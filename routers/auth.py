from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
import re
from datetime import datetime, timedelta
import os
import requests
import time

from database import get_db, User, get_security_log, set_security_log
from schemas import RegisterModel, LoginModel, GoogleLoginModel, VerifyModel
from dependencies import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM
import jwt
from services.email_service import send_email

# Import evaluate_user_lifecycle from backend_api to resolve NameError
from utils import *

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://innocean-tracker.vercel.app")

router = APIRouter()

@router.post("/api/register")
def register(user_data: RegisterModel, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Validasi Domain Whitelist (innocean.co.id & innocean.com)
    email_lower = user_data.email.lower()
    if not (
        email_lower.endswith("@innocean.co.id") or email_lower.endswith("@innocean.com")
    ):
        raise HTTPException(
            status_code=400,
            detail="Only @innocean.co.id or @innocean.com emails are allowed.",
        )

    # Validasi Standar Industri untuk Kekuatan Password
    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=400, detail="Password must be at least 8 characters long."
        )
    if not re.search(r"[A-Z]", user_data.password) or not re.search(
        r"[0-9]", user_data.password
    ):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter and one number.",
        )

    if not re.match(r"^[a-zA-Z0-9_.-]+$", user_data.username):
        raise HTTPException(
            status_code=400,
            detail="Username can only contain letters, numbers, dots, dashes, and underscores.",
        )
    if len(user_data.username) < 3 or len(user_data.username) > 30:
        raise HTTPException(
            status_code=400, detail="Username must be between 3 and 30 characters."
        )

    existing = (
        db.query(User)
        .filter(or_(User.username == user_data.username, User.email == user_data.email))
        .first()
    )
    if existing:
        if existing.email == user_data.email:
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = get_password_hash(user_data.password)
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        password=hashed_password,
        is_verified=0,
        created_at=now_str,
    )
    db.add(new_user)
    db.commit()

    # Kirim Email Verifikasi
    verify_token = create_access_token(
        data={"sub": new_user.username, "type": "verify"}
    )
    verify_link = f"{FRONTEND_URL}/?verify={verify_token}"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0f172a; margin-top: 0; text-transform: uppercase; font-weight: 900;">Verify Your Email</h2>
        <p style="color: #475569; font-size: 16px;">Hello <strong>@{new_user.username}</strong>,</p>
        <p style="color: #475569; font-size: 15px;">Welcome to INNOCEAN Tracker! Please click the button below to verify your email address and activate your account:</p>
        <a href="{verify_link}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">Verify Account</a>
        <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email.</p>
    </div>
    """
    background_tasks.add_task(send_email, new_user.email, "Verify Your INNOCEAN Tracker Account", html_body)

    return {
        "message": "Registration successful! Please check your email inbox to verify your account before logging in."
    }


@router.post("/api/login")
def login(credentials: LoginModel, db: Session = Depends(get_db)):
    now_time = time.time()
    # Pengecekan status Lockout
    login_state = get_security_log(db, f"login_attempts:{credentials.username}", {"count": 0, "lockout_time": 0})
    if login_state["lockout_time"] > now_time:
        raise HTTPException(
            status_code=429,
            detail="Too many failed attempts. Account locked for 15 minutes.",
        )

    user = db.query(User).filter(User.username == credentials.username).first()
    if user:
        if verify_password(credentials.password, user.password):
            evaluate_user_lifecycle(db, user)
            if user.is_verified == 0:
                raise HTTPException(
                    status_code=403,
                    detail="Please verify your email address first. Check your inbox for the verification link.",
                )
            if user.account_status == "pending_deletion":
                raise HTTPException(
                    status_code=403,
                    detail="Your account is scheduled for deletion and has been disabled.",
                )

            # Bersihkan log kegagalan jika login berhasil
            set_security_log(db, f"login_attempts:{credentials.username}", {"count": 0, "lockout_time": 0})
            access_token = create_access_token(data={"sub": user.username})
            return {"message": "Login successful", "token": access_token}

    # Tambahkan rekam jejak kegagalan login
    login_state["count"] += 1
    if login_state["count"] >= 5:
        login_state["lockout_time"] = now_time + 900  # Kunci selama 15 menit
        set_security_log(db, f"login_attempts:{credentials.username}", login_state)
        raise HTTPException(
            status_code=429,
            detail="Too many failed attempts. Account locked for 15 minutes.",
        )

    set_security_log(db, f"login_attempts:{credentials.username}", login_state)
    raise HTTPException(status_code=401, detail="Invalid username or password")


@router.post("/api/google-login")
def google_login(payload: GoogleLoginModel, db: Session = Depends(get_db)):
    # Verifikasi token langsung ke server Google
    resp = requests.get(
        f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={payload.token}"
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    user_info = resp.json()
    email = user_info.get("email", "").lower()
    name = user_info.get("name", "")
    picture = user_info.get("picture", "")

    # Validasi Whitelist Domain Perusahaan
    if not (email.endswith("@innocean.co.id") or email.endswith("@innocean.com")):
        raise HTTPException(
            status_code=403,
            detail="Only @innocean.co.id or @innocean.com emails are allowed to login.",
        )

    user = db.query(User).filter(User.email == email).first()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if not user:
        # Jika user belum ada, buat akun secara otomatis (Auto-Provisioning)
        base_username = email.split("@")[0]
        username = base_username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1
        user = User(
            username=username,
            email=email,
            full_name=name,
            password=get_password_hash("GoogleSSOAutoGenerate!"),
            avatar=picture,
            is_verified=1,
            created_at=now_str,
        )
        db.add(user)
        db.commit()
    else:
        evaluate_user_lifecycle(db, user)
        if user.account_status == "pending_deletion":
            raise HTTPException(
                status_code=403,
                detail="Your account is scheduled for deletion and has been disabled.",
            )
        # Selalu sinkronkan avatar dari Google jika masih kosong atau masih menggunakan bawaan Google
        if picture and (not user.avatar or "googleusercontent.com" in user.avatar):
            user.avatar = picture
            db.commit()

    access_token = create_access_token(data={"sub": user.username})
    return {
        "message": "Login successful",
        "token": access_token,
        "username": user.username,
    }


@router.post("/api/forgot-password")
def forgot_password(payload: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email = payload.get("email")
    origin = payload.get("origin", FRONTEND_URL)
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    now_time = time.time()
    last_email_time = get_security_log(db, f"forgot_password:{email}", 0)
    
    if (now_time - last_email_time) < 60:
        raise HTTPException(
            status_code=429,
            detail="Please wait 60 seconds before requesting another reset email.",
        )
    set_security_log(db, f"forgot_password:{email}", now_time)

    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"message": "If your email is registered, a reset link has been sent."}

    reset_token = create_access_token(
        data={"sub": user.username, "type": "reset"},
        expires_delta=timedelta(minutes=30),
    )
    reset_link = f"{origin}/?token={reset_token}"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0f172a; margin-top: 0; text-transform: uppercase; font-weight: 900;">Password Reset</h2>
        <p style="color: #475569; font-size: 16px;">Hello <strong>@{user.username}</strong>,</p>
        <p style="color: #475569; font-size: 15px;">We received a request to reset your INNOCEAN Tracker password. Click the button below to set a new password:</p>
        <a href="{reset_link}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">Reset Password</a>
        <p style="color: #64748b; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 11px;">This link will expire in 24 hours.</p>
    </div>
    """
    background_tasks.add_task(send_email, user.email, "Reset Your INNOCEAN Tracker Password", html_body)
    return {"message": "If your email is registered, a reset link has been sent."}


@router.post("/api/reset-password")
def reset_password(payload: dict, db: Session = Depends(get_db)):
    token = payload.get("token")
    new_password = payload.get("new_password")

    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if data.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Invalid token")
        username = data.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if (
        len(new_password) < 8
        or not re.search(r"[A-Z]", new_password)
        or not re.search(r"[0-9]", new_password)
    ):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters, contain 1 uppercase and 1 number.",
        )

    user.password = get_password_hash(new_password)
    db.commit()
    return {"message": "Password successfully reset"}


@router.post("/api/verify-email")
def verify_email(payload: VerifyModel, db: Session = Depends(get_db)):
    try:
        data = jwt.decode(payload.token, SECRET_KEY, algorithms=[ALGORITHM])
        if data.get("type") != "verify":
            raise HTTPException(status_code=400, detail="Invalid token")
        username = data.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=400, detail="Invalid or expired verification link"
        )

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = 1
    db.commit()
    return {"message": "Email verified successfully! You can now login."}


