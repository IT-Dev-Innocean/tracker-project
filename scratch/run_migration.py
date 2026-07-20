import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)

migrations = [
    ("users", "created_at"),
    ("users", "deletion_date"),
    ("leave_days", "leave_date"),
    ("subtasks", "due_date"),
    ("requests", "timestamp"),
    ("requests", "deadline"),
    ("requests", "completed_time"),
    ("requests", "start_date"),
    ("boards", "created_at"),
    ("boards", "last_activity_date"),
    ("boards", "deletion_date"),
    ("comments", "timestamp"),
    ("notifications", "timestamp"),
    ("direct_messages", "timestamp"),
    ("leave_records", "leave_date"),
]

with engine.begin() as conn:
    for table, col in migrations:
        sql = f"""
        ALTER TABLE {table} 
        ALTER COLUMN {col} TYPE TIMESTAMP WITHOUT TIME ZONE 
        USING NULLIF({col}, '')::timestamp without time zone
        """
        print(f"Migrating {table}.{col}...")
        try:
            conn.execute(text(sql))
            print(f" -> Success")
        except Exception as e:
            print(f" -> FAILED: {e}")
