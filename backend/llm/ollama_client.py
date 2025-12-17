"""
Ollama client for LLM chat completions.

This module provides functionality for generating responses using Ollama LLM.
Depends on: configs
"""

from typing import List, Dict, Optional
import httpx

from configs import OLLAMA_URL, CHAT_MODEL
from exceptions import LLMError


class OllamaClient:
    """
    Client for interacting with Ollama LLM for chat completions.

    This class handles communication with Ollama API for generating
    character responses based on context and chat history.
    """

    def __init__(self, ollama_url: str = OLLAMA_URL, model: str = CHAT_MODEL):
        """
        Initialize Ollama client.

        Args:
            ollama_url: URL of the Ollama server
            model: Name of the chat model to use

        Raises:
            LLMError: If Ollama connection fails
        """
        self.ollama_url = ollama_url.rstrip('/')
        self.model = model
        self.client = httpx.AsyncClient(timeout=60.0)

    async def generate_response(self, system_prompt: str, user_prompt: str,
                               temperature: float = 0.7,
                               max_tokens: Optional[int] = None) -> str:
        """
        Generate a response from the LLM using separate system and user prompts.

        Args:
            system_prompt: System prompt with character identity and knowledge
            user_prompt: User prompt with conversation context and task
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum number of tokens to generate

        Returns:
            str: Generated response text

        Raises:
            LLMError: If response generation fails
        """
        messages = self._build_messages(system_prompt, user_prompt)

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature
            }
        }

        if max_tokens:
            payload["options"]["num_predict"] = max_tokens

        try:
            response = await self._call_ollama_api("/api/chat", payload)
            return response.get("message", {}).get("content", "")
        except Exception as e:
            raise LLMError(f"Failed to generate response: {str(e)}")

    async def generate_streaming_response(self, system_prompt: str, user_prompt: str,
                                         temperature: float = 0.7):
        """
        Generate a streaming response from the LLM using separate system and user prompts.

        Args:
            system_prompt: System prompt with character identity and knowledge
            user_prompt: User prompt with conversation context and task
            temperature: Sampling temperature (0.0-1.0)

        Yields:
            str: Chunks of generated text

        Raises:
            LLMError: If response generation fails
        """
        messages = self._build_messages(system_prompt, user_prompt)

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature
            }
        }

        try:
            url = f"{self.ollama_url}/api/chat"
            async with self.client.stream("POST", url, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.strip():
                        import json
                        data = json.loads(line)
                        if "message" in data:
                            content = data["message"].get("content", "")
                            if content:
                                yield content
        except Exception as e:
            raise LLMError(f"Failed to generate streaming response: {str(e)}")

    def _build_messages(self, system_prompt: str, user_prompt: str) -> List[Dict]:
        """
        Build messages list for Ollama chat API.

        Args:
            system_prompt: System prompt with character identity and knowledge
            user_prompt: User prompt with conversation context and task

        Returns:
            List[Dict]: Messages in Ollama chat format
        """
        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

    async def check_model_availability(self) -> bool:
        """
        Check if the configured model is available.

        Returns:
            bool: True if model is available, False otherwise
        """
        try:
            response = await self._call_ollama_api("/api/tags", {})
            models = response.get("models", [])
            return any(model.get("name") == self.model for model in models)
        except Exception:
            return False

    async def _call_ollama_api(self, endpoint: str, payload: Dict) -> Dict:
        """
        Internal method to call Ollama API.

        Args:
            endpoint: API endpoint (e.g., '/api/generate')
            payload: Request payload

        Returns:
            Dict: API response

        Raises:
            LLMError: If API call fails
        """
        url = f"{self.ollama_url}{endpoint}"
        try:
            if endpoint == "/api/tags":
                response = await self.client.get(url)
            else:
                response = await self.client.post(url, json=payload)

            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise LLMError(f"Ollama API returned error {e.response.status_code}: {e.response.text}")
        except httpx.RequestError as e:
            raise LLMError(f"Failed to connect to Ollama at {url}: {str(e)}")
        except Exception as e:
            raise LLMError(f"Unexpected error calling Ollama API: {str(e)}")
