"""
TTS client module.

This module provides HTTP client for communicating with the local TTS service.
"""

import requests
from pathlib import Path
from typing import Dict, Any

from exceptions import (
    TTSServiceUnavailableError,
    TTSTimeoutError,
    TTSProcessingError,
)


class TTSClient:
    """
    HTTP client for communicating with the local TTS service.

    Responsibilities:
    - Send HTTP POST requests to TTS service
    - Build request payload: {"text": str, "output": str}
    - Parse response payload: {"ogg_path": str}
    - Handle timeouts, connection errors, and service failures
    - Return path to synthesized audio file
    """

    def __init__(self, service_url: str, timeout: float):
        """
        Initialize TTSClient with configuration.

        Args:
            service_url: Base URL of TTS service (e.g., http://localhost:8013)
            timeout: Request timeout in seconds
        """
        self.service_url = service_url
        self.timeout = timeout

    def synthesize_speech(self, text: str, output_path: Path) -> Path:
        """
        Request speech synthesis for given text.

        Args:
            text: Message content to synthesize
            output_path: Where to save audio file

        Returns:
            Path: Path to synthesized OGG audio file

        Raises:
            TTSServiceUnavailableError: When TTS service cannot be reached
            TTSTimeoutError: When request exceeds timeout limit
            TTSProcessingError: When TTS service returns an error
        """
        payload = self._build_request_payload(text, output_path)
        response_data = self._send_request(payload)
        return self._parse_response(response_data, output_path)

    def _build_request_payload(self, text: str, output_path: Path) -> Dict[str, Any]:
        """
        Build JSON payload for TTS request.

        Args:
            text: Text to synthesize
            output_path: Path where audio should be saved

        Returns:
            dict: Request payload with text and output fields
        """
        return {
            "text": text,
            "output": str(output_path),
        }

    def _send_request(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send HTTP POST request to TTS service with error handling.

        Args:
            payload: Request payload dictionary

        Returns:
            dict: Response JSON data

        Raises:
            TTSServiceUnavailableError: When service cannot be reached
            TTSTimeoutError: When request times out
            TTSProcessingError: When service returns error
        """
        try:
            response = requests.post(
                f"{self.service_url}/tts",
                json=payload,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json() if response.content else {}
        except requests.Timeout:
            raise TTSTimeoutError(f"TTS request timed out after {self.timeout}s")
        except requests.ConnectionError as e:
            raise TTSServiceUnavailableError(f"Cannot connect to TTS service: {e}")
        except requests.HTTPError as e:
            raise TTSProcessingError(f"TTS service error: {e}")
        except Exception as e:
            raise TTSProcessingError(f"Unexpected error: {e}")

    def _parse_response(self, response_json: Dict[str, Any], default_path: Path) -> Path:
        """
        Extract ogg_path from response.

        Args:
            response_json: Response JSON from TTS service
            default_path: Fallback path if ogg_path missing

        Returns:
            Path: Path to synthesized audio file
        """
        ogg_path_str = response_json.get("ogg_path") or str(default_path)
        return Path(ogg_path_str)
