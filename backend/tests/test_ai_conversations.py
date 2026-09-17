import os
import sys
import unittest

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from backend_api import app, get_current_user
from database import SessionLocal, AIConversation

client = TestClient(app)


class AIConversationTests(unittest.TestCase):
    def tearDown(self):
        app.dependency_overrides.clear()
        db = SessionLocal()
        try:
            db.query(AIConversation).filter(
                AIConversation.username.in_(["conv_owner_a", "conv_owner_b"])
            ).delete(synchronize_session=False)
            db.commit()
        finally:
            db.close()

    def test_conversation_crud_and_search(self):
        app.dependency_overrides[get_current_user] = lambda: "conv_owner_a"
        created = client.post(
            "/api/ai/conversations",
            json={
                "messages": [
                    {"sender": "bot", "text": "Halo"},
                    {"sender": "user", "text": "Status task staging DNS"},
                ],
                "state": {"assistantMode": "chat", "step": "idle"},
            },
        )
        self.assertEqual(created.status_code, 200)
        body = created.json()
        self.assertEqual(body["title"], "Status task staging DNS")
        self.assertIn("staging DNS", body["preview"])
        conversation_id = body["id"]

        listed = client.get("/api/ai/conversations")
        self.assertEqual(listed.status_code, 200)
        ids = [item["id"] for item in listed.json()["conversations"]]
        self.assertIn(conversation_id, ids)

        searched = client.get("/api/ai/conversations", params={"q": "staging"})
        self.assertEqual(searched.status_code, 200)
        self.assertTrue(
            any(item["id"] == conversation_id for item in searched.json()["conversations"])
        )

        missed = client.get("/api/ai/conversations", params={"q": "tidak-ada-hasil-xyz"})
        self.assertEqual(missed.status_code, 200)
        self.assertEqual(missed.json()["conversations"], [])

        patched = client.patch(
            f"/api/ai/conversations/{conversation_id}",
            json={"title": "DNS Staging", "state": {"assistantMode": "chat", "step": "confirm"}},
        )
        self.assertEqual(patched.status_code, 200)
        self.assertEqual(patched.json()["title"], "DNS Staging")
        self.assertEqual(patched.json()["state"]["step"], "confirm")

        fetched = client.get(f"/api/ai/conversations/{conversation_id}")
        self.assertEqual(fetched.status_code, 200)
        self.assertEqual(fetched.json()["title"], "DNS Staging")
        self.assertEqual(len(fetched.json()["messages"]), 2)

        deleted = client.delete(f"/api/ai/conversations/{conversation_id}")
        self.assertEqual(deleted.status_code, 200)
        missing = client.get(f"/api/ai/conversations/{conversation_id}")
        self.assertEqual(missing.status_code, 404)

    def test_conversations_are_isolated_per_user(self):
        app.dependency_overrides[get_current_user] = lambda: "conv_owner_a"
        created = client.post(
            "/api/ai/conversations",
            json={"messages": [{"sender": "user", "text": "Rahasia milik A"}]},
        )
        self.assertEqual(created.status_code, 200)
        conversation_id = created.json()["id"]

        app.dependency_overrides[get_current_user] = lambda: "conv_owner_b"
        listed = client.get("/api/ai/conversations")
        self.assertEqual(listed.status_code, 200)
        self.assertFalse(
            any(item["id"] == conversation_id for item in listed.json()["conversations"])
        )
        forbidden = client.get(f"/api/ai/conversations/{conversation_id}")
        self.assertEqual(forbidden.status_code, 404)
        forbidden_patch = client.patch(
            f"/api/ai/conversations/{conversation_id}",
            json={"title": "Hijack"},
        )
        self.assertEqual(forbidden_patch.status_code, 404)
        forbidden_delete = client.delete(f"/api/ai/conversations/{conversation_id}")
        self.assertEqual(forbidden_delete.status_code, 404)


if __name__ == "__main__":
    unittest.main()
