"""
Main entry point for ParadoxGPT.

This module provides the main entry point for the ParadoxGPT
distributed multi-agent code generation system.
"""

import argparse
import logging
import sys
import threading
from typing import Optional

from orchestrator import ParadoxGPTOrchestrator
from utils import save_result_to_file
from config import validate_api_keys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("paradoxgpt.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="ParadoxGPT - AI Assistant that works exactly like ChatGPT")
    
    parser.add_argument(
        "--task", "-t",
        type=str,
        help="Any task or question to process (coding, writing, analysis, etc.)"
    )
    
    parser.add_argument(
        "--file", "-f",
        type=str,
        help="Path to a file containing the task or question"
    )
    
    parser.add_argument(
        "--output", "-o",
        type=str,
        default="output",
        help="Directory to save the output files (default: 'output')"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging"
    )
    
    parser.add_argument(
        "--save", "-s",
        action="store_true",
        help="Save the generated response to a file (default: False)"
    )
    
    return parser.parse_args()

def get_task_from_file(file_path: str) -> Optional[str]:
    """
    Read the task from a file.
    
    Args:
        file_path: Path to the file containing the task
        
    Returns:
        The task as a string, or None if the file could not be read
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception as e:
        logger.error(f"Error reading task file: {str(e)}")
        return None

def get_user_task():
    """Prompt the user for a coding task and return it."""
    # Simple prompt like a chat interface
    print("\nYou: ", end="", flush=True)
    
    # Get the user's input (supports multi-line input with Ctrl+Enter in most terminals)
    user_input = input()
    
    # Check if user wants to exit
    if user_input.lower() in ['exit', 'quit', 'q']:
        return None
    
    return user_input

def process_task(task, orchestrator, output_dir, save_to_file=True):
    """Process a single task and return the result."""
    try:
        # Process the task
        print("\nParadoxGPT: I'll help you with that. This may take a few minutes...\n")
        
        # Add a simple progress indicator without dots
        print("Working on your request...", flush=True)
        
        # Create a flag to control the progress indicator
        stop_progress = threading.Event()
        
        # Start a thread to show progress while the task is being processed
        def progress_indicator():
            spinner = ['|', '/', '-', '\\']
            i = 0
            while not stop_progress.is_set():
                print(f"\rProcessing... {spinner[i % len(spinner)]}", end="", flush=True)
                i += 1
                # Use a short timeout to check the stop flag frequently
                stop_progress.wait(0.3)
            
            # Clear the spinner line when done
            print("\r                                ", end="\r", flush=True)
        
        progress_thread = threading.Thread(target=progress_indicator)
        progress_thread.daemon = True
        progress_thread.start()
        
        try:
            # Process the task
            result = orchestrator.process_task(task)
        finally:
            # Stop the progress indicator thread
            stop_progress.set()
            # Wait for the thread to finish
            progress_thread.join(timeout=1.0)
        
        # Save the result to a file if requested
        if save_to_file:
            output_file = save_result_to_file(result, output_dir)
            result["output_file"] = output_file
        
        # Print the result in a chat-like format
        print("\nParadoxGPT: Here's my response:\n")
        
        if "final_solution" in result and result["final_solution"]:
            # Print the response directly without code blocks (unless it's clearly code)
            response = result["final_solution"]
            if any(keyword in response.lower() for keyword in ['def ', 'function', 'class ', 'import ', '<!doctype', '<html', 'console.log']):
                # This looks like code, so use code blocks
                print("```")
                print(response)
                print("```\n")
            else:
                # This is regular text, print it directly
                print(response)
                print()
        else:
            print("I wasn't able to provide a complete response. Here's what I have:\n")
            if "error" in result:
                print(f"Error: {result['error']}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        print(f"\nParadoxGPT: I encountered an error: {str(e)}")
        return {"success": False, "error": str(e)}

def main():
    """Main entry point for ParadoxGPT."""
    # Parse command line arguments
    args = parse_arguments()
    
    # Set logging level based on verbose flag
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Get the task from arguments or file (for single-run mode)
    initial_task = None
    if args.task:
        initial_task = args.task
    elif args.file:
        initial_task = get_task_from_file(args.file)
    
    # Validate API keys
    if not validate_api_keys():
        print("Error: Missing required API keys. Please check your .env file.")
        return 1
    
    # Initialize the orchestrator (do this once)
    try:
        orchestrator = ParadoxGPTOrchestrator()
    except Exception as e:
        logger.error(f"Error initializing orchestrator: {str(e)}")
        print(f"Error initializing orchestrator: {str(e)}")
        return 1
    
    # If a task was provided via command line, process it once and exit
    if initial_task:
        result = process_task(initial_task, orchestrator, args.output, save_to_file=args.save)
        return 0 if result.get("success", False) else 1
    
    # Interactive mode with continuous loop
    print("\nParadoxGPT: Hello! I'm ParadoxGPT, an AI assistant that works just like ChatGPT.")
    print("ParadoxGPT: I can help you with anything - coding, writing, analysis, creative tasks, questions, and more.")
    print("ParadoxGPT: What can I help you with today? (Type 'exit' to quit)")
    
    while True:
        # Get the next task from the user
        task = get_user_task()
        
        # Exit if the user wants to quit
        if task is None:
            print("\nParadoxGPT: Goodbye! Have a great day!")
            return 0
        
        # Process the task
        process_task(task, orchestrator, args.output, save_to_file=args.save)
        
        # Simple prompt for the next task
        print("ParadoxGPT: Is there anything else I can help you with? (Type 'exit' to quit)")

if __name__ == "__main__":
    sys.exit(main())
