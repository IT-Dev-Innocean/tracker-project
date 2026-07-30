import os
from pathlib import Path
from dotenv import load_dotenv
import bcrypt
import json
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    text,
    DateTime,
    Boolean,
    Float,
    UniqueConstraint,
)
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
    # Global application role. Project ownership remains derived from Board.owner_username.
    system_role = Column(String(20), nullable=False, default="staff", index=True)
    groq_monthly_token_allowance = Column(Integer, nullable=False, default=100000)
    timesheet_approver = Column(String(50), nullable=True)


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
    # Optional organization team responsible for this project.
    team_id = Column(Integer, nullable=True, index=True)


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


class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class TeamMembership(Base):
    __tablename__ = "team_memberships"
    __table_args__ = (
        UniqueConstraint("team_id", "username", name="uq_team_membership"),
    )
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, nullable=False, index=True)
    username = Column(String(50), nullable=False, index=True)
    # Mirrors the member's responsibility inside this team, not project ownership.
    membership_role = Column(String(20), nullable=False, default="staff")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class GroqTokenLedger(Base):
    __tablename__ = "groq_token_ledger"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False, index=True)
    period = Column(String(7), nullable=False, index=True)  # YYYY-MM, UTC calendar month
    prompt_tokens = Column(Integer, nullable=False, default=0)
    completion_tokens = Column(Integer, nullable=False, default=0)
    total_tokens = Column(Integer, nullable=False, default=0)
    model = Column(String(100), nullable=False)
    endpoint = Column(String(100), nullable=False, default="ai_generate")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class FileAsset(Base):
    """Attachment metadata. Binary payload storage is intentionally not implied."""

    __tablename__ = "file_assets"
    id = Column(Integer, primary_key=True, index=True)
    uploader_username = Column(String(50), nullable=False, index=True)
    request_id = Column(Integer, nullable=True, index=True)
    comment_id = Column(Integer, nullable=True, index=True)
    original_filename = Column(String(255), nullable=False)
    content_type = Column(String(150), nullable=True)
    size_bytes = Column(Integer, nullable=False, default=0)
    storage_kind = Column(String(30), nullable=False, default="metadata_only")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# Compatibility name for code that refers to attachments rather than file assets.
Attachment = FileAsset


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
    db = SessionLocal()
    try:
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
                system_role="admin",
            )
            db.add(new_admin)
            db.commit()
        elif admin.is_superadmin == 0 or admin.system_role != "admin":
            admin.is_superadmin = 1
            admin.system_role = "admin"
            db.commit()

        elif not admin.password.startswith("$2b$"):
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
