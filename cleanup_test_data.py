#!/usr/bin/env python
"""
Script to clean up test characters from the production database.

This script:
1. Connects to the production SQLite database
2. Identifies and lists all test characters
3. Deletes test characters and their associated data
4. Cleans up associated files (avatars, books, ChromaDB)

Usage:
    python cleanup_test_data.py
"""

import sys
import os
import shutil
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from storage.database import CharacterDB, BookDB, MessageDB


def cleanup_test_characters(dry_run: bool = False):
    """
    Delete all test characters from the database.

    Args:
        dry_run: If True, only print what would be deleted without actually deleting
    """
    # Connect to production database
    db_path = "backend/data/chat_to.db"
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    engine = create_engine(f'sqlite:///{db_path}')
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Get all characters
        all_characters = session.query(CharacterDB).all()

        print(f"Total characters in database: {len(all_characters)}\n")

        if len(all_characters) == 0:
            print("No characters found in database.")
            return

        # List all characters
        print("Characters in database:")
        print("-" * 80)
        for i, char in enumerate(all_characters, 1):
            books_count = session.query(BookDB).filter_by(character_id=char.id).count()
            messages_count = session.query(MessageDB).filter_by(character_id=char.id).count()
            print(f"{i}. {char.name}")
            print(f"   ID: {char.id}")
            print(f"   Books: {books_count}, Messages: {messages_count}")
            print(f"   Created: {char.created_at}")

        print("\n" + "=" * 80)

        if dry_run:
            print("\nDRY RUN MODE - No data will be deleted")
            print(f"\nWould delete {len(all_characters)} characters")
            return

        # Ask for confirmation
        response = input(f"\nDelete ALL {len(all_characters)} characters? (yes/no): ")
        if response.lower() != 'yes':
            print("Cancelled.")
            return

        # Delete all characters and their data
        deleted_count = 0
        for char in all_characters:
            char_id = char.id
            char_name = char.name

            # Delete books
            books = session.query(BookDB).filter_by(character_id=char_id).all()
            for book in books:
                session.delete(book)

            # Delete messages
            messages = session.query(MessageDB).filter_by(character_id=char_id).all()
            for msg in messages:
                session.delete(msg)

            # Delete character
            session.delete(char)

            # Delete character files
            _cleanup_character_files(char_id)

            deleted_count += 1
            print(f"Deleted: {char_name} (ID: {char_id})")

        # Commit transaction
        session.commit()

        print(f"\n{deleted_count} characters deleted successfully.")

        # Verify deletion
        remaining = session.query(CharacterDB).count()
        print(f"Remaining characters: {remaining}")

    except Exception as e:
        print(f"Error during cleanup: {e}")
        session.rollback()
    finally:
        session.close()


def _cleanup_character_files(character_id: str):
    """
    Clean up files associated with a character.

    Args:
        character_id: ID of character to clean up
    """
    # Clean up avatars
    avatars_dir = Path("backend/data/avatars") / character_id
    if avatars_dir.exists():
        try:
            shutil.rmtree(avatars_dir)
            print(f"  - Deleted avatars directory: {avatars_dir}")
        except Exception as e:
            print(f"  - Warning: Failed to delete avatars: {e}")

    # Clean up books
    books_dir = Path("backend/data/books") / character_id
    if books_dir.exists():
        try:
            shutil.rmtree(books_dir)
            print(f"  - Deleted books directory: {books_dir}")
        except Exception as e:
            print(f"  - Warning: Failed to delete books: {e}")

    # Clean up ChromaDB
    chroma_dir = Path("backend/chroma") / character_id
    if chroma_dir.exists():
        try:
            shutil.rmtree(chroma_dir)
            print(f"  - Deleted ChromaDB directory: {chroma_dir}")
        except Exception as e:
            print(f"  - Warning: Failed to delete ChromaDB: {e}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Clean up test characters from production database"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be deleted without actually deleting"
    )

    args = parser.parse_args()

    cleanup_test_characters(dry_run=args.dry_run)
