import os
import sys
import unittest
from unittest.mock import MagicMock, patch

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
        put_response = client.put("/api/admin/ai/limits", json={"default_daily_limit": 20})
        self.assertEqual(put_response.status_code, 403)

    def test_ai_overview_admin_can_read_and_update_limits(self):
        app.dependency_overrides[get_current_user] = lambda: "admin"
        response = client.get("/api/admin/ai/overview")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("users", data)
        self.assertIn("today", data)
        self.assertIn("engines", data)
        self.assertIn("capacity", data)
        self.assertIn("gemini_35", data["engines"])
        self.assertIn("gemini_31", data["engines"])
        self.assertIn("groq", data["engines"])
        put_response = client.put("/api/admin/ai/limits", json={"default_daily_limit": 20})
        self.assertEqual(put_response.status_code, 200)
        self.assertEqual(put_response.json()["default_daily_limit"], 20)
        try:
            free_response = client.put(
                "/api/admin/ai/limits",
                json={
                    "engine_plans": {
                        "gemini_35": "free",
                        "gemini_31": "free",
                        "groq": "free",
                    }
                },
            )
            self.assertEqual(free_response.status_code, 200)
            free_engines = free_response.json()["engines"]
            self.assertEqual(free_engines["gemini_35"]["plan"], "free")
            self.assertEqual(free_engines["gemini_35"]["model"], "gemini-3.5-flash-lite")
            self.assertEqual(free_engines["gemini_35"]["rpd"], 500)
            self.assertEqual(free_engines["gemini_31"]["plan"], "free")
            self.assertEqual(free_engines["gemini_31"]["model"], "gemini-3.1-flash-lite")
            self.assertEqual(free_engines["gemini_31"]["rpd"], 500)
            self.assertEqual(free_engines["groq"]["plan"], "free")
            self.assertEqual(free_engines["groq"]["rpd"], 1000)
            capacity = free_response.json()["capacity"]
            self.assertEqual(capacity["order"], ["groq", "gemini_35", "gemini_31"])
            self.assertEqual(capacity["rpd_total"], 2000)
            self.assertEqual(capacity["app_need_100_users"], 2000)
            self.assertTrue(capacity["enough_for_100_users"])
            plan_response = client.put(
                "/api/admin/ai/limits",
                json={
                    "engine_plans": {
                        "gemini_35": "tier1",
                        "gemini_31": "tier1",
                        "groq": "developer",
                    }
                },
            )
            self.assertEqual(plan_response.status_code, 200)
            engines = plan_response.json()["engines"]
            self.assertEqual(engines["gemini_35"]["plan"], "tier1")
            self.assertEqual(engines["gemini_35"]["rpd"], 10000)
            self.assertEqual(engines["gemini_31"]["plan"], "tier1")
            self.assertTrue(engines["groq"]["unlimited"])
        finally:
            client.put(
                "/api/admin/ai/limits",
                json={
                    "engine_plans": {
                        "gemini_35": "free",
                        "gemini_31": "free",
                        "groq": "free",
                    }
                },
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
                        provider_used="gemini_35",
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

    @patch("routers.ai.requests.post")
    @patch("routers.ai.genai.Client")
    def test_ai_generate_falls_back_across_three_models(self, mock_client_cls, mock_post):
        username = "ai_fallback_test_user"
        app.dependency_overrides[get_current_user] = lambda: username
        original_gemini = os.environ.get("GEMINI_API_KEY")
        original_groq = os.environ.get("GROQ_API_KEY")
        os.environ["GEMINI_API_KEY"] = "test-gemini-key"
        os.environ["GROQ_API_KEY"] = "test-groq-key"

        class FakeResponse:
            text = "ok from 3.1"
            candidates = []

        models_mock = MagicMock()

        def generate_content(*args, **kwargs):
            model = kwargs.get("model") or (args[0] if args else None)
            if model == "gemini-3.5-flash-lite":
                raise Exception("429 RESOURCE_EXHAUSTED")
            if model == "gemini-3.1-flash-lite":
                return FakeResponse()
            raise AssertionError(f"unexpected model {model}")

        models_mock.generate_content.side_effect = generate_content
        mock_client_cls.return_value.models = models_mock
        groq_response = MagicMock()
        groq_response.status_code = 429
        mock_post.return_value = groq_response

        db = SessionLocal()
        try:
            db.query(AIUsageLog).filter(AIUsageLog.username == username).delete()
            db.commit()
            set_security_log(db, f"ai_generate:{username}", 0)
            response = client.post("/api/ai/generate", json={"prompt": "hello", "language": "en"})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json().get("text"), "ok from 3.1")
            mock_post.assert_called_once()
            called_models = [
                (call.kwargs.get("model") or (call.args[0] if call.args else None))
                for call in models_mock.generate_content.call_args_list
            ]
            self.assertEqual(
                called_models,
                ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"],
            )
            log = (
                db.query(AIUsageLog)
                .filter(AIUsageLog.username == username, AIUsageLog.status == "ok")
                .order_by(AIUsageLog.id.desc())
                .first()
            )
            self.assertIsNotNone(log)
            self.assertEqual(log.provider_used, "gemini_31")
        finally:
            db.query(AIUsageLog).filter(AIUsageLog.username == username).delete()
            db.commit()
            db.close()
            if original_gemini is None:
                os.environ.pop("GEMINI_API_KEY", None)
            else:
                os.environ["GEMINI_API_KEY"] = original_gemini
            if original_groq is None:
                os.environ.pop("GROQ_API_KEY", None)
            else:
                os.environ["GROQ_API_KEY"] = original_groq

    @patch("routers.ai.requests.post")
    @patch("routers.ai.genai.Client")
    def test_ai_generate_uses_gemini_35_when_groq_is_limited(self, mock_client_cls, mock_post):
        username = "ai_fallback_gemini_user"
        app.dependency_overrides[get_current_user] = lambda: username
        original_gemini = os.environ.get("GEMINI_API_KEY")
        original_groq = os.environ.get("GROQ_API_KEY")
        os.environ["GEMINI_API_KEY"] = "test-gemini-key"
        os.environ["GROQ_API_KEY"] = "test-groq-key"

        class FakeResponse:
            text = "ok from 3.5"
            candidates = []

        models_mock = MagicMock()

        def generate_content(*args, **kwargs):
            model = kwargs.get("model") or (args[0] if args else None)
            if model == "gemini-3.5-flash-lite":
                return FakeResponse()
            raise AssertionError(f"unexpected model {model}")

        models_mock.generate_content.side_effect = generate_content
        mock_client_cls.return_value.models = models_mock
        groq_response = MagicMock()
        groq_response.status_code = 429
        mock_post.return_value = groq_response

        db = SessionLocal()
        try:
            db.query(AIUsageLog).filter(AIUsageLog.username == username).delete()
            db.commit()
            set_security_log(db, f"ai_generate:{username}", 0)
            response = client.post("/api/ai/generate", json={"prompt": "hello"})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json().get("text"), "ok from 3.5")
            mock_post.assert_called_once()
            called_models = [
                (call.kwargs.get("model") or (call.args[0] if call.args else None))
                for call in models_mock.generate_content.call_args_list
            ]
            self.assertEqual(called_models, ["gemini-3.5-flash-lite"])
            log = (
                db.query(AIUsageLog)
                .filter(AIUsageLog.username == username, AIUsageLog.status == "ok")
                .order_by(AIUsageLog.id.desc())
                .first()
            )
            self.assertEqual(log.provider_used, "gemini_35")
        finally:
            db.query(AIUsageLog).filter(AIUsageLog.username == username).delete()
            db.commit()
            db.close()
            if original_gemini is None:
                os.environ.pop("GEMINI_API_KEY", None)
            else:
                os.environ["GEMINI_API_KEY"] = original_gemini
            if original_groq is None:
                os.environ.pop("GROQ_API_KEY", None)
            else:
                os.environ["GROQ_API_KEY"] = original_groq


if __name__ == "__main__":
    unittest.main()
