from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session, load_only
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
    is_approver = db.query(User).filter(User.timesheet_approver == current_user).count() > 0
    return {
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "job_position": getattr(user, 'job_position', None),
        "division_name": getattr(user, 'division_name', None),
        "avatar": user.avatar,
        "account_status": user.account_status,
        "is_superadmin": user.is_superadmin,
        "role": get_user_role(db, current_user),
        "timesheet_approver": user.timesheet_approver,
        "is_approver": is_approver,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "timesheet_required": user.timesheet_required if getattr(user, 'timesheet_required', None) is not None else True,
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
        user.job_position = payload.job_position
        user.division_name = payload.division_name

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


@router.get("/api/users")
def get_users_directory(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    users = db.query(User).filter(User.account_status != "suspended").all()
    can_manage = can_manage_workspace_users(db, current_user)
    return {
        "users": [
            {
                "username": u.username,
                "full_name": u.full_name,
                "email": u.email if can_manage else "Email hidden for privacy",
                "job_position": u.job_position or "N/A",
                "department": u.division_name or "N/A",
                "division_name": u.division_name or "N/A",
                "role": get_user_role(db, u.username),
                "account_status": u.account_status,
            }
            for u in users
        ]
    }


@router.get("/api/users/avatars")
def get_all_avatars(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    # Metadata without avatar/password — avatar base64 is fetched only for connected users
    users = (
        db.query(User)
        .options(
            load_only(
                User.id,
                User.username,
                User.email,
                User.full_name,
                User.is_verified,
                User.account_status,
                User.is_superadmin,
                User.role,
            )
        )
        .all()
    )
    can_manage = can_manage_workspace_users(db, current_user)

    known_usernames = set([current_user, "admin"])
    if not can_manage:
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

        dms_sent = (
            db.query(DirectMessage.receiver_username)
            .filter(DirectMessage.sender_username == current_user)
            .distinct()
            .all()
        )
        dms_recv = (
            db.query(DirectMessage.sender_username)
            .filter(DirectMessage.receiver_username == current_user)
            .distinct()
            .all()
        )

        for dm in dms_sent:
            known_usernames.add(dm[0])
        for dm in dms_recv:
            known_usernames.add(dm[0])

    avatar_usernames = (
        [u.username for u in users]
        if can_manage
        else [u for u in known_usernames if u]
    )
    avatars = {}
    if avatar_usernames:
        for uname, avatar in (
            db.query(User.username, User.avatar)
            .filter(User.username.in_(avatar_usernames), User.avatar.isnot(None))
            .all()
        ):
            if avatar:
                avatars[uname] = avatar

    directory = []
    for u in users:
        is_connected = can_manage or u.username in known_usernames
        show_email = can_manage or u.username in known_usernames
        email_display = u.email if show_email else "Email hidden for privacy"
        avatar_val = avatars.get(u.username) if is_connected else None
        directory.append(
            {
                "username": u.username,
                "full_name": u.full_name,
                "job_position": getattr(u, 'job_position', None),
                "division_name": getattr(u, 'division_name', None),
                "email": email_display,
                "avatar": avatar_val,
                "is_connected": is_connected,
                "is_verified": u.is_verified,
                "account_status": u.account_status,
                "is_superadmin": u.is_superadmin,
                "role": get_user_role(db, u.username),
            }
        )

    return {
        "avatars": avatars if can_manage else {k: v for k, v in avatars.items() if k in known_usernames},
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
        .order_by(Notification.id.desc())
        .limit(100)
        .all()
    )
    combined_dict = {n.id: n for n in latest_notifs + unread_notifs}
    final_notifs = sorted(
        list(combined_dict.values()), key=lambda x: x.id, reverse=True
    )
    task_ids = [
        n.related_task_id
        for n in final_notifs
        if n.related_task_id
        and n.type not in ["team_chat", "team_chat_no_email", "team_invite", "access_request", "access_accepted", "info"]
    ]
    board_by_task = {}
    if task_ids:
        board_by_task = {
            tid: bid
            for tid, bid in db.query(Request.id, Request.board_id)
            .filter(Request.id.in_(task_ids))
            .all()
        }
    # Pre-fetch boards map by name for exact fallback matching (sorted by longest name first)
    boards_list = db.query(Board.id, Board.name).all()
    boards_list.sort(key=lambda b: len(b.name), reverse=True)

    res = []
    for n in final_notifs:
        board_id = None
        if n.type in ["team_chat", "team_chat_no_email", "team_invite", "access_request", "access_accepted"]:
            board_id = n.related_task_id
        elif n.type == "info" and n.related_task_id:
            # Info notifications for project invite responses store board.id in related_task_id
            board_id = n.related_task_id
        elif n.related_task_id:
            board_id = board_by_task.get(n.related_task_id)

        # Fallback parsing project name from message string if board_id not resolved or invalid
        if n.message:
            msg_lower = n.message.lower()
            for b in boards_list:
                if b.name.lower() in msg_lower:
                    board_id = b.id
                    break

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
                "task_name": task.task_name,
                "description": task.description,
                "status": task.status,
                "timestamp": task.timestamp,
                "category": task.category,
            }
        )
    return {"tickets": tasks_list}

