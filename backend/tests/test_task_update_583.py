from fastapi.testclient import TestClient
from backend_api import app
from dependencies import get_current_user
from database import get_db, Request

# Find owner of task 583
db = next(get_db())
t = db.query(Request).filter(Request.id == 583).first()
print(f"Task 583 owner: {t.requester}, owner_username: {getattr(t, 'owner_username', 'none')}")

def override_get_current_user():
    return t.requester.replace("@", "") if t.requester else "Eka Hary"
app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

res_put = client.put(f"/api/tasks/583", json={"status": "Done"})
print("PUT Status:", res_put.status_code)
print("PUT Response:", res_put.json() if res_put.status_code != 200 else "Success")

db.expire_all()
t_after = db.query(Request).filter(Request.id == 583).first()
print(f"DB Status after: {t_after.status}")
