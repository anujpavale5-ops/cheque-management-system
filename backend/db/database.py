from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# We will temporarily use SQLite to bypass the PostgreSQL password issues.
# Once you have the exact Postgres credentials, you can change this back in .env!
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./chequedb.db")

# SQLite requires check_same_thread=False for FastAPI
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
