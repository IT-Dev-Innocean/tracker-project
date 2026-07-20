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
from services.email_service import send_email

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://iid-tracker.netlify.app").split(",")[0].strip().rstrip("/")

router = APIRouter()

@router.get("/api/profile")
def get_profile(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "avatar": user.avatar,
        "account_status": user.account_status,
        "is_superadmin": user.is_superadmin,
        "timesheet_approver": user.timesheet_approver,
    }


@router.put("/api/profile")
def update_profile(
    payload: ProfileUpdateModel,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.avatar is not None and len(payload.avatar) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=400, detail="Avatar image size is too large (Max 2MB)."
        )

    # Validasi Whitelist Email pada saat Edit Profile
    email_lower = payload.email.lower()
    if not (
        email_lower.endswith("@innocean.co.id") or email_lower.endswith("@innocean.com")
    ):
        raise HTTPException(
            status_code=400,
            detail="Only @innocean.co.id or @innocean.com emails are allowed.",
        )

    existing_email = (
        db.query(User)
        .filter(User.email == payload.email, User.username != current_user)
        .first()
    )
    if existing_email:
        raise HTTPException(
            status_code=400, detail="Email is already in use by another account."
        )

    user = db.query(User).filter(User.username == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user:
        if payload.new_password:
            if not payload.current_password or not verify_password(
                payload.current_password, user.password
            ):
                raise HTTPException(
                    status_code=400, detail="Incorrect current password."
                )
            if (
                len(payload.new_password) < 8
                or not re.search(r"[A-Z]", payload.new_password)
                or not re.search(r"[0-9]", payload.new_password)
            ):
                raise HTTPException(
                    status_code=400,
                    detail="New password must be at least 8 characters, contain 1 uppercase and 1 number.",
                )
            user.password = get_password_hash(payload.new_password)

        user.full_name = payload.full_name

        email_changed = False
        if user.email != payload.email:
            user.email = payload.email
            user.is_verified = 0
            email_changed = True

        if payload.avatar is not None:
            user.avatar = payload.avatar
        db.commit()

        if email_changed:
            verify_token = create_access_token(
                data={"sub": user.username, "type": "verify"}
            )
            verify_link = f"{FRONTEND_URL}/?verify={verify_token}"

            html_body = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h2 style="color: #0f172a; margin-top: 0; text-transform: uppercase; font-weight: 900;">Verify Your New Email</h2>
                <p style="color: #475569; font-size: 16px;">Hello <strong>@{user.username}</strong>,</p>
                <p style="color: #475569; font-size: 15px;">You recently changed your email address on INNOCEAN Tracker. Please click the button below to verify this new email address:</p>
                <a href="{verify_link}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">Verify New Email</a>
                <p style="color: #64748b; font-size: 14px;">If you didn't request this, please contact the administrator immediately.</p>
            </div>
            """
            background_tasks.add_task(
                send_email,
                user.email, "Verify Your New Email - INNOCEAN Tracker", html_body
            )
            return {
                "message": "Profile updated! Please check your inbox to verify your new email.",
                "email_changed": True,
            }

    return {"message": "Profile updated successfully", "email_changed": False}


@router.get("/api/users/avatars")
def get_all_avatars(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    users = db.query(User.username, User.avatar, User.email).all()
    is_admin = is_user_superadmin(db, current_user)

    known_usernames = set([current_user])
    if not is_admin:
        owned_boards = db.query(Board.id).filter(Board.owner_username == current_user)
        member_boards = db.query(BoardMember.board_id).filter(
            BoardMember.member_username == current_user
        )
        all_involved_boards = db.query(Board.id).filter(
            or_(Board.id.in_(owned_boards), Board.id.in_(member_boards))
        )

        known_owners = (
            db.query(Board.owner_username)
            .filter(Board.id.in_(all_involved_boards))
            .all()
        )
        known_members = (
            db.query(BoardMember.member_username)
            .filter(BoardMember.board_id.in_(all_involved_boards))
            .all()
        )

        for o in known_owners:
            known_usernames.add(o[0])
        for m in known_members:
            known_usernames.add(m[0])
            
        dms_sent = db.query(DirectMessage.receiver_username).filter(DirectMessage.sender_username == current_user).distinct().all()
        dms_recv = db.query(DirectMessage.sender_username).filter(DirectMessage.receiver_username == current_user).distinct().all()
        
        for dm in dms_sent:
            known_usernames.add(dm[0])
        for dm in dms_recv:
            known_usernames.add(dm[0])

    directory = []
    for u in users:
        is_connected = is_admin or u.username in known_usernames or u.username == "admin"
        show_email = is_admin or u.username in known_usernames
        email_display = u.email if show_email else "Email hidden for privacy"
        directory.append(
            {
                "username": u.username,
                "email": email_display,
                "is_connected": is_connected,
            }
        )

    return {
        "avatars": {u.username: u.avatar for u in users if u.avatar},
        "directory": directory,
    }


@router.get("/api/notifications")
def get_notifications(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    latest_notifs = (
        db.query(Notification)
        .filter(Notification.user_username == current_user)
        .order_by(Notification.id.desc())
        .limit(20)
        .all()
    )
    unread_notifs = (
        db.query(Notification)
        .filter(Notification.user_username == current_user, Notification.is_read == 0)
        .all()
    )
    combined_dict = {n.id: n for n in latest_notifs + unread_notifs}
    final_notifs = sorted(
        list(combined_dict.values()), key=lambda x: x.id, reverse=True
    )
    res = []
    for n in final_notifs:
        board_id = None
        if n.type in ["team_chat", "team_chat_no_email", "team_invite"]:
            board_id = n.related_task_id
        elif n.related_task_id:
            task = db.query(Request).filter(Request.id == n.related_task_id).first()
            if task:
                board_id = task.board_id
        res.append(
            {
                "id": n.id,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "timestamp": n.timestamp,
                "related_task_id": n.related_task_id,
                "board_id": board_id,
            }
        )
    return {"notifications": res}


@router.put("/api/notifications/{notif_id}/read")
def read_notification(
    notif_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = (
        db.query(Notification)
        .filter(Notification.id == notif_id, Notification.user_username == current_user)
        .first()
    )
    if notif:
        notif.is_read = 1
        db.commit()
    return {"message": "Notification marked as read"}


@router.put("/api/notifications/read_all")
def read_all_notifications(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_username == current_user, Notification.is_read == 0
    ).update({"is_read": 1})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.get("/api/my-tickets")
def get_my_tickets(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    board = (
        db.query(Board)
        .filter(Board.owner_username == "admin", Board.name == "System Feedback")
        .first()
    )
    if not board:
        return {"tickets": []}

    tasks = (
        db.query(Request)
        .filter(Request.board_id == board.id, Request.requester == current_user)
        .order_by(Request.id.desc())
        .all()
    )
    tasks_list = []
    for task in tasks:
        tasks_list.append(
            {
                "id": task.id,
                "project_name": task.project_name,
                "description": task.description,
                "status": task.status,
                "timestamp": task.timestamp,
                "category": task.category,
            }
        )
    return {"tickets": tasks_list}

