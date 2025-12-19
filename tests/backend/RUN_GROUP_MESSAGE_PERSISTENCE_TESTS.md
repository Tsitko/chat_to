# How to Run Group Message Persistence Tests

This document provides instructions for running the comprehensive test suite for the Persistent Group Message Storage feature.

## Test File Locations

All test files are located in `/home/denis/Projects/chat_to/tests/backend/`:

```
tests/backend/
├── storage/
│   └── test_group_message_repository.py          # Unit tests for GroupMessageRepository (47 tests)
├── api/
│   └── test_group_message_routes.py              # Unit tests for API endpoints (25 tests)
├── chat_handler/
│   └── test_group_chat_service_persistence.py    # Integration tests for service (16 tests)
├── integration/
│   └── test_group_message_persistence_e2e.py     # E2E tests (14 tests)
├── GROUP_MESSAGE_PERSISTENCE_TEST_SUMMARY.md     # Comprehensive test documentation
└── RUN_GROUP_MESSAGE_PERSISTENCE_TESTS.md        # This file
```

## Prerequisites

### 1. Activate Virtual Environment

```bash
cd /home/denis/Projects/chat_to
source venv/bin/activate
```

### 2. Install Dependencies

Ensure all testing dependencies are installed:

```bash
pip install pytest pytest-asyncio sqlalchemy aiosqlite pydantic
```

### 3. Set Python Path

```bash
export PYTHONPATH=/home/denis/Projects/chat_to/backend:$PYTHONPATH
```

## Running All Tests

### Run Complete Test Suite (All 103 tests)

```bash
cd /home/denis/Projects/chat_to
pytest tests/backend/storage/test_group_message_repository.py \
       tests/backend/api/test_group_message_routes.py \
       tests/backend/chat_handler/test_group_chat_service_persistence.py \
       tests/backend/integration/test_group_message_persistence_e2e.py \
       -v
```

### Run with Coverage

```bash
pytest tests/backend/storage/test_group_message_repository.py \
       tests/backend/api/test_group_message_routes.py \
       tests/backend/chat_handler/test_group_chat_service_persistence.py \
       tests/backend/integration/test_group_message_persistence_e2e.py \
       --cov=backend/storage/group_message_repository \
       --cov=backend/api/group_routes \
       --cov=backend/api/group_message_routes \
       --cov=backend/chat_handler/group_chat_service \
       --cov-report=html \
       --cov-report=term
```

## Running Tests by File

### 1. GroupMessageRepository Unit Tests (47 tests)

```bash
pytest tests/backend/storage/test_group_message_repository.py -v
```

**What it tests:**
- Repository initialization
- create_message (user and assistant)
- get_messages_by_group (with pagination)
- get_recent_messages_by_group
- count_messages_by_group
- delete_messages_by_group
- Edge cases and error handling

### 2. API Routes Unit Tests (25 tests)

```bash
pytest tests/backend/api/test_group_message_routes.py -v
```

**What it tests:**
- GET /api/groups/{id}/messages
- POST /api/groups/messages
- Request validation
- Response formatting
- Error handling (404, 400)

### 3. GroupChatService Integration Tests (16 tests)

```bash
pytest tests/backend/chat_handler/test_group_chat_service_persistence.py -v
```

**What it tests:**
- Service initialization with repository
- _save_user_message_to_group
- _save_character_message_to_group
- process_group_message with persistence
- Error handling and resilience

### 4. E2E Tests (14 tests)

```bash
pytest tests/backend/integration/test_group_message_persistence_e2e.py -v
```

**What it tests:**
- Complete create → send → retrieve flow
- Multi-turn conversations
- Pagination across pages
- Cascade deletion
- Multi-group isolation
- Edge cases with real database

## Running Tests by Marker

### Unit Tests Only

```bash
pytest -m unit \
       tests/backend/storage/test_group_message_repository.py \
       tests/backend/api/test_group_message_routes.py \
       tests/backend/chat_handler/test_group_chat_service_persistence.py \
       -v
```

### Integration Tests Only

```bash
pytest -m integration \
       tests/backend/chat_handler/test_group_chat_service_persistence.py \
       -v
```

### E2E Tests Only

```bash
pytest -m e2e \
       tests/backend/integration/test_group_message_persistence_e2e.py \
       -v
```

## Running Specific Test Classes

### Run a specific test class

```bash
# GroupMessageRepository tests
pytest tests/backend/storage/test_group_message_repository.py::TestCreateMessage -v

# API routes tests
pytest tests/backend/api/test_group_message_routes.py::TestGetGroupMessages -v

# Service tests
pytest tests/backend/chat_handler/test_group_chat_service_persistence.py::TestSaveUserMessageToGroup -v

# E2E tests
pytest tests/backend/integration/test_group_message_persistence_e2e.py::TestGroupMessagePersistenceE2E -v
```

## Running Specific Test Methods

### Run a single test

```bash
# Test create message
pytest tests/backend/storage/test_group_message_repository.py::TestCreateMessage::test_create_user_message_success -v

# Test GET endpoint
pytest tests/backend/api/test_group_message_routes.py::TestGetGroupMessages::test_get_group_messages_returns_empty_list_for_new_group -v

# Test service persistence
pytest tests/backend/chat_handler/test_group_chat_service_persistence.py::TestProcessGroupMessageWithPersistence::test_process_group_message_saves_user_message_before_processing -v

# Test E2E flow
pytest tests/backend/integration/test_group_message_persistence_e2e.py::TestGroupMessagePersistenceE2E::test_create_group_send_message_retrieve_messages -v
```

## Running Tests with Different Verbosity

### Minimal output (just pass/fail)

```bash
pytest tests/backend/storage/test_group_message_repository.py
```

### Verbose (show test names)

```bash
pytest tests/backend/storage/test_group_message_repository.py -v
```

### Very verbose (show test names and output)

```bash
pytest tests/backend/storage/test_group_message_repository.py -vv
```

### Show print statements

```bash
pytest tests/backend/storage/test_group_message_repository.py -s
```

## Running Tests with Filters

### Run tests matching a pattern

```bash
# All tests with "create" in the name
pytest tests/backend/storage/test_group_message_repository.py -k "create" -v

# All tests with "error" in the name
pytest tests/backend/storage/test_group_message_repository.py -k "error" -v

# All tests with "pagination" in the name
pytest tests/backend/api/test_group_message_routes.py -k "pagination" -v
```

### Run tests NOT matching a pattern

```bash
# All tests except edge cases
pytest tests/backend/storage/test_group_message_repository.py -k "not edge" -v
```

## Continuous Testing

### Watch mode (re-run on file changes)

```bash
# Install pytest-watch
pip install pytest-watch

# Run in watch mode
ptw tests/backend/storage/test_group_message_repository.py -- -v
```

### Run only failed tests from last run

```bash
pytest tests/backend/storage/test_group_message_repository.py --lf -v
```

### Run failed tests first, then others

```bash
pytest tests/backend/storage/test_group_message_repository.py --ff -v
```

## Parallel Execution

### Run tests in parallel (faster)

```bash
# Install pytest-xdist
pip install pytest-xdist

# Run with 4 workers
pytest tests/backend/storage/test_group_message_repository.py -n 4 -v
```

## Test Output Formats

### Generate HTML report

```bash
pytest tests/backend/storage/test_group_message_repository.py \
       --html=test_report.html \
       --self-contained-html
```

### Generate JUnit XML (for CI/CD)

```bash
pytest tests/backend/storage/test_group_message_repository.py \
       --junitxml=test_results.xml
```

### Generate JSON report

```bash
# Install pytest-json-report
pip install pytest-json-report

pytest tests/backend/storage/test_group_message_repository.py \
       --json-report \
       --json-report-file=test_results.json
```

## Debugging Tests

### Run with Python debugger (pdb)

```bash
pytest tests/backend/storage/test_group_message_repository.py --pdb
```

### Drop into debugger on failure

```bash
pytest tests/backend/storage/test_group_message_repository.py -x --pdb
```

### Show local variables on failure

```bash
pytest tests/backend/storage/test_group_message_repository.py -l
```

### Show full diff on assertion failures

```bash
pytest tests/backend/storage/test_group_message_repository.py -vv
```

## Expected Test Results

### When All Tests Pass

```
tests/backend/storage/test_group_message_repository.py ................ [ 45%]
tests/backend/api/test_group_message_routes.py ................ [ 70%]
tests/backend/chat_handler/test_group_chat_service_persistence.py .... [ 85%]
tests/backend/integration/test_group_message_persistence_e2e.py ...... [100%]

========================= 103 passed in X.XXs =========================
```

### Test Breakdown

- **Unit Tests**: 88 tests
  - GroupMessageRepository: 47 tests
  - API Routes: 25 tests
  - GroupChatService: 16 tests

- **Integration Tests**: 1 test
  - API integration flow: 1 test

- **E2E Tests**: 14 tests
  - Complete persistence flows: 11 tests
  - Edge cases: 3 tests

**Total**: 103 tests

## Common Issues and Solutions

### Issue: ModuleNotFoundError

**Solution**: Set PYTHONPATH
```bash
export PYTHONPATH=/home/denis/Projects/chat_to/backend:$PYTHONPATH
```

### Issue: Database locked

**Solution**: E2E tests use temp files that are cleaned up. If tests are interrupted, manually clean:
```bash
rm /tmp/*.db
```

### Issue: Async tests not running

**Solution**: Install pytest-asyncio
```bash
pip install pytest-asyncio
```

### Issue: Import errors

**Solution**: Ensure you're in the venv
```bash
source venv/bin/activate
which python  # Should point to venv/bin/python
```

## Test Development Workflow

### 1. Run tests before implementation

```bash
pytest tests/backend/storage/test_group_message_repository.py
# Should FAIL (no implementation yet)
```

### 2. Implement feature

```bash
# Implement backend/storage/group_message_repository.py
```

### 3. Run tests again

```bash
pytest tests/backend/storage/test_group_message_repository.py -v
# Should PASS
```

### 4. Iterate until all pass

```bash
# Fix failing tests one by one
pytest tests/backend/storage/test_group_message_repository.py --lf -v
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Group Message Persistence Tests
  run: |
    source venv/bin/activate
    export PYTHONPATH=/home/denis/Projects/chat_to/backend:$PYTHONPATH
    pytest tests/backend/storage/test_group_message_repository.py \
           tests/backend/api/test_group_message_routes.py \
           tests/backend/chat_handler/test_group_chat_service_persistence.py \
           tests/backend/integration/test_group_message_persistence_e2e.py \
           --cov=backend \
           --junitxml=test-results.xml \
           --cov-report=xml
```

## Quick Reference

### Most Common Commands

```bash
# Run all tests
pytest tests/backend/storage/test_group_message_repository.py \
       tests/backend/api/test_group_message_routes.py \
       tests/backend/chat_handler/test_group_chat_service_persistence.py \
       tests/backend/integration/test_group_message_persistence_e2e.py -v

# Run unit tests only
pytest tests/backend/storage/test_group_message_repository.py -v

# Run E2E tests only
pytest tests/backend/integration/test_group_message_persistence_e2e.py -v

# Run with coverage
pytest tests/backend/storage/test_group_message_repository.py --cov=backend/storage/group_message_repository --cov-report=term

# Run failed tests from last run
pytest --lf -v

# Run in parallel (4 workers)
pytest -n 4 -v
```

## Test Statistics

- **Total Tests**: 103
- **Estimated Run Time**: 5-10 seconds (unit tests), 15-30 seconds (E2E tests)
- **Lines of Test Code**: ~2,500+
- **Coverage Target**: >80% for all new code

## Next Steps After Tests Pass

1. ✅ All tests pass → Implementation is correct
2. ✅ Run coverage report → Verify >80% coverage
3. ✅ Run E2E tests → Verify complete flow
4. ✅ Code review → Check implementation quality
5. ✅ Integration testing → Test with frontend
6. ✅ Manual QA → Verify user experience

## Support

For questions or issues with tests:
1. Check test documentation in test file docstrings
2. Review `GROUP_MESSAGE_PERSISTENCE_TEST_SUMMARY.md`
3. Check `task.md` for architecture design
4. Review existing test patterns in other test files

---

**Happy Testing!**

These tests are your safety net. They ensure the Persistent Group Message Storage feature works correctly and will continue to work after refactoring.
