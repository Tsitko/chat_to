"""
STT client module.

This module provides HTTP client for communicating with the local STT service.
"""

import requests
from typing import Dict, Any, BinaryIO

from exceptions import (
    STTServiceUnavailableError,
    STTTimeoutError,
    STTProcessingError,
)


class STTClient:
    """
    HTTP client for communicating with the local STT service.

    Responsibilities:
    - Send HTTP POST requests to STT service with audio files
    - Build multipart/form-data request with "file" field
    - Parse response payload: {"processed_text": str, "raw_text": str}
    - Handle timeouts, connection errors, and service failures
    - Return transcribed text (processed_text preferred, raw_text as fallback)
    """

    def __init__(self, service_url: str, timeout: float):
        """
        Initialize STTClient with configuration.

        Args:
            service_url: Base URL of STT service (e.g., http://localhost:8013)
            timeout: Request timeout in seconds
        """
        # Remove trailing slash from service_url to avoid double slashes
        self.service_url = service_url.rstrip("/")
        self.timeout = timeout

    def transcribe_audio(self, audio_file: BinaryIO, filename: str) -> str:
        """
        Send audio file to STT service and get transcribed text.

        Args:
            audio_file: File-like object containing audio data
            filename: Original filename for content disposition

        Returns:
            str: Transcribed text (processed_text preferred, raw_text as fallback)

        Raises:
            STTServiceUnavailableError: When STT service cannot be reached
            STTTimeoutError: When request exceeds timeout limit
            STTProcessingError: When STT service returns an error
        """
        files = self._build_multipart_files(audio_file, filename)
        response_data = self._send_request(files)
        return self._parse_response(response_data)

    def _build_multipart_files(
        self, audio_file: BinaryIO, filename: str
    ) -> Dict[str, Any]:
        """
        Build multipart files dict for request.

        Args:
            audio_file: File-like object containing audio data
            filename: Original filename

        Returns:
            dict: Files dict for requests library
        """
        return {"file": (filename, audio_file, "audio/*")}

    def _send_request(self, files: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send HTTP POST request to STT service with error handling.

        Args:
            files: Files dict for multipart upload

        Returns:
            dict: Response JSON data

        Raises:
            STTServiceUnavailableError: When service cannot be reached
            STTTimeoutError: When request times out
            STTProcessingError: When service returns error
        """
        url = f"{self.service_url}/stt"

        try:
            response = requests.post(url, files=files, timeout=self.timeout)
            response.raise_for_status()
            return response.json()

        except requests.exceptions.Timeout as e:
            raise STTTimeoutError(f"Request timeout: exceeded {self.timeout}s limit") from e

        except requests.exceptions.ConnectionError as e:
            raise STTServiceUnavailableError(
                f"Service unavailable: Cannot connect to STT service at {url}"
            ) from e

        except requests.exceptions.HTTPError as e:
            raise STTProcessingError(
                f"HTTP error {response.status_code}: {response.text}"
            ) from e

        except requests.exceptions.RequestException as e:
            raise STTServiceUnavailableError(
                f"Request failed: {str(e)}"
            ) from e

        except ValueError as e:
            raise STTProcessingError(
                f"Invalid JSON response from service"
            ) from e

    def _parse_response(self, response_json: Dict[str, Any]) -> str:
        """
        Extract transcribed text from response.

        Prioritizes processed_text over raw_text, returns empty string as fallback.

        Args:
            response_json: Response JSON from STT service

        Returns:
            str: Transcribed text (processed_text > raw_text > "")

        Raises:
            STTProcessingError: If response is not a dict or text values are not strings
        """
        # Validate response is a dictionary
        if not isinstance(response_json, dict):
            raise STTProcessingError(
                f"Invalid response format: expected dict, got {type(response_json).__name__}"
            )

        processed_text = response_json.get("processed_text")
        if processed_text:
            if not isinstance(processed_text, str):
                raise STTProcessingError(
                    f"Invalid processed_text type: expected str, got {type(processed_text).__name__}"
                )
            return processed_text

        raw_text = response_json.get("raw_text")
        if raw_text:
            if not isinstance(raw_text, str):
                raise STTProcessingError(
                    f"Invalid raw_text type: expected str, got {type(raw_text).__name__}"
                )
            return raw_text

        return ""
