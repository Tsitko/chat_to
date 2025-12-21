"""
OpenAI-compatible client for LM Studio chat completions.

This module provides functionality for generating responses using LM Studio.
Depends on: configs
"""

from typing import List, Dict, Optional
import httpx

from configs import LM_STUDIO_URL, CHAT_MODEL
from exceptions import LLMError


class OllamaClient:
    """
    Client for interacting with LM Studio for chat completions.

    This class handles communication with LM Studio API for generating
    character responses based on context and chat history.
    """

    def __init__(self, ollama_url: str = LM_STUDIO_URL, model: str = CHAT_MODEL):
        """
        Initialize LM Studio client.

        Args:
            ollama_url: URL of the LM Studio server
            model: Name of the chat model to use

        Raises:
            LLMError: If LM Studio connection fails
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
            "temperature": temperature,
        }

        if max_tokens is not None:
            payload["max_tokens"] = max_tokens

        try:
            response = await self._call_ollama_api("/v1/chat/completions", payload)
            choices = response.get("choices", [])
            if not choices:
                return ""
            return choices[0].get("message", {}).get("content", "")
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
            "temperature": temperature,
        }

        try:
            url = f"{self.ollama_url}/v1/chat/completions"
            async with self.client.stream("POST", url, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    if line.startswith("data: "):
                        data_str = line[len("data: "):].strip()
                    else:
                        data_str = line.strip()
                    if data_str == "[DONE]":
                        break
                    import json
                    data = json.loads(data_str)
                    delta = data.get("choices", [{}])[0].get("delta", {})
                    content = delta.get("content", "")
                    if content:
                        yield content
        except Exception as e:
            raise LLMError(f"Failed to generate streaming response: {str(e)}")

    def _build_messages(self, system_prompt: str, user_prompt: str) -> List[Dict]:
        """
        Build messages list for OpenAI-compatible chat API.

        Args:
            system_prompt: System prompt with character identity and knowledge
            user_prompt: User prompt with conversation context and task

        Returns:
            List[Dict]: Messages in OpenAI-compatible chat format
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
            response = await self._call_ollama_api("/v1/models", {})
            models = response.get("data", [])
            return any(model.get("id") == self.model for model in models)
        except Exception:
            return False

    async def _call_ollama_api(self, endpoint: str, payload: Dict) -> Dict:
        """
        Internal method to call LM Studio API.

        Args:
            endpoint: API endpoint (e.g., '/v1/chat/completions')
            payload: Request payload

        Returns:
            Dict: API response

        Raises:
            LLMError: If API call fails
        """
        url = f"{self.ollama_url}{endpoint}"
        try:
            if endpoint == "/v1/models":
                response = await self.client.get(url)
            else:
                response = await self.client.post(url, json=payload)

            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise LLMError(f"LM Studio API returned error {e.response.status_code}: {e.response.text}")
        except httpx.RequestError as e:
            raise LLMError(f"Failed to connect to LM Studio at {url}: {str(e)}")
        except Exception as e:
            raise LLMError(f"Unexpected error calling LM Studio API: {str(e)}")
