from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from database import get_db, User, Timesheet, Board, Request
from dependencies import get_current_user
from schemas import (
    TimesheetEntryModel,
    TimesheetUpdateModel,
    TimesheetSubmitModel,
    TimesheetApproveModel,
)
from datetime import datetime

router = APIRouter()

@router.get("/entries")
def get_my_timesheets(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """Fetch current user's timesheet entries"""
    entries = db.query(Timesheet).filter(Timesheet.user_username == current_user).all()
    # Enrich with project and task names for the frontend
    results = []
    for entry in entries:
        project_name = None
        task_name = None
        
        if entry.board_id:
            board = db.query(Board).filter(Board.id == entry.board_id).first()
            if board:
                project_name = board.name
        else:
            project_name = entry.custom_project_name
                
        if entry.request_id:
            req = db.query(Request).filter(Request.id == entry.request_id).first()
            if req:
                task_name = req.project_name[:50] + "..." if req.project_name and len(req.project_name) > 50 else req.project_name
        else:
            task_name = entry.custom_task_name
 
        results.append({
            "id": entry.id,
            "date": entry.date.strftime("%Y-%m-%d"),
            "hours_logged": entry.hours_logged,
            "description": entry.description,
            "status": entry.status,
            "approver_username": entry.approver_username,
            "board_id": entry.board_id,
            "project_name": project_name,
            "request_id": entry.request_id,
            "task_name": task_name,
            "custom_project_name": entry.custom_project_name,
            "custom_task_name": entry.custom_task_name,
        })
    return {"entries": results}

@router.post("/entry")
def create_timesheet_entry(data: TimesheetEntryModel, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    try:
        date_obj = datetime.strptime(data.date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")
        
    entry = Timesheet(
        user_username=current_user,
        request_id=data.request_id,
        board_id=data.board_id,
        date=date_obj,
        hours_logged=data.hours_logged,
        description=data.description,
        status="Draft",
        approver_username=None,
        custom_project_name=data.custom_project_name,
        custom_task_name=data.custom_task_name,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"message": "Entry created", "id": entry.id}

@router.put("/entry/{entry_id}")
def update_timesheet_entry(entry_id: int, data: TimesheetUpdateModel, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    entry = db.query(Timesheet).filter(Timesheet.id == entry_id, Timesheet.user_username == current_user).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
        
    if entry.status not in ["Draft", "Rejected"]:
        raise HTTPException(status_code=400, detail="Can only edit Draft or Rejected entries")
        
    if data.hours_logged is not None:
        entry.hours_logged = data.hours_logged
    if data.description is not None:
        entry.description = data.description
    if data.status is not None:
        entry.status = data.status
        
    db.commit()
    return {"message": "Entry updated"}

@router.delete("/entry/{entry_id}")
def delete_timesheet_entry(entry_id: int, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    entry = db.query(Timesheet).filter(Timesheet.id == entry_id, Timesheet.user_username == current_user).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
        
    if entry.status not in ["Draft", "Rejected"]:
        raise HTTPException(status_code=400, detail="Can only delete Draft or Rejected entries")
        
    db.delete(entry)
    db.commit()
    return {"message": "Entry deleted"}

@router.post("/submit")
def submit_timesheets(data: TimesheetSubmitModel, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    user_record = db.query(User).filter(User.username == current_user).first()
    if not user_record or not user_record.timesheet_approver:
        raise HTTPException(status_code=400, detail="You do not have an assigned approver. Contact an Admin.")
        
    entries = db.query(Timesheet).filter(
        Timesheet.id.in_(data.entry_ids),
        Timesheet.user_username == current_user,
        Timesheet.status.in_(["Draft", "Rejected"])
    ).all()
    
    if not entries:
        return {"message": "No Draft or Rejected entries found in this date range to submit."}
        
    for entry in entries:
        entry.status = "Pending"
        entry.approver_username = user_record.timesheet_approver
        
    db.commit()
    return {"message": f"Successfully submitted {len(entries)} entries.", "count": len(entries)}

@router.get("/approvals")
def get_approvals(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """Fetch timesheet entries pending approval by the current user"""
    entries = db.query(Timesheet).filter(
        Timesheet.approver_username == current_user,
        Timesheet.status == "Pending"
    ).all()
    
    results = []
    for entry in entries:
        project_name = None
        task_name = None
        
        if entry.board_id:
            board = db.query(Board).filter(Board.id == entry.board_id).first()
            if board:
                project_name = board.name
        else:
            project_name = entry.custom_project_name
                
        if entry.request_id:
            req = db.query(Request).filter(Request.id == entry.request_id).first()
            if req:
                task_name = req.project_name[:50] + "..." if req.project_name and len(req.project_name) > 50 else req.project_name
        else:
            task_name = entry.custom_task_name
 
        results.append({
            "id": entry.id,
            "user_username": entry.user_username,
            "date": entry.date.strftime("%Y-%m-%d"),
            "hours_logged": entry.hours_logged,
            "description": entry.description,
            "status": entry.status,
            "board_id": entry.board_id,
            "project_name": project_name,
            "request_id": entry.request_id,
            "task_name": task_name,
            "custom_project_name": entry.custom_project_name,
            "custom_task_name": entry.custom_task_name,
        })
    return {"entries": results}

@router.patch("/approve")
def approve_timesheets(data: TimesheetApproveModel, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    if data.status not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status. Use 'Approved' or 'Rejected'")
        
    entries = db.query(Timesheet).filter(
        Timesheet.id.in_(data.entry_ids),
        Timesheet.approver_username == current_user,
        Timesheet.status == "Pending"
    ).all()
    
    for entry in entries:
        entry.status = data.status
        
    db.commit()
    return {"message": f"Successfully marked {len(entries)} entries as {data.status}"}
