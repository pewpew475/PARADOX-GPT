"""
Configuration module for ParadoxGPT.

This module loads environment variables and provides configuration settings
for the ParadoxGPT distributed multi-agent code generation system.
"""

import os
from typing import Dict, List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API Keys
DIVIDER_API_KEY = os.getenv("DIVIDER_API_KEY")

# Thinker API Keys
THINKER_API_KEYS = [
    os.getenv(f"THINKER_{i}_API_KEY") for i in range(1, 11)
]

# Mid-Level Combiner API Keys
MID_COMBINER_API_KEYS = [
    os.getenv("MID_COMBINER_1_API_KEY"),
    os.getenv("MID_COMBINER_2_API_KEY")
]

# Final Combiner API Key
FINAL_COMBINER_API_KEY = os.getenv("FINAL_COMBINER_API_KEY")

# API Configuration
GEMINI_API_BASE_URL = os.getenv("GEMINI_API_BASE_URL", 
                               "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent")
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", 60))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", 3))

# Validate that all required API keys are present
def validate_api_keys() -> bool:
    """Validate that all required API keys are present."""
    if not DIVIDER_API_KEY:
        print("Error: DIVIDER_API_KEY is missing")
        return False
    
    for i, key in enumerate(THINKER_API_KEYS, 1):
        if not key:
            print(f"Error: THINKER_{i}_API_KEY is missing")
            return False
    
    for i, key in enumerate(MID_COMBINER_API_KEYS, 1):
        if not key:
            print(f"Error: MID_COMBINER_{i}_API_KEY is missing")
            return False
    
    if not FINAL_COMBINER_API_KEY:
        print("Error: FINAL_COMBINER_API_KEY is missing")
        return False
    
    return True

# System configuration
NUM_THINKERS = 10
NUM_MID_COMBINERS = 2
THINKERS_PER_MID_COMBINER = NUM_THINKERS // NUM_MID_COMBINERS  # Should be 5
