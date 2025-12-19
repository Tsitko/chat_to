"""
STT API routes module.

This module provides FastAPI endpoints for Speech-to-Text transcription.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pathlib import Path

from models import STTResponse
from utils import STTClient
from configs import STT_SERVICE_URL, STT_TIMEOUT, STT_MAX_FILE_SIZE, STT_ALLOWED_FORMATS
from exceptions import (
    STTServiceUnavailableError,
    STTTimeoutError,
    STTProcessingError,
)


router = APIRouter(prefix="/api/stt", tags=["stt"])


def get_stt_client() -> STTClient:
    """
    Dependency injection for STTClient.

    Returns:
        STTClient: Configured STT client instance
    """
    return STTClient(service_url=STT_SERVICE_URL, timeout=STT_TIMEOUT)


@router.post("/", response_model=STTResponse)
async def transcribe_audio(file: UploadFile = File(...)) -> STTResponse:
    """
    Transcribe audio file to text.

    Args:
        file: Audio file upload (multipart/form-data)

    Returns:
        STTResponse: Response with transcribed text

    Raises:
        HTTPException: 400 if validation fails, 503 if service unavailable,
                      504 if timeout, 500 if processing error
    """
    # Validate file is uploaded
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    # Validate filename exists
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    # Validate file format
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in STT_ALLOWED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format. Allowed formats: {', '.join(STT_ALLOWED_FORMATS)}"
        )

    # Validate file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > STT_MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {STT_MAX_FILE_SIZE / (1024 * 1024):.1f} MB"
        )

    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    try:
        # Get STT client via dependency injection
        stt_client = get_stt_client()

        # Transcribe audio
        transcribed_text = stt_client.transcribe_audio(file.file, file.filename)

        return STTResponse(transcribed_text=transcribed_text)

    except STTServiceUnavailableError as e:
        raise HTTPException(status_code=503, detail=f"STT service unavailable: {e}")
    except STTTimeoutError as e:
        raise HTTPException(status_code=504, detail=f"STT request timeout: {e}")
    except STTProcessingError as e:
        raise HTTPException(status_code=500, detail=f"STT processing failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
