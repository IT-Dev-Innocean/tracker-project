import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)

with engine.connect() as conn:
    res = conn.execute(text("SELECT timestamp, deadline, completed_time, start_date FROM requests LIMIT 10"))
    for row in res:
        print(row)
