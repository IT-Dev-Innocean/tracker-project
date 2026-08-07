from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session, load_only
from sqlalchemy import or_, and_, func, text
import re
import json
from datetime import datetime, timedelta
import os
from collections import defaultdict

from database import get_db, User, Request, Subtask, Board, BoardMember, LeaveDay, LeaveRecord, Comment, Notification, DirectMessage
from schemas import *
from dependencies import *
from utils import *

router = APIRouter()

@router.get("/api/boards")
def get_boards(
    current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    owned = db.query(Board).filter(Board.owner_username == current_user).all()
    member_links = (
        db.query(BoardMember)
        .filter(
            BoardMember.member_username == current_user,
            BoardMember.status == "accepted",
        )
        .all()
    )
    shared = [
        db.query(Board).filter(Board.id == m.board_id).first() for m in member_links
    ]

    # Admin & Project Owner also get every non-private workspace project in sidebar
    extra_managed = []
    if can_manage_projects(db, current_user):
        known_ids = {b.id for b in owned} | {b.id for b in shared if b}
        for b in db.query(Board).all():
            if not b or b.id in known_ids:
                continue
            # Never surface personal To-do List boards in the shared project list
            if is_todo_list_board(b):
                continue
            # Keep other users' private workspaces private (except root admin)
            if getattr(b, "is_private", 0) == 1 and not is_user_superadmin(db, current_user):
                continue
            extra_managed.append(b)

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

    valid_owned = [b for b in owned if not evaluate_board_lifecycle(db, b)]
    valid_shared = [b for b in shared if b and not evaluate_board_lifecycle(db, b)]
    valid_extra = [b for b in extra_managed if b and not evaluate_board_lifecycle(db, b)]
    all_valid_boards = valid_owned + valid_shared + valid_extra
    all_board_ids = list({b.id for b in all_valid_boards})

    # One light query for all boards — avoid per-board full-row task scans (huge Neon transfer)
    tasks_by_board = defaultdict(list)
    if all_board_ids:
        light_tasks = (
            db.query(Request)
            .options(
                load_only(
                    Request.id,
                    Request.board_id,
                    Request.requester,
                    Request.owner_username,
                    Request.status,
                    Request.deadline,
                    Request.task_name,
                )
            )
            .filter(
                Request.board_id.in_(all_board_ids),
                or_(Request.requester == None, Request.requester != "System"),
                or_(
                    Request.task_name == None,
                    Request.task_name != "[SYSTEM] PROJECT CHAT",
                ),
            )
            .all()
        )
        for t in light_tasks:
            tasks_by_board[t.board_id].append(t)

    active_task_ids = [
        t.id
        for tasks in tasks_by_board.values()
        for t in tasks
        if t.status not in ("Done", "Rejected")
    ]
    subs_by_task = batch_subtasks_by_request(db, active_task_ids)

    request_counts = dict(
        db.query(BoardMember.board_id, func.count(BoardMember.id))
        .filter(
            BoardMember.board_id.in_(all_board_ids) if all_board_ids else False,
            BoardMember.status == "requesting",
        )
        .group_by(BoardMember.board_id)
        .all()
    ) if all_board_ids else {}

    members_by_board = defaultdict(list)
    if all_board_ids:
        for board_id, username in (
            db.query(BoardMember.board_id, BoardMember.member_username)
            .filter(
                BoardMember.board_id.in_(all_board_ids),
                BoardMember.status == "accepted",
            )
            .all()
        ):
            members_by_board[board_id].append(username)

    def get_metrics(board_id):
        tasks = tasks_by_board.get(board_id, [])
        total = len(tasks)
        done = sum(1 for t in tasks if t.status == "Done")
        my_pending = 0
        curr_user_lower = current_user.lower()

        member_critical = defaultdict(int)
        member_active = defaultdict(int)

        for t in tasks:
            if t.status in ["Done", "Rejected"]:
                continue
            assignees = get_assignees(t.requester)
            if t.owner_username:
                assignees.add(t.owner_username)

            is_mine = curr_user_lower in [a.lower() for a in assignees]

            if (
                not is_mine
                and t.owner_username
                and t.owner_username.lower() == curr_user_lower
            ):
                is_mine = True

            if not is_mine:
                for s in subs_by_task.get(t.id, []):
                    if (
                        s.assignee
                        and s.assignee.lower() == curr_user_lower
                        and s.is_done == 0
                    ):
                        is_mine = True
                        break
            if is_mine:
                my_pending += 1

            task_leaves = set(leave_dates)
            for a in assignees:
                task_leaves.update(personal_leaves.get(a, set()))

            prio_str, prio_lvl = calculate_priority(t.deadline or "", task_leaves)
            for a in assignees:
                member_active[a] += 1
                if prio_lvl == "critical":
                    member_critical[a] += 1

        alert_msg = ""
        if member_critical:
            max_c = max(member_critical.values())
            top_c = [m for m, c in member_critical.items() if c == max_c]
            names = (
                f"@{top_c[0]}, @{top_c[1]} and {len(top_c)-2} others"
                if len(top_c) > 2
                else " and ".join([f"@{m}" for m in top_c])
            )
            alert_msg = f"Attention! {names} has {max_c} critical task(s). They might need immediate backup."
        elif member_active:
            max_a = max(member_active.values())
            if max_a >= 3:
                top_a = [m for m, c in member_active.items() if c == max_a]
                names = " and ".join([f"@{m}" for m in top_a[:2]]) + (
                    " and others" if len(top_a) > 2 else ""
                )
                alert_msg = (
                    f"Workload Notice: {names} is carrying {max_a} active requests."
                )

        if not alert_msg and total > 0 and done == total:
            alert_msg = "All tasks are completed! Great job team. ✨"
        elif not alert_msg and total > 0:
            alert_msg = "Project is on track. Keep it up! ✨"

        return total, done, my_pending, alert_msg, request_counts.get(board_id, 0)

    def board_payload(b, role):
        total, done, my_pending, alert_msg, requests_count = get_metrics(b.id)
        members_db = members_by_board.get(b.id, [])
        team = [b.owner_username] + [m for m in members_db if m != b.owner_username]
        return {
            "id": b.id,
            "name": b.name,
            "owner_username": b.owner_username,
            "role": role,
            "total_tasks": total,
            "done_tasks": done,
            "my_pending": my_pending,
            "statuses": b.statuses,
            "categories": b.categories,
            "deletion_date": b.deletion_date,
            "created_at": b.created_at,
            "team_preview": team[:20],
            "health_alert": alert_msg,
            "is_private": getattr(b, "is_private", 0),
            "project_number": getattr(b, "project_number", None),
            "client_name": getattr(b, "client_name", None),
            "access_requests_count": requests_count,
        }

    res = []
    for b in valid_owned:
        res.append(board_payload(b, "owner"))
    for b in valid_shared:
        res.append(board_payload(b, "member"))
    for b in valid_extra:
        role = "owner" if b.owner_username == current_user else "manager"
        res.append(board_payload(b, role))
    return {"boards": res}


@router.post("/api/boards")
def create_board(
    payload: BoardModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_create_project(db, current_user):
        raise HTTPException(
            status_code=403,
            detail="Only Admin and Project Owner can create projects.",
        )
    if not payload.name or len(payload.name.strip()) == 0 or len(payload.name) > 100:
        raise HTTPException(
            status_code=400, detail="Project name must be between 1 and 100 characters."
        )

    # Cek apakah project dengan nama yang sama sudah pernah dibuat oleh user ini
    existing_board = (
        db.query(Board)
        .filter(
            Board.name == payload.name.strip(), Board.owner_username == current_user
        )
        .first()
    )
    if existing_board:
        raise HTTPException(
            status_code=400, detail="You already have a project with this exact name."
        )

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    default_statuses = json.dumps(["To Do", "In Progress", "Done"])
    default_categories = json.dumps(
        [
            "Development",
            "Design",
            "Marketing",
            "Research",
            "Maintenance",
            "Consulting",
            "Other",
        ]
    )
    
    is_private = 1 if payload.name.lower() == "to-do list" else 0
    project_number = (payload.project_number or "").strip() or None
    client_name = (payload.client_name or "").strip() or None
    new_board = Board(
        name=payload.name,
        owner_username=current_user,
        created_at=now_str,
        statuses=default_statuses,
        categories=default_categories,
        is_private=is_private,
        project_number=project_number,
        client_name=client_name,
    )
    db.add(new_board)
    db.commit()
    db.refresh(new_board)
    return {
        "message": "Project created successfully!",
        "board_id": new_board.id,
        "board_name": new_board.name,
        "project_number": new_board.project_number,
        "client_name": new_board.client_name,
        "owner_username": new_board.owner_username,
    }


@router.put("/api/boards/{board_id}")
def update_board(
    board_id: int,
    payload: BoardUpdateModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_manage_projects(db, current_user):
        raise HTTPException(
            status_code=403,
            detail="Only Admin and Project Owner can update projects.",
        )

    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Project not found")

    if is_todo_list_board(board):
        raise HTTPException(status_code=400, detail="Cannot update personal To-do List.")

    name = (payload.name or "").strip()
    if not name or len(name) > 100:
        raise HTTPException(
            status_code=400, detail="Project name must be between 1 and 100 characters."
        )

    existing_board = (
        db.query(Board)
        .filter(
            Board.name == name,
            Board.owner_username == board.owner_username,
            Board.id != board_id,
        )
        .first()
    )
    if existing_board:
        raise HTTPException(
            status_code=400,
            detail="Owner already has another project with this exact name.",
        )

    board.name = name
    board.project_number = (payload.project_number or "").strip() or None
    board.client_name = (payload.client_name or "").strip() or None
    db.commit()
    db.refresh(board)
    update_board_activity(db, board_id)

    return {
        "message": "Project updated successfully!",
        "board_id": board.id,
        "board_name": board.name,
        "project_number": board.project_number,
        "client_name": board.client_name,
    }


@router.put("/api/boards/{board_id}/settings")
def update_board_settings(
    board_id: int,
    payload: BoardSettingsModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    if not check_board_access(db, board_id, current_user) and not is_user_superadmin(
        db, current_user
    ):
        raise HTTPException(
            status_code=403, detail="Only project members can update board settings"
        )
    board.statuses = payload.statuses
    board.categories = payload.categories
    db.commit()
    update_board_activity(db, board_id)
    return {"message": "Board settings updated"}


@router.delete("/api/boards/{board_id}")
def delete_board(
    board_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Project not found.")

    is_admin = is_user_superadmin(db, current_user)
    is_owner = board.owner_username == current_user
    can_manage = can_manage_projects(db, current_user)

    # Super Admins / Project Owners can delete any project. Regular users can only delete their own.
    if not is_admin and not can_manage and not is_owner:
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this project."
        )

    # Safeguard: Prevent non-admins from deleting their own private "To-do List". Admins can override.
    if getattr(board, "is_private", 0) == 1 and board.name.lower() == "to-do list" and not is_admin:
        raise HTTPException(status_code=403, detail="Cannot delete your private default workspace.")

    db.query(BoardMember).filter(BoardMember.board_id == board_id).delete()
    tasks = db.query(Request).filter(Request.board_id == board_id).all()
    for t in tasks:
        db.query(Subtask).filter(Subtask.request_id == t.id).delete()
        db.query(Comment).filter(Comment.request_id == t.id).delete()
    db.query(Request).filter(Request.board_id == board_id).delete()
    db.delete(board)
    db.commit()
    return {"message": "Project deleted successfully!"}


@router.get("/api/boards/{board_id}/tasks")
def get_board_tasks(
    board_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not check_board_access(db, board_id, current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    board = db.query(Board).filter(Board.id == board_id).first()
    if board and evaluate_board_lifecycle(db, board):
        raise HTTPException(
            status_code=404,
            detail="Project has been auto-deleted due to 6 months of inactivity.",
        )
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

    tasks = (
        db.query(Request)
        .options(
            load_only(
                Request.id,
                Request.board_id,
                Request.timestamp,
                Request.task_name,
                Request.requester,
                Request.category,
                Request.start_date,
                Request.deadline,
                Request.impact,
                Request.etc,
                Request.auto_nudge,
                Request.recurring,
                Request.status,
                Request.completed_time,
                Request.owner_username,
                Request.supporting_access,
            )
        )
        .filter(
            Request.board_id == board_id,
            or_(Request.requester == None, Request.requester != "System"),
            or_(
                Request.task_name == None,
                Request.task_name != "[SYSTEM] PROJECT CHAT",
            ),
        )
        .all()
    )

    task_ids = [t.id for t in tasks]
    subs_by_task = batch_subtasks_by_request(db, task_ids)
    desc_meta = {}
    if task_ids:
        for tid, preview, full_len in (
            db.query(
                Request.id,
                func.left(Request.description, 280),
                func.length(Request.description),
            )
            .filter(Request.id.in_(task_ids))
            .all()
        ):
            desc_meta[tid] = (preview or "", int(full_len or 0))

    tasks_list = []
    for task in tasks:
        q_info = global_queues.get(task.id, {})
        desc_preview, full_len = desc_meta.get(task.id, ("", 0))
        t_dict = {
            "id": task.id,
            "board_id": task.board_id,
            "board_name": board.name if board else "Unknown",
            "timestamp": task.timestamp,
            "task_name": task.task_name,
            "requester": task.requester,
            "head_of_project": getattr(task, "head_of_project", "") or "",
            "rc_team": getattr(task, "rc_team", "") or "",
            "category": task.category,
            "description": desc_preview,
            "supporting_access": task.supporting_access or "",
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
            "description_truncated": full_len > 280,
        }
        subtasks = subs_by_task.get(task.id, [])
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


@router.get("/api/boards/{board_id}/tasks/light")
def get_light_tasks(
    board_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not check_board_access(db, board_id, current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    tasks = (
        db.query(Request)
        .filter(
            Request.board_id == board_id,
            Request.task_name != "[SYSTEM] PROJECT CHAT",
            Request.status.notin_(["Done", "Rejected"]),
        )
        .order_by(Request.id.desc())
        .all()
    )

    is_super = is_user_superadmin(db, current_user)
    board = db.query(Board).filter(Board.id == board_id).first()
    is_board_owner = board and board.owner_username == current_user

    res = []
    for t in tasks:
        involved = False
        if is_super or is_board_owner or t.owner_username == current_user:
            involved = True
        else:
            assignees = get_assignees(t.requester)
            if current_user in assignees:
                involved = True
            else:
                subs = db.query(Subtask).filter(Subtask.request_id == t.id).all()
                if any(s.assignee == current_user for s in subs):
                    involved = True
        res.append(
            {
                "id": t.id,
                "task_name": t.task_name,
                "status": t.status,
                "is_involved": involved,
            }
        )

    return {"tasks": res}


@router.post("/api/boards/{board_id}/tasks")
def create_task(
    board_id: int,
    task: RequestFormModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if len(task.task_name) > 255 or len(task.description) > 10000:
        raise HTTPException(
            status_code=400, detail="Payload size exceeds maximum allowed limit."
        )

    if not check_board_access(db, board_id, current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    if not can_create_task(db, current_user):
        raise HTTPException(
            status_code=403,
            detail="Staff role cannot create tasks. Contact a Manager or Project Owner.",
        )

    now = datetime.now()
    timestamp = now.strftime("%Y-%m-%d %H:%M:%S")

    # Mencegah error UNIQUE constraint pada kolom timestamp saat bulk create
    counter = 0
    while db.query(Request).filter(Request.timestamp == timestamp).first():
        counter += 1
        timestamp = (now + timedelta(seconds=counter)).strftime("%Y-%m-%d %H:%M:%S")
        
    board = db.query(Board).filter(Board.id == board_id).first()
    if board and getattr(board, "is_private", 0) == 1:
        assignees = get_assignees(task.requester)
        if any(a.lower() != current_user.lower() for a in assignees):
            raise HTTPException(status_code=400, detail="Cannot assign tasks to other users in a private workspace.")
        for st in task.subtasks:
            if st.get("assignee") and st.get("assignee").lower() != current_user.lower():
                raise HTTPException(status_code=400, detail="Cannot assign subtasks to other users in a private workspace.")

    try:
        new_task = Request(
            board_id=board_id,
            timestamp=timestamp,
            task_name=task.task_name,
            requester=task.requester,
            head_of_project=task.head_of_project or "",
            rc_team=task.rc_team or "",
            category=task.category,
            description=task.description,
            supporting_access=task.supporting_access,
            start_date=task.start_date if task.start_date and task.start_date.strip() else None,
            deadline=task.deadline if task.deadline and task.deadline.strip() else None,
            impact=task.impact or "Medium",
            etc=task.etc if task.etc is not None else 2,
            auto_nudge=True if task.auto_nudge else False,
            status="To Do",
            owner_username=current_user,
        )
        setattr(new_task, "recurring", task.recurring or "none")
        db.add(new_task)
        db.flush()  # Flush untuk mendapatkan ID task yang baru dibuat tanpa melakukan commit

        # Masukkan semua sub-task awal yang dikirim dari Frontend
        subtask_assignees = set()
        newly_invited = []
        for idx, st in enumerate(task.subtasks):
            name = st.get("task_name", "").strip()
            if name:
                assignee = st.get("assignee")
                db.add(
                    Subtask(
                        request_id=new_task.id,
                        task_name=name,
                        assignee=assignee,
                        position=idx,
                    )
                )
                if assignee and assignee != current_user:
                    subtask_assignees.add(assignee)

        db.commit()
        log_activity(db, new_task.id, f"**@{current_user}** created this task.")

        assignees = get_assignees(f"{task.requester or ''} {task.head_of_project or ''} {task.rc_team or ''}")
        all_involved = assignees.union(subtask_assignees)
        for m in all_involved:
            if m != current_user:
                if auto_add_to_board(db, board_id, m, current_user):
                    newly_invited.append(f"@{m}")
                target = db.query(User).filter(User.username == m).first()
                if target and check_board_access(db, board_id, m):
                    create_notification(
                        db,
                        m,
                        f"@{current_user} assigned you a new task: {task.task_name or 'Untitled'}",
                        "task_assigned",
                        new_task.id,
                    )

        update_board_activity(db, board_id)

        response_message = "Task created successfully"
        if newly_invited:
            invited_str = ", ".join(newly_invited)
            response_message += f". Also, {invited_str} "
            if len(newly_invited) > 1:
                response_message += "were automatically invited to the project."
            else:
                response_message += "was automatically invited to the project."

        return {
            "message": response_message,
            "project": task.task_name,
            "task_id": new_task.id,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/boards/{board_id}/request-access")
def request_board_access(
    board_id: int,
    task_id: Optional[int] = None,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Project not found")
    if getattr(board, "is_private", 0) == 1:
        raise HTTPException(status_code=403, detail="Cannot request access to a private workspace.")

    existing = db.query(BoardMember).filter(BoardMember.board_id == board_id, BoardMember.member_username == current_user).first()
    if existing:
        if existing.status == "accepted":
            return {"message": "You are already a member."}
        elif existing.status == "requesting":
            return {"message": "Access request already sent."}
        elif existing.status == "pending":
            return {"message": "You already have a pending invitation. Please check your invitations."}

    new_req = BoardMember(board_id=board_id, member_username=current_user, status="requesting")
    db.add(new_req)
    db.commit()

    task_info = ""
    if task_id:
        task = db.query(Request).filter(Request.id == task_id).first()
        if task:
            task_info = f" to view task: {task.task_name} <!--TASK_ID:{task.id}-->"

    create_notification(
        db, board.owner_username,
        f"@{current_user} is requesting access to your project: {board.name}{task_info}",
        "access_request", board.id
    )
    return {"message": "Access request sent successfully!"}


@router.put("/api/boards/{board_id}/requests/{member_id}/accept")
def accept_access_request(board_id: int, member_id: int, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board or (board.owner_username != current_user and not is_user_superadmin(db, current_user)):
        raise HTTPException(status_code=403, detail="Only owner can accept requests.")
    
    req = db.query(BoardMember).filter(BoardMember.id == member_id, BoardMember.board_id == board_id, BoardMember.status == "requesting").first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req.status = "accepted"
    db.commit()
    
    last_req_notif = db.query(Notification).filter(
        Notification.user_username == board.owner_username,
        Notification.type == "access_request",
        Notification.message.like(f"%@{req.member_username} is requesting access%"),
        Notification.related_task_id == board_id
    ).order_by(Notification.id.desc()).first()

    task_info = ""
    if last_req_notif:
        import re
        match = re.search(r'<!--TASK_ID:(\d+)-->', last_req_notif.message)
        if match:
            task_id_match = match.group(1)
            task = db.query(Request).filter(Request.id == int(task_id_match)).first()
            if task:
                task_info = f" You can now view the task: {task.task_name} <!--TASK_ID:{task.id}-->"

    create_notification(
        db, req.member_username,
        f"Your request to join project '{board.name}' has been accepted. You are now a member!{task_info}",
        "access_accepted", board.id
    )
    return {"message": "Access request accepted"}


@router.post("/api/boards/{board_id}/invite")
def invite_board_member(
    board_id: int,
    payload: InviteModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board or board.owner_username != current_user:
        raise HTTPException(
            status_code=403, detail="Only the project owner can invite members."
        )
    if getattr(board, "is_private", 0) == 1:
        raise HTTPException(status_code=403, detail="Cannot invite members to a private workspace.")

    owned_boards = (
        db.query(Board.id).filter(Board.owner_username == current_user).subquery()
    )
    unique_members_count = (
        db.query(BoardMember.member_username)
        .filter(BoardMember.board_id.in_(owned_boards))
        .distinct()
        .count()
    )

    raw_inputs = [
        x.strip()
        for x in payload.members_input.replace(";", ",").split(",")
        if x.strip()
    ]
    if not raw_inputs:
        raise HTTPException(
            status_code=400, detail="Please provide at least one username or email."
        )

    success_count = 0
    errors = []

    for identifier in raw_inputs:
        target = (
            db.query(User)
            .filter(or_(User.username == identifier, User.email == identifier))
            .first()
        )
        if not target:
            errors.append(f"{identifier} (Not found)")
            continue

        if target.username == "admin":
            errors.append(f"{identifier} (Cannot invite system admin)")
            continue

        if target.username == current_user:
            errors.append(f"{identifier} (Cannot invite yourself)")
            continue

        existing_connection = (
            db.query(BoardMember)
            .filter(
                BoardMember.board_id == board_id,
                BoardMember.member_username == target.username,
            )
            .first()
        )
        if existing_connection:
            errors.append(f"{identifier} (Already in project)")
            continue

        new_invite = BoardMember(board_id=board_id, member_username=target.username)
        db.add(new_invite)
        create_notification(
            db,
            target.username,
            f"@{current_user} invited you to project: {board.name}",
            "team_invite",
        )
        success_count += 1

    db.commit()

    if success_count == 0:
        raise HTTPException(
            status_code=400, detail=f"Failed to invite. Issues: {', '.join(errors)}"
        )

    msg = f"Successfully invited {success_count} user(s)."
    if errors:
        msg += f" Skipped: {', '.join(errors)}"

    return {"message": msg}


@router.get("/api/boards/{board_id}/members")
def get_board_members(
    board_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not check_board_access(db, board_id, current_user):
        raise HTTPException(status_code=403)
    board = db.query(Board).filter(Board.id == board_id).first()
    members = (
        db.query(BoardMember)
        .filter(BoardMember.board_id == board_id, BoardMember.status == "accepted")
        .all()
    )

    all_members = set([board.owner_username] + [m.member_username for m in members])
    return {"members": list(all_members)}


@router.get("/api/boards/{board_id}/manage")
def manage_board(
    board_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not check_board_access(db, board_id, current_user):
        raise HTTPException(status_code=403)
    members = db.query(BoardMember).filter(BoardMember.board_id == board_id).all()
    return {
        "team": [
            {"id": m.id, "username": m.member_username, "status": m.status}
            for m in members
        ]
    }


@router.delete("/api/boards/{board_id}/revoke/{member_id}")
def revoke_board_member(
    board_id: int,
    member_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    board = db.query(Board).filter(Board.id == board_id).first()

    inv = (
        db.query(BoardMember)
        .filter(BoardMember.id == member_id, BoardMember.board_id == board_id)
        .first()
    )
    if not inv:
        raise HTTPException(status_code=404, detail="Project member not found")

    if not board or (
        board.owner_username != current_user
        and inv.member_username != current_user
        and not is_user_superadmin(db, current_user)
    ):
        raise HTTPException(
            status_code=403, detail="Only project owner can revoke access, or you can leave by yourself."
        )

    db.delete(inv)
    db.commit()
    return {"message": "Access revoked successfully"}


@router.put("/api/boards/{board_id}/transfer-member")
def transfer_board_to_member(
    board_id: int,
    payload: TransferToMemberModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board or board.owner_username != current_user:
        raise HTTPException(
            status_code=403, detail="Only the current owner can transfer ownership."
        )

    member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == board_id,
            BoardMember.member_username == payload.new_owner,
            BoardMember.status == "accepted",
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=400,
            detail="The selected user must be an active team member first.",
        )

    old_owner = board.owner_username
    board.owner_username = payload.new_owner
    db.delete(member)  # Hapus penerima dari status anggota biasa

    new_member = BoardMember(
        board_id=board_id, member_username=old_owner, status="accepted"
    )
    db.add(new_member)  # Jadikan owner lama sebagai anggota biasa

    db.commit()
    create_notification(
        db,
        payload.new_owner,
        f"@{old_owner} transferred ownership of project '{board.name}' to you.",
        "info",
        board.id,
    )
    return {"message": f"Ownership successfully transferred to @{payload.new_owner}"}


@router.get("/api/boards/{board_id}/chat")
def get_board_chat(
    board_id: int,
    offset: int = 0,
    limit: int = 50,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not check_board_access(db, board_id, current_user):
        raise HTTPException(status_code=403)
    chat_task = get_or_create_chat_task(db, board_id)
    comments = (
        db.query(Comment)
        .filter(Comment.request_id == chat_task.id)
        .order_by(Comment.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    comments.reverse()
    res = []
    for c in comments:
        if c.username != "System":
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
    return {"messages": res}


@router.post("/api/boards/{board_id}/chat")
def add_board_chat(
    board_id: int,
    payload: CommentModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if len(payload.text) > 3000:
        raise HTTPException(
            status_code=400,
            detail="Message text is too long (Maximum 3000 characters).",
        )

    if not check_board_access(db, board_id, current_user):
        raise HTTPException(status_code=403)
            
    board = db.query(Board).filter(Board.id == board_id).first()
    if board and getattr(board, "is_private", 0) == 1:
        raise HTTPException(status_code=400, detail="Cannot chat in a private workspace.")
            
    chat_task = get_or_create_chat_task(db, board_id)
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_msg = Comment(
        request_id=chat_task.id,
        username=current_user,
        text=payload.text,
        timestamp=now_str,
    )
    db.add(new_msg)
    db.commit()

    mentions = set(re.findall(r"@([\w.-]+)", payload.text or ""))
    board = db.query(Board).filter(Board.id == board_id).first()
    if "team" in {m.lower() for m in mentions}:
        members = (
            db.query(BoardMember)
            .filter(BoardMember.board_id == board_id, BoardMember.status == "accepted")
            .all()
        )
        team_users = {m.member_username for m in members}
        if board:
            team_users.add(board.owner_username)
        for tu in team_users:
            if tu.lower() != current_user.lower():
                create_notification(
                    db,
                    tu,
                    f"@{current_user} mentioned @team in {board.name} chat",
                    "team_chat_no_email",
                    board_id,
                )
    else:
        for m in mentions:
            if m.lower() != current_user.lower() and check_board_access(
                db, board_id, m
            ):
                create_notification(
                    db,
                    m,
                    f"@{current_user} mentioned you in {board.name if board else 'Project'} chat",
                    "team_chat",
                    board_id,
                )

    update_board_activity(db, board_id)
    return {"message": "Chat sent"}


@router.delete("/api/boards/{board_id}/chat/{comment_id}")
def delete_board_chat(
    board_id: int,
    comment_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not check_board_access(db, board_id, current_user):
        raise HTTPException(status_code=403)
    chat_task = get_or_create_chat_task(db, board_id)
    comment = (
        db.query(Comment)
        .filter(Comment.id == comment_id, Comment.request_id == chat_task.id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404)
    if comment.username != current_user and not is_user_superadmin(db, current_user):
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this message"
        )
    db.delete(comment)
    db.commit()
    return {"message": "Message deleted"}
