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

    user.is_superadmin = 1 if user.is_superadmin == 0 else 0
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
