"""
Orchestrator module for ParadoxGPT.

This module provides a simple ParadoxGPT interface using a single AI agent.
"""

import logging
import time
from typing import Dict, Any

from config import DIVIDER_API_KEY, validate_api_keys
from api_client import GeminiAPIClient
from prompts import PARADOXGPT_PROMPT

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ParadoxGPTOrchestrator:
    """
    Simple ParadoxGPT orchestrator using a single AI agent.
    """

    def __init__(self):
        """Initialize the ParadoxGPT orchestrator."""
        logger.info("Initializing ParadoxGPT orchestrator")

        # Validate API keys
        if not validate_api_keys():
            raise ValueError("Missing required API keys. Please check your .env file.")

        # Initialize single AI client
        self.api_client = GeminiAPIClient(DIVIDER_API_KEY, "ParadoxGPT")

        logger.info("ParadoxGPT orchestrator initialized successfully")

    def process_task(self, user_message: str) -> Dict[str, Any]:
        """
        Process a user message like ParadoxGPT would.

        Args:
            user_message: The user's message/question

        Returns:
            A dictionary containing the response and metadata
        """
        start_time = time.time()
        logger.info(f"Processing message: {user_message[:100]}...")

        try:
            # Create the full prompt with system instructions and user message
            full_prompt = f"{PARADOXGPT_PROMPT}\n\nUser: {user_message}\n\nAssistant:"

            # Generate response using the API client
            response = self.api_client.generate_response(full_prompt, temperature=0.7)

            if response and response.get("success", False):
                final_solution = response.get("content", "")
                success = True
            else:
                final_solution = "I apologize, but I'm having trouble processing your request right now. Please try again."
                success = False

        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            final_solution = "I apologize, but I encountered an error while processing your request. Please try again."
            success = False

        # Calculate total processing time
        total_time = time.time() - start_time
        logger.info(f"Message processing completed in {total_time:.2f} seconds")

        # Return result in the expected format
        result = {
            "final_solution": final_solution,
            "success": success,
            "processing_time": total_time,
            "metadata": {
                "model": "ParadoxGPT",
                "temperature": 0.7,
                "response_type": "conversational"
            }
        }

        return result


