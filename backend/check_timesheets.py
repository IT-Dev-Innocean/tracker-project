from database import SessionLocal, Timesheet
import os

db = SessionLocal()
# Let's see what user we have
timesheets = db.query(Timesheet).all()
print(f"Total timesheet entries: {len(timesheets)}")
for t in timesheets:
    print(f"ID: {t.id}, User: {t.user_username}, Date: {t.date}, Hours: {t.hours_logged}, Board: {t.board_id}, Req: {t.request_id}, CustomProj: {t.custom_project_name}, CustomTask: {t.custom_task_name}, Status: {t.status}")
db.close()
