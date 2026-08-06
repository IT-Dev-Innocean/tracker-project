import os
from pathlib import Path
from dotenv import load_dotenv
import bcrypt
import json
from sqlalchemy import create_engine, Column, Integer, String, Text, text, DateTime, Boolean, Float
from datetime import datetime
from sqlalchemy.orm import declarative_base, sessionmaker

_BACKEND_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _BACKEND_DIR.parent

# Muat .env dari root repo lalu backend/ (backend menimpa jika ada)
load_dotenv(_REPO_ROOT / ".env", override=False)
load_dotenv(_BACKEND_DIR / ".env", override=True)

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in the environment or .env file!")

# Tambahkan pool_pre_ping dan pool_recycle untuk menangani auto-disconnect di cloud DB (seperti Neon DB)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, pool_pre_ping=True, pool_recycle=300
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Request(Base):
    __tablename__ = "requests"
    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, index=True, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    project_name = Column(String(100))
    requester = Column(String(100))
    category = Column(String(50))
    description = Column(Text)
    supporting_access = Column(Text)
    start_date = Column(DateTime, nullable=True)
    deadline = Column(DateTime)
    status = Column(String(50), default="Pending")
    completed_time = Column(DateTime, nullable=True)
    owner_username = Column(String(50), index=True)
    impact = Column(String(50), default="Medium")
    etc = Column(Float, default=2.0)
    auto_nudge = Column(Boolean, default=False)
    recurring = Column(String(50), default="none")


class LeaveDay(Base):
    __tablename__ = "leave_days"
    id = Column(Integer, primary_key=True, index=True)
    leave_date = Column(DateTime, unique=True)


class LeaveRecord(Base):
    __tablename__ = "leave_records"
    id = Column(Integer, primary_key=True, index=True)
    leave_date = Column(DateTime, index=True)
    username = Column(String(50), index=True, nullable=True)
    description = Column(String(255))
    leave_type = Column(
        String(50), default="personal"
    )  # 'personal', 'mass_leave', 'public_holiday'


class Subtask(Base):
    __tablename__ = "subtasks"
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, index=True)
    task_name = Column(String(255))
    is_done = Column(Integer, default=0)
    assignee = Column(String(50), nullable=True)
    due_date = Column(DateTime, nullable=True)
    position = Column(Integer, default=0)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    full_name = Column(String(100))
    password = Column(String(255))
    avatar = Column(Text, nullable=True)
    is_verified = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    account_status = Column(
        String(50), default="active"
    )  # active, suspended, pending_deletion
    deletion_date = Column(DateTime, nullable=True)
    is_superadmin = Column(Integer, default=0)
    # admin | project_owner | manager | staff
    role = Column(String(50), default="project_owner")
    timesheet_approver = Column(String(50), nullable=True)
    timesheet_required = Column(Boolean, default=True)


class Board(Base):
    __tablename__ = "boards"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    owner_username = Column(String(50), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    statuses = Column(Text, nullable=True)
    categories = Column(Text, nullable=True)
    last_activity_date = Column(DateTime, nullable=True)
    deletion_date = Column(DateTime, nullable=True)
    is_private = Column(Integer, default=0)
    project_number = Column(String(100), nullable=True)


class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    client_code = Column(String(50), unique=True, index=True)
    client_name = Column(String(200))
    status = Column(String(50), default="active")  # active | inactive
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(50), nullable=True)


class BoardMember(Base):
    __tablename__ = "board_members"
    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, index=True)
    member_username = Column(String(50), index=True)
    status = Column(String(20), default="pending")


class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, index=True)
    username = Column(String(50))
    text = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_username = Column(String(50), index=True)
    message = Column(String(255))
    type = Column(String(50), default="info")
    is_read = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    related_task_id = Column(Integer, nullable=True)


class DirectMessage(Base):
    __tablename__ = "direct_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_username = Column(String(50), index=True)
    receiver_username = Column(String(50), index=True)
    text = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Integer, default=0)
    is_deleted_by_sender = Column(Integer, default=0)
    is_deleted_by_receiver = Column(Integer, default=0)


class Timesheet(Base):
    __tablename__ = "timesheets"
    id = Column(Integer, primary_key=True, index=True)
    user_username = Column(String(50), index=True)
    request_id = Column(Integer, index=True, nullable=True)
    board_id = Column(Integer, index=True, nullable=True)
    date = Column(DateTime, index=True)
    hours_logged = Column(Float, default=0.0)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="Draft") # Draft, Pending, Approved, Rejected
    approver_username = Column(String(50), index=True, nullable=True)
    custom_project_name = Column(String(255), nullable=True)
    custom_task_name = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


class SecurityLog(Base):
    __tablename__ = "security_logs"
    key = Column(String(255), primary_key=True, index=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def get_security_log(db, key: str, default_value=None):
    log = db.query(SecurityLog).filter(SecurityLog.key == key).first()
    if log and log.value:
        try:
            return json.loads(log.value)
        except:
            return default_value
    return default_value


def set_security_log(db, key: str, value):
    log = db.query(SecurityLog).filter(SecurityLog.key == key).first()
    str_val = json.dumps(value)
    if log:
        log.value = str_val
    else:
        new_log = SecurityLog(key=key, value=str_val)
        db.add(new_log)
    db.commit()


def setup_db():
    Base.metadata.create_all(bind=engine)
    # Ensure role and timesheet_required columns exist on older databases
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'project_owner'"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS timesheet_required BOOLEAN DEFAULT TRUE"
                )
            )
            conn.execute(
                text(
                    "UPDATE users SET timesheet_required = TRUE WHERE timesheet_required IS NULL"
                )
            )
    except Exception:
        try:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'project_owner'"))
                conn.execute(text("ALTER TABLE users ADD COLUMN timesheet_required BOOLEAN DEFAULT TRUE"))
        except Exception:
            pass

    db = SessionLocal()
    try:
        # Backfill roles from is_superadmin for rows missing/invalid role
        users = db.query(User).all()
        for u in users:
            current_role = getattr(u, "role", None)
            if current_role not in ("admin", "project_owner", "manager", "staff"):
                u.role = "admin" if u.is_superadmin == 1 else "project_owner"
            # Keep is_superadmin in sync with role
            u.is_superadmin = 1 if u.role == "admin" else 0
        db.commit()

        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            salt = bcrypt.gensalt()
            hashed_pw = bcrypt.hashpw("admin123".encode("utf-8"), salt).decode("utf-8")
            new_admin = User(
                username="admin",
                email="admin@innocean.co.id",
                full_name="System Admin",
                password=hashed_pw,
                is_superadmin=1,
                role="admin",
            )
            db.add(new_admin)
            db.commit()
        else:
            if admin.is_superadmin == 0 or getattr(admin, "role", None) != "admin":
                admin.is_superadmin = 1
                admin.role = "admin"
                db.commit()

            if not admin.password.startswith("$2b$"):
                salt = bcrypt.gensalt()
                admin.password = bcrypt.hashpw(
                    admin.password.encode("utf-8")[:71], salt
                ).decode("utf-8")
                db.commit()
    finally:
        db.close()


def get_leave_dates(db):
    leaves = db.query(LeaveDay.leave_date).all()
    global_leaves = (
        db.query(LeaveRecord.leave_date)
        .filter(LeaveRecord.leave_type.in_(["mass_leave", "public_holiday"]))
        .all()
    )

    ans = set()
    for l in leaves:
        if l[0]:
            ans.add(l[0].strftime("%Y-%m-%d") if hasattr(l[0], "strftime") else str(l[0])[:10])
    for l in global_leaves:
        if l[0]:
            ans.add(l[0].strftime("%Y-%m-%d") if hasattr(l[0], "strftime") else str(l[0])[:10])
    return ans


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
