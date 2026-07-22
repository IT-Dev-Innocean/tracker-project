from fastapi.testclient import TestClient
from backend_api import app
from dependencies import get_current_user
import sys

def override_get_current_user():
    return "Eka Hary"

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

print("Calling AI Generator...", flush=True)
response = client.post("/api/ai/generate", json={"prompt": "Say hello in 2 words", "provider": "gemini"})
print("Status Code:", response.status_code)
print("Response JSON:", response.json() if response.status_code != 500 else response.text)
