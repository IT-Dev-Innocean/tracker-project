import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

# Import get_db and User model from database
from database import get_db, User, TeamMembership

SYSTEM_ROLES = {"admin", "manager", "staff"}

# Konfigurasi Keamanan (JWT & Bcrypt)
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError(
        "FATAL ERROR: SECRET_KEY environment variable is not set. "
        "The application cannot start in an insecure state."
    )

ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def get_password_hash(password: str) -> str:
    # Batasi 71 karakter dan hash langsung menggunakan bcrypt (tanpa passlib)
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8")[:71], salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:71], hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=60 * 24)  # Berlaku 24 jam
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=401, detail="Invalid authentication credentials"
            )

        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=401, detail="User account no longer exists")
        if user.account_status == "pending_deletion":
            raise HTTPException(
                status_code=403, detail="Account is disabled and scheduled for deletion"
            )

        return username
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=401, detail="Invalid authentication credentials"
        )


def effective_system_role(user: User) -> str:
    """Read the new role while preserving legacy is_superadmin behavior."""
    if getattr(user, "is_superadmin", 0) == 1:
        return "admin"
    role = getattr(user, "system_role", None) or "staff"
    return role if role in SYSTEM_ROLES else "staff"


def get_current_user_record(
    username: str = Depends(get_current_user), db: Session = Depends(get_db)
) -> User:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User account no longer exists")
    return user


def require_roles(*allowed_roles):
    allowed = set(allowed_roles)

    def dependency(user: User = Depends(get_current_user_record)) -> User:
        if effective_system_role(user) not in allowed:
            raise HTTPException(status_code=403, detail="Insufficient system role")
        return user

    return dependency


require_admin = require_roles("admin")
require_manager_or_admin = require_roles("admin", "manager")


def is_admin_user(user: User) -> bool:
    return effective_system_role(user) == "admin"


def user_managed_team_ids(db: Session, username: str):
    return {
        row[0]
        for row in db.query(TeamMembership.team_id)
        .filter(
            TeamMembership.username == username,
            TeamMembership.membership_role == "manager",
        )
        .all()
    }


def can_manage_staff(db: Session, actor: User, target: User) -> bool:
    """Admins manage anyone; managers manage staff sharing a managed team."""
    actor_role = effective_system_role(actor)
    if actor_role == "admin":
        return True
    if actor_role != "manager" or effective_system_role(target) != "staff":
        return False
    managed_ids = user_managed_team_ids(db, actor.username)
    if not managed_ids:
        return False
    return (
        db.query(TeamMembership.id)
        .filter(
            TeamMembership.username == target.username,
            TeamMembership.membership_role == "staff",
            TeamMembership.team_id.in_(managed_ids),
        )
        .first()
        is not None
    )


def ensure_not_last_admin(db: Session, user: User):
    if effective_system_role(user) != "admin":
        return
    admin_count = sum(
        1 for candidate in db.query(User).all()
        if effective_system_role(candidate) == "admin"
    )
    if admin_count <= 1:
        raise HTTPException(
            status_code=409,
            detail="Cannot demote or delete the last Admin.",
        )
