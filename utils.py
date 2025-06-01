"""
Utilities module for ParadoxGPT.

This module provides helper functions for the ParadoxGPT
distributed multi-agent code generation system.
"""

import os
import json
import logging
import time
from typing import Dict, Any, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def save_result_to_file(result: Dict[str, Any], output_dir: str = "output") -> str:
    """
    Save the result to a file.

    Args:
        result: The result to save
        output_dir: The directory to save the result to

    Returns:
        The path to the saved file
    """
    # Create the output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Generate a timestamp for the filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Save the final solution to a .py file
    solution_filename = f"{output_dir}/solution_{timestamp}.py"
    with open(solution_filename, "w", encoding="utf-8") as f:
        f.write(result.get("final_solution", "# No solution generated"))

    # Save the full result (including metadata) to a JSON file
    metadata_filename = f"{output_dir}/metadata_{timestamp}.json"

    # Create a copy of the result without the large text fields to keep the JSON file manageable
    metadata = result.copy()

    # Remove large text fields from the metadata
    if "final_solution" in metadata:
        metadata["final_solution_length"] = len(metadata["final_solution"])
        metadata["final_solution"] = metadata["final_solution"][:100] + "... (truncated)"

    if "subtasks" in metadata:
        for subtask in metadata["subtasks"]:
            if "full_text" in subtask:
                subtask["full_text_length"] = len(subtask["full_text"])
                subtask["full_text"] = subtask["full_text"][:100] + "... (truncated)"

    # Save the metadata
    with open(metadata_filename, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Saved solution to {solution_filename}")
    logger.info(f"Saved metadata to {metadata_filename}")

    return solution_filename

def format_processing_time(seconds: float) -> str:
    """
    Format processing time in a human-readable format.

    Args:
        seconds: The processing time in seconds

    Returns:
        A formatted string representing the processing time
    """
    minutes, seconds = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)

    if hours > 0:
        return f"{hours}h {minutes}m {seconds}s"
    elif minutes > 0:
        return f"{minutes}m {seconds}s"
    else:
        return f"{seconds:.2f}s"

def print_summary(result: Dict[str, Any]) -> None:
    """
    Print a summary of the result.

    Args:
        result: The result to summarize
    """
    print("\n" + "="*80)
    print("PARADOX GPT - EXECUTION SUMMARY")
    print("="*80)

    if "error" in result:
        print(f"Error: {result['error']}")
        return

    # Print processing time
    processing_time = result.get("processing_time", 0)
    formatted_time = format_processing_time(processing_time)
    print(f"Total processing time: {formatted_time}")

    # Print subtask information
    if "subtasks" in result:
        print(f"\nTask divided into {len(result['subtasks'])} subtasks:")
        for i, subtask in enumerate(result["subtasks"]):
            print(f"  {i+1}. {subtask.get('title', 'Untitled')}")

    # Print success status
    success = result.get("success", False)
    print(f"\nExecution {'successful' if success else 'failed'}")

    # Print the generated code directly
    if "final_solution" in result and result["final_solution"]:
        print("\n" + "="*80)
        print("GENERATED CODE:")
        print("="*80)
        print(result["final_solution"])
        print("="*80)

    # Print output file location if saved
    if "output_file" in result:
        print(f"\nSolution also saved to: {result['output_file']}")

    print("="*80)
