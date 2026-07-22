import httpx

client = httpx.Client(base_url="http://localhost:8000")

# login
login_data = {
    "username": "eka",
    "password": "123"
}
res = client.post("/api/login", json=login_data)
token = res.json().get("access_token")
client.headers.update({"Authorization": f"Bearer {token}"})

# create a recurring task
task_data = {
    "project_name": "Test Recurring",
    "requester": "@eka",
    "category": "Development",
    "description": "test",
    "start_date": "2026-06-19",
    "deadline": "2026-06-20 17:00:00",
    "recurring": "daily",
    "etc": 2,
    "impact": "Medium",
    "subtasks": []
}
# wait, creating tasks in global board might not be allowed. Let's get a board id
res = client.get("/api/boards")
boards = res.json().get("boards", [])
if boards:
    board_id = boards[0]["id"]
    res = client.post(f"/api/boards/{board_id}/tasks", json=task_data)
    task_id = res.json().get("task_id")
    if task_id:
        res = client.put(f"/api/tasks/{task_id}", json={"status": "Done"})
        print("PUT RESPONSE:", res.json())
    else:
        print("FAILED TO CREATE TASK", res.json())
else:
    print("NO BOARDS")
