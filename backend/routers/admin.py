from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, text
import re
import json
from datetime import datetime, timedelta
import os

from database import get_db, User, Request, Subtask, Board, BoardMember, LeaveDay, LeaveRecord, Comment, Notification, DirectMessage
from schemas import *
from dependencies import *
from utils import *

router = APIRouter()

@router.get("/api/admin/config")
def get_system_config(current_user: str = Depends(get_current_user)):
    if current_user != "admin":
        raise HTTPException(
            status_code=403, detail="Only 'admin' can access system configuration."
        )
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
    payload: SystemConfigModel, current_user: str = Depends(get_current_user)
):
    if current_user != "admin":
        raise HTTPException(
            status_code=403, detail="Only 'admin' can modify system configuration."
        )

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
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user != "admin":
        raise HTTPException(
            status_code=403, detail="Only admin can perform this action."
        )
    user = db.query(User).filter(User.username == current_user).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect password.")
    return {"message": "Verified"}


@router.get("/api/admin/users")
def get_all_users(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not can_manage_workspace_users(db, current_user):
        raise HTTPException(status_code=403, detail="Admin or Project Owner access required")
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
                "role": get_user_role(db, u.username),
                "timesheet_approver": u.timesheet_approver,
                "timesheet_required": u.timesheet_required if getattr(u, 'timesheet_required', None) is not None else True,
            }
            for u in users
        ]
    }


@router.put("/api/admin/users/timesheet-requirement")
def set_user_timesheet_requirement(
    payload: UserTimesheetRequirementModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_manage_workspace_users(db, current_user):
        raise HTTPException(status_code=403, detail="Admin or Project Owner access required")
    user = db.query(User).filter(User.username == payload.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.timesheet_required = payload.timesheet_required
    db.commit()
    return {"message": f"Timesheet requirement for @{payload.username} updated."}


@router.put("/api/admin/users/status")
def update_user_status(
    payload: AdminActionModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    username = payload.username
    if not can_manage_workspace_users(db, current_user):
        raise HTTPException(status_code=403)
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404)
    if username == "admin":
        raise HTTPException(status_code=400, detail="Cannot modify root admin")
    if get_user_role(db, username) == ROLE_ADMIN and get_user_role(db, current_user) != ROLE_ADMIN:
        raise HTTPException(status_code=403, detail="Only Admin can modify Admin users")

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


@router.put("/api/admin/users/role")
def set_user_role(
    payload: UserRoleUpdateModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_manage_workspace_users(db, current_user):
        raise HTTPException(status_code=403, detail="Admin or Project Owner access required")
    role = (payload.role or "").strip().lower()
    if role not in VALID_USER_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Use admin, project_owner, manager, or staff.",
        )
    actor_role = get_user_role(db, current_user)
    if role == ROLE_ADMIN and actor_role != ROLE_ADMIN:
        raise HTTPException(status_code=403, detail="Only Admin can assign Admin role")
    if payload.username == "admin" and role != ROLE_ADMIN:
        raise HTTPException(status_code=400, detail="Cannot demote root admin")
    if get_user_role(db, payload.username) == ROLE_ADMIN and actor_role != ROLE_ADMIN:
        raise HTTPException(status_code=403, detail="Only Admin can modify Admin users")
    user = db.query(User).filter(User.username == payload.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sync_user_role_flags(user, role)
    db.commit()
    labels = {
        ROLE_ADMIN: "Admin",
        ROLE_PROJECT_OWNER: "Project Owner",
        ROLE_MANAGER: "Manager",
        ROLE_STAFF: "Staff",
    }
    return {"message": f"User @{payload.username} role updated to {labels.get(role, role)}."}


@router.put("/api/admin/users/superadmin")
def toggle_superadmin(
    payload: AdminActionModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Legacy toggle — maps to admin <-> project_owner."""
    username = payload.username
    if not is_user_superadmin(db, current_user):
        raise HTTPException(status_code=403)
    if username == "admin":
        raise HTTPException(status_code=400, detail="Cannot demote root admin")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404)

    new_role = ROLE_PROJECT_OWNER if get_user_role(db, username) == ROLE_ADMIN else ROLE_ADMIN
    sync_user_role_flags(user, new_role)
    db.commit()
    status_str = (
        "promoted to Admin"
        if new_role == ROLE_ADMIN
        else "demoted to Project Owner"
    )
    return {"message": f"User @{username} has been {status_str}."}


@router.put("/api/admin/users/verify")
def manual_verify_user(
    payload: AdminActionModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    username = payload.username
    if not can_manage_workspace_users(db, current_user):
        raise HTTPException(status_code=403, detail="Admin or Project Owner access required")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified == 1:
        return {"message": f"User @{username} is already verified."}

    user.is_verified = 1
    db.commit()
    return {"message": f"User @{username} has been manually verified."}


@router.post("/api/teams/invite")
def invite_workspace_user(
    payload: WorkspaceInviteModel,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_manage_workspace_users(db, current_user):
        raise HTTPException(status_code=403, detail="Admin or Project Owner access required")

    email = (payload.email or "").strip().lower()
    role = (payload.role or ROLE_MANAGER).strip().lower()

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not (email.endswith("@innocean.co.id") or email.endswith("@innocean.com")):
        raise HTTPException(
            status_code=400,
            detail="Only @innocean.co.id or @innocean.com emails are allowed.",
        )
    if role not in VALID_USER_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    actor_role = get_user_role(db, current_user)
    if role == ROLE_ADMIN and actor_role != ROLE_ADMIN:
        raise HTTPException(status_code=403, detail="Only Admin can invite as Admin")

    local_part = email.split("@", 1)[0]
    # Username & full name auto-derived from email when not provided
    base_username = re.sub(r"[^a-zA-Z0-9_.-]", ".", (payload.username or local_part).strip())
    base_username = re.sub(r"\.+", ".", base_username).strip(".-_") or "user"
    if not re.match(r"^[a-zA-Z0-9_.-]+$", base_username):
        raise HTTPException(status_code=400, detail="Invalid username format")

    full_name = (payload.full_name or "").strip()
    if not full_name:
        full_name = " ".join(
            part.capitalize() for part in re.split(r"[._\-\s]+", local_part) if part
        ) or local_part

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    username = base_username
    suffix = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base_username}{suffix}"
        suffix += 1
        if suffix > 99:
            raise HTTPException(status_code=400, detail="Unable to generate unique username")

    temp_password = payload.temporary_password or f"Welcome{username[:1].upper()}123!"
    if len(temp_password) < 8:
        raise HTTPException(status_code=400, detail="Temporary password must be at least 8 characters")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_user = User(
        username=username,
        email=email,
        full_name=full_name,
        password=get_password_hash(temp_password),
        is_verified=1,
        created_at=now_str,
        role=role,
        is_superadmin=1 if role == ROLE_ADMIN else 0,
    )
    db.add(new_user)
    db.commit()

    frontend_url = os.getenv("FRONTEND_URL", "https://iid-tracker.netlify.app").split(",")[0].strip().rstrip("/")
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>You are invited to INNOCEAN TRACKER</h2>
      <p>Hi {full_name},</p>
      <p>@{current_user} invited you to the workspace.</p>
      <p><strong>Username:</strong> {username}<br/>
      <strong>Temporary password:</strong> {temp_password}</p>
      <p>Please sign in and change your password immediately.</p>
      <p><a href="{frontend_url}">Open Tracker</a></p>
    </div>
    """
    try:
        from services.email_service import send_email
        background_tasks.add_task(
            send_email,
            email,
            "Invitation to INNOCEAN TRACKER",
            html_body,
        )
    except Exception:
        pass

    return {
        "message": f"User @{username} invited successfully.",
        "username": username,
        "temporary_password": temp_password,
    }


@router.post("/api/admin/users/delete")
def admin_delete_user(
    payload: AdminActionModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    username = payload.username
    if not can_manage_workspace_users(db, current_user):
        raise HTTPException(status_code=403, detail="Admin or Project Owner access required")
    if username == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete root admin")
    if get_user_role(db, username) == ROLE_ADMIN and get_user_role(db, current_user) != ROLE_ADMIN:
        raise HTTPException(status_code=403, detail="Only Admin can delete Admin users")

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
    if not can_manage_projects(db, current_user):
        raise HTTPException(status_code=403, detail="Project management access required")

    # Admin & Project Owner can see every project in the workspace
    # (exclude personal To-do List boards — easier project maintenance)
    boards = db.query(Board).all()

    res = []
    for b in boards:
        if is_todo_list_board(b):
            continue
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
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Project not found")

    is_admin = is_user_superadmin(db, current_user)
    can_manage = can_manage_projects(db, current_user)
    if not is_admin and not can_manage:
        raise HTTPException(status_code=403, detail="Only admin or project owner can transfer")

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
