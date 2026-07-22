import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)

with engine.connect() as conn:
    for col in ["timestamp", "deadline", "completed_time", "start_date"]:
        res = conn.execute(text(f"SELECT COUNT(*) FROM requests WHERE {col} = ''"))
        print(f"Empty strings in {col}: {res.scalar()}")
