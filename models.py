"""
Models module for ParadoxGPT.

This module defines the agent classes and their behaviors for the
ParadoxGPT distributed multi-agent code generation system.
"""

import logging
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod

from api_client import GeminiAPIClient
import prompts

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class Agent(ABC):
    """Base abstract class for all agents in the system."""

    def __init__(self, api_key: str, name: str):
        """
        Initialize an agent.

        Args:
            api_key: The API key for this agent
            name: The name of this agent
        """
        self.name = name
        self.api_client = GeminiAPIClient(api_key, name)
        logger.info(f"Initialized agent: {name}")

    @abstractmethod
    def process(self, input_data: Any) -> Any:
        """
        Process the input data and return the result.

        Args:
            input_data: The input data to process

        Returns:
            The processed result
        """
        pass


class DividerAgent(Agent):
    """
    Task Divider Agent that splits a user request into subtasks.
    """

    def __init__(self, api_key: str):
        """Initialize the Divider Agent."""
        super().__init__(api_key, "Task Divider")

    def process(self, user_task: str) -> List[Dict[str, str]]:
        """
        Divide the user task into 10 subtasks.

        Args:
            user_task: The full user request

        Returns:
            A list of subtask dictionaries
        """
        logger.info(f"[{self.name}] Dividing task into subtasks")

        # Format the prompt with the user task
        prompt = prompts.DIVIDER_PROMPT.format(user_task=user_task)

        # Generate the subtasks
        response = self.api_client.generate_content(prompt)

        if not response:
            logger.error(f"[{self.name}] Failed to generate subtasks")
            return []

        # Parse the response into subtasks
        subtasks = self._parse_subtasks(response)

        logger.info(f"[{self.name}] Successfully divided task into {len(subtasks)} subtasks")
        return subtasks

    def _parse_subtasks(self, response: str) -> List[Dict[str, str]]:
        """
        Parse the response text into structured subtasks.

        Args:
            response: The raw text response from the API

        Returns:
            A list of subtask dictionaries
        """
        subtasks = []
        current_subtask = None

        # Log the raw response for debugging
        logger.debug(f"[{self.name}] Raw response from API: {response}")

        # Try to detect if the response is in a different format
        if "Subtask 1:" in response or "SUBTASK 1:" in response:
            # Alternative parsing for "Subtask N:" format
            return self._parse_subtasks_alternative(response)

        # Simple parsing logic - can be improved for more robust parsing
        lines = response.strip().split('\n')

        for line in lines:
            line = line.strip()

            # More flexible pattern matching for numbered items
            # Match patterns like "1.", "1)", "Subtask 1:", etc.
            subtask_match = False
            subtask_number = None

            # Check for numbered patterns
            for i in range(1, 11):
                patterns = [
                    f"{i}.", f"{i})", f"Subtask {i}:", f"SUBTASK {i}:",
                    f"Task {i}:", f"TASK {i}:", f"#{i}", f"Step {i}:"
                ]
                for pattern in patterns:
                    if line.startswith(pattern):
                        subtask_match = True
                        subtask_number = i
                        subtask_title = line[len(pattern):].strip()
                        break
                if subtask_match:
                    break

            if subtask_match and subtask_number:
                # If we were building a previous subtask, add it to our list
                if current_subtask:
                    subtasks.append(current_subtask)

                # Start a new subtask
                current_subtask = {
                    "number": subtask_number,
                    "title": subtask_title,
                    "description": subtask_title,  # Initialize with title, will be updated
                    "full_text": line
                }
            elif current_subtask:
                # Add this line to the current subtask's full text
                current_subtask["full_text"] += "\n" + line

                # Update the description to include more details
                if not line.startswith(('-', '*', '•')):
                    current_subtask["description"] += " " + line

        # Add the last subtask if there is one
        if current_subtask:
            subtasks.append(current_subtask)

        # If we couldn't parse any subtasks with the standard method, try the alternative method
        if not subtasks:
            logger.warning(f"[{self.name}] Could not parse subtasks with standard method, trying alternative method")
            return self._parse_subtasks_alternative(response)

        # Ensure we have exactly 10 subtasks
        if len(subtasks) != 10:
            logger.warning(f"[{self.name}] Expected 10 subtasks, but got {len(subtasks)}")

            # If we have fewer than 10, pad with empty subtasks
            while len(subtasks) < 10:
                subtask_number = len(subtasks) + 1
                subtasks.append({
                    "number": subtask_number,
                    "title": f"Subtask {subtask_number}",
                    "description": f"Generated subtask {subtask_number}",
                    "full_text": f"{subtask_number}. Generated subtask {subtask_number}"
                })

            # If we have more than 10, truncate
            if len(subtasks) > 10:
                subtasks = subtasks[:10]

        return subtasks

    def _parse_subtasks_alternative(self, response: str) -> List[Dict[str, str]]:
        """
        Alternative parsing method for different response formats.

        Args:
            response: The raw text response from the API

        Returns:
            A list of subtask dictionaries
        """
        subtasks = []

        # Try to split the response into 10 equal parts if all else fails
        if "```" in response:
            # Handle code blocks by removing them temporarily
            code_blocks = []
            response_without_code = ""
            in_code_block = False
            code_block = ""

            for line in response.split('\n'):
                if line.strip().startswith("```"):
                    if in_code_block:
                        code_blocks.append(code_block)
                        code_block = ""
                        in_code_block = False
                    else:
                        in_code_block = True
                elif in_code_block:
                    code_block += line + "\n"
                else:
                    response_without_code += line + "\n"

            response = response_without_code

        # Try to find subtask markers
        markers = [
            "Subtask", "SUBTASK", "Task", "TASK", "Step", "STEP",
            "Part", "PART", "Component", "COMPONENT"
        ]

        for marker in markers:
            # Try to find sections like "Subtask 1:", "Task 2:", etc.
            sections = []
            for i in range(1, 11):
                pattern = f"{marker} {i}:"
                if pattern in response:
                    start_idx = response.find(pattern)
                    # Find the start of the next section or the end of the text
                    next_pattern = f"{marker} {i+1}:"
                    end_idx = response.find(next_pattern) if next_pattern in response else len(response)

                    section_text = response[start_idx:end_idx].strip()
                    sections.append((i, section_text))

            if len(sections) >= 5:  # If we found at least half of the expected sections
                for number, text in sections:
                    title = text.split('\n')[0].replace(f"{marker} {number}:", "").strip()
                    subtasks.append({
                        "number": number,
                        "title": title,
                        "description": title,
                        "full_text": text
                    })
                break

        # If we still don't have enough subtasks, create artificial ones
        if len(subtasks) < 10:
            # Split the response into chunks
            chunks = response.split('\n\n')
            chunk_index = 0

            while len(subtasks) < 10 and chunk_index < len(chunks):
                chunk = chunks[chunk_index].strip()
                if chunk and len(chunk) > 10:  # Only use non-empty, substantial chunks
                    subtask_number = len(subtasks) + 1
                    title = chunk.split('\n')[0][:50]  # Use first line as title, truncate if needed

                    # Check if this chunk is already part of an existing subtask
                    already_included = False
                    for subtask in subtasks:
                        if chunk in subtask["full_text"]:
                            already_included = True
                            break

                    if not already_included:
                        subtasks.append({
                            "number": subtask_number,
                            "title": title,
                            "description": title,
                            "full_text": chunk
                        })

                chunk_index += 1

        # If we still don't have 10 subtasks, create generic ones
        while len(subtasks) < 10:
            subtask_number = len(subtasks) + 1
            subtasks.append({
                "number": subtask_number,
                "title": f"Subtask {subtask_number}",
                "description": f"Generated subtask {subtask_number}",
                "full_text": f"Subtask {subtask_number}: Generated subtask {subtask_number}"
            })

        # If we have more than 10, truncate
        if len(subtasks) > 10:
            subtasks = subtasks[:10]

        return subtasks


class ThinkerAgent(Agent):
    """
    Thinker Agent that solves a specific subtask.
    """

    def __init__(self, api_key: str, thinker_id: int):
        """
        Initialize a Thinker Agent.

        Args:
            api_key: The API key for this agent
            thinker_id: The ID of this thinker (1-10)
        """
        super().__init__(api_key, f"Thinker_{thinker_id}")
        self.thinker_id = thinker_id

    def process(self, subtask: Dict[str, str], temperature: float = 0.7) -> Dict[str, Any]:
        """
        Solve the assigned subtask.

        Args:
            subtask: The subtask to solve
            temperature: Controls creativity level (0.1-1.0)

        Returns:
            A dictionary containing the solution and metadata
        """
        logger.info(f"[{self.name}] Processing subtask {subtask['number']}: {subtask['title']}")

        # Format the prompt with the subtask
        prompt = prompts.THINKER_PROMPT.format(
            subtask=subtask['full_text'],
            subtask_number=subtask['number']
        )

        # Generate the solution with the specified temperature
        solution = self.api_client.generate_content(prompt, temperature=temperature)

        if not solution:
            logger.error(f"[{self.name}] Failed to generate solution for subtask {subtask['number']}")
            return {
                "subtask": subtask,
                "solution": "# Error: Failed to generate solution",
                "success": False
            }

        logger.info(f"[{self.name}] Successfully generated solution for subtask {subtask['number']}")

        return {
            "subtask": subtask,
            "solution": solution,
            "success": True
        }


class MidCombinerAgent(Agent):
    """
    Mid-Level Combiner Agent that merges 5 thinker outputs.
    """

    def __init__(self, api_key: str, combiner_id: int):
        """
        Initialize a Mid-Level Combiner Agent.

        Args:
            api_key: The API key for this agent
            combiner_id: The ID of this combiner (1-2)
        """
        super().__init__(api_key, f"Mid_Combiner_{combiner_id}")
        self.combiner_id = combiner_id

    def process(self, thinker_results: List[Dict[str, Any]], temperature: float = 0.7) -> Dict[str, Any]:
        """
        Merge 5 thinker outputs into a coherent code block.

        Args:
            thinker_results: List of results from 5 thinkers
            temperature: Controls creativity level (0.1-1.0)

        Returns:
            A dictionary containing the merged code and metadata
        """
        logger.info(f"[{self.name}] Merging outputs from {len(thinker_results)} thinkers")

        # Extract subtask descriptions and solutions
        subtask_descriptions = "\n".join([
            f"{result['subtask']['number']}. {result['subtask']['title']}"
            for result in thinker_results
        ])

        code_implementations = "\n\n".join([
            f"--- SUBTASK {result['subtask']['number']}: {result['subtask']['title']} ---\n\n{result['solution']}"
            for result in thinker_results
        ])

        # Format the prompt
        prompt = prompts.MID_COMBINER_PROMPT.format(
            subtask_descriptions=subtask_descriptions,
            code_implementations=code_implementations
        )

        # Generate the merged code with the specified temperature
        merged_code = self.api_client.generate_content(prompt, temperature=temperature)

        if not merged_code:
            logger.error(f"[{self.name}] Failed to merge thinker outputs")
            return {
                "merged_code": "# Error: Failed to merge code",
                "success": False,
                "thinker_results": thinker_results
            }

        logger.info(f"[{self.name}] Successfully merged thinker outputs")

        return {
            "merged_code": merged_code,
            "success": True,
            "thinker_results": thinker_results
        }


class FinalCombinerAgent(Agent):
    """
    Final Combiner Agent that merges the outputs from the mid-level combiners.
    """

    def __init__(self, api_key: str):
        """Initialize the Final Combiner Agent."""
        super().__init__(api_key, "Final_Combiner")

    def process(self, mid_combiner_results: List[Dict[str, Any]], original_task: str, temperature: float = 0.7) -> Dict[str, Any]:
        """
        Merge the outputs from the mid-level combiners into the final solution.

        Args:
            mid_combiner_results: Results from the mid-level combiners
            original_task: The original user task
            temperature: Controls creativity level (0.1-1.0)

        Returns:
            A dictionary containing the final solution and metadata
        """
        logger.info(f"[{self.name}] Merging outputs from {len(mid_combiner_results)} mid-level combiners")

        # Extract the merged code from each mid-level combiner
        first_code_block = mid_combiner_results[0]["merged_code"]
        second_code_block = mid_combiner_results[1]["merged_code"]

        # Format the prompt
        prompt = prompts.FINAL_COMBINER_PROMPT.format(
            first_code_block=first_code_block,
            second_code_block=second_code_block,
            original_task=original_task
        )

        # Generate the final solution with the specified temperature
        final_solution = self.api_client.generate_content(prompt, temperature=temperature)

        if not final_solution:
            logger.error(f"[{self.name}] Failed to generate final solution")
            return {
                "final_solution": "# Error: Failed to generate final solution",
                "success": False,
                "mid_combiner_results": mid_combiner_results
            }

        logger.info(f"[{self.name}] Successfully generated final solution")

        return {
            "final_solution": final_solution,
            "success": True,
            "mid_combiner_results": mid_combiner_results
        }
