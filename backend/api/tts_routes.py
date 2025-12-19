"""
TTS API routes module.

This module provides FastAPI endpoints for TTS synthesis.
"""

from fastapi import APIRouter, HTTPException, Depends

from models import TTSRequest, TTSResponse
from utils import TTSClient
from storage import AudioFileManager
from configs import TTS_SERVICE_URL, TTS_TIMEOUT, TTS_OUTPUT_DIR
from exceptions import (
    TTSServiceUnavailableError,
    TTSTimeoutError,
    TTSProcessingError,
)


router = APIRouter(prefix="/api/tts", tags=["tts"])


def get_tts_client() -> TTSClient:
    """
    Dependency injection for TTSClient.

    Returns:
        TTSClient: Configured TTS client instance
    """
    return TTSClient(service_url=TTS_SERVICE_URL, timeout=TTS_TIMEOUT)


def get_audio_file_manager() -> AudioFileManager:
    """
    Dependency injection for AudioFileManager.

    Returns:
        AudioFileManager: Configured audio file manager instance
    """
    return AudioFileManager(output_dir=TTS_OUTPUT_DIR)


@router.post("/", response_model=TTSResponse)
async def synthesize_speech(request: TTSRequest) -> TTSResponse:
    """
    Synthesize speech from text.

    Args:
        request: TTS request with text to synthesize

    Returns:
        TTSResponse: Response with relative path to audio file

    Raises:
        HTTPException: 503 if service unavailable, 504 if timeout, 500 if other error
    """
    try:
        # Get dependencies by calling the functions
        # This allows mocking via @patch decorators
        tts_client = get_tts_client()
        audio_manager = get_audio_file_manager()

        # Generate unique output path
        output_path = audio_manager.generate_audio_filepath()

        # Call TTS service
        audio_path = tts_client.synthesize_speech(request.text, output_path)

        # Convert to relative path for API response
        relative_path = audio_manager.get_relative_path(audio_path)

        return TTSResponse(audio_path=relative_path)

    except TTSServiceUnavailableError as e:
        raise HTTPException(status_code=503, detail=f"TTS service unavailable: {e}")
    except TTSTimeoutError as e:
        raise HTTPException(status_code=504, detail=f"TTS request timeout: {e}")
    except TTSProcessingError as e:
        raise HTTPException(status_code=500, detail=f"TTS processing failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
