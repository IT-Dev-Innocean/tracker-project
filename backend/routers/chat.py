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

@router.get("/api/my-chats")
def get_my_chats(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    # Dapatkan ID proyek yang pengguna miliki atau ikuti
    owned = db.query(Board.id).filter(Board.owner_username == current_user)
    member = db.query(BoardMember.board_id).filter(
        BoardMember.member_username == current_user, BoardMember.status == "accepted"
    )
    acc_boards = db.query(Board.id).filter(
        or_(Board.id.in_(owned), Board.id.in_(member))
    )

    # Dapatkan semua tugas/permintaan yang berada dalam proyek tersebut
    acc_requests = db.query(Request.id).filter(Request.board_id.in_(acc_boards))

    # Cari ID Komentar (Pesan) maksimum/terbaru untuk setiap tugas yang BUKAN berasal dari Log Sistem
    subq = (
        db.query(func.max(Comment.id))
        .filter(Comment.request_id.in_(acc_requests), Comment.username != "System")
        .group_by(Comment.request_id)
    )

    # Ambil 30 pesan terbaru secara global
    latest_comments = (
        db.query(Comment)
        .filter(Comment.id.in_(subq))
        .order_by(Comment.id.desc())
        .limit(30)
        .all()
    )

    all_chats = []
    for c in latest_comments:
        task = db.query(Request).filter(Request.id == c.request_id).first()
        if not task:
            continue

        board = db.query(Board).filter(Board.id == task.board_id).first()
        board_name = board.name if board else "Unknown"

        clean_text, _ = parse_comment_text(c.text)

        all_chats.append(
            {
                "task_id": task.id,
                "board_id": task.board_id,
                "board_name": board_name,
                "project_name": task.project_name,
                "is_project_chat": task.project_name == "[SYSTEM] PROJECT CHAT",
                "is_dm": False,
                "latest_message": clean_text,
                "latest_sender": c.username,
                "timestamp": c.timestamp,
                "unread_count": 0,
            }
        )

    # Get latest DM for each conversation partner (Database-Agnostic Approach)
    recent_dms = (
        db.query(DirectMessage)
        .filter(
            or_(
                and_(
                    DirectMessage.sender_username == current_user,
                    DirectMessage.is_deleted_by_sender == 0,
                ),
                and_(
                    DirectMessage.receiver_username == current_user,
                    DirectMessage.is_deleted_by_receiver == 0,
                ),
            )
        )
        .order_by(DirectMessage.id.desc())
        .limit(100)
        .all()
    )

    seen_partners = set()
    for dm in recent_dms:
        partner = (
            dm.receiver_username
            if dm.sender_username == current_user
            else dm.sender_username
        )
        if partner not in seen_partners:
            seen_partners.add(partner)
            clean_text, _ = parse_comment_text(dm.text)
            unread_count = db.query(DirectMessage).filter(
                DirectMessage.sender_username == partner,
                DirectMessage.receiver_username == current_user,
                DirectMessage.is_read == 0
            ).count()
            all_chats.append(
                {
                    "is_dm": True,
                    "partner_username": partner,
                    "latest_message": clean_text,
                    "latest_sender": dm.sender_username,
                    "timestamp": dm.timestamp,
                    "unread_count": unread_count,
                }
            )

    all_chats.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"chats": all_chats[:30]}


@router.get("/api/dm/conversations")
def get_dm_conversations(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    # 1. AUTO-PURGE: Menghapus pesan DM yang lebih tua dari 1 tahun (365 hari)
    one_year_ago = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d %H:%M:%S")
    try:
        db.query(DirectMessage).filter(DirectMessage.timestamp < one_year_ago).delete()
        db.commit()
    except Exception:
        db.rollback()

    # 2. Ambil semua DM yang melibatkan user ini (Sebagai pengirim atau penerima)
    messages = (
        db.query(DirectMessage)
        .filter(
            or_(
                and_(
                    DirectMessage.sender_username == current_user,
                    DirectMessage.is_deleted_by_sender == 0,
                ),
                and_(
                    DirectMessage.receiver_username == current_user,
                    DirectMessage.is_deleted_by_receiver == 0,
                ),
            )
        )
        .order_by(DirectMessage.id.desc())
        .all()
    )

    convos = {}
    for m in messages:
        partner = (
            m.receiver_username
            if m.sender_username == current_user
            else m.sender_username
        )
        if partner not in convos:
            clean_text, _ = parse_comment_text(m.text)
            convos[partner] = {
                "partner": partner,
                "latest_message": clean_text,
                "timestamp": m.timestamp,
                "unread_count": 0,
            }
        # Hitung jumlah pesan yang belum dibaca khusus dari partner ini
        if m.receiver_username == current_user and m.is_read == 0:
            convos[partner]["unread_count"] += 1

    return {"conversations": list(convos.values())}


@router.get("/api/dm/{target_username}")
def get_dm_messages(
    target_username: str,
    offset: int = 0,
    limit: int = 50,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    messages = (
        db.query(DirectMessage)
        .filter(
            or_(
                and_(
                    DirectMessage.sender_username == current_user,
                    DirectMessage.receiver_username == target_username,
                    DirectMessage.is_deleted_by_sender == 0,
                ),
                and_(
                    DirectMessage.sender_username == target_username,
                    DirectMessage.receiver_username == current_user,
                    DirectMessage.is_deleted_by_receiver == 0,
                ),
            )
        )
        .order_by(DirectMessage.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    messages.reverse()
    res = []
    for m in messages:
        clean_text, rx = parse_comment_text(m.text)
        res.append(
            {
                "id": m.id,
                "username": m.sender_username,
                "text": clean_text,
                "timestamp": m.timestamp,
                "reactions": rx,
                "is_read": m.is_read,
            }
        )
    return {"messages": res}


@router.post("/api/dm/{target_username}")
def send_dm_message(
    target_username: str,
    payload: DMModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if len(payload.text) > 3000:
        raise HTTPException(status_code=400, detail="Message is too long.")

    target = db.query(User).filter(User.username == target_username).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_msg = DirectMessage(
        sender_username=current_user,
        receiver_username=target_username,
        text=payload.text,
        timestamp=now_str,
        is_read=0,
    )
    db.add(new_msg)
    db.commit()

    create_notification(
        db, target_username, f"@{current_user} sent you a direct message", "info"
    )
    return {"message": "Message sent"}


@router.put("/api/dm/{target_username}/read")
def read_dm_messages(
    target_username: str,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(DirectMessage).filter(
        DirectMessage.sender_username == target_username,
        DirectMessage.receiver_username == current_user,
        DirectMessage.is_read == 0,
        DirectMessage.is_deleted_by_receiver == 0,
    ).update({"is_read": 1})
    db.commit()
    return {"message": "Messages marked as read"}


@router.put("/api/dm/read-all")
def read_all_dm_messages(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(DirectMessage).filter(
        DirectMessage.receiver_username == current_user,
        DirectMessage.is_read == 0,
        DirectMessage.is_deleted_by_receiver == 0,
    ).update({"is_read": 1})
    db.commit()
    return {"message": "All DMs marked as read"}


@router.post("/api/dm/react/{message_id}")
def react_to_dm(
    message_id: int,
    payload: dict,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    emoji = payload.get("emoji")
    if not emoji:
        raise HTTPException(status_code=400)
    msg = db.query(DirectMessage).filter(DirectMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404)
    if msg.sender_username != current_user and msg.receiver_username != current_user:
        raise HTTPException(status_code=403, detail="Not authorized to react to this message")

    clean_text, rx = parse_comment_text(msg.text)

    is_already_selected = current_user in rx.get(emoji, [])

    keys_to_delete = []
    for key in rx.keys():
        if current_user in rx[key]:
            rx[key].remove(current_user)
        if not rx[key]:
            keys_to_delete.append(key)
    for key in keys_to_delete:
        del rx[key]

    if not is_already_selected:
        if emoji not in rx:
            rx[emoji] = []
        rx[emoji].append(current_user)

    msg.text = build_comment_text(clean_text, rx)
    db.commit()
    return {"message": "Reaction updated", "reactions": rx}


@router.delete("/api/dm/conversations/{target_username}")
def delete_dm_conversation(
    target_username: str,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Soft delete (Sembunyikan percakapan hanya dari sisi user yang menghapus)
    db.query(DirectMessage).filter(
        DirectMessage.sender_username == current_user,
        DirectMessage.receiver_username == target_username,
    ).update({"is_deleted_by_sender": 1})

    db.query(DirectMessage).filter(
        DirectMessage.sender_username == target_username,
        DirectMessage.receiver_username == current_user,
    ).update({"is_deleted_by_receiver": 1})

    db.commit()
    return {"message": "Conversation deleted"}


@router.delete("/api/dm/{message_id}")
def delete_dm_message(
    message_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msg = db.query(DirectMessage).filter(DirectMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_username != current_user and not is_user_superadmin(db, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to delete this message")

    db.delete(msg)
    db.commit()
    return {"message": "Message deleted"}

