from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, text
import re
import json
from datetime import datetime, timedelta
import os
import base64
from collections import defaultdict

from database import (
    get_db,
    User,
    Request,
    Subtask,
    Board,
    BoardMember,
    LeaveDay,
    LeaveRecord,
    Comment,
    Notification,
    DirectMessage,
    Team,
    TeamMembership,
    GroqTokenLedger,
    FileAsset,
)
from schemas import *
from dependencies import *
from utils import *
from services.groq_quota import current_period, quota_snapshot

router = APIRouter()

@router.get("/api/admin/config")
def get_system_config(admin: User = Depends(require_admin)):
    return {
        "smtp_server": os.getenv("SMTP_SERVER", ""),
        "smtp_port": os.getenv("SMTP_PORT", ""),
        "smtp_username": os.getenv("SMTP_USERNAME", ""),
        "smtp_password": "********" if os.getenv("SMTP_PASSWORD") else "",
        "gemini_api_key": "********" if os.getenv("GEMINI_API_KEY") else "",
        "groq_api_key": "********" if os.getenv("GROQ_API_KEY") else "",
        "database_url": "********" if os.getenv("DATABASE_URL") else "",
        "google_calendar_api_key": (
            "********" if os.getenv("GOOGLE_CALENDAR_API_KEY") else ""
        ),
        "secret_key": "********" if os.getenv("SECRET_KEY") else "",
    }


@router.put("/api/admin/config")
def update_system_config(
    payload: SystemConfigModel, admin: User = Depends(require_admin)
):

    if payload.smtp_server is not None:
        update_env_var("SMTP_SERVER", payload.smtp_server)
    if payload.smtp_port is not None:
        update_env_var("SMTP_PORT", payload.smtp_port)
    if payload.smtp_username is not None:
        update_env_var("SMTP_USERNAME", payload.smtp_username)
    if payload.smtp_password and payload.smtp_password != "********":
        update_env_var("SMTP_PASSWORD", payload.smtp_password)
    if payload.gemini_api_key and payload.gemini_api_key != "********":
        update_env_var("GEMINI_API_KEY", payload.gemini_api_key)
    if payload.groq_api_key and payload.groq_api_key != "********":
        update_env_var("GROQ_API_KEY", payload.groq_api_key)
    if payload.database_url and payload.database_url != "********":
        update_env_var("DATABASE_URL", payload.database_url)
    if (
        payload.google_calendar_api_key
        and payload.google_calendar_api_key != "********"
    ):
        update_env_var("GOOGLE_CALENDAR_API_KEY", payload.google_calendar_api_key)
    if payload.secret_key and payload.secret_key != "********":
        update_env_var("SECRET_KEY", payload.secret_key)

    return {"message": "System configuration updated successfully!"}


@router.post("/api/admin/verify-sudo")
def verify_sudo(
    payload: SudoVerifyModel,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.password, admin.password):
        raise HTTPException(status_code=400, detail="Incorrect password.")
    return {"message": "Verified"}


@router.get("/api/admin/users")
def get_all_users(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not is_user_superadmin(db, current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    users = db.query(User).all()
    return {
        "users": [
            evaluate_user_lifecycle(db, u)
            and {
                "username": u.username,
                "full_name": u.full_name,
                "email": u.email,
                "is_verified": u.is_verified,
                "account_status": u.account_status,
                "deletion_date": u.deletion_date,
                "created_at": u.created_at,
                "is_superadmin": u.is_superadmin,
                "system_role": effective_system_role(u),
                "groq_monthly_token_allowance": u.groq_monthly_token_allowance,
                "timesheet_approver": u.timesheet_approver,
            }
            for u in users
        ]
    }


@router.put("/api/admin/users/status")
def update_user_status(
    payload: AdminActionModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    username = payload.username
    if not is_user_superadmin(db, current_user):
        raise HTTPException(status_code=403)
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404)
    if username == "admin":
        raise HTTPException(status_code=400, detail="Cannot modify root admin")
    if payload.status == "pending_deletion":
        ensure_not_last_admin(db, user)

    user.account_status = payload.status
    if payload.status == "pending_deletion":
        # Set 3 Months (90 Days) Notice Period
        user.deletion_date = (datetime.now() + timedelta(days=90)).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    elif payload.status == "offboarding" and payload.offboard_date:
        user.deletion_date = payload.offboard_date + " 23:59:59"
    else:
        user.deletion_date = None

    db.commit()
    return {"message": f"User status updated to {payload.status.replace('_', ' ')}"}


@router.put("/api/admin/users/superadmin")
def toggle_superadmin(
    payload: AdminActionModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    username = payload.username
    if not is_user_superadmin(db, current_user):
        raise HTTPException(status_code=403)
    if username == "admin":
        raise HTTPException(status_code=400, detail="Cannot demote root admin")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404)

    if effective_system_role(user) == "admin":
        ensure_not_last_admin(db, user)
        user.system_role = "staff"
        user.is_superadmin = 0
    else:
        user.system_role = "admin"
        user.is_superadmin = 1
    db.commit()
    status_str = (
        "promoted to Super Admin"
        if user.is_superadmin == 1
        else "demoted to regular user"
    )
    return {"message": f"User @{username} has been {status_str}."}


@router.put("/api/admin/users/verify")
def manual_verify_user(
    payload: AdminActionModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    username = payload.username
    if not is_user_superadmin(db, current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    ensure_not_last_admin(db, user)

    if user.is_verified == 1:
        return {"message": f"User @{username} is already verified."}

    user.is_verified = 1
    db.commit()
    return {"message": f"User @{username} has been manually verified."}


@router.post("/api/admin/users/delete")
def admin_delete_user(
    payload: AdminActionModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    username = payload.username
    if not is_user_superadmin(db, current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    if username == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete root admin")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Proactive Ownership Transfer: Reassign owned projects to a team member or admin
    owned_boards = db.query(Board).filter(Board.owner_username == username).all()
    for board in owned_boards:
        # Find the first available team member in the project
        first_member = (
            db.query(BoardMember)
            .filter(
                BoardMember.board_id == board.id,
                BoardMember.status == "accepted",
                BoardMember.member_username != username,
            )
            .first()
        )

        new_owner = "admin"  # Default fallback
        if first_member:
            new_owner = first_member.member_username
            # Promote the member to owner by removing their member entry
            db.delete(first_member)

        board.owner_username = new_owner
        # Log this important event in the project's chat for audit trail
        chat_task = get_or_create_chat_task(db, board.id)
        log_activity(
            db,
            chat_task.id,
            f"**System**: Ownership of this project was automatically transferred to **@{new_owner}** because the original owner **@{username}** was deleted.",
        )

    # Sapu bersih relasi terkait agar tidak terjadi SQL Integrity Error
    db.query(Notification).filter(Notification.user_username == username).delete()
    db.query(BoardMember).filter(BoardMember.member_username == username).delete()
    db.query(LeaveRecord).filter(LeaveRecord.username == username).delete()
    db.query(TeamMembership).filter(TeamMembership.username == username).delete()
    db.query(GroqTokenLedger).filter(GroqTokenLedger.username == username).delete()
    db.query(FileAsset).filter(FileAsset.uploader_username == username).delete()

    try:
        db.delete(user)
        db.commit()
        return {"message": f"User {username} deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Cannot delete user. They have existing active tasks/comments.",
        )


@router.get("/api/admin/boards")
def get_all_boards_admin(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not is_user_superadmin(db, current_user):
        raise HTTPException(status_code=403, detail="Admin access required")

    boards = db.query(Board).all()
    res = []
    for b in boards:
        owner = db.query(User).filter(User.username == b.owner_username).first()
        owner_status = owner.account_status if owner else "orphan"
        res.append(
            {
                "id": b.id,
                "name": b.name,
                "owner_username": b.owner_username,
                "owner_status": owner_status,
                "created_at": b.created_at,
            }
        )
    return {"boards": res}


@router.put("/api/admin/boards/{board_id}/transfer")
def admin_transfer_board(
    board_id: int,
    payload: TransferBoardModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not is_user_superadmin(db, current_user):
        raise HTTPException(status_code=403, detail="Admin access required")

    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Project not found")

    new_user = db.query(User).filter(User.username == payload.new_owner).first()
    if not new_user:
        raise HTTPException(status_code=404, detail="New owner user not found")

    board.owner_username = new_user.username
    db.commit()
    create_notification(
        db,
        new_user.username,
        f"Admin transferred ownership of project '{board.name}' to you.",
        "info",
        board.id,
    )
    return {"message": f"Project ownership transferred to @{new_user.username}"}


@router.put("/api/admin/users/approver")
def set_timesheet_approver(
    payload: AdminActionModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not is_user_superadmin(db, current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    user = db.query(User).filter(User.username == payload.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    approver = None
    if payload.status: # Reusing status field to pass approver_username
        approver = db.query(User).filter(User.username == payload.status).first()
        if not approver:
            raise HTTPException(status_code=404, detail="Approver user not found")
        user.timesheet_approver = approver.username
    else:
        user.timesheet_approver = None
        
    db.commit()
    msg = f"Timesheet approver for @{user.username} cleared." if not approver else f"Timesheet approver for @{user.username} set to @{approver.username}."
    return {"message": msg}


def _avatar_database_bytes(avatar):
    if not avatar or not avatar.startswith("data:") or "," not in avatar:
        return 0
    header, encoded = avatar.split(",", 1)
    if ";base64" not in header:
        return len(encoded.encode("utf-8"))
    try:
        return len(base64.b64decode(encoded, validate=False))
    except Exception:
        return len(encoded.encode("utf-8"))


def _storage_snapshot(db: Session):
    avatar_rows = db.query(User.username, User.avatar).all()
    avatar_by_user = {
        username: _avatar_database_bytes(avatar)
        for username, avatar in avatar_rows
        if _avatar_database_bytes(avatar)
    }
    assets = db.query(FileAsset).all()
    metadata_bytes = sum(
        len(
            "|".join(
                [
                    asset.original_filename or "",
                    asset.content_type or "",
                    asset.storage_kind or "",
                    asset.uploader_username or "",
                ]
            ).encode("utf-8")
        )
        for asset in assets
    )
    declared_attachment_bytes = sum(max(0, asset.size_bytes or 0) for asset in assets)
    resources = [
        {
            "id": f"avatar:{username}",
            "name": f"Avatar @{username}",
            "owner_username": username,
            "type": "avatar",
            "size_bytes": size,
            "updated_at": None,
        }
        for username, size in avatar_by_user.items()
    ]
    resources.extend(
        {
            "id": f"asset:{asset.id}",
            "name": asset.original_filename,
            "owner_username": asset.uploader_username,
            "type": asset.content_type or "attachment",
            "size_bytes": asset.size_bytes or 0,
            "updated_at": asset.created_at,
        }
        for asset in assets
    )
    return {
        "database_backed_avatar_bytes": sum(avatar_by_user.values()),
        "avatar_bytes_by_user": avatar_by_user,
        "attachment_count": len(assets),
        "attachment_metadata_bytes": metadata_bytes,
        "attachment_declared_content_bytes": declared_attachment_bytes,
        "database_accounted_bytes": sum(avatar_by_user.values()) + metadata_bytes,
        "resources": resources,
        "note": "Attachment content bytes are declared metadata only; no external or binary storage is assumed.",
    }


@router.get("/api/admin/dashboard/stats")
def admin_dashboard_stats(
    admin: User = Depends(require_admin), db: Session = Depends(get_db)
):
    role_counts = {"admin": 0, "manager": 0, "staff": 0}
    users = db.query(User).all()
    for user in users:
        role_counts[effective_system_role(user)] += 1
    period = current_period()
    groq_tokens = int(
        db.query(func.coalesce(func.sum(GroqTokenLedger.total_tokens), 0))
        .filter(GroqTokenLedger.period == period)
        .scalar()
        or 0
    )
    return {
        "users": {"total": len(users), "by_role": role_counts},
        "teams": db.query(Team).count(),
        "projects": db.query(Board).count(),
        "tasks": {
            "total": db.query(Request).count(),
            "active": db.query(Request)
            .filter(Request.status.notin_(["Done", "Rejected"]))
            .count(),
        },
        "groq": {"period": period, "tokens_used": groq_tokens},
        "storage": _storage_snapshot(db),
    }


@router.put("/api/admin/users/{username}/role")
def update_user_role(
    username: str,
    payload: UserRoleUpdateModel,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.username == username).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    role = payload.system_role.lower()
    if role not in SYSTEM_ROLES:
        raise HTTPException(status_code=422, detail="Role must be admin, manager, or staff")
    if username == "admin" and role != "admin":
        raise HTTPException(status_code=400, detail="Cannot demote root admin")
    if effective_system_role(target) == "admin" and role != "admin":
        ensure_not_last_admin(db, target)
    target.system_role = role
    target.is_superadmin = 1 if role == "admin" else 0
    if role == "admin":
        db.query(TeamMembership).filter(
            TeamMembership.username == username
        ).delete()
    else:
        db.query(TeamMembership).filter(
            TeamMembership.username == username,
            TeamMembership.membership_role != role,
        ).delete()
    db.commit()
    return {
        "username": target.username,
        "system_role": effective_system_role(target),
        "is_superadmin": target.is_superadmin,
    }


@router.delete("/api/admin/users/{username}")
def delete_user_rest(
    username: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return admin_delete_user(
        payload=AdminActionModel(username=username),
        current_user=admin.username,
        db=db,
    )


@router.get("/api/admin/projects")
def monitor_projects(
    admin: User = Depends(require_admin), db: Session = Depends(get_db)
):
    projects = []
    for board in db.query(Board).order_by(Board.id.desc()).all():
        tasks = db.query(Request).filter(Request.board_id == board.id)
        team = db.query(Team).filter(Team.id == board.team_id).first() if board.team_id else None
        member_count = db.query(BoardMember).filter(
            BoardMember.board_id == board.id,
            BoardMember.status == "accepted",
        ).count()
        projects.append(
            {
                "id": board.id,
                "name": board.name,
                "owner_username": board.owner_username,
                "created_at": board.created_at,
                "last_activity_date": board.last_activity_date,
                "is_private": bool(board.is_private),
                "team_id": board.team_id,
                "team_name": team.name if team else None,
                "member_count": member_count,
                "accepted_member_count": member_count,
                "status": "active",
                "task_count": tasks.count(),
                "active_task_count": tasks.filter(
                    Request.status.notin_(["Done", "Rejected"])
                ).count(),
            }
        )
    return {"projects": projects}


@router.put("/api/admin/projects/{project_id}")
def update_project_governance(
    project_id: int,
    payload: AdminProjectUpdateModel,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    board = db.query(Board).filter(Board.id == project_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Project not found")
    if payload.owner_username is not None:
        owner = db.query(User).filter(User.username == payload.owner_username).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Project owner not found")
        board.owner_username = owner.username
    if payload.team_id is not None:
        team = db.query(Team).filter(Team.id == payload.team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        board.team_id = team.id
    else:
        board.team_id = None
    db.commit()
    return {"message": "Project governance updated"}


@router.put("/api/admin/users/{username}/groq-credit")
def update_groq_credit(
    username: str,
    payload: GroqCreditUpdateModel,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if payload.monthly_token_allowance < 0:
        raise HTTPException(status_code=422, detail="Allowance cannot be negative")
    target = db.query(User).filter(User.username == username).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.groq_monthly_token_allowance = payload.monthly_token_allowance
    db.commit()
    return {"username": username, **quota_snapshot(db, target)}


@router.get("/api/admin/groq-usage")
def get_groq_usage(
    period: str = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    period = period or current_period()
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", period):
        raise HTTPException(status_code=422, detail="Period must use YYYY-MM")
    grouped = {
        username: {
            "prompt_tokens": prompt or 0,
            "completion_tokens": completion or 0,
            "total_tokens": total or 0,
            "request_count": count or 0,
        }
        for username, prompt, completion, total, count in db.query(
            GroqTokenLedger.username,
            func.sum(GroqTokenLedger.prompt_tokens),
            func.sum(GroqTokenLedger.completion_tokens),
            func.sum(GroqTokenLedger.total_tokens),
            func.count(GroqTokenLedger.id),
        )
        .filter(GroqTokenLedger.period == period)
        .group_by(GroqTokenLedger.username)
        .all()
    }
    users = []
    for user in db.query(User).order_by(User.username).all():
        usage = grouped.get(
            user.username,
            {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
                "request_count": 0,
            },
        )
        allowance = max(0, user.groq_monthly_token_allowance or 0)
        users.append(
            {
                "username": user.username,
                "allowance": allowance,
                **usage,
                "remaining": max(0, allowance - usage["total_tokens"]),
                "exhausted": usage["total_tokens"] >= allowance,
            }
        )
    return {"period": period, "users": users}


@router.get("/api/admin/storage")
def get_storage_breakdown(
    admin: User = Depends(require_admin), db: Session = Depends(get_db)
):
    return _storage_snapshot(db)
