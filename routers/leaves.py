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

@router.get("/api/leaves")
def get_leaves(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    # Cari ID project (board) yang Anda miliki atau ikuti
    owned_boards = db.query(Board.id).filter(Board.owner_username == current_user)
    member_boards = db.query(BoardMember.board_id).filter(
        BoardMember.member_username == current_user, BoardMember.status == "accepted"
    )

    # Kumpulkan username seluruh rekan satu tim Anda
    team_members = (
        db.query(BoardMember.member_username)
        .filter(
            or_(
                BoardMember.board_id.in_(owned_boards),
                BoardMember.board_id.in_(member_boards),
            )
        )
        .all()
    )
    owners = (
        db.query(Board.owner_username)
        .filter(or_(Board.id.in_(owned_boards), Board.id.in_(member_boards)))
        .all()
    )

    team_usernames = set([m[0] for m in team_members] + [o[0] for o in owners])
    team_usernames.add(current_user)

    # Ambil Hari Libur Nasional, Cuti Bersama, dan Cuti Personal milik Anda & tim Anda
    leaves = (
        db.query(LeaveRecord)
        .filter(
            or_(
                LeaveRecord.leave_type.in_(["mass_leave", "public_holiday"]),
                and_(
                    LeaveRecord.leave_type == "personal",
                    LeaveRecord.username.in_(team_usernames),
                ),
            )
        )
        .all()
    )

    return {
        "leaves": [
            {
                "id": l.id,
                "leave_date": l.leave_date.strftime("%Y-%m-%d") if hasattr(l.leave_date, "strftime") else str(l.leave_date)[:10],
                "description": l.description,
                "leave_type": l.leave_type,
                "username": l.username,
            }
            for l in leaves
        ]
    }


@router.post("/api/leaves")
def create_leave(
    payload: LeaveModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.leave_type == "mass_leave" and not is_user_superadmin(db, current_user):
        raise HTTPException(
            status_code=403, detail="Only Super Admins can set mass leaves."
        )
    username = current_user if payload.leave_type == "personal" else None

    start_dt = datetime.strptime(payload.start_date, "%Y-%m-%d")
    end_dt = (
        datetime.strptime(payload.end_date, "%Y-%m-%d")
        if payload.end_date
        else start_dt
    )
    delta = end_dt - start_dt

    for i in range(delta.days + 1):
        cur_date = (start_dt + timedelta(days=i)).strftime("%Y-%m-%d")
        existing = (
            db.query(LeaveRecord)
            .filter(
                LeaveRecord.leave_date == cur_date,
                LeaveRecord.leave_type == payload.leave_type,
                LeaveRecord.username == username,
            )
            .first()
        )
        if not existing:
            new_leave = LeaveRecord(
                leave_date=cur_date,
                description=payload.description,
                leave_type=payload.leave_type,
                username=username,
            )
            db.add(new_leave)

    db.commit()
    return {"message": "Leave date(s) added successfully"}


@router.delete("/api/leaves/{leave_id}")
def delete_leave(
    leave_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    leave = db.query(LeaveRecord).filter(LeaveRecord.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Not found")
    if leave.leave_type == "mass_leave" and not is_user_superadmin(db, current_user):
        raise HTTPException(status_code=403)
    if leave.leave_type == "personal" and leave.username != current_user:
        raise HTTPException(status_code=403)
    if leave.leave_type == "public_holiday":
        raise HTTPException(
            status_code=403, detail="Cannot manually delete public holidays."
        )
    db.delete(leave)
    db.commit()
    return {"message": "Leave removed"}

