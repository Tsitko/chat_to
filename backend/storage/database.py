"""
Database setup and SQLAlchemy models.

This module provides database initialization and ORM models.
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from pathlib import Path

from configs import DATA_DIR

Base = declarative_base()


class CharacterDB(Base):
    """SQLAlchemy model for Character table."""

    __tablename__ = 'characters'

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    books = relationship("BookDB", back_populates="character", cascade="all, delete-orphan")
    messages = relationship("MessageDB", back_populates="character", cascade="all, delete-orphan")


class BookDB(Base):
    """SQLAlchemy model for Book table."""

    __tablename__ = 'books'

    id = Column(String, primary_key=True)
    character_id = Column(String, ForeignKey('characters.id'), nullable=False)
    filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    indexed = Column(Boolean, default=False)

    # Relationship
    character = relationship("CharacterDB", back_populates="books")


class MessageDB(Base):
    """SQLAlchemy model for Message table."""

    __tablename__ = 'messages'

    id = Column(String, primary_key=True)
    character_id = Column(String, ForeignKey('characters.id'), nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    character = relationship("CharacterDB", back_populates="messages")


class Database:
    """Database connection manager."""

    def __init__(self, db_path: str = None, use_sync: bool = False):
        """
        Initialize database connection.

        Args:
            db_path: Path to SQLite database file. If None, uses default path.
            use_sync: If True, use synchronous SQLite instead of async (for tests)
        """
        if db_path is None:
            data_dir = Path(DATA_DIR)
            data_dir.mkdir(parents=True, exist_ok=True)
            db_path = str(data_dir / "chat_to.db")

        self.db_path = db_path
        self.db_url = f"sqlite+aiosqlite:///{db_path}"
        self.sync_db_url = f"sqlite:///{db_path}"
        self.use_sync = use_sync
        self.engine = None
        self.SessionLocal = None

    def init_db(self):
        """Initialize database and create tables."""
        # Use sync engine for table creation
        from sqlalchemy import create_engine
        print(f"[DB INIT] Database path: {self.db_path}")
        print(f"[DB INIT] Sync DB URL: {self.sync_db_url}")
        sync_engine = create_engine(self.sync_db_url)
        Base.metadata.create_all(bind=sync_engine)
        sync_engine.dispose()

    def get_session_factory(self):
        """Get sessionmaker for creating database sessions."""
        if self.use_sync:
            # Return sync sessionmaker for tests
            from sqlalchemy import create_engine
            from sqlalchemy.orm import sessionmaker

            if self.SessionLocal is None:
                print(f"[DB SESSION] Creating sync engine with URL: {self.sync_db_url}")
                self.engine = create_engine(
                    self.sync_db_url,
                    echo=False,
                    connect_args={"check_same_thread": False}
                )
                self.SessionLocal = sessionmaker(
                    bind=self.engine,
                    expire_on_commit=False
                )

            return self.SessionLocal
        else:
            # Return async sessionmaker for production
            from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
            from sqlalchemy.orm import sessionmaker

            if self.SessionLocal is None:
                self.engine = create_async_engine(
                    self.db_url,
                    echo=False,
                    connect_args={"check_same_thread": False}
                )
                self.SessionLocal = sessionmaker(
                    bind=self.engine,
                    class_=AsyncSession,
                    expire_on_commit=False
                )

            return self.SessionLocal


# Global database instance (use sync mode for production)
_database = None


def get_database() -> Database:
    """Get the global database instance."""
    global _database
    if _database is None:
        _database = Database(use_sync=True)
    return _database


def set_test_database(db: Database):
    """
    Set a test database instance (for testing only).

    Args:
        db: Test database instance to use
    """
    global _database
    _database = db


def init_database():
    """Initialize the database (create tables if they don't exist)."""
    db = get_database()
    db.init_db()
