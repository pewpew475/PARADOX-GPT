"""
API Client module for ParadoxGPT.

This module handles API calls to the Gemini-2.0-Flash API,
including authentication, request formatting, and error handling.
"""

import time
import json
import logging
from typing import Dict, Any, Optional

import google.generativeai as genai
import requests
from requests.exceptions import RequestException, Timeout

from config import GEMINI_API_BASE_URL, REQUEST_TIMEOUT, MAX_RETRIES

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class GeminiAPIClient:
    """Client for interacting with the Gemini-2.0-Flash API."""

    def __init__(self, api_key: str, agent_name: str = "Unknown"):
        """
        Initialize the Gemini API client.

        Args:
            api_key: The API key for authentication
            agent_name: Name of the agent using this client (for logging)
        """
        self.api_key = api_key
        self.agent_name = agent_name
        self.base_url = GEMINI_API_BASE_URL
        self.timeout = REQUEST_TIMEOUT
        self.max_retries = MAX_RETRIES

        # Configure the Gemini client
        genai.configure(api_key=api_key)

    def generate_content(self, prompt: str, temperature: float = 0.7) -> Optional[str]:
        """
        Generate content using the Gemini-2.0-Flash model.

        Args:
            prompt: The prompt to send to the model
            temperature: Controls randomness (0.0 to 1.0)
                         Higher values (0.7-1.0) produce more creative outputs
                         Lower values (0.1-0.3) produce more focused outputs
                         For web design tasks, use 0.85-0.95 for maximum creativity

        Returns:
            The generated text or None if an error occurred
        """
        # For web design tasks, ensure temperature is high enough for creativity
        if "html" in prompt.lower() and "css" in prompt.lower():
            # Ensure minimum temperature of 0.85 for web design tasks
            temperature = max(temperature, 0.85)
        logger.info(f"[{self.agent_name}] Sending request to Gemini API")

        for attempt in range(self.max_retries):
            try:
                # Configure the model
                model = genai.GenerativeModel(
                    model_name="gemini-2.0-flash",
                    generation_config={"temperature": temperature}
                )

                # Generate content
                response = model.generate_content(prompt)

                # Extract and return the text
                if response and hasattr(response, 'text'):
                    logger.info(f"[{self.agent_name}] Successfully received response")
                    return response.text
                else:
                    logger.warning(f"[{self.agent_name}] Received empty or invalid response")
                    return None

            except Exception as e:
                logger.error(f"[{self.agent_name}] Error on attempt {attempt+1}/{self.max_retries}: {str(e)}")
                if attempt < self.max_retries - 1:
                    # Exponential backoff: 1s, 2s, 4s, ...
                    wait_time = 2 ** attempt
                    logger.info(f"[{self.agent_name}] Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"[{self.agent_name}] Failed after {self.max_retries} attempts")
                    # Try the direct REST API method as a fallback
                    logger.info(f"[{self.agent_name}] Trying direct REST API method as fallback")
                    return self.generate_content_direct(prompt, temperature)

        return None

    def generate_content_direct(self, prompt: str, temperature: float = 0.7) -> Optional[str]:
        # For web design tasks, ensure temperature is high enough for creativity
        if "html" in prompt.lower() and "css" in prompt.lower():
            # Ensure minimum temperature of 0.85 for web design tasks
            temperature = max(temperature, 0.85)
        """
        Alternative implementation using direct REST API calls instead of the SDK.
        This can be used as a fallback if the SDK has issues.

        Args:
            prompt: The prompt to send to the model
            temperature: Controls randomness (0.0 to 1.0)

        Returns:
            The generated text or None if an error occurred
        """
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key
        }

        data = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature
            }
        }

        for attempt in range(self.max_retries):
            try:
                response = requests.post(
                    self.base_url,
                    headers=headers,
                    json=data,
                    timeout=self.timeout
                )

                if response.status_code == 200:
                    result = response.json()
                    if "candidates" in result and len(result["candidates"]) > 0:
                        content = result["candidates"][0]["content"]
                        if "parts" in content and len(content["parts"]) > 0:
                            return content["parts"][0]["text"]

                logger.warning(f"[{self.agent_name}] API returned status code {response.status_code}")

            except (RequestException, Timeout) as e:
                logger.error(f"[{self.agent_name}] Request error on attempt {attempt+1}/{self.max_retries}: {str(e)}")

            if attempt < self.max_retries - 1:
                wait_time = 2 ** attempt
                logger.info(f"[{self.agent_name}] Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                logger.error(f"[{self.agent_name}] Failed after {self.max_retries} attempts")

        return None

    def generate_response(self, prompt: str, temperature: float = 0.7) -> Dict[str, Any]:
        """
        Generate a response and return it in a structured format.

        Args:
            prompt: The prompt to send to the model
            temperature: Controls randomness (0.0 to 1.0)

        Returns:
            A dictionary containing the response and metadata
        """
        content = self.generate_content(prompt, temperature)
        
        if content:
            return {
                "success": True,
                "content": content,
                "agent_name": self.agent_name
            }
        else:
            return {
                "success": False,
                "content": "",
                "agent_name": self.agent_name,
                "error": "Failed to generate content"
            }
