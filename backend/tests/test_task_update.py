from fastapi.testclient import TestClient
from backend_api import app
from dependencies import get_current_user

# Mock auth
def override_get_current_user():
    return "Eka Hary"
app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

# 1. Fetch all tasks
print("Fetching tasks...")
res = client.get("/api/tasks/all")
tasks = res.json().get("tasks", [])
pending_tasks = [t for t in tasks if t["status"] == "Pending"]

if not pending_tasks:
    print("No pending tasks found.")
else:
    task = pending_tasks[0]
    task_id = task["id"]
    print(f"Target Task ID: {task_id}, Status: {task['status']}, Subtasks: {task['subtask_done']}/{task['subtask_total']}")
    
    # 2. Update to Done
    print("Updating to Done...")
    res_put = client.put(f"/api/tasks/{task_id}", json={"status": "Done"})
    print("PUT Status:", res_put.status_code)
    
    # 3. Fetch all tasks again
    print("Fetching tasks again...")
    res_after = client.get("/api/tasks/all")
    tasks_after = res_after.json().get("tasks", [])
    task_after = next(t for t in tasks_after if t["id"] == task_id)
    print(f"After Update - Task ID: {task_id}, Status: {task_after['status']}")
