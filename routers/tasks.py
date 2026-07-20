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
from routers.ai import generate_ai_text

router = APIRouter()

@router.get("/api/tasks/all")
def get_all_global_tasks(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    owned_subq = db.query(Board.id).filter(Board.owner_username == current_user)
    shared_subq = db.query(BoardMember.board_id).filter(
        BoardMember.member_username == current_user, BoardMember.status == "accepted"
    )

    tasks = (
        db.query(Request)
        .filter(
            or_(Request.board_id.in_(owned_subq), Request.board_id.in_(shared_subq)),
            or_(Request.requester == None, Request.requester != "System"),
            or_(
                Request.project_name == None,
                Request.project_name != "[SYSTEM] PROJECT CHAT",
            ),
        )
        .all()
    )
    boards_dict = {b.id: b.name for b in db.query(Board).all()}
    leave_dates = get_leave_dates(db)

    personal_leaves_db = (
        db.query(LeaveRecord.leave_date, LeaveRecord.username)
        .filter(LeaveRecord.leave_type == "personal")
        .all()
    )
    personal_leaves = {}
    for ldate, uname in personal_leaves_db:
        if uname not in personal_leaves:
            personal_leaves[uname] = set()
        if ldate:
            date_str = ldate.strftime("%Y-%m-%d") if hasattr(ldate, "strftime") else str(ldate)[:10]
            personal_leaves[uname].add(date_str)

    global_queues = get_all_queues(db, leave_dates)

    tasks_list = []
    for task in tasks:
        q_info = global_queues.get(task.id, {})
        t_dict = {
            "id": task.id,
            "board_id": task.board_id,
            "board_name": boards_dict.get(task.board_id, "Unknown"),
            "timestamp": task.timestamp,
            "project_name": task.project_name,
            "requester": task.requester,
            "category": task.category,
            "description": task.description,
            "supporting_access": task.supporting_access,
            "start_date": format_dt(task.start_date) or (format_dt(task.timestamp).split(" ")[0] if task.timestamp else None),
            "deadline": format_dt(task.deadline),
            "impact": getattr(task, "impact", "Medium"),
            "etc": getattr(task, "etc", 2),
            "auto_nudge": bool(getattr(task, "auto_nudge", False)),
            "recurring": getattr(task, "recurring", "none"),
            "status": task.status,
            "completed_time": task.completed_time,
            "owner_username": task.owner_username,
            "queue_global_number": q_info.get("global_q"),
            "total_global_queue": q_info.get("global_t"),
            "queue_project_number": q_info.get("project_q"),
            "total_project_queue": q_info.get("project_t"),
            "main_assignee": q_info.get("main_assignee"),
        }
        subtasks = (
            db.query(Subtask)
            .filter(Subtask.request_id == task.id)
            .order_by(Subtask.position.asc(), Subtask.id.asc())
            .all()
        )
        t_dict["subtask_total"] = len(subtasks)
        t_dict["subtask_done"] = sum(1 for s in subtasks if s.is_done == 1)
        t_dict["subtask_assignees"] = ", ".join(
            [s.assignee for s in subtasks if s.assignee]
        )
        t_dict["subtask_details"] = "\n".join(
            [
                f"[{'x' if s.is_done else ' '}] {s.task_name} (@{s.assignee or 'unassigned'})"
                for s in subtasks
            ]
        )

        assignees = get_assignees(task.requester)
        for s in subtasks:
            if s.assignee:
                assignees.add(s.assignee)

        task_leaves = set(leave_dates)
        for a in assignees:
            task_leaves.update(personal_leaves.get(a, set()))

        prio_str, prio_lvl = calculate_priority(task.deadline or "", task_leaves)
        t_dict["priority_str"] = prio_str
        t_dict["priority_lvl"] = prio_lvl
        tasks_list.append(t_dict)

    return {"tasks": tasks_list}


@router.get("/api/tasks/global-export")
def get_global_export(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    owned_subq = db.query(Board.id).filter(Board.owner_username == current_user)
    shared_subq = db.query(BoardMember.board_id).filter(
        BoardMember.member_username == current_user, BoardMember.status == "accepted"
    )

    tasks = (
        db.query(Request)
        .filter(
            or_(Request.board_id.in_(owned_subq), Request.board_id.in_(shared_subq)),
            or_(Request.requester == None, Request.requester != "System"),
            or_(
                Request.project_name == None,
                Request.project_name != "[SYSTEM] PROJECT CHAT",
            ),
        )
        .all()
    )
    boards_dict = {b.id: b.name for b in db.query(Board).all()}

    tasks_list = []
    for t in tasks:
        subtasks = (
            db.query(Subtask)
            .filter(Subtask.request_id == t.id)
            .order_by(Subtask.position.asc(), Subtask.id.asc())
            .all()
        )
        subtask_assignees = ", ".join([s.assignee for s in subtasks if s.assignee])
        subtask_details = "\n".join(
            [
                f"[{'x' if s.is_done else ' '}] {s.task_name} (@{s.assignee or 'unassigned'})"
                for s in subtasks
            ]
        )
        tasks_list.append(
            {
                "id": t.id,
                "board_name": boards_dict.get(t.board_id, "Unknown"),
                "project_name": t.project_name,
                "description": t.description,
                "requester": t.requester,
                "category": t.category,
                "status": t.status,
                "start_date": format_dt(t.start_date) or (format_dt(t.timestamp).split(" ")[0] if t.timestamp else None),
                "deadline": format_dt(t.deadline),
                "impact": getattr(t, "impact", "Medium"),
                "etc": getattr(t, "etc", 2),
                "recurring": getattr(t, "recurring", "none"),
                "timestamp": t.timestamp,
                "completed_time": t.completed_time,
                "owner_username": t.owner_username,
                "subtask_assignees": subtask_assignees,
                "subtask_details": subtask_details,
            }
        )

    return {"tasks": tasks_list}


@router.get("/api/tasks/search")
def global_search_tasks(
    q: str, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not q or len(q.strip()) < 2:
        return {"results": []}

    # Hapus simbol '@' jika user mengetiknya, karena di DB nama assignee disimpan tanpa '@'
    clean_q = q.strip().replace("@", "")
    keywords = [kw for kw in clean_q.split() if kw]

    # Hanya cari di project yang Anda miliki ATAU di mana Anda diundang
    owned_subq = db.query(Board.id).filter(Board.owner_username == current_user)
    shared_subq = db.query(BoardMember.board_id).filter(
        BoardMember.member_username == current_user, BoardMember.status == "accepted"
    )

    # Batasi data yang diindeks: Abaikan task Done/Rejected yang sudah lebih dari 90 hari
    ninety_days_ago = datetime.now() - timedelta(days=90)
    recent_condition = or_(
        Request.status.notin_(["Done", "Rejected"]),
        Request.completed_time >= ninety_days_ago,
        Request.completed_time == None,
    )

    conditions = []
    for kw in keywords:
        search_term = f"%{kw}%"
        kw_subtask_match = db.query(Subtask.request_id).filter(
            or_(Subtask.assignee.ilike(search_term), Subtask.task_name.ilike(search_term))
        )
        kw_cond = or_(
            Request.project_name.ilike(search_term),
            Request.requester.ilike(search_term),
            Request.category.ilike(search_term),
            Request.owner_username.ilike(search_term),
            Request.description.ilike(search_term),
            Request.id.in_(kw_subtask_match),
        )
        conditions.append(kw_cond)

    final_search_condition = and_(*conditions) if conditions else text("1=1")

    tasks = (
        db.query(Request)
        .filter(
            or_(Request.board_id.in_(owned_subq), Request.board_id.in_(shared_subq)),
            or_(Request.requester == None, Request.requester != "System"),
            or_(
                Request.project_name == None,
                Request.project_name != "[SYSTEM] PROJECT CHAT",
            ),
            recent_condition,
            final_search_condition,
        )
        .order_by(Request.id.desc())
        .limit(15)
        .all()
    )  # Batasi 10 hasil agar dropdown sangat cepat

    boards_dict = {b.id: b.name for b in db.query(Board).all()}
    leave_dates = get_leave_dates(db)

    personal_leaves_db = (
        db.query(LeaveRecord.leave_date, LeaveRecord.username)
        .filter(LeaveRecord.leave_type == "personal")
        .all()
    )
    personal_leaves = {}
    for ldate, uname in personal_leaves_db:
        if uname not in personal_leaves:
            personal_leaves[uname] = set()
        if ldate:
            date_str = ldate.strftime("%Y-%m-%d") if hasattr(ldate, "strftime") else str(ldate)[:10]
            personal_leaves[uname].add(date_str)

    tasks_list = []
    for task in tasks:
        t_dict = {
            "id": task.id,
            "board_id": task.board_id,
            "board_name": boards_dict.get(task.board_id, "Unknown"),
            "timestamp": task.timestamp,
            "project_name": task.project_name,
            "requester": task.requester,
            "category": task.category,
            "description": task.description,
            "supporting_access": task.supporting_access,
            "start_date": format_dt(task.start_date),
            "deadline": format_dt(task.deadline),
            "impact": getattr(task, "impact", "Medium"),
            "etc": getattr(task, "etc", 2),
            "auto_nudge": bool(getattr(task, "auto_nudge", False)),
            "status": task.status,
            "completed_time": task.completed_time,
            "owner_username": task.owner_username,
        }
        subtasks = (
            db.query(Subtask)
            .filter(Subtask.request_id == task.id)
            .order_by(Subtask.position.asc(), Subtask.id.asc())
            .all()
        )
        task_leaves = set(leave_dates)

        prio_str, prio_lvl = calculate_priority(task.deadline or "", task_leaves)
        t_dict["priority_str"] = prio_str
        t_dict["priority_lvl"] = prio_lvl
        tasks_list.append(t_dict)

    return {"results": tasks_list}


@router.get("/api/tasks/{task_id}")
def get_single_task(
    task_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Request).filter(Request.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not has_task_read_access(db, task, current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    leave_dates = get_leave_dates(db)
    prio_str, prio_lvl = calculate_priority(task.deadline or "", set(leave_dates))

    global_queues = get_all_queues(db, leave_dates)
    q_info = global_queues.get(task.id, {})

    board = db.query(Board).filter(Board.id == task.board_id).first()
    t_dict = {
        "id": task.id,
        "board_id": task.board_id,
        "board_name": board.name if board else "Unknown",
        "timestamp": task.timestamp,
        "project_name": task.project_name,
        "requester": task.requester,
        "category": task.category,
        "description": task.description,
        "supporting_access": task.supporting_access,
        "start_date": format_dt(task.start_date),
        "deadline": format_dt(task.deadline),
        "impact": getattr(task, "impact", "Medium"),
        "etc": getattr(task, "etc", 2),
        "auto_nudge": bool(getattr(task, "auto_nudge", False)),
        "recurring": getattr(task, "recurring", "none"),
        "status": task.status,
        "completed_time": task.completed_time,
        "owner_username": task.owner_username,
        "priority_str": prio_str,
        "priority_lvl": prio_lvl,
        "queue_global_number": q_info.get("global_q"),
        "total_global_queue": q_info.get("global_t"),
        "queue_project_number": q_info.get("project_q"),
        "total_project_queue": q_info.get("project_t"),
        "main_assignee": q_info.get("main_assignee"),
    }
    return {"task": t_dict}


@router.get("/api/tasks/preview/{task_id}")
def get_task_preview(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Request).filter(Request.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Jangan tampilkan data private board untuk preview publik (Keamanan Lanjutan)
    board = db.query(Board).filter(Board.id == task.board_id).first()
    if board and getattr(board, "is_private", 0) == 1:
         raise HTTPException(status_code=403, detail="This is a private task.")

    leave_dates = get_leave_dates(db)
    prio_str, prio_lvl = calculate_priority(task.deadline or "", set(leave_dates))

    subtasks = db.query(Subtask).filter(Subtask.request_id == task_id).all()
    subtask_total = len(subtasks)
    subtask_done = sum(1 for s in subtasks if s.is_done == 1)

    global_queues = get_all_queues(db, leave_dates)
    q_info = global_queues.get(task.id, {})

    t_dict = {
        "id": task.id,
        "board_id": task.board_id,
        "project_name": task.project_name,
        "requester": task.requester,
        "category": task.category,
        "start_date": format_dt(task.start_date),
        "deadline": format_dt(task.deadline),
        "impact": getattr(task, "impact", "Medium"),
        "etc": getattr(task, "etc", 2),
        "recurring": getattr(task, "recurring", "none"),
        "board_name": board.name if board else "Unknown",
        "timestamp": task.timestamp,
        "status": task.status,
            "completed_time": task.completed_time,
        "priority_str": prio_str,
        "priority_lvl": prio_lvl,
        "owner_username": task.owner_username,
        "subtask_total": subtask_total,
        "subtask_done": subtask_done,
        "queue_global_number": q_info.get("global_q"),
        "total_global_queue": q_info.get("global_t"),
        "queue_project_number": q_info.get("project_q"),
        "total_project_queue": q_info.get("project_t"),
        "main_assignee": q_info.get("main_assignee"),
        "description": "", # Masked
        "supporting_access": "" # Masked
    }
    return {"task": t_dict}


@router.put("/api/tasks/{task_id}/auto-nudge")
def toggle_auto_nudge(
    task_id: int,
    payload: AutoNudgeToggleModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Request).filter(Request.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    val_bool = True if payload.auto_nudge else False
    
    # Gunakan ORM update agar dialect (Postgres/SQLite) otomatis menangani tipe boolean
    # dan nama tabel diselesaikan dengan benar oleh SQLAlchemy tanpa hardcode
    db.query(Request).filter(Request.id == task_id).update({"auto_nudge": val_bool})
    db.commit()
    return {"message": "Auto nudge updated"}


@router.put("/api/tasks/{task_id}")
def update_task_status(
    task_id: int,
    update: TaskUpdateModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    task = db.query(Request).filter(Request.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not has_task_read_access(db, task, current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    assignees = {a.lower() for a in get_assignees(task.requester)}
    if not is_task_admin(db, task, current_user) and current_user.lower() not in assignees:
        raise HTTPException(
            status_code=403,
            detail="Permission Denied: Only the Task Creator, Project Owner, or Main Assignee can change task status.",
        )

    old_status = task.status
    task.status = update.status
    task.completed_time = now_str if update.status in ["Done", "Rejected"] else None
    
    cloned_task_id = None
    if old_status != "Done" and update.status == "Done":
        cloned_task_id = spawn_recurring_task(db, task)


    db.commit()

    if old_status != update.status:
        log_activity(
            db, task.id, f"**@{current_user}** changed status to **{update.status}**."
        )
        notif_type = "task_completed" if update.status == "Done" else "status_changed"
        if current_user != task.owner_username and check_board_access(
            db, task.board_id, task.owner_username
        ):
            create_notification(
                db,
                task.owner_username,
                f"@{current_user} changed task status to {update.status}: {task.project_name or 'Untitled'}",
                notif_type,
                task.id,
            )

        assignees = get_assignees(task.requester)
        for a in assignees:
            if (
                a != current_user
                and a != task.owner_username
                and db.query(User).filter(User.username == a).first()
            ):
                if has_task_read_access(db, task, a):
                    create_notification(
                        db,
                        a,
                        f"@{current_user} changed task status to {update.status}: {task.project_name or 'Untitled'}",
                        notif_type,
                        task.id,
                    )

    update_board_activity(db, task.board_id)
    return {"message": "Task updated successfully", "cloned_task_id": cloned_task_id}


@router.put("/api/tasks/{task_id}/details")
def edit_task_details(
    task_id: int,
    update: TaskEditModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if len(update.project_name) > 255 or len(update.description) > 10000:
        raise HTTPException(
            status_code=400, detail="Payload size exceeds maximum allowed limit."
        )

    task = db.query(Request).filter(Request.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not has_task_read_access(db, task, current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    assignees = {a.lower() for a in get_assignees(task.requester)}
    if not is_task_admin(db, task, current_user) and current_user.lower() not in assignees:
        raise HTTPException(
            status_code=403,
            detail="Permission Denied: Only the Task Creator, Project Owner, or Main Assignee can edit task details.",
        )

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    target_board_id = update.board_id if update.board_id else task.board_id
    target_board = db.query(Board).filter(Board.id == target_board_id).first()
    if target_board and getattr(target_board, "is_private", 0) == 1:
        assignees = get_assignees(update.requester)
        if any(a.lower() != current_user.lower() for a in assignees):
            raise HTTPException(status_code=400, detail="Cannot assign tasks to other users in a private workspace.")
        subs = db.query(Subtask).filter(Subtask.request_id == task_id).all()
        if any(s.assignee and s.assignee.lower() != current_user.lower() for s in subs):
            raise HTTPException(status_code=400, detail="Please remove other users from subtasks before moving to a private workspace.")

    old_requester = task.requester
    old_status = task.status

    changes = []
    if task.project_name != update.project_name:
        changes.append(f"**Title**: `{task.project_name}` ➔ `{update.project_name}`")
    if task.requester != update.requester:
        changes.append(f"**Assignee**: `{task.requester}` ➔ `{update.requester}`")
    if task.category != update.category:
        changes.append(f"**Category**: `{task.category}` ➔ `{update.category}`")
    if str(task.start_date) != str(update.start_date):
        old_start = str(task.start_date).split(" ")[0] if task.start_date else "-"
        new_start = str(update.start_date).split(" ")[0] if update.start_date else "-"
        changes.append(f"**Start Date**: `{old_start}` ➔ `{new_start}`")
    if str(task.deadline) != str(update.deadline):
        old_dl = str(task.deadline).split(" ")[0] if task.deadline else "-"
        new_dl = str(update.deadline).split(" ")[0] if update.deadline else "-"
        changes.append(f"**Deadline**: `{old_dl}` ➔ `{new_dl}`")
    
    old_impact = getattr(task, "impact", "Medium")
    new_impact = update.impact or "Medium"
    if old_impact != new_impact:
        changes.append(f"**Impact**: `{old_impact}` ➔ `{new_impact}`")
        
    old_etc = getattr(task, "etc", 2.0)
    new_etc = update.etc if update.etc is not None else 2.0
    if old_etc != new_etc:
        changes.append(f"**ETC**: `{old_etc}h` ➔ `{new_etc}h`")
        
    old_rec = getattr(task, "recurring", "none")
    new_rec = update.recurring or "none"
    if old_rec != new_rec:
        changes.append(f"**Recurring**: `{old_rec}` ➔ `{new_rec}`")

    old_auto = bool(getattr(task, "auto_nudge", False))
    new_auto = True if update.auto_nudge else False
    if old_auto != new_auto:
        changes.append(f"**Auto Nudge**: `{'ON' if new_auto else 'OFF'}`")
        
    if task.description != update.description:
        changes.append("**Description** was modified")
    if task.supporting_access != update.supporting_access:
        changes.append("**Links** were modified")

    task.project_name = update.project_name
    task.requester = update.requester
    task.category = update.category
    task.description = update.description
    task.supporting_access = update.supporting_access
    task.start_date = update.start_date if update.start_date and update.start_date.strip() else None
    task.deadline = update.deadline if update.deadline and update.deadline.strip() else None
    task.impact = update.impact or "Medium"
    task.etc = update.etc if update.etc is not None else 2
    task.auto_nudge = True if update.auto_nudge else False

    if task.status != update.status:
        task.status = update.status
        task.completed_time = now_str if update.status in ["Done", "Rejected"] else None

    cloned_task_id = None
    if old_status != "Done" and update.status == "Done":
        cloned_task_id = spawn_recurring_task(db, task)
    setattr(task, "recurring", update.recurring or "none")
    old_board_id = task.board_id
    if update.board_id and update.board_id != old_board_id:
        if not check_board_access(db, update.board_id, current_user):
            raise HTTPException(
                status_code=403, detail="Access denied to target project"
            )

        old_board = db.query(Board).filter(Board.id == old_board_id).first()
        old_board_name = old_board.name if old_board else "Unknown"

        new_board = db.query(Board).filter(Board.id == update.board_id).first()
        new_board_name = new_board.name if new_board else "Unknown"

        task.board_id = update.board_id
        update_board_activity(db, update.board_id)  # Update target board
        log_activity(
            db,
            task.id,
            f"**@{current_user}** transferred this task from project **{old_board_name}** to **{new_board_name}**.",
        )

    db.commit()
    if changes:
        changes_str = "\n- ".join(changes)
        log_activity(db, task.id, f"**@{current_user}** updated task details:\n- {changes_str}")
    else:
        log_activity(db, task.id, f"**@{current_user}** updated the task details.")

    old_mentions = get_assignees(old_requester)
    new_mentions = get_assignees(update.requester)
    added_mentions = new_mentions - old_mentions
    for m in added_mentions:
        if m != current_user and db.query(User).filter(User.username == m).first():
            auto_add_to_board(db, task.board_id, m, current_user)
            if has_task_read_access(db, task, m):
                create_notification(
                    db,
                    m,
                    f"@{current_user} assigned you to the task: {update.project_name or 'Untitled'}",
                    "task_assigned",
                    task.id,
                )

    if old_status != update.status:
        notif_type = "task_completed" if update.status == "Done" else "status_changed"
        if current_user != task.owner_username and check_board_access(
            db, task.board_id, task.owner_username
        ):
            create_notification(
                db,
                task.owner_username,
                f"@{current_user} changed task status to {update.status}: {task.project_name or 'Untitled'}",
                notif_type,
                task.id,
            )

        assignees = get_assignees(update.requester)
        for a in assignees:
            if (
                a != current_user
                and a != task.owner_username
                and db.query(User).filter(User.username == a).first()
            ):
                if has_task_read_access(db, task, a):
                    create_notification(
                        db,
                        a,
                        f"@{current_user} changed task status to {update.status}: {update.project_name or 'Untitled'}",
                        notif_type,
                        task.id,
                    )

    update_board_activity(db, target_board_id)
    return {"message": "Task details updated successfully", "cloned_task_id": cloned_task_id}


@router.delete("/api/tasks/{task_id}")
def delete_task(
    task_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Request).filter(Request.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not has_task_read_access(db, task, current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    if not is_task_admin(db, task, current_user):
        raise HTTPException(
            status_code=403,
            detail="Only task owner or project owner can delete this task",
        )

    db.query(Subtask).filter(Subtask.request_id == task_id).delete()
    db.delete(task)
    db.commit()
    update_board_activity(db, task.board_id)
    return {"message": "Task deleted successfully"}


@router.get("/api/tasks/{task_id}/subtasks")
def get_subtasks(
    task_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Request).filter(Request.id == task_id).first()
    if task and not has_task_read_access(db, task, current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    subtasks = (
        db.query(Subtask)
        .filter(Subtask.request_id == task_id)
        .order_by(Subtask.position.asc(), Subtask.id.asc())
        .all()
    )
    return {
        "subtasks": [
            {
                "id": s.id,
                "task_name": s.task_name,
                "is_done": s.is_done,
                "assignee": s.assignee,
            }
            for s in subtasks
        ]
    }


@router.put("/api/tasks/{task_id}/subtasks/reorder")
def reorder_subtasks(
    task_id: int,
    payload: SubtaskReorderModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Request).filter(Request.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404)
    if not has_task_read_access(db, task, current_user):
        raise HTTPException(status_code=403)

    if is_system_feedback_board(db, task.board_id) and not can_modify_system_ticket(
        db, current_user
    ):
        raise HTTPException(
            status_code=403,
            detail="Permission Denied: Only Admins can modify system tickets.",
        )

    for idx, sub_id in enumerate(payload.ordered_ids):
        db.query(Subtask).filter(
            Subtask.id == sub_id, Subtask.request_id == task_id
        ).update({"position": idx})
    db.commit()
    update_board_activity(db, task.board_id)
    return {"message": "Subtasks reordered successfully"}


@router.post("/api/tasks/{task_id}/subtasks")
def create_subtask(
    task_id: int,
    payload: SubtaskModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Request).filter(Request.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not has_task_read_access(db, task, current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    if is_system_feedback_board(db, task.board_id) and not can_modify_system_ticket(
        db, current_user
    ):
        raise HTTPException(
            status_code=403,
            detail="Permission Denied: Only Admins can modify system tickets.",
        )

    is_admin = is_task_admin(db, task, current_user) or current_user in get_assignees(
        task.requester
    )
    if not is_admin:
        raise HTTPException(
            status_code=403,
            detail="Permission Denied: Only Task Admins can add sub-tasks.",
        )
        
    board = db.query(Board).filter(Board.id == task.board_id).first()
    if board and getattr(board, "is_private", 0) == 1 and payload.assignee and payload.assignee.lower() != current_user.lower():
        raise HTTPException(status_code=400, detail="Cannot assign subtasks to other users in a private workspace.")

    max_pos = db.query(Subtask).filter(Subtask.request_id == task_id).count()
    new_sub = Subtask(
        request_id=task_id,
        task_name=payload.task_name,
        assignee=payload.assignee,
        position=max_pos,
    )
    db.add(new_sub)
    db.commit()
    log_activity(
        db, task_id, f"**@{current_user}** added sub-task **{payload.task_name}**."
    )

    if payload.assignee and payload.assignee != current_user:
        auto_add_to_board(db, task.board_id, payload.assignee, current_user)
        if task and has_task_read_access(db, task, payload.assignee):
            create_notification(
                db,
                payload.assignee,
                f"@{current_user} assigned you to a sub-task in: {task.project_name or 'Untitled'}",
                "task_assigned",
                task_id,
            )

    update_board_activity(db, task.board_id)
    return {"message": "Subtask created successfully"}


@router.put("/api/subtasks/{subtask_id}")
def toggle_subtask(
    subtask_id: int,
    payload: SubtaskToggleModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = db.query(Subtask).filter(Subtask.id == subtask_id).first()
    if sub:
        task = db.query(Request).filter(Request.id == sub.request_id).first()
        if task:
            if not has_task_read_access(db, task, current_user):
                raise HTTPException(status_code=403, detail="Access denied")

            if is_system_feedback_board(
                db, task.board_id
            ) and not can_modify_system_ticket(db, current_user):
                raise HTTPException(
                    status_code=403,
                    detail="Permission Denied: Only Admins can modify system tickets.",
                )

            is_admin = is_task_admin(
                db, task, current_user
            ) or current_user in get_assignees(task.requester)
            if not is_admin:
                if sub.assignee and sub.assignee != current_user:
                    raise HTTPException(
                        status_code=403,
                        detail="Permission Denied: Cannot modify a sub-task assigned to someone else.",
                    )
                if (
                    payload.assignee
                    and payload.assignee != current_user
                    and payload.assignee != sub.assignee
                ):
                    raise HTTPException(
                        status_code=403,
                        detail="Permission Denied: Only Task Admins can reassign sub-tasks.",
                    )
                    
        board = db.query(Board).filter(Board.id == task.board_id).first()
        if board and getattr(board, "is_private", 0) == 1 and payload.assignee and payload.assignee.lower() != current_user.lower():
            raise HTTPException(status_code=400, detail="Cannot assign subtasks to other users in a private workspace.")

        old_assignee = sub.assignee
        old_is_done = sub.is_done
        sub.is_done = payload.is_done
        if payload.assignee is not None:
            sub.assignee = payload.assignee
        db.commit()

        if old_is_done != payload.is_done:
            log_activity(
                db,
                sub.request_id,
                f"**@{current_user}** marked sub-task **{sub.task_name}** as **{'Done' if payload.is_done else 'Pending'}**.",
            )
        if payload.assignee and payload.assignee != old_assignee:
            log_activity(
                db,
                sub.request_id,
                f"**@{current_user}** assigned sub-task **{sub.task_name}** to **@{payload.assignee}**.",
            )

        if (
            payload.assignee
            and payload.assignee != old_assignee
            and payload.assignee != current_user
        ):
            auto_add_to_board(db, task.board_id, payload.assignee, current_user)
            if task and has_task_read_access(db, task, payload.assignee):
                create_notification(
                    db,
                    payload.assignee,
                    f"@{current_user} assigned you to a sub-task in: {task.project_name or 'Untitled'}",
                    "task_assigned",
                    sub.request_id,
                )

        update_board_activity(db, task.board_id)
    return {"message": "Subtask updated"}


@router.delete("/api/subtasks/{subtask_id}")
def delete_subtask(
    subtask_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = db.query(Subtask).filter(Subtask.id == subtask_id).first()
    if sub:
        task = db.query(Request).filter(Request.id == sub.request_id).first()
        if task:
            if not has_task_read_access(db, task, current_user):
                raise HTTPException(status_code=403, detail="Access denied")
            is_admin = is_task_admin(
                db, task, current_user
            ) or current_user in get_assignees(task.requester)
            if not is_admin:
                raise HTTPException(
                    status_code=403,
                    detail="Permission Denied: Only Task Admins can delete sub-tasks.",
                )
        task_id = sub.request_id
        task_name = sub.task_name
        db.delete(sub)
        db.commit()
        log_activity(
            db, task_id, f"**@{current_user}** deleted sub-task **{task_name}**."
        )
        update_board_activity(db, task.board_id)
    return {"message": "Subtask deleted"}


@router.get("/api/tasks/{task_id}/comments")
def get_comments(
    task_id: int,
    offset: int = 0,
    limit: int = 50,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Request).filter(Request.id == task_id).first()
    if task and not has_task_read_access(db, task, current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    comments = (
        db.query(Comment)
        .filter(Comment.request_id == task_id)
        .order_by(Comment.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    comments.reverse()
    res = []
    for c in comments:
        clean_text, rx = parse_comment_text(c.text)
        res.append(
            {
                "id": c.id,
                "username": c.username,
                "text": clean_text,
                "timestamp": c.timestamp,
                "reactions": rx,
            }
        )
    return {"comments": res}


@router.post("/api/tasks/{task_id}/comments")
def add_comment(
    task_id: int,
    payload: CommentModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if len(payload.text) > 3000:
        raise HTTPException(
            status_code=400,
            detail="Comment text is too long (Maximum 3000 characters).",
        )

    task = db.query(Request).filter(Request.id == task_id).first()
    if task and not has_task_read_access(db, task, current_user):
        raise HTTPException(status_code=403, detail="Access denied")
            
    if task:
        board = db.query(Board).filter(Board.id == task.board_id).first()
        if board and getattr(board, "is_private", 0) == 1:
            mentions = set(re.findall(r"@([\w.-]+)", payload.text or ""))
            if any(m.lower() not in [current_user.lower(), "ai", "all"] for m in mentions):
                raise HTTPException(status_code=400, detail="Cannot mention or invite other users in a private workspace.")

    if (
        task
        and task.project_name != "[SYSTEM] PROJECT CHAT"
        and not is_user_involved_in_task(db, task, current_user)
    ):
        raise HTTPException(
            status_code=403, detail="Only involved members can comment on this task."
        )

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_comment = Comment(
        request_id=task_id, username=current_user, text=payload.text, timestamp=now_str
    )
    db.add(new_comment)
    db.commit()

    task = db.query(Request).filter(Request.id == task_id).first()
    if task:
        # 1. Notifikasi ke orang yang di-mention spesifik di dalam Komentar
        mentions = set(re.findall(r"@([\w.-]+)", payload.text or ""))
        for m in mentions:
            if m != current_user and db.query(User).filter(User.username == m).first():
                auto_add_to_board(db, task.board_id, m, current_user)
                if has_task_read_access(db, task, m):
                    create_notification(
                        db,
                        m,
                        f"@{current_user} mentioned you in a comment on: {task.project_name or 'Untitled'}",
                        "mention",
                        task.id,
                    )

        # 2. Notifikasi ke Pembuat Tugas (Owner)
        if current_user != task.owner_username and task.owner_username not in mentions:
            if has_task_read_access(db, task, task.owner_username):
                create_notification(
                    db,
                    task.owner_username,
                    f"@{current_user} commented on your task: {task.project_name or 'Untitled'}",
                    "comment",
                    task.id,
                )

        # 3. Notifikasi ke Assignee lain yang terhubung di tugas tersebut
        assignees = get_assignees(task.requester)
        for a in assignees:
            if a != current_user and a != task.owner_username and a not in mentions:
                if db.query(User).filter(User.username == a).first():
                    if has_task_read_access(db, task, a):
                        create_notification(
                            db,
                            a,
                            f"@{current_user} commented on a task assigned to you: {task.project_name or 'Untitled'}",
                            "comment",
                            task.id,
                        )

    if task:
        update_board_activity(db, task.board_id)
    return {"message": "Comment added successfully"}


@router.delete("/api/tasks/{task_id}/comments/{comment_id}")
def delete_comment(
    task_id: int,
    comment_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comment = (
        db.query(Comment)
        .filter(Comment.id == comment_id, Comment.request_id == task_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.username != current_user and not is_user_superadmin(db, current_user):
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this comment"
        )

    db.delete(comment)
    db.commit()
    task = db.query(Request).filter(Request.id == task_id).first()
    if task:
        update_board_activity(db, task.board_id)
    return {"message": "Comment deleted successfully"}


@router.post("/api/tasks/{task_id}/ai-reply")
def ai_task_reply(
    task_id: int,
    payload: AIChatModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Request).filter(Request.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not has_task_read_access(db, task, current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    if task.project_name != "[SYSTEM] PROJECT CHAT" and not is_user_involved_in_task(
        db, task, current_user
    ):
        raise HTTPException(
            status_code=403, detail="Only involved members can use AI in this task."
        )

    # Dapatkan 20 riwayat komentar terakhir
    comments = (
        db.query(Comment)
        .filter(Comment.request_id == task_id)
        .order_by(Comment.id.desc())
        .limit(20)
        .all()
    )
    comments.reverse()

    history = ""
    for c in comments:
        clean_text, _ = parse_comment_text(c.text)
        if c.username != "System":
            history += f"@{c.username}: {clean_text}\n"

    # Dapatkan status sub-tugas
    subtasks = (
        db.query(Subtask)
        .filter(Subtask.request_id == task_id)
        .order_by(Subtask.position.asc())
        .all()
    )
    subtasks_str = "\n".join(
        [
            f"- [{'x' if s.is_done else ' '}] {s.task_name} (@{s.assignee or 'unassigned'})"
            for s in subtasks
        ]
    )

    prompt = f"""You are 'Smart Assistant 🤖', an AI project manager for INNOCEAN Tracker.
You are assisting the team within a specific task.

### TASK CONTEXT ###
Title: {task.project_name}
Category: {task.category}
Status: {task.status}
Deadline: {task.deadline}
Description: {task.description}
Sub-tasks:
{subtasks_str}

### RECENT CONVERSATION IN THIS TASK ###
{history}

### YOUR OBJECTIVE ###
User @{current_user} is explicitly asking for your help with this message:
"{payload.text}"

CRITICAL RULE: You must stay strictly within the context of the current task, project management, developer collaboration, or work productivity. If the user's message is unrelated to this task, project management, or work (for example: cooking recipes, general trivia, unrelated chit-chat, hobbies, sports, personal life, etc.), you must politely decline to answer, explaining in the user's language that your role in this chat is strictly to assist with this specific task on INNOCEAN Tracker. Do not provide information or perform tasks for out-of-context topics under any circumstances.

Please provide a helpful, actionable, and concise response to assist the team. You can provide solutions, ideas, summaries, or answer questions based on the task context. 
If the user asks to conceptualize a program, workflow, architecture, or flowchart, please generate a detailed, clean ASCII-art flowchart wrapped inside a ```text ... ``` code block. Do NOT use leading spaces to center the flowchart; align it to the left edge.
IMPORTANT LIMITATION: In this specific task chat, you CANNOT create new tasks, create leaves, or perform system actions. If the user asks you to do these, politely decline and advise them to use the main 'Smart Assistant' menu (the floating button) instead.
Use markdown for formatting. Do not wrap your response in JSON. Respond in the same language as the user's message."""

    payload_req = AIGenerateModel(prompt=prompt, provider="auto")

    try:
        ai_response = generate_ai_text(payload=payload_req, current_user=current_user, db=db)
        ai_response_text = ai_response["text"]
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"AI Task Reply Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    ai_text = ai_response_text[:3000]
    if ai_text.count("```") % 2 != 0:
        ai_text += "\n```"

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_comment = Comment(
        request_id=task_id,
        username="Smart Assistant 🤖",
        text=ai_text,  # Batasi 3000 karakter agar tidak merusak kolom DB
        timestamp=now_str,
    )
    try:
        db.add(new_comment)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail="Failed to save AI comment to database"
        )

    mentions = set(re.findall(r"@([\w.-]+)", ai_response_text))
    mentions.add(current_user)
    for m in mentions:
        if (
            m != "Smart Assistant 🤖"
            and db.query(User).filter(User.username == m).first()
            and has_task_read_access(db, task, m)
        ):
            create_notification(
                db,
                m,
                f"Smart Assistant 🤖 replied to a task you are involved in: {task.project_name}",
                "info",
                task_id,
            )

    update_board_activity(db, task.board_id)
    return {"message": "AI Replied successfully"}


@router.post("/api/comments/{comment_id}/react")
def toggle_reaction(
    comment_id: int,
    payload: dict,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    emoji = payload.get("emoji")
    if not emoji:
        raise HTTPException(status_code=400)

    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404)

    clean_text, rx = parse_comment_text(comment.text)

    is_already_selected = current_user in rx.get(emoji, [])

    # Hapus user dari semua emoji yang ada sebelumnya
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
        # Notif cerdas tanpa email spam dikirim hanya jika itu emotikon baru
        if comment.username != current_user:
            task = db.query(Request).filter(Request.id == comment.request_id).first()
            if task and task.project_name == "[SYSTEM] PROJECT CHAT":
                board = db.query(Board).filter(Board.id == task.board_id).first()
                create_notification(
                    db,
                    comment.username,
                    f"@{current_user} reacted {emoji} to your message in {board.name if board else 'chat'}",
                    "info",
                    task.board_id,
                )
            else:
                create_notification(
                    db,
                    comment.username,
                    f"@{current_user} reacted {emoji} to your comment",
                    "info",
                    comment.request_id,
                )

    comment.text = build_comment_text(clean_text, rx)
    db.commit()
    task = db.query(Request).filter(Request.id == comment.request_id).first()
    if task:
        update_board_activity(db, task.board_id)
    return {"message": "Reaction updated", "reactions": rx}
