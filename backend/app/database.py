from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import os
from dotenv import load_dotenv

load_dotenv()  # .env fájl betöltése

DATABASE_URL = os.getenv("DATABASE_URL")
print("Using database URL:", DATABASE_URL)

# SQL Server engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite specifikus, multithread miatt kell
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

