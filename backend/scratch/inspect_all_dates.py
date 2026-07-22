import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect

load_dotenv()

db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)
inspector = inspect(engine)

for table in inspector.get_table_names():
    cols = inspector.get_columns(table)
    print(f"Table '{table}':")
    for col in cols:
        if "date" in col["name"].lower() or "time" in col["name"].lower():
            print(f" - {col['name']}: {col['type']}")
