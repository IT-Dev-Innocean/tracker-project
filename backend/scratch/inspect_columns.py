import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect

load_dotenv()

db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)
inspector = inspect(engine)

print("Tables:", inspector.get_table_names())

columns = inspector.get_columns("requests")
print("\nColumns in 'requests' table:")
for col in columns:
    print(f" - {col['name']}: {col['type']}")
