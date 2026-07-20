from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, text
import re
import json
from datetime import datetime, timedelta
import os
import time
import requests
from google import genai

from database import get_db, User, Request, Subtask, Board, BoardMember, LeaveDay, LeaveRecord, Comment, Notification, DirectMessage, get_security_log, set_security_log
from schemas import *
from dependencies import *
from utils import *

router = APIRouter()

@router.post("/api/ai/generate")
def generate_ai_text(
    payload: AIGenerateModel, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    now_time = time.time()
    last_generate_time = get_security_log(db, f"ai_generate:{current_user}", 0)
    if (now_time - last_generate_time) < 1:
        raise HTTPException(
            status_code=429,
            detail="Please wait 1 second before generating another AI response.",
        )
    set_security_log(db, f"ai_generate:{current_user}", now_time)

    groq_api_key = os.getenv("GROQ_API_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    error_msgs = []

    final_prompt = payload.prompt

    def call_gemini():
        if not gemini_api_key:
            raise Exception("Gemini API Key missing in .env")
        client = genai.Client(api_key=gemini_api_key.strip())
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash", contents=final_prompt
            )
            return {"text": response.text, "provider": "Google Gemini"}
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                raise Exception(
                    "Gemini API free tier limit reached. Please wait a moment or switch to GPT-OSS 120B."
                )
            raise Exception(error_str)

    def call_llama():
        if not groq_api_key:
            raise Exception("Groq API Key missing in .env")
        headers = {
            "Authorization": f"Bearer {groq_api_key.strip()}",
            "Content-Type": "application/json",
        }
        data = {
            "model": "openai/gpt-oss-120b",
            "messages": [{"role": "user", "content": final_prompt}],
        }
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=data,
        )
        if response.status_code == 429:
            raise Exception("Groq AI limit reached. Please wait a moment.")
        response.raise_for_status()
        return {
            "text": response.json()["choices"][0]["message"]["content"],
            "provider": "GPT-OSS 120B (Groq)",
        }

    # Strict User Selection
    if payload.provider == "gemini":
        try:
            return call_gemini()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gemini Error: {str(e)}")
    elif payload.provider == "llama":
        try:
            return call_llama()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Groq Error: {str(e)}")

    # Default Fallback Logic (Auto)
    if gemini_api_key:
        try:
            return call_gemini()
        except Exception as e:
            error_msgs.append(f"Gemini: {str(e)}")

    if groq_api_key:
        try:
            return call_llama()
        except Exception as e:
            error_msgs.append(f"Groq: {str(e)}")

    if not gemini_api_key and not groq_api_key:
        raise HTTPException(
            status_code=400,
            detail="No AI configured. Please set GEMINI_API_KEY or GROQ_API_KEY in the .env file.",
        )

    # Jika semua AI gagal terhubung
    raise HTTPException(
        status_code=500, detail="AI generation failed. " + " | ".join(error_msgs)
    )

