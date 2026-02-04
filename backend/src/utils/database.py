from sqlmodel import create_engine, Session
from sqlalchemy import engine
from typing import Generator
import os

# Get database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://username:password@localhost:5432/chat_todo_db")

# Create the database engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=300,    # Recycle connections every 5 minutes
    echo=False           # Set to True for SQL query logging during development
)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def create_tables():
    """Create all tables in the database"""
    from ..models.user import User
    from ..models.task import Task
    from ..models.conversation import Conversation
    from ..models.message import Message

    from sqlmodel import SQLModel
    SQLModel.metadata.create_all(engine)