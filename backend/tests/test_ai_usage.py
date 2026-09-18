import os
import sys
import unittest
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from backend_api import app, get_current_user
from database import SessionLocal, AIUsageLog, AIUserDailyUsage, set_security_log
from ai_usage import DEFAULT_DAILY_LIMIT, MAX_DAILY_LIMIT
from services.ai.cost import estimate_groq_cost
from services.ai.providers.base import ProviderResult
from services.ai.router import engines_for_task
from services.ai.types import normalize_task_type

client = TestClient(app)


def _clear_user_ai(db, username):
    db.rollback()
    db.query(AIUsageLog).filter(AIUsageLog.username == username).delete()
    db.query(AIUserDailyUsage).filter(AIUserDailyUsage.username == username).delete()
    db.commit()
    set_security_log(db, f"ai_generate:{username}", 0)
    set_security_log(db, f"ai_burst:{username}", [])


class AIUsageTests(unittest.TestCase):
    def tearDown(self):
        app.dependency_overrides.clear()

    def test_routing_is_deterministic_by_task_type(self):
        self.assertEqual(normalize_task_type("summarize"), "SUMMARIZE_TASK")
        light = engines_for_task("SIMPLE_QA")
        complex_chain = engines_for_task("PROJECT_ANALYSIS")
        self.assertEqual(light[0].startswith("gemini"), True)
        self.assertEqual(complex_chain[0], "groq")
        self.assertIn("groq", light)
        self.assertIn("gemini_31", complex_chain)

    def test_groq_cost_uses_token_formula(self):
        cost = estimate_groq_cost(
            input_tokens=1_000_000,
            output_tokens=1_000_000,
            cached_input_tokens=0,
        )
        self.assertAlmostEqual(cost, 0.75, places=6)
        cached = estimate_groq_cost(
            input_tokens=1_000_000,
            output_tokens=0,
            cached_input_tokens=1_000_000,
        )
        self.assertAlmostEqual(cached, 0.075, places=6)

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
        self.assertIn("capacity", data)
        self.assertIn("groq_budget", data)
        self.assertIn("provider_distribution", data)
        self.assertEqual(data["max_daily_limit"], 20)
        self.assertIn("gemini_35", data["engines"])
        self.assertIn("gemini_31", data["engines"])
        self.assertIn("groq", data["engines"])
        too_high = client.put("/api/admin/ai/limits", json={"default_daily_limit": 21})
        self.assertEqual(too_high.status_code, 400)
        put_response = client.put("/api/admin/ai/limits", json={"default_daily_limit": 15})
        self.assertEqual(put_response.status_code, 200)
        self.assertEqual(put_response.json()["default_daily_limit"], 15)
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
            self.assertEqual(capacity["lightweight_order"][0].startswith("gemini"), True)
            self.assertEqual(capacity["complex_order"][0], "groq")
            self.assertEqual(capacity["rpd_total"], 2000)
            budget = free_response.json()["groq_budget"]
            self.assertEqual(budget["monthly_budget_usd"], 30)
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
                    "default_daily_limit": 15,
                    "engine_plans": {
                        "gemini_35": "free",
                        "gemini_31": "free",
                        "groq": "developer",
                    },
                },
            )

    def test_ai_daily_limit_blocks_after_default_quota(self):
        username = "ai_quota_test_user"
        app.dependency_overrides[get_current_user] = lambda: username
        db = SessionLocal()
        try:
            from ai_usage import set_default_daily_limit, wib_today_date_str, _daily_row

            db.rollback()
            set_default_daily_limit(db, 15)
            _clear_user_ai(db, username)
            row = _daily_row(db, username, wib_today_date_str())
            row.prompt_count = DEFAULT_DAILY_LIMIT
            for _ in range(DEFAULT_DAILY_LIMIT):
                db.add(
                    AIUsageLog(
                        username=username,
                        success=1,
                        status="ok",
                        provider_used="gemini_31",
                        counts_as_prompt=1,
                    )
                )
            db.commit()

            response = client.post(
                "/api/ai/generate", json={"prompt": "hello", "language": "id"}
            )
            self.assertEqual(response.status_code, 429)
            detail = str(response.json().get("detail", ""))
            self.assertNotIn("Gemini", detail)
            self.assertNotIn("Groq", detail)
            self.assertNotIn("GPT-OSS", detail)
            self.assertIn("Batas AI harian tercapai", detail)
        finally:
            _clear_user_ai(db, username)
            db.close()

    def test_ai_usage_endpoint_hides_providers(self):
        username = "ai_usage_endpoint_user"
        app.dependency_overrides[get_current_user] = lambda: username
        db = SessionLocal()
        try:
            from ai_usage import set_default_daily_limit

            set_default_daily_limit(db, 15)
            _clear_user_ai(db, username)
            response = client.get("/api/ai/usage")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["used"], 0)
            self.assertEqual(data["limit"], DEFAULT_DAILY_LIMIT)
            self.assertEqual(data["remaining"], DEFAULT_DAILY_LIMIT)
            self.assertNotIn("groq", str(data).lower())
            self.assertNotIn("gemini", str(data).lower())
        finally:
            _clear_user_ai(db, username)
            db.close()

    def test_ai_generate_hides_vendor_names_when_unconfigured(self):
        username = "ai_unconfigured_test_user"
        app.dependency_overrides[get_current_user] = lambda: username
        original_gemini = os.environ.pop("GEMINI_API_KEY", None)
        original_groq = os.environ.pop("GROQ_API_KEY", None)
        db = SessionLocal()
        try:
            _clear_user_ai(db, username)
            response = client.post(
                "/api/ai/generate", json={"prompt": "hello", "provider": "gemini"}
            )
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
            _clear_user_ai(db, username)
            db.close()

    @patch("services.ai.service.call_groq")
    @patch("services.ai.service.call_gemini")
    def test_simple_qa_uses_gemini_not_groq(self, mock_gemini, mock_groq):
        username = "ai_simple_qa_user"
        app.dependency_overrides[get_current_user] = lambda: username
        os.environ["GEMINI_API_KEY"] = "test-gemini-key"
        os.environ["GROQ_API_KEY"] = "test-groq-key"
        mock_gemini.return_value = ProviderResult(
            text="ok from gemini",
            engine="gemini_31",
            model="gemini-3.1-flash-lite",
            input_tokens=12,
            output_tokens=8,
        )
        db = SessionLocal()
        try:
            _clear_user_ai(db, username)
            response = client.post(
                "/api/ai/generate",
                json={"prompt": "hello", "task_type": "SIMPLE_QA", "language": "en"},
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json().get("text"), "ok from gemini")
            self.assertEqual(response.json().get("provider"), "Smart Assistant")
            mock_groq.assert_not_called()
            mock_gemini.assert_called()
            log = (
                db.query(AIUsageLog)
                .filter(AIUsageLog.username == username, AIUsageLog.status == "ok")
                .order_by(AIUsageLog.id.desc())
                .first()
            )
            self.assertEqual(log.provider_used, "gemini_31")
            self.assertEqual(log.counts_as_prompt, 1)
            self.assertEqual(response.json()["usage"]["used"], 1)
        finally:
            _clear_user_ai(db, username)
            db.close()

    @patch("services.ai.service.call_groq")
    @patch("services.ai.service.call_gemini")
    def test_project_analysis_uses_groq(self, mock_gemini, mock_groq):
        username = "ai_project_analysis_user"
        app.dependency_overrides[get_current_user] = lambda: username
        os.environ["GEMINI_API_KEY"] = "test-gemini-key"
        os.environ["GROQ_API_KEY"] = "test-groq-key"
        mock_groq.return_value = ProviderResult(
            text="deep analysis",
            engine="groq",
            model="openai/gpt-oss-120b",
            input_tokens=100,
            output_tokens=40,
            cached_input_tokens=10,
            estimated_cost=estimate_groq_cost(100, 40, 10),
        )
        db = SessionLocal()
        try:
            _clear_user_ai(db, username)
            response = client.post(
                "/api/ai/generate",
                json={
                    "prompt": "Analyze this project",
                    "task_type": "PROJECT_ANALYSIS",
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json().get("text"), "deep analysis")
            mock_groq.assert_called_once()
            mock_gemini.assert_not_called()
            log = (
                db.query(AIUsageLog)
                .filter(AIUsageLog.username == username, AIUsageLog.status == "ok")
                .order_by(AIUsageLog.id.desc())
                .first()
            )
            self.assertEqual(log.provider_used, "groq")
            self.assertGreater(log.estimated_cost, 0)
            self.assertEqual(log.input_tokens, 100)
            self.assertEqual(log.cached_input_tokens, 10)
        finally:
            _clear_user_ai(db, username)
            db.close()

    @patch("services.ai.service.call_groq")
    @patch("services.ai.service.call_gemini")
    def test_fallback_does_not_double_count_prompt(self, mock_gemini, mock_groq):
        username = "ai_fallback_count_user"
        app.dependency_overrides[get_current_user] = lambda: username
        os.environ["GEMINI_API_KEY"] = "test-gemini-key"
        os.environ["GROQ_API_KEY"] = "test-groq-key"

        from services.ai.errors import ProviderError

        def gemini_side_effect(engine, prompt):
            raise ProviderError("rate_limit", "429")

        mock_gemini.side_effect = gemini_side_effect
        mock_groq.return_value = ProviderResult(
            text="fallback groq",
            engine="groq",
            model="openai/gpt-oss-120b",
            input_tokens=20,
            output_tokens=10,
            estimated_cost=0.0001,
        )
        db = SessionLocal()
        try:
            _clear_user_ai(db, username)
            response = client.post(
                "/api/ai/generate",
                json={"prompt": "rewrite this", "task_type": "REWRITE"},
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json().get("text"), "fallback groq")
            ok_logs = (
                db.query(AIUsageLog)
                .filter(
                    AIUsageLog.username == username,
                    AIUsageLog.counts_as_prompt == 1,
                    AIUsageLog.status == "ok",
                )
                .all()
            )
            self.assertEqual(len(ok_logs), 1)
            self.assertEqual(response.json()["usage"]["used"], 1)
        finally:
            _clear_user_ai(db, username)
            db.close()

    @patch("services.ai.service.call_groq")
    @patch("services.ai.service.call_gemini")
    def test_idempotency_key_does_not_double_count(self, mock_gemini, mock_groq):
        username = "ai_idem_user"
        app.dependency_overrides[get_current_user] = lambda: username
        os.environ["GEMINI_API_KEY"] = "test-gemini-key"
        os.environ["GROQ_API_KEY"] = "test-groq-key"
        mock_gemini.return_value = ProviderResult(
            text="same answer",
            engine="gemini_31",
            model="gemini-3.1-flash-lite",
        )
        db = SessionLocal()
        try:
            _clear_user_ai(db, username)
            unique_key = f"idem-{username}-{os.getpid()}-{id(self)}"
            headers = {"X-Idempotency-Key": unique_key}
            first = client.post(
                "/api/ai/generate",
                json={"prompt": "hello", "task_type": "SIMPLE_QA"},
                headers=headers,
            )
            second = client.post(
                "/api/ai/generate",
                json={"prompt": "hello", "task_type": "SIMPLE_QA"},
                headers=headers,
            )
            self.assertEqual(first.status_code, 200)
            self.assertEqual(second.status_code, 200)
            self.assertEqual(second.json().get("text"), "same answer")
            self.assertEqual(mock_gemini.call_count, 1)
            self.assertEqual(first.json()["usage"]["used"], 1)
            self.assertEqual(second.json()["usage"]["used"], 1)
        finally:
            _clear_user_ai(db, username)
            db.close()

    def test_max_daily_limit_constant(self):
        self.assertEqual(MAX_DAILY_LIMIT, 20)
        self.assertEqual(DEFAULT_DAILY_LIMIT, 15)


if __name__ == "__main__":
    unittest.main()
