# Utils Module

**Layer:** Utilities (Level 1)
**Dependencies:** configs, exceptions
**Purpose:** Text processing, document parsing, and file validation utilities

## File Map

| File | Description |
|------|-------------|
| `text_chunker.py` | Split text into overlapping chunks for indexing |
| `document_parser.py` | Parse PDF, DOCX, TXT files to extract text |
| `file_validator.py` | Validate uploaded file types and sizes |

## Key Components

### `text_chunker.py`
**Purpose:** Text chunking with configurable overlap

**Key Class:** `TextChunker`

**Key Methods:**
- `chunk_text(text: str) -> List[str]` - Split text into chunks
- `chunk_with_metadata(text: str, metadata: dict) -> List[tuple[str, dict]]` - Chunks with metadata

**Configuration:**
- Chunk size: from `CHUNK_SIZE` config (default 3000 chars)
- Overlap: from `CHUNK_OVERLAP` config (default 10%)

**Algorithm:**
1. Calculate overlap size
2. Slide window across text
3. Create chunks with overlap
4. Return list of text chunks

**Dependencies:** configs.chunking_config

### `document_parser.py`
**Purpose:** Extract text from various document formats

**Key Class:** `DocumentParser`

**Key Methods:**
- `parse_file(file_path: str) -> str` - Auto-detect format and parse
- `parse_pdf(file_path: str) -> str` - Extract text from PDF
- `parse_docx(file_path: str) -> str` - Extract text from DOCX
- `parse_txt(file_path: str) -> str` - Read plain text file

**Supported Formats:**
- PDF (via PyPDF2)
- DOCX (via python-docx)
- TXT (UTF-8 encoding)

**Error Handling:**
- Raises `StorageError` if file cannot be read
- Handles malformed documents gracefully

**Dependencies:** PyPDF2, python-docx, exceptions

### `file_validator.py`
**Purpose:** Validate file uploads before processing

**Key Class:** `FileValidator`

**Key Methods:**
- `validate_book(filename: str, file_size: int)` - Validate book files
- `validate_avatar(filename: str, file_size: int)` - Validate avatar images

**Validation Rules:**

**Books:**
- Extensions: `.pdf`, `.docx`, `.txt`
- Max size: 100 MB

**Avatars:**
- Extensions: `.png`, `.jpg`, `.jpeg`
- Max size: 10 MB

**Exceptions:**
- `InvalidFileTypeError` - Wrong file extension
- `FileSizeExceededError` - File too large

**Dependencies:** exceptions

## Interface Signatures

```python
# TextChunker
class TextChunker:
    def __init__(self):
        """Initialize with chunk size and overlap from config."""

    def chunk_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks."""

    def chunk_with_metadata(self, text: str, metadata: dict) -> List[tuple[str, dict]]:
        """Split text and attach metadata to each chunk."""

# DocumentParser
class DocumentParser:
    @staticmethod
    def parse_file(file_path: str) -> str:
        """Auto-detect format and extract text."""

    @staticmethod
    def parse_pdf(file_path: str) -> str:
        """Extract text from PDF file."""

    @staticmethod
    def parse_docx(file_path: str) -> str:
        """Extract text from DOCX file."""

    @staticmethod
    def parse_txt(file_path: str) -> str:
        """Read plain text file with UTF-8 encoding."""

# FileValidator
class FileValidator:
    BOOK_EXTENSIONS = {'.pdf', '.docx', '.txt'}
    AVATAR_EXTENSIONS = {'.png', '.jpg', '.jpeg'}
    MAX_BOOK_SIZE = 100 * 1024 * 1024  # 100 MB
    MAX_AVATAR_SIZE = 10 * 1024 * 1024  # 10 MB

    @staticmethod
    def validate_book(filename: str, file_size: int):
        """Validate book file. Raises exception if invalid."""

    @staticmethod
    def validate_avatar(filename: str, file_size: int):
        """Validate avatar file. Raises exception if invalid."""
```

## Data Flow

**Document Indexing Flow:**
1. `FileValidator.validate_book()` checks file
2. `FileStorage.save_book()` saves file to disk
3. `DocumentParser.parse_file()` extracts text
4. `TextChunker.chunk_text()` splits into chunks
5. Chunks passed to embedding generation

**File Upload Validation Flow:**
1. API receives file upload
2. `FileValidator.validate_*()` checks extension and size
3. If valid, proceed with storage
4. If invalid, raise exception → HTTP 400 error

## Usage Notes

**TextChunker:**
- Overlap prevents context loss at chunk boundaries
- Configured via `configs/chunking_config.py`
- Typical chunk size: 3000 chars
- Typical overlap: 10% (300 chars)

**DocumentParser:**
- Auto-detects format by file extension
- Handles multi-page PDFs
- Extracts text-only (no images)
- UTF-8 encoding for text files

**FileValidator:**
- Validates BEFORE storage to save resources
- Case-insensitive extension matching
- Clear error messages for users
- Prevents malicious file uploads
