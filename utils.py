from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, text
from database import get_db, User, Request, Subtask, Board, BoardMember, LeaveDay, LeaveRecord, Comment, Notification, DirectMessage, get_leave_dates
import os
import re
import json
import html
import time
from collections import defaultdict
import bcrypt
import jwt
import requests
import threading
from typing import List, Optional
from fastapi import BackgroundTasks
from services.email_service import send_email_async, send_email

def format_dt(dt_val):
    if isinstance(dt_val, datetime):
        return dt_val.strftime("%Y-%m-%d %H:%M:%S")
    elif isinstance(dt_val, date):
        return dt_val.strftime("%Y-%m-%d")
    elif isinstance(dt_val, str):
        return dt_val.replace("T", " ")
    return dt_val

MONTHS_LIST = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

def parse_raw_date(date_val):
    if not date_val or date_val == "-":
        return None
    if isinstance(date_val, datetime):
        return date_val
    if isinstance(date_val, date):
        return datetime.combine(date_val, datetime.min.time())
    
    date_str = str(date_val).split(".")[0].strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d", "%m/%d/%Y %H:%M:%S", "%m/%d/%Y %H:%M"):
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None

def format_date_only(date_str, include_time=True):
    dt = parse_raw_date(date_str)
    if not dt: return "-"
    if include_time:
        return f"{dt.day:02d} {MONTHS_LIST[dt.month-1]} {dt.year} {dt.strftime('%H:%M')}"
    else:
        return f"{dt.day:02d} {MONTHS_LIST[dt.month-1]} {dt.year}"

def calculate_priority(deadline_str, leave_dates_set):
    dt = parse_raw_date(deadline_str)
    if not dt: return "⚪ NO DATE", "safe"
    now = datetime.now()
    
    delta_days = (dt.date() - now.date()).days
    
    if delta_days < 0:
        return f"🔴 OVERDUE ({abs(delta_days)}d)", "critical"
    elif delta_days == 0:
        return "🟠 URGENT (Today)", "warning"
    elif delta_days == 1:
        return "🟠 URGENT (1d left)", "warning"
    elif delta_days < 7:
        return f"🟢 SAFE ({delta_days}d left)", "safe"
    else:
        w = delta_days // 7
        d = delta_days % 7
        if d == 0:
            return f"🟢 SAFE ({w}w left)", "safe"
        else:
            return f"🟢 SAFE ({w}w {d}d left)", "safe"

# --- Extracted Helpers ---
def create_notification(
    db: Session,
    username: str,
    message: str,
    notif_type: str = "info",
    related_task_id: int = None,
    background_tasks: BackgroundTasks = None,
):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    notif = Notification(
        user_username=username,
        message=message,
        type=notif_type,
        is_read=0,
        timestamp=now_str,
        related_task_id=related_task_id,
    )
    db.add(notif)
    db.commit()

    # Filter hanya jenis notifikasi penting yang akan dikirim via Email (termasuk team_invite)
    if notif_type in [
        "task_assigned",
        "mention",
        "task_completed",
        "team_invite",
        "team_chat",
        "auto_nudge",
        "access_request",
        "access_accepted"
    ]:
        user = db.query(User).filter(User.username == username).first()
        if user and user.email:
            subject = "INNOCEAN Tracker Update"
            if notif_type == "task_assigned":
                subject = "New Task Assigned"
            elif notif_type == "mention":
                subject = "You were mentioned in a task comment"
            elif notif_type == "task_completed":
                subject = "Task Completed"
            elif notif_type == "team_invite":
                subject = "Project Invitation"
            elif notif_type == "team_chat":
                subject = "New Mention in Team Chat"
            elif notif_type == "auto_nudge":
                subject = "Automated Task Reminder"
            elif notif_type == "access_request":
                subject = "New Access Request"
            elif notif_type == "access_accepted":
                subject = "Welcome to the Project!"

            safe_message = re.sub(r'(?:<!--|&lt;!--)\s*TASK_ID:\d+\s*(?:-->|--&gt;)', '', message, flags=re.IGNORECASE)
            safe_message = html.escape(safe_message.strip())
            html_body = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h2 style="color: #0f172a; margin-top: 0; text-transform: uppercase; font-weight: 900;">INNOCEAN Tracker</h2>
                <p style="color: #475569; font-size: 16px;">Hello <strong>@{username}</strong>,</p>
                <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #1e293b; font-size: 15px;">{safe_message}</p>
                </div>
                <p style="color: #64748b; font-size: 14px;">Please login to the workspace to view the details.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="color: #94a3b8; font-size: 11px;">This is an automated message from INNOCEAN Tracker. Please do not reply.</p>
            </div>
            """
            if background_tasks:
                background_tasks.add_task(send_email, user.email, subject, html_body)
            else:
                send_email_async(user.email, subject, html_body)


def auto_add_to_board(db: Session, board_id: int, username: str, inviter: str):
    if not username or username == inviter or not board_id:
        return False
    if is_system_feedback_board(db, board_id):
        return False
    target = db.query(User).filter(User.username == username).first()
    if not target or check_board_access(db, board_id, username):
        return False
    
    new_member = BoardMember(board_id=board_id, member_username=username, status="accepted")
    db.add(new_member)
    db.commit() # Commit agar langsung bisa mendapat notifikasi task di baris kode selanjutnya
    
    board = db.query(Board).filter(Board.id == board_id).first()
    board_name = board.name if board else 'Unknown'
    create_notification(db, username, f"@{inviter} automatically added you to project '{board_name}' by tagging you.", "info", board_id)
    return True


def log_activity(db: Session, task_id: int, message: str):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.add(
        Comment(
            request_id=task_id,
            username="System",
            text=f"[ACTIVITY] {message}",
            timestamp=now_str,
        )
    )
    db.commit()





def update_board_activity(db: Session, board_id: int):
    if not board_id:
        return
    board = db.query(Board).filter(Board.id == board_id).first()
    if board and board.name != "System Feedback":
        board.last_activity_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        board.deletion_date = None
        db.commit()


def evaluate_board_lifecycle(db: Session, board: Board):
    if board.name == "System Feedback":
        return False

    now = datetime.now()
    last_activity = (
        parse_raw_date(board.last_activity_date)
        if board.last_activity_date
        else parse_raw_date(board.created_at)
    )
    if not last_activity:
        last_activity = now
        board.last_activity_date = now.strftime("%Y-%m-%d %H:%M:%S")
        db.commit()

    if (now - last_activity).days > 180:
        if not board.deletion_date:
            board.deletion_date = (now + timedelta(days=7)).strftime(
                "%Y-%m-%d %H:%M:%S"
            )
            db.commit()
    else:
        if board.deletion_date:
            board.deletion_date = None
            db.commit()

    if board.deletion_date:
        del_date = parse_raw_date(board.deletion_date)
        if del_date and now > del_date:
            # EXECUTE AUTO DELETION (ZOMBIE PROJECT)
            db.query(BoardMember).filter(BoardMember.board_id == board.id).delete()
            tasks = db.query(Request).filter(Request.board_id == board.id).all()
            for t in tasks:
                db.query(Subtask).filter(Subtask.request_id == t.id).delete()
                db.query(Comment).filter(Comment.request_id == t.id).delete()
            db.query(Request).filter(Request.board_id == board.id).delete()
            db.delete(board)
            db.commit()
            return True
    return False


def evaluate_user_lifecycle(db: Session, user: User):
    if not user:
        return None

    # AUTO-PURGE: Hapus otomatis akun sampah/spam yang tidak diverifikasi setelah 7 hari
    if user.is_verified == 0 and user.created_at:
        created_dt = parse_raw_date(user.created_at)
        if created_dt and (datetime.now() - created_dt).days >= 7:
            try:
                username = user.username
                db.query(Notification).filter(
                    Notification.user_username == username
                ).delete()
                db.query(BoardMember).filter(
                    BoardMember.member_username == username
                ).delete()
                db.query(LeaveRecord).filter(LeaveRecord.username == username).delete()
                db.delete(user)
                db.commit()
                return None  # Kembalikan None agar tidak ditampilkan di tabel Admin
            except Exception:
                db.rollback()

    if user.account_status == "offboarding" and user.deletion_date:
        del_date = parse_raw_date(user.deletion_date)
        if del_date and datetime.now() > del_date:
            user.account_status = "pending_deletion"
            # Mulai hitungan mundur 90 hari untuk penghapusan permanen setelah nonaktif
            user.deletion_date = (datetime.now() + timedelta(days=90)).strftime(
                "%Y-%m-%d %H:%M:%S"
            )
            db.commit()
    return user


def get_all_queues(db: Session, leave_dates):
    all_active = db.query(Request).filter(Request.status.notin_(["Done", "Rejected"])).all()
    
    # Pre-fetch boards and board members to prevent N+1 query overhead
    boards = {b.id: b for b in db.query(Board).all()}
    members = db.query(BoardMember).filter(BoardMember.status == "accepted").all()
    board_members = defaultdict(set)
    for m in members:
        board_members[m.board_id].add(m.member_username.lower())
        
    def check_user_access(board_id, username):
        if not board_id:
            return False
        b = boards.get(board_id)
        if not b:
            return False
        uname_lower = username.lower()
        if b.owner_username and b.owner_username.lower() == uname_lower:
            return True
        if getattr(b, "is_private", 0) == 1:
            return False
        return uname_lower in board_members.get(board_id, set())

    user_global = defaultdict(list)
    user_project = defaultdict(list)
    for t in all_active:
        a_name = None
        m = re.search(r"@([\w.-]+)", t.requester or "")
        if m:
            a_name = m.group(1).lower()
        elif t.owner_username:
            a_name = t.owner_username.lower()
        if a_name:
            has_access = False
            if check_user_access(t.board_id, a_name):
                has_access = True
            else:
                b = boards.get(t.board_id)
                if b and b.name == "System Feedback" and t.requester and t.requester.lower() == a_name:
                    has_access = True
            
            if has_access:
                user_global[a_name].append(t)
                user_project[(a_name, t.board_id)].append(t)
            
    task_queue_info = {}
    def sort_key(t):
        p_weight = {"critical": 1, "warning": 2, "normal": 3}
        _, p_lvl = calculate_priority(t.deadline or "", set(leave_dates))
        w1 = p_weight.get(p_lvl, 3)
        i_weight = {"High": 1, "Medium": 2, "Low": 3}
        w2 = i_weight.get(getattr(t, "impact", "Medium"), 2)
        dt = parse_raw_date(t.deadline) if t.deadline else parse_raw_date(t.timestamp)
        ts = dt.timestamp() if dt else float('inf')
        return (w1, w2, ts, t.id)

    for a_name, user_tasks in user_global.items():
        user_tasks.sort(key=sort_key)
        total = len(user_tasks)
        for idx, t in enumerate(user_tasks):
            task_queue_info[t.id] = {
                "global_q": idx + 1,
                "global_t": total,
                "main_assignee": a_name
            }

    for (a_name, b_id), user_tasks in user_project.items():
        user_tasks.sort(key=sort_key)
        total = len(user_tasks)
        for idx, t in enumerate(user_tasks):
            if t.id in task_queue_info:
                task_queue_info[t.id]["project_q"] = idx + 1
                task_queue_info[t.id]["project_t"] = total
            
    return task_queue_info


def parse_comment_text(raw_text):
    if not raw_text:
        return "", {}
    parts = str(raw_text).split("<!--REACTIONS:")
    clean_text = parts[0]
    reactions = {}
    if len(parts) > 1:
        try:
            json_str = parts[1].split("-->")[0]
            reactions = json.loads(json_str)
        except:
            pass
    return clean_text, reactions


def build_comment_text(clean_text, reactions):
    if not reactions:
        return clean_text
    return clean_text + f"<!--REACTIONS:{json.dumps(reactions)}-->"


def get_assignees(text: str) -> set:
    if not text:
        return set()
    return set(re.findall(r"@([\w.-]+)", text))


def update_env_var(key: str, value: str):
    if value is None:
        return
    value = str(value).replace("\n", "").replace("\r", "").strip()
    env_file = ".env"
    lines = []
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            lines = f.readlines()
    found = False
    with open(env_file, "w") as f:
        for line in lines:
            if line.startswith(f"{key}="):
                f.write(f"{key}={value}\n")
                found = True
            else:
                f.write(line)
        if not found:
            if lines and not lines[-1].endswith("\n"):
                f.write("\n")
            f.write(f"{key}={value}\n")
    os.environ[key] = value


def check_board_access(db: Session, board_id: int, username: str):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        return False
    if board.owner_username == username:
        return True
    if getattr(board, "is_private", 0) == 1:
        return False
    member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == board_id,
            BoardMember.member_username == username,
            BoardMember.status == "accepted",
        )
        .first()
    )
    return bool(member)


def has_task_read_access(db: Session, task: Request, username: str) -> bool:
    if check_board_access(db, task.board_id, username):
        return True
    board = db.query(Board).filter(Board.id == task.board_id).first()
    if board and board.name == "System Feedback" and task.requester == username:
        return True
    return False


def is_system_feedback_board(db: Session, board_id: int) -> bool:
    board = db.query(Board).filter(Board.id == board_id).first()
    return board and board.name == "System Feedback"


def can_modify_system_ticket(db: Session, username: str) -> bool:
    if username == "admin":
        return True
    return is_user_superadmin(db, username)


def is_user_superadmin(db: Session, username: str):
    user = db.query(User).filter(User.username == username).first()
    return user and user.is_superadmin == 1


def is_task_admin(db: Session, task: Request, username: str):
    if is_user_superadmin(db, username):
        return True
    if task.owner_username and task.owner_username.lower() == username.lower():
        return True
    board = db.query(Board).filter(Board.id == task.board_id).first()
    if board and board.owner_username and board.owner_username.lower() == username.lower():
        return True
    return False


def is_user_involved_in_task(db: Session, task: Request, username: str) -> bool:
    if is_user_superadmin(db, username):
        return True
    if task.owner_username and task.owner_username.lower() == username.lower():
        return True
    board = db.query(Board).filter(Board.id == task.board_id).first()
    if board and board.owner_username and board.owner_username.lower() == username.lower():
        return True
    if task.requester:
        req_clean = task.requester.replace("@", "").strip().lower()
        if req_clean == username.lower():
            return True
    assignees = {a.lower() for a in get_assignees(task.requester)}
    if username.lower() in assignees:
        return True
    subtasks = db.query(Subtask).filter(Subtask.request_id == task.id).all()
    for st in subtasks:
        if st.assignee and st.assignee.lower() == username.lower():
            return True
    return False


def spawn_recurring_task(db: Session, original_task: Request):
    if not getattr(original_task, "recurring", None) or original_task.recurring == "none":
        return None
        
    old_start = parse_raw_date(original_task.start_date) if original_task.start_date else datetime.now()
    old_dead = parse_raw_date(original_task.deadline) if original_task.deadline else datetime.now()
    
    delta = timedelta(days=0)
    if original_task.recurring == "daily":
        delta = timedelta(days=1)
    elif original_task.recurring == "weekly":
        delta = timedelta(days=7)
    elif original_task.recurring == "monthly":
        delta = timedelta(days=30)
        
    new_start = old_start + delta if old_start else None
    new_dead = old_dead + delta if old_dead else None
    
    timestamp = datetime.utcnow()
        
    new_task = Request(
        board_id=original_task.board_id,
        timestamp=timestamp,
        project_name=original_task.project_name,
        requester=original_task.requester,
        category=original_task.category,
        description=original_task.description,
        supporting_access=original_task.supporting_access,
        start_date=new_start,
        deadline=new_dead,
        impact=getattr(original_task, "impact", "Medium"),
        etc=getattr(original_task, "etc", 2.0),
        auto_nudge=getattr(original_task, "auto_nudge", False),
        status="Pending",
        owner_username=original_task.owner_username,
    )
    setattr(new_task, "recurring", original_task.recurring)
    db.add(new_task)
    db.flush()
    
    old_subs = db.query(Subtask).filter(Subtask.request_id == original_task.id).all()
    for s in old_subs:
        db.add(Subtask(
            request_id=new_task.id,
            task_name=s.task_name,
            assignee=s.assignee,
            position=s.position,
            is_done=0
        ))
    db.flush()
        
    original_task.recurring = "none"
    db.add(Comment(
        request_id=original_task.id,
        username="System",
        text=f"[ACTIVITY] This recurring task was completed. A new task has been auto-generated for the next period.",
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    return new_task.id


def get_or_create_chat_task(db: Session, board_id: int):
    task = (
        db.query(Request)
        .filter(
            Request.board_id == board_id,
            Request.project_name == "[SYSTEM] PROJECT CHAT",
        )
        .first()
    )
    if not task:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        task = Request(
            board_id=board_id,
            timestamp=now_str,
            project_name="[SYSTEM] PROJECT CHAT",
            requester="System",
            category="Other",
            description="Internal Chat Space",
            supporting_access="",
            start_date=now_str.split(" ")[0],
            deadline=now_str.split(" ")[0],
            status="Done",
            owner_username="admin",
        )
        db.add(task)
        db.commit()
        db.refresh(task)
    return task

