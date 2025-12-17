# Test Execution Guide

This guide provides step-by-step instructions for running the comprehensive TDD test suite.

## Prerequisites Checklist

Before running tests, ensure:

- [ ] Python 3.12+ installed
- [ ] Virtual environment activated: `source venv/bin/activate`
- [ ] Dependencies installed: `pip install -r backend/requirements.txt`
- [ ] Ollama installed and running: `ollama serve`
- [ ] Required models pulled:
  ```bash
  ollama pull qwen2.5:7b
  ollama pull qwen-embeddings-indexer
  ollama pull qwen-embeddings-kb
  ```

## Quick Start

```bash
# Navigate to project root
cd /home/denis/Projects/chat_to

# Activate virtual environment
source venv/bin/activate

# Run all tests
pytest tests/

# Run with coverage
pytest tests/ --cov=backend --cov-report=html
```

## Test Execution Strategy

### Phase 1: Fast Unit Tests (No External Dependencies)

Run unit tests first to quickly validate core logic:

```bash
# Run all unit tests
pytest tests/unit/ -m unit

# Run specific unit test files
pytest tests/unit/test_text_chunker.py -v
pytest tests/unit/test_embedding_generator.py -v
pytest tests/unit/test_knowledge_base_manager.py -v
```

**Expected duration**: 5-15 seconds
**Expected result**: All tests pass (75+ tests)

### Phase 2: Integration Tests (Requires Ollama)

Verify component interactions with real dependencies:

```bash
# Ensure Ollama is running
# Run integration tests
pytest tests/integration/ -m integration

# Or with more details
pytest tests/integration/test_chat_flow.py -v -s
```

**Expected duration**: 30-60 seconds
**Expected result**: All integration tests pass (10+ tests)

### Phase 3: End-to-End Tests (Full System)

Test complete user journeys with real data:

```bash
# Run all E2E tests (slow)
pytest tests/e2e/ -m e2e

# Run specific use case tests
pytest tests/e2e/test_use_cases.py::TestUC1CreateCharacter -v
pytest tests/e2e/test_use_cases.py::TestUC2ChatWithCharacter -v
pytest tests/e2e/test_use_cases.py::TestUC3EditCharacter -v
pytest tests/e2e/test_use_cases.py::TestUC4DeleteCharacter -v
pytest tests/e2e/test_use_cases.py::TestUC5DeleteBook -v
```

**Expected duration**: 5-10 minutes (includes async indexing waits)
**Expected result**: All E2E tests pass (13 tests covering 5 use cases)

### Phase 4: Full Test Suite

Run everything together:

```bash
# Full test suite with coverage
pytest tests/ --cov=backend --cov-report=html --cov-report=term

# Then view HTML coverage report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

**Expected duration**: 6-12 minutes
**Expected result**: 95+ tests pass, 80%+ coverage

## Test Execution Patterns

### Development Workflow

When developing a new feature:

```bash
# 1. Run relevant unit tests in watch mode (if pytest-watch installed)
ptw tests/unit/test_<your_module>.py

# 2. After changes, run unit tests
pytest tests/unit/test_<your_module>.py -v

# 3. Then run integration tests
pytest tests/integration/ -v

# 4. Finally run relevant E2E test
pytest tests/e2e/ -k "test_<your_feature>" -v
```

### Pre-Commit Workflow

Before committing code:

```bash
# 1. Run fast tests only
pytest tests/unit/ -m "not slow"

# 2. If all pass, run full suite
pytest tests/ --cov=backend --cov-report=term-missing

# 3. Check coverage is >= 80%
```

### CI/CD Pipeline Recommendation

```bash
# Stage 1: Lint and format (fast)
black backend/ --check
flake8 backend/
mypy backend/

# Stage 2: Unit tests (fast)
pytest tests/unit/ -m unit --cov=backend --cov-report=xml

# Stage 3: Integration tests (medium)
pytest tests/integration/ -m integration

# Stage 4: E2E tests (slow)
pytest tests/e2e/ -m e2e --timeout=600
```

## Troubleshooting Test Failures

### Ollama Connection Errors

```
Error: Connection refused to localhost:11434
```

**Solution**:
```bash
# Start Ollama
ollama serve

# Verify it's running
curl http://localhost:11434/api/version
```

### Model Not Found Errors

```
Error: Model 'qwen2.5:7b' not found
```

**Solution**:
```bash
# Pull all required models
ollama pull qwen2.5:7b
ollama pull qwen-embeddings-indexer
ollama pull qwen-embeddings-kb

# Verify models are available
ollama list
```

### E2E Test Timeouts

```
AssertionError: Book indexing did not complete within timeout
```

**Solutions**:
1. Increase timeout in test (edit test file)
2. Use smaller test files (only first few pages)
3. Ensure Ollama has sufficient resources (RAM, CPU)

### Import Errors

```
ImportError: No module named 'backend'
```

**Solution**:
```bash
# Ensure you're in project root
cd /home/denis/Projects/chat_to

# Check Python path
python -c "import sys; print('\n'.join(sys.path))"

# If needed, set PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:/home/denis/Projects/chat_to"
```

### ChromaDB Persistence Issues

```
Error: Collection 'test-char-001-books' already exists
```

**Solution**:
```bash
# Clean up test databases
rm -rf /tmp/pytest-*
rm -rf /tmp/tmp*

# Re-run tests
pytest tests/
```

### Test Data Not Found

```
FileNotFoundError: [Errno 2] No such file or directory: '.../Гегель/gegel-3.jpg'
```

**Solution**:
```bash
# Verify test data exists
ls -la Гегель/

# Should show:
# gegel-3.jpg
# Гегель Георг Вильгельм Фридрих. Лекции по истории философии. Книга вторая.txt
# Гегель Георг Вильгельм Фридрих. Лекции по истории философии. Книга первая.txt
# Гегель Георг Вильгельм Фридрих. Лекции по истории философии. Книга третья.txt
# Гегель Георг Вильгельм Фридрих. Учение о бытии.txt
```

## Selective Test Execution

### Run Only Fast Tests

```bash
pytest tests/ -m "not slow"
```

### Run Only Tests Requiring Ollama

```bash
pytest tests/ -m requires_ollama
```

### Run Tests Matching Pattern

```bash
# Run all tests with "character" in name
pytest tests/ -k character

# Run all tests with "create" or "delete"
pytest tests/ -k "create or delete"

# Run all tests except slow ones
pytest tests/ -k "not slow"
```

### Run Last Failed Tests

```bash
# Run tests that failed last time
pytest tests/ --lf

# Run failed tests first, then all others
pytest tests/ --ff
```

### Stop on First Failure

```bash
pytest tests/ -x
```

### Run Specific Number of Tests

```bash
# Run only first 10 tests
pytest tests/ --maxfail=10
```

## Parallel Test Execution

If `pytest-xdist` is installed:

```bash
# Run tests in parallel (auto-detect CPU cores)
pytest tests/ -n auto

# Run with 4 workers
pytest tests/ -n 4

# Parallel with coverage
pytest tests/ -n auto --cov=backend
```

**Note**: E2E tests may conflict when run in parallel if they share resources.

## Test Output Options

### Verbose Output

```bash
# More detailed test names
pytest tests/ -v

# Very verbose (show each assert)
pytest tests/ -vv
```

### Show Print Statements

```bash
# Capture disabled (show prints)
pytest tests/ -s
```

### Show Local Variables on Failure

```bash
pytest tests/ -l
```

### Short Traceback

```bash
pytest tests/ --tb=short
```

### Show All Test Results

```bash
# Show summary of all tests (not just failures)
pytest tests/ -ra
```

## Coverage Analysis

### Generate Coverage Report

```bash
# Terminal report
pytest tests/ --cov=backend --cov-report=term

# HTML report
pytest tests/ --cov=backend --cov-report=html
open htmlcov/index.html

# XML report (for CI/CD)
pytest tests/ --cov=backend --cov-report=xml

# Combined
pytest tests/ --cov=backend --cov-report=html --cov-report=term-missing
```

### Coverage Goals

- **Overall**: 80%+ coverage
- **Critical modules** (knowledge_base, embeddings): 90%+
- **Utility modules**: 85%+
- **API routes**: 75%+ (covered by E2E tests)

### Check Coverage Thresholds

```bash
# Fail if coverage < 80%
pytest tests/ --cov=backend --cov-fail-under=80
```

## Performance Profiling

### Time Test Execution

```bash
# Show slowest 10 tests
pytest tests/ --durations=10

# Show all test durations
pytest tests/ --durations=0
```

### Profile Test Code

If `pytest-profiling` is installed:

```bash
pytest tests/ --profile
```

## Test Reporting

### Generate JUnit XML Report

```bash
pytest tests/ --junit-xml=test-results.xml
```

### Generate HTML Report

If `pytest-html` is installed:

```bash
pytest tests/ --html=report.html --self-contained-html
```

## Debugging Tests

### Run with PDB on Failure

```bash
# Drop into debugger on failure
pytest tests/ --pdb

# Drop into debugger on first failure
pytest tests/ -x --pdb
```

### Run Specific Test with Debugging

```bash
# Run one test with max output
pytest tests/unit/test_text_chunker.py::TestTextChunker::test_chunk_text_creates_overlap -vv -s --pdb
```

### Examine Test Fixtures

```bash
# Show available fixtures
pytest --fixtures

# Show fixtures used by specific test
pytest tests/unit/test_text_chunker.py --fixtures-per-test
```

## Best Practices

### Daily Development

```bash
# Morning: Run fast tests
pytest tests/unit/ -m "not slow"

# Before lunch: Run all unit tests
pytest tests/unit/

# Before going home: Run full suite
pytest tests/ --cov=backend
```

### Before Creating PR

```bash
# 1. Lint
black backend/ --check
flake8 backend/

# 2. Full test suite with coverage
pytest tests/ --cov=backend --cov-report=term-missing --cov-fail-under=80

# 3. Check no TODOs in tests
grep -r "TODO" tests/

# 4. Verify E2E tests pass
pytest tests/e2e/ -v
```

### After Pulling Latest Code

```bash
# 1. Update dependencies
pip install -r backend/requirements.txt

# 2. Run smoke tests (fast)
pytest tests/unit/ -m unit

# 3. If passing, run full suite
pytest tests/
```

## Summary

For a typical development session:

```bash
# 1. Activate environment
cd /home/denis/Projects/chat_to
source venv/bin/activate

# 2. Quick smoke test
pytest tests/unit/ -m "not slow"

# 3. Work on feature...

# 4. Test your changes
pytest tests/unit/test_<your_module>.py -v

# 5. Before committing
pytest tests/ --cov=backend --cov-report=term

# 6. Commit if all pass with 80%+ coverage
```

## Getting Help

If tests are failing and you're not sure why:

1. Check this guide's troubleshooting section
2. Run with verbose output: `pytest tests/ -vv -s`
3. Run single failing test: `pytest path/to/test.py::test_name -vv -s`
4. Check test logs in `test-results/` if generated
5. Verify all prerequisites are met (Ollama running, models pulled, etc.)

## Test Metrics to Monitor

After running tests, check:
- **Pass rate**: Should be 100%
- **Coverage**: Should be >= 80%
- **Duration**: Should be < 15 minutes for full suite
- **Flakiness**: No tests should fail intermittently

If any metric is off, investigate before proceeding.
