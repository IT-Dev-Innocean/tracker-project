import unittest

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, GroqTokenLedger, Team, TeamMembership, User
from dependencies import (
    can_manage_staff,
    effective_system_role,
    ensure_not_last_admin,
)
from services.groq_quota import current_period, quota_snapshot, require_groq_quota

def make_user(username, role="staff", allowance=100):
    return User(
        username=username,
        email=f"{username}@innocean.co.id",
        full_name=username,
        password="not-used",
        system_role=role,
        is_superadmin=1 if role == "admin" else 0,
        groq_monthly_token_allowance=allowance,
    )

class RoleAndGroqQuotaTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.db = sessionmaker(bind=self.engine)()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def test_legacy_superadmin_maps_to_admin(self):
        user = make_user("legacy", role="staff")
        user.is_superadmin = 1
        self.assertEqual(effective_system_role(user), "admin")

    def test_last_admin_cannot_be_removed(self):
        admin = make_user("only-admin", role="admin")
        self.db.add(admin)
        self.db.commit()
        with self.assertRaises(HTTPException) as raised:
            ensure_not_last_admin(self.db, admin)
        self.assertEqual(raised.exception.status_code, 409)

    def test_manager_can_manage_only_staff_in_managed_team(self):
        manager = make_user("manager", role="manager")
        staff = make_user("staff", role="staff")
        other_manager = make_user("other-manager", role="manager")
        team = Team(name="Creative")
        self.db.add_all([manager, staff, other_manager, team])
        self.db.flush()
        self.db.add_all(
            [
                TeamMembership(
                    team_id=team.id,
                    username=manager.username,
                    membership_role="manager",
                ),
                TeamMembership(
                    team_id=team.id,
                    username=staff.username,
                    membership_role="staff",
                ),
            ]
        )
        self.db.commit()
        self.assertTrue(can_manage_staff(self.db, manager, staff))
        self.assertFalse(can_manage_staff(self.db, manager, other_manager))

    def test_groq_quota_uses_calendar_month_ledger(self):
        user = make_user("quota-user", allowance=10)
        self.db.add(user)
        self.db.add(
            GroqTokenLedger(
                username=user.username,
                period=current_period(),
                prompt_tokens=4,
                completion_tokens=6,
                total_tokens=10,
                model="test",
                endpoint="test",
            )
        )
        self.db.commit()
        snapshot = quota_snapshot(self.db, user)
        self.assertEqual(snapshot["remaining"], 0)
        self.assertTrue(snapshot["exhausted"])
        with self.assertRaises(HTTPException) as raised:
            require_groq_quota(self.db, user.username)
        self.assertEqual(raised.exception.status_code, 429)
        self.assertEqual(raised.exception.detail["code"], "groq_quota_exhausted")


if __name__ == "__main__":
    unittest.main()
