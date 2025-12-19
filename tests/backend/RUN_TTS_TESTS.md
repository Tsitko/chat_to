# Quick Guide: Running TTS Tests

## Prerequisites

```bash
# Ensure you're in the project root
cd /home/denis/Projects/chat_to

# Activate virtual environment
source venv/bin/activate

# Install test dependencies (if not already installed)
pip install pytest pytest-asyncio pytest-cov
```

## Run All TTS Tests

```bash
# Run all backend TTS tests
pytest tests/backend/ -v

# Run with coverage report
pytest tests/backend/ --cov=backend --cov-report=term-missing
```

## Run by Test Type

### Unit Tests Only (Fast)
```bash
pytest tests/backend/ -m unit -v
```

### Integration Tests Only
```bash
pytest tests/backend/ -m integration -v
```

### E2E Tests Only
```bash
pytest tests/backend/ -m e2e -v
```

### Exclude Slow Tests
```bash
pytest tests/backend/ -m "not slow" -v
```

## Run by Component

### Configuration Tests
```bash
pytest tests/backend/configs/test_tts_config.py -v
```

### Exception Tests
```bash
pytest tests/backend/exceptions/test_tts_exceptions.py -v
```

### AudioFileManager Tests
```bash
pytest tests/backend/storage/test_audio_file_manager.py -v
```

### TTS Models Tests
```bash
pytest tests/backend/models/test_tts.py -v
```

### TTSClient Tests
```bash
pytest tests/backend/utils/test_tts_client.py -v
```

### API Routes Tests
```bash
pytest tests/backend/api/test_tts_routes.py -v
```

### E2E Tests
```bash
pytest tests/backend/api/test_tts_e2e.py -v
```

## Run Specific Test Class

```bash
# Example: Run only TTSClient success tests
pytest tests/backend/utils/test_tts_client.py::TestSynthesizeSpeechSuccess -v

# Example: Run only AudioFileManager security tests
pytest tests/backend/storage/test_audio_file_manager.py::TestAudioFileManagerSecurity -v
```

## Run Specific Test Function

```bash
# Example: Run single timeout test
pytest tests/backend/utils/test_tts_client.py::TestSynthesizeSpeechTimeout::test_synthesize_speech_timeout_raises_tts_timeout_error -v
```

## Useful Options

### Show Print Statements
```bash
pytest tests/backend/ -v -s
```

### Stop on First Failure
```bash
pytest tests/backend/ -v -x
```

### Show Local Variables on Failure
```bash
pytest tests/backend/ -v -l
```

### Run Last Failed Tests
```bash
pytest tests/backend/ -v --lf
```

### Run Failed Tests First
```bash
pytest tests/backend/ -v --ff
```

### Parallel Execution (if pytest-xdist installed)
```bash
pip install pytest-xdist
pytest tests/backend/ -v -n auto
```

## Coverage Reports

### Terminal Report
```bash
pytest tests/backend/ --cov=backend --cov-report=term-missing
```

### HTML Report
```bash
pytest tests/backend/ --cov=backend --cov-report=html
# Open htmlcov/index.html in browser
```

### XML Report (for CI/CD)
```bash
pytest tests/backend/ --cov=backend --cov-report=xml
```

## Expected Results

### Before Implementation
All tests should FAIL with import errors:
```
ImportError: No module named 'backend.configs.tts_config'
ImportError: No module named 'backend.exceptions.tts_exceptions'
# etc.
```

### During Implementation
Tests gradually pass as components are implemented:
```
tests/backend/configs/test_tts_config.py ................. PASSED
tests/backend/exceptions/test_tts_exceptions.py ........... PASSED
# etc.
```

### After Complete Implementation
All tests should PASS:
```
================= 150+ passed in 5.23s =================
```

## Troubleshooting

### ImportError: No module named 'backend'
```bash
# Ensure backend is in Python path
export PYTHONPATH="${PYTHONPATH}:/home/denis/Projects/chat_to"
# Or add to conftest.py (already done)
```

### ModuleNotFoundError: No module named 'requests'
```bash
# Install requests library
pip install requests
```

### Mock Import Errors
```bash
# Ensure unittest.mock is available (Python 3.3+)
python --version  # Should be 3.8+
```

## Test Execution Time Estimates

- **Unit Tests**: ~3-5 seconds (fast, all mocked)
- **Integration Tests**: ~5-10 seconds (TestClient overhead)
- **E2E Tests**: ~10-30 seconds (file I/O, more realistic)
- **All Tests**: ~15-40 seconds total

## CI/CD Command

```bash
# Recommended CI/CD command
pytest tests/backend/ -v --cov=backend --cov-report=xml --cov-report=term-missing --tb=short
```

## Development Workflow

1. **Red**: Run tests (they fail)
   ```bash
   pytest tests/backend/configs/test_tts_config.py -v
   ```

2. **Green**: Write minimal implementation to pass tests
   ```bash
   # Edit backend/configs/tts_config.py
   pytest tests/backend/configs/test_tts_config.py -v
   ```

3. **Refactor**: Improve code while keeping tests green
   ```bash
   pytest tests/backend/configs/test_tts_config.py -v
   ```

4. **Repeat** for next component

## Test Count by File

- `test_tts_config.py`: 17 tests
- `test_tts_exceptions.py`: 26 tests
- `test_audio_file_manager.py`: 33 tests
- `test_tts.py`: 41 tests
- `test_tts_client.py`: 32 tests
- `test_tts_routes.py`: 25 tests
- `test_tts_e2e.py`: 12 tests

**Total**: ~186 tests
