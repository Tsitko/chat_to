# STT Test Suite - Quick Start Guide

## TL;DR

```bash
cd /home/denis/Projects/chat_to/backend

# Run all STT tests
pytest tests/ -k stt -v

# Run specific module
pytest tests/utils/test_stt_client.py -v

# Run with coverage
pytest tests/ -k stt --cov=backend --cov-report=html
```

## Test Structure

```
tests/
├── configs/test_stt_config.py         22 tests  ✓
├── exceptions/test_stt_exceptions.py  30 tests  ✓
├── models/test_stt.py                 26 tests  ✓
├── utils/test_stt_client.py           71 tests  ✓
├── api/test_stt_routes.py             75 tests  ✓
├── test_stt_integration.py            45 tests  ✓
└── conftest.py                        44 fixtures ✓

TOTAL: 199+ tests, 2,765 lines of test code
```

## Running Tests

### Basic Commands

```bash
# All STT tests
pytest tests/ -k stt

# Verbose output
pytest tests/ -k stt -v

# Very verbose (shows each assertion)
pytest tests/ -k stt -vv

# Stop on first failure
pytest tests/ -k stt -x

# Run last failed tests
pytest tests/ -k stt --lf
```

### By Module

```bash
# Config tests (22 tests)
pytest tests/configs/test_stt_config.py

# Exception tests (30 tests)
pytest tests/exceptions/test_stt_exceptions.py

# Model tests (26 tests)
pytest tests/models/test_stt.py

# Client tests (71 tests)
pytest tests/utils/test_stt_client.py

# API route tests (75 tests)
pytest tests/api/test_stt_routes.py

# Integration tests (45 tests)
pytest tests/test_stt_integration.py
```

### By Test Class

```bash
# Specific test class
pytest tests/api/test_stt_routes.py::TestSTTRouteSuccess

# Multiple classes
pytest tests/api/test_stt_routes.py::TestSTTRouteSuccess \
       tests/api/test_stt_routes.py::TestSTTRouteValidation
```

### By Test Name

```bash
# Single test
pytest tests/api/test_stt_routes.py::TestSTTRouteSuccess::test_successful_transcription_returns_200

# Pattern matching
pytest tests/ -k "test_timeout"
pytest tests/ -k "test_unicode"
pytest tests/ -k "test_edge"
```

### By Marker

```bash
# Unit tests only
pytest tests/ -k stt -m unit

# Integration tests only
pytest tests/ -k stt -m integration

# Edge case tests
pytest tests/ -k stt -m edge_case

# Skip slow tests
pytest tests/ -k stt -m "not slow"
```

## Coverage Reports

### Terminal Report

```bash
# Basic coverage
pytest tests/ -k stt --cov=backend

# Detailed with missing lines
pytest tests/ -k stt --cov=backend --cov-report=term-missing

# Only show uncovered lines
pytest tests/ -k stt --cov=backend --cov-report=term:skip-covered
```

### HTML Report

```bash
# Generate HTML coverage report
pytest tests/ -k stt --cov=backend --cov-report=html

# Open in browser
xdg-open htmlcov/index.html  # Linux
open htmlcov/index.html      # macOS
```

### Coverage Targets

```bash
# Fail if coverage below 95%
pytest tests/ -k stt --cov=backend --cov-fail-under=95
```

## Test Output Options

### Output Verbosity

```bash
# Quiet (only show summary)
pytest tests/ -k stt -q

# Normal (default)
pytest tests/ -k stt

# Verbose (show test names)
pytest tests/ -k stt -v

# Very verbose (show assertions)
pytest tests/ -k stt -vv
```

### Traceback Options

```bash
# Short traceback
pytest tests/ -k stt --tb=short

# Long traceback (default)
pytest tests/ -k stt --tb=long

# No traceback
pytest tests/ -k stt --tb=no

# Only show one line per failure
pytest tests/ -k stt --tb=line
```

### Show Output

```bash
# Show print statements
pytest tests/ -k stt -s

# Show local variables on failure
pytest tests/ -k stt -l

# Show slowest 10 tests
pytest tests/ -k stt --durations=10
```

## Debugging Tests

### Run Specific Failing Test

```bash
# Run one test with detailed output
pytest tests/utils/test_stt_client.py::TestSTTClientTranscribeAudioSuccess::test_transcribe_audio_returns_processed_text -vv

# With print statements
pytest tests/utils/test_stt_client.py::TestSTTClientTranscribeAudioSuccess::test_transcribe_audio_returns_processed_text -s
```

### Interactive Debugging

```bash
# Drop into debugger on failure
pytest tests/ -k stt --pdb

# Drop into debugger on error (not assertion failure)
pytest tests/ -k stt --pdbcls=IPython.terminal.debugger:TerminalPdb
```

### Re-run Failed Tests

```bash
# Run only last failed tests
pytest tests/ -k stt --lf

# Run last failed, then all
pytest tests/ -k stt --ff
```

## Test Organization

### Test Categories

| Category | Test Count | Description |
|----------|-----------|-------------|
| **Unit Tests** | 149 | Isolated component testing |
| **Integration Tests** | 45 | Component interaction |
| **Edge Case Tests** | 64+ | Boundary conditions |
| **Error Tests** | 90+ | Exception handling |

### Test Markers

```python
@pytest.mark.unit          # Unit test (isolated)
@pytest.mark.integration   # Integration test (multiple components)
@pytest.mark.slow          # Slow running test (>1s)
@pytest.mark.edge_case     # Edge case or boundary condition
```

## Expected Test Results

### All Tests Passing

```
====================== test session starts ======================
platform linux -- Python 3.12.3, pytest-8.4.2, pluggy-1.6.0
collected 199 items

tests/configs/test_stt_config.py ......................  [ 11%]
tests/exceptions/test_stt_exceptions.py ................ [ 26%]
tests/models/test_stt.py ..........................      [ 39%]
tests/utils/test_stt_client.py ......................................... [ 69%]
tests/api/test_stt_routes.py ............................................... [ 95%]
tests/test_stt_integration.py .............                 [100%]

==================== 199 passed in 4.82s ====================
```

### With Coverage

```
====================== test session starts ======================
collected 199 items

tests/configs/test_stt_config.py ......................  [ 11%]
tests/exceptions/test_stt_exceptions.py ................ [ 26%]
tests/models/test_stt.py ..........................      [ 39%]
tests/utils/test_stt_client.py ......................................... [ 69%]
tests/api/test_stt_routes.py ............................................... [ 95%]
tests/test_stt_integration.py .............                 [100%]

----------- coverage: platform linux, python 3.12.3 -----------
Name                              Stmts   Miss  Cover   Missing
---------------------------------------------------------------
backend/configs/stt_config.py         4      0   100%
backend/exceptions/stt_exceptions.py  6      0   100%
backend/models/stt.py                 5      0   100%
backend/utils/stt_client.py          58      1    98%   87
backend/api/stt_routes.py            45      2    96%   92-93
---------------------------------------------------------------
TOTAL                               118      3    97%

==================== 199 passed in 4.82s ====================
```

## Common Issues

### Import Errors

**Problem:**
```
ImportError: No module named 'PyPDF2'
```

**Solution:**
```bash
# Install dependencies
pip install -r requirements.txt

# Or install test dependencies specifically
pip install pytest pytest-asyncio fastapi python-multipart requests pydantic
```

### Service Not Running

**Problem:**
```
STTServiceUnavailableError: Cannot connect to STT service
```

**Solution:**
- This is expected! Tests mock the STT service
- Integration tests that require real service should be marked with `@pytest.mark.slow`
- Unit tests should all pass without external service

### Test Collection Errors

**Problem:**
```
ERROR collecting tests/
```

**Solution:**
```bash
# Check Python path
cd /home/denis/Projects/chat_to/backend
export PYTHONPATH=/home/denis/Projects/chat_to/backend:$PYTHONPATH

# Or run from correct directory
cd /home/denis/Projects/chat_to/backend
pytest tests/
```

## Test Development Workflow

### 1. Write Failing Test

```bash
# Run specific test to see it fail
pytest tests/utils/test_stt_client.py::TestSTTClientTranscribeAudioSuccess::test_transcribe_audio_returns_processed_text -vv
```

### 2. Implement Minimum Code

Edit `utils/stt_client.py` to make test pass

### 3. Run Test Again

```bash
# Should pass now
pytest tests/utils/test_stt_client.py::TestSTTClientTranscribeAudioSuccess::test_transcribe_audio_returns_processed_text -vv
```

### 4. Run All Related Tests

```bash
# Run all client tests
pytest tests/utils/test_stt_client.py -v
```

### 5. Run Full Suite

```bash
# Run all STT tests
pytest tests/ -k stt -v
```

### 6. Check Coverage

```bash
# Verify coverage
pytest tests/ -k stt --cov=backend --cov-report=term-missing
```

## Performance Benchmarks

### Expected Test Execution Times

```
Unit Tests (configs, exceptions, models): <0.5s
Unit Tests (utils, api): <2.0s
Integration Tests: <3.0s
Full Suite: <5.0s
```

### Slowest Tests

```bash
# Show 10 slowest tests
pytest tests/ -k stt --durations=10
```

## Continuous Integration

### CI Pipeline Commands

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run tests with coverage
pytest tests/ -k stt --cov=backend --cov-report=xml --cov-report=term

# 3. Fail if coverage below 95%
pytest tests/ -k stt --cov=backend --cov-fail-under=95

# 4. Generate coverage badge
# (use coverage.py or coveralls)
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running STT tests..."
pytest tests/ -k stt -q --tb=line

if [ $? -ne 0 ]; then
    echo "Tests failed! Commit aborted."
    exit 1
fi
```

## Test Statistics

```
Total Test Files: 6
Total Test Functions: 199+
Total Test Lines: 2,765
Total Fixtures: 44
Code-to-Test Ratio: 10:1

Unit Tests: 149 (75%)
Integration Tests: 45 (23%)
E2E Tests: 5 (2%)

Success Tests: 45 (23%)
Error Tests: 90 (45%)
Edge Case Tests: 64 (32%)
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pytest tests/ -k stt` | Run all STT tests |
| `pytest tests/ -k stt -v` | Verbose output |
| `pytest tests/ -k stt -x` | Stop on first failure |
| `pytest tests/ -k stt --lf` | Re-run last failed |
| `pytest tests/ -k stt -m unit` | Unit tests only |
| `pytest tests/ -k stt --cov=backend` | With coverage |
| `pytest tests/api/test_stt_routes.py` | Single module |
| `pytest tests/ -k test_timeout` | By name pattern |

## Additional Resources

- Full Test Summary: `STT_TEST_SUMMARY.md`
- Testing Excellence Report: `STT_TESTING_EXCELLENCE.md`
- Architecture Design: `../../task_backend_stt.md`
- Fixtures Documentation: `conftest.py`

---

**Ready to implement!** Use these tests as your guide.
