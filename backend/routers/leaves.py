from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, text
import re
import json
from datetime import datetime, timedelta
import os
import urllib.request
import urllib.parse

from database import get_db, User, Request, Subtask, Board, BoardMember, LeaveDay, LeaveRecord, Comment, Notification, DirectMessage
from schemas import *
from dependencies import *
from utils import *

router = APIRouter()

LAST_GCAL_SYNC = None

def sync_public_holidays_from_gcal():
    from database import SessionLocal
    api_key = os.getenv("GOOGLE_CALENDAR_API_KEY")
    if not api_key:
        return
    
    db = SessionLocal()
    try:
        current_year = datetime.now().year
        years_to_sync = [current_year - 1, current_year, current_year + 1]
        
        calendar_id = "id.indonesian#holiday@group.v.calendar.google.com"
        encoded_id = urllib.parse.quote(calendar_id)
        
        for year in years_to_sync:
            time_min = f"{year}-01-01T00:00:00Z"
            time_max = f"{year}-12-31T23:59:59Z"
            url = (
                f"https://www.googleapis.com/calendar/v3/calendars/{encoded_id}/events"
                f"?key={api_key}&timeMin={time_min}&timeMax={time_max}&maxResults=100"
            )
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=10) as response:
                    data = json.loads(response.read().decode('utf-8'))
                    for item in data.get('items', []):
                        summary = item.get('summary')
                        start = item.get('start', {})
                        date_str = start.get('date') or (start.get('dateTime')[:10] if start.get('dateTime') else None)
                        if not date_str or not summary:
                            continue
                        
                        dt = datetime.strptime(date_str, "%Y-%m-%d")
                        
                        existing = db.query(LeaveRecord).filter(
                            LeaveRecord.leave_date == dt,
                            LeaveRecord.leave_type == "public_holiday"
                        ).first()
                        
                        if not existing:
                            new_holiday = LeaveRecord(
                                leave_date=dt,
                                description=summary,
                                leave_type="public_holiday",
                                username=None
                            )
                            db.add(new_holiday)
                db.commit()
            except Exception as e:
                print(f"Error syncing gcal holidays for year {year}: {e}")
    except Exception as e:
        print(f"Error in gcal sync background task: {e}")
    finally:
        db.close()

@router.get("/api/leaves")
def get_leaves(
    background_tasks: BackgroundTasks,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    global LAST_GCAL_SYNC
    now = datetime.now()
    if LAST_GCAL_SYNC is None or (now - LAST_GCAL_SYNC).total_seconds() > 86400:
        LAST_GCAL_SYNC = now
        background_tasks.add_task(sync_public_holidays_from_gcal)

    # Cari ID project (board) yang Anda miliki atau di mana Anda menjadi anggota aktif
    owned_boards = db.query(Board.id).filter(Board.owner_username == current_user)
    member_boards = db.query(BoardMember.board_id).filter(
        BoardMember.member_username == current_user, BoardMember.status == "accepted"
    )
    my_board_ids = owned_boards.union(member_boards)

    # Kumpulkan username seluruh rekan satu tim HANYA dari proyek di mana pengguna terlibat
    team_members = (
        db.query(BoardMember.member_username)
        .filter(
            BoardMember.board_id.in_(my_board_ids),
            BoardMember.status == "accepted"
        )
        .all()
    )
    owners = (
        db.query(Board.owner_username)
        .filter(Board.id.in_(my_board_ids))
        .all()
    )

    team_usernames = set([m[0] for m in team_members] + [o[0] for o in owners])
    team_usernames.add(current_user)

    # Kumpulkan juga username dari user yang approver-nya adalah Anda
    managed_users = db.query(User.username).filter(User.timesheet_approver == current_user).all()
    managed_usernames = [mu[0] for mu in managed_users]
    team_usernames.update(managed_usernames)

    # Jika current_user adalah Admin / Project Owner / SuperAdmin, berikan akses melihat seluruh cuti personal di workspace
    is_manager = can_manage_projects(db, current_user) or is_user_superadmin(db, current_user)
    
    if is_manager:
        leaves = (
            db.query(LeaveRecord)
            .filter(
                or_(
                    LeaveRecord.leave_type.in_(["mass_leave", "public_holiday"]),
                    LeaveRecord.leave_type == "personal",
                )
            )
            .all()
        )
    else:
        # Untuk Staff biasa: HANYA ambil cuti personal milik rekan satu tim di proyek yang ia ikuti atau bawahannya
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

