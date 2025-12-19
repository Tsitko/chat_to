# Test Infrastructure Improvements

This document describes the test infrastructure improvements implemented to ensure proper test isolation and prevent test data pollution of the production database.

## Problem Statement

Prior to these improvements:
- Tests were creating characters in the production database (`backend/data/chat_to.db`)
- 92 test characters accumulated in the production database
- No clear separation between test and production data
- Tests could potentially interfere with production data

## Solution Overview

The test infrastructure has been improved with:

1. **Centralized Test Configuration** - New configuration module for test-specific paths
2. **Test Database Isolation** - All tests now use temporary, isolated databases
3. **Automatic Cleanup** - Test data is automatically cleaned up after each test
4. **Production Database Protection** - Production database is never touched by tests

## Implementation Details

### 1. Test Configuration Module

**File:** `/backend/configs/test_config.py`

This module provides centralized configuration for all test environments:

```python
TEST_DATA_DIR      # Root directory for test data (uses temp directory by default)
TEST_DB_PATH       # Path to test SQLite database
TEST_CHROMA_DIR    # Path to test ChromaDB directory
TEST_SERVER_PORT   # Port for test server (1311)
TEST_BASE_URL      # Base URL for test server
```

**Key Features:**
- Uses system temp directory by default (`/tmp/chat_to_test_data`)
- Environment variables can override defaults for CI/CD
- Helper functions to create and clean up test directories
- No hardcoded paths that could affect production

**Environment Variables:**
- `TEST_ROOT_DIR` - Override test root directory
- `TEST_DATA_DIR` - Override test data directory
- `TEST_DB_PATH` - Override test database path
- `TEST_CHROMA_DIR` - Override ChromaDB directory
- `TEST_SERVER_PORT` - Override test server port

### 2. Test Fixtures (conftest.py)

**File:** `/tests/conftest.py`

Updated fixtures to ensure test isolation:

#### `sync_test_db` Fixture
- Creates isolated SQLite database in temporary directory
- Initializes database schema
- Sets as global database instance for test duration
- Disposes engine and resets global state after test
- Prevents test pollution between test runs

#### `test_client` Fixture
- Creates FastAPI TestClient with test database
- Sets environment variables to point to test directories:
  - `DATA_DIR` - Points to temp data directory
  - `CHROMA_DIR` - Points to temp ChromaDB directory
- Overrides all database dependencies to use sync test database
- Restores original environment after test
- Ensures complete isolation from production

#### `temp_data_dir` Fixture
- Creates temporary directory with proper structure:
  - `data/characters/` - Character metadata
  - `data/books/` - Uploaded book files
  - `data/avatars/` - Avatar images
  - `chroma/` - ChromaDB vector databases
- Automatically cleaned up after test
- Each test gets fresh temporary directory

### 3. Real Integration Tests

**Files:** `/tests/real_integration/conftest.py` and `/tests/real_integration/helpers.py`

Updated to use centralized test configuration:

- Imports test configuration from `configs.test_config`
- Uses configured test paths for all operations
- Test server runs with test environment variables
- All file operations isolated to test directories

### 4. Cleanup Script

**File:** `/cleanup_test_data.py`

Utility script to clean production database:

```bash
# Dry run (show what would be deleted)
python cleanup_test_data.py --dry-run

# Actually delete all characters
python cleanup_test_data.py
```

**Features:**
- Lists all characters with stats (books, messages)
- Requires confirmation before deletion
- Deletes characters, books, messages
- Cleans up associated files (avatars, books, ChromaDB)
- Provides detailed progress output

## Usage

### Running Tests

Tests automatically use isolated test databases:

```bash
# Run all E2E tests (uses temp database)
pytest tests/e2e/

# Run integration tests (uses temp database)
pytest tests/integration/

# Run real integration tests (uses temp database and real server)
pytest tests/real_integration/

# Run unit tests (uses mocks, no database)
pytest tests/unit/
```

### Verifying Test Isolation

After running tests, verify production database is clean:

```bash
python -c "
import sys
sys.path.insert(0, 'backend')
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from storage.database import CharacterDB

engine = create_engine('sqlite:///backend/data/chat_to.db')
Session = sessionmaker(bind=engine)
session = Session()
print(f'Characters: {session.query(CharacterDB).count()}')
"
```

Should output: `Characters: 0`

### Cleaning Production Database

If test data somehow gets into production database:

```bash
# Review what will be deleted
python cleanup_test_data.py --dry-run

# Delete all test characters
python cleanup_test_data.py
```

## Test Data Locations

### Production Data (NEVER touched by tests)
```
backend/data/
├── chat_to.db          # Production SQLite database
├── characters/         # Production character metadata
├── books/              # Production book files
└── avatars/            # Production avatar images

backend/chroma/         # Production ChromaDB
```

### Test Data (Automatically created and cleaned up)
```
/tmp/chat_to_test_data/      # Or $TEST_DATA_DIR
├── test_chat_to.db          # Test SQLite database
├── data/
│   ├── characters/          # Test character metadata
│   ├── books/               # Test book files
│   └── avatars/             # Test avatar images
└── chroma/                  # Test ChromaDB
```

### Temporary Test Data (Per-test isolation)
```
/tmp/tmpXXXXXX/             # Unique per test
├── test.db                 # Isolated test database
├── data/
│   ├── characters/
│   ├── books/
│   ├── avatars/
│   └── chroma/
```

## Benefits

### Before Improvements
- 92 test characters in production database
- No clear separation of test and production data
- Risk of accidentally modifying production data
- Manual cleanup required

### After Improvements
- 0 characters in production database
- Complete test/production isolation
- Automatic cleanup after each test
- Tests can run in parallel without interference
- CI/CD friendly (uses temp directories)
- Environment variable overrides for flexibility

## Best Practices

### For Test Developers

1. **Use Fixtures**: Always use the provided fixtures (`test_client`, `sync_test_db`, `temp_data_dir`)
2. **No Hardcoded Paths**: Never hardcode database or file paths in tests
3. **Import Test Config**: Use `configs.test_config` for test-specific paths
4. **Check Production**: After running tests locally, verify production DB is clean

### For CI/CD

Set environment variables to control test locations:

```bash
# Example GitHub Actions configuration
TEST_ROOT_DIR=/tmp/ci_tests
TEST_DATA_DIR=/tmp/ci_tests/data
pytest tests/
```

### For Debugging

If tests fail, test data is preserved in temp directory for inspection:

```bash
# Find test data
ls -la /tmp/chat_to_test_data/

# Inspect test database
sqlite3 /tmp/chat_to_test_data/test_chat_to.db ".tables"
```

## Troubleshooting

### Production Database Has Test Data

Run cleanup script:
```bash
python cleanup_test_data.py
```

### Tests Failing After Infrastructure Changes

1. Clear pytest cache: `pytest --cache-clear`
2. Remove all test data: `rm -rf /tmp/chat_to_test_data`
3. Verify conftest.py imports work
4. Check environment variables are set correctly

### Permission Errors

Ensure temp directory is writable:
```bash
chmod -R 755 /tmp/chat_to_test_data
```

## Future Improvements

Potential enhancements:

1. **Pytest Plugin**: Create custom pytest plugin for automatic setup/teardown
2. **Test Data Fixtures**: Pre-populated test databases for common scenarios
3. **Performance**: Use in-memory SQLite for faster unit tests
4. **Parallel Execution**: Configure pytest-xdist for parallel test execution
5. **Test Reporting**: Generate coverage reports with database access patterns

## Related Files

- `/backend/configs/test_config.py` - Test configuration module
- `/tests/conftest.py` - Main test fixtures
- `/tests/real_integration/conftest.py` - Real integration test fixtures
- `/tests/real_integration/helpers.py` - Integration test helpers
- `/cleanup_test_data.py` - Production database cleanup script
- `/backend/storage/database.py` - Database connection manager (supports test mode)

## Migration Guide

For existing tests that need updating:

1. Remove any hardcoded database paths
2. Use `test_client` fixture instead of creating own client
3. Import paths from `configs.test_config` if needed
4. Remove manual cleanup code (fixtures handle it)

Example:

```python
# Before
def test_something():
    # Manually create database connection
    engine = create_engine('sqlite:///backend/data/chat_to.db')
    # ... test code ...
    # Manual cleanup

# After
def test_something(test_client):
    # Use fixture - automatic setup and cleanup
    response = test_client.post("/api/characters", ...)
    # ... test code ...
    # Automatic cleanup
```
