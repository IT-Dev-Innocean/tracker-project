"""Feature flags defaults and DB helpers."""

import json
from datetime import datetime

from database import AppSetting

FEATURE_FLAGS_SETTING_KEY = "feature_flags"

DEFAULT_FEATURE_FLAGS = {
    "TIMESHEETS_UI_ENABLED": True,
    "MASTER_VIEW_UI_ENABLED": False,
    "TODO_LIST_UI_ENABLED": False,
    "INSTALL_APP_UI_ENABLED": False,
    "MY_CAPACITY_UI_ENABLED": False,
    "MY_TICKETS_UI_ENABLED": False,
    "SUBMIT_IDEA_UI_ENABLED": False,
    "CONTACT_SUPPORT_UI_ENABLED": False,
    "REPLAY_TOUR_UI_ENABLED": False,
    "WELCOME_TOUR_BUTTONS_ENABLED": False,
    "BOARD_HIGHLIGHTS_TOUR_ENABLED": False,
    "TASK_FORM_AI_ASSISTANT_ENABLED": False,
    "TASK_COMMENT_AI_MENTION_ENABLED": False,
    "TASK_CHAT_AI_COPILOT_ENABLED": True,
    "TASK_SCHEDULE_MEETING_UI_ENABLED": False,
    "TASK_ADD_TO_CALENDAR_UI_ENABLED": False,
    "TASK_SMART_NUDGE_UI_ENABLED": False,
    "TASK_AUTO_NUDGE_UI_ENABLED": False,
    "TASK_MEET_NOW_UI_ENABLED": False,
    "TASK_QUEUE_LABEL_UI_ENABLED": False,
    "TEAM_CHAT_UI_ENABLED": False,
    "EXPORT_CSV_UI_ENABLED": False,
    "GET_ALL_DATA_UI_ENABLED": False,
}


def merge_feature_flags(stored=None):
    """Return defaults overridden by known keys from stored payload."""
    result = dict(DEFAULT_FEATURE_FLAGS)
    if not isinstance(stored, dict):
        return result
    for key in DEFAULT_FEATURE_FLAGS:
        if key in stored:
            result[key] = bool(stored[key])
    return result


def get_feature_flags(db):
    row = (
        db.query(AppSetting)
        .filter(AppSetting.key == FEATURE_FLAGS_SETTING_KEY)
        .first()
    )
    if not row or not row.value:
        return dict(DEFAULT_FEATURE_FLAGS)
    try:
        stored = json.loads(row.value)
    except Exception:
        stored = {}
    return merge_feature_flags(stored)


def save_feature_flags(db, flags):
    merged = merge_feature_flags(flags if isinstance(flags, dict) else {})
    payload = json.dumps(merged)
    row = (
        db.query(AppSetting)
        .filter(AppSetting.key == FEATURE_FLAGS_SETTING_KEY)
        .first()
    )
    if row:
        row.value = payload
        row.updated_at = datetime.utcnow()
    else:
        db.add(
            AppSetting(
                key=FEATURE_FLAGS_SETTING_KEY,
                value=payload,
                updated_at=datetime.utcnow(),
            )
        )
    db.commit()
    return merged


def ensure_feature_flags_seeded(db):
    row = (
        db.query(AppSetting)
        .filter(AppSetting.key == FEATURE_FLAGS_SETTING_KEY)
        .first()
    )
    if row:
        return
    db.add(
        AppSetting(
            key=FEATURE_FLAGS_SETTING_KEY,
            value=json.dumps(DEFAULT_FEATURE_FLAGS),
            updated_at=datetime.utcnow(),
        )
    )
    db.commit()
