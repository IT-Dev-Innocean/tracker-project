import os
import sys
import unittest

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from backend_api import app, get_current_user
from database import SessionLocal, AIUsageLog, set_security_log
from ai_usage import DEFAULT_DAILY_LIMIT

client = TestClient(app)


class AIUsageTests(unittest.TestCase):
    def tearDown(self):
        app.dependency_overrides.clear()

    def test_ai_overview_requires_admin(self):
        app.dependency_overrides[get_current_user] = lambda: "staff_user_who_does_not_exist_xyz"
        response = client.get("/api/admin/ai/overview")
        self.assertEqual(response.status_code, 403)
        put_response = client.put("/api/admin/ai/limits", json={"default_daily_limit": 15})
        self.assertEqual(put_response.status_code, 403)

    def test_ai_overview_admin_can_read_and_update_limits(self):
        app.dependency_overrides[get_current_user] = lambda: "admin"
        response = client.get("/api/admin/ai/overview")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("users", data)
        self.assertIn("today", data)
        self.assertIn("engines", data)
        self.assertEqual(data["default_daily_limit"], 15)
        self.assertIn("gemini", data["engines"])
        self.assertIn("groq", data["engines"])
        put_response = client.put("/api/admin/ai/limits", json={"default_daily_limit": 15})
        self.assertEqual(put_response.status_code, 200)
        self.assertEqual(put_response.json()["default_daily_limit"], 15)
        try:
            free_response = client.put(
                "/api/admin/ai/limits",
                json={"engine_plans": {"gemini": "free", "groq": "free"}},
            )
            self.assertEqual(free_response.status_code, 200)
            free_engines = free_response.json()["engines"]
            self.assertEqual(free_engines["gemini"]["plan"], "free")
            self.assertEqual(free_engines["gemini"]["rpd"], 250)
            self.assertEqual(free_engines["groq"]["plan"], "free")
            self.assertEqual(free_engines["groq"]["rpd"], 1000)
            plan_response = client.put(
                "/api/admin/ai/limits",
                json={"engine_plans": {"gemini": "tier1", "groq": "developer"}},
            )
            self.assertEqual(plan_response.status_code, 200)
            engines = plan_response.json()["engines"]
            self.assertEqual(engines["gemini"]["plan"], "tier1")
            self.assertEqual(engines["gemini"]["rpd"], 10000)
            self.assertEqual(engines["groq"]["plan"], "developer")
            self.assertTrue(engines["groq"]["unlimited"])
        finally:
            client.put(
                "/api/admin/ai/limits",
                json={"engine_plans": {"gemini": "free", "groq": "free"}},
            )

    def test_ai_daily_limit_blocks_after_default_quota(self):
        username = "ai_quota_test_user"
        app.dependency_overrides[get_current_user] = lambda: username
        db = SessionLocal()
        try:
            db.query(AIUsageLog).filter(AIUsageLog.username == username).delete()
            db.commit()
            set_security_log(db, f"ai_generate:{username}", 0)
            for _ in range(DEFAULT_DAILY_LIMIT):
                db.add(
                    AIUsageLog(
                        username=username,
                        success=1,
                        status="ok",
                        provider_used="gemini",
                    )
                )
            db.commit()

            response = client.post("/api/ai/generate", json={"prompt": "hello", "language": "id"})
            self.assertEqual(response.status_code, 429)
            detail = str(response.json().get("detail", ""))
            self.assertNotIn("Gemini", detail)
            self.assertNotIn("Groq", detail)
            self.assertNotIn("GPT-OSS", detail)
            self.assertIn("Smart Assistant", detail)
            self.assertIn("batas Smart Assistant hari ini", detail)
        finally:
            db.query(AIUsageLog).filter(AIUsageLog.username == username).delete()
            db.commit()
            db.close()

    def test_ai_generate_hides_vendor_names_when_unconfigured(self):
        username = "ai_unconfigured_test_user"
        app.dependency_overrides[get_current_user] = lambda: username
        original_gemini = os.environ.pop("GEMINI_API_KEY", None)
        original_groq = os.environ.pop("GROQ_API_KEY", None)
        db = SessionLocal()
        try:
            db.query(AIUsageLog).filter(AIUsageLog.username == username).delete()
            db.commit()
            set_security_log(db, f"ai_generate:{username}", 0)
            response = client.post("/api/ai/generate", json={"prompt": "hello", "provider": "gemini"})
            self.assertEqual(response.status_code, 400)
            detail = str(response.json().get("detail", ""))
            self.assertNotIn("GEMINI_API_KEY", detail)
            self.assertNotIn("GROQ_API_KEY", detail)
            self.assertNotIn("Gemini", detail)
            self.assertNotIn("Groq", detail)
        finally:
            if original_gemini is not None:
                os.environ["GEMINI_API_KEY"] = original_gemini
            if original_groq is not None:
                os.environ["GROQ_API_KEY"] = original_groq
            db.query(AIUsageLog).filter(AIUsageLog.username == username).delete()
            db.commit()
            db.close()


if __name__ == "__main__":
    unittest.main()
