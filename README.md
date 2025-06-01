# ParadoxGPT

A distributed, multi-agent code generation system using the Gemini-2.0-Flash API.

## Overview

ParadoxGPT is a distributed system that uses multiple AI agents to generate code solutions for complex programming tasks. The system works by:

1. Dividing a complex coding task into 10 manageable subtasks
2. Processing each subtask in parallel with dedicated "Thinker" agents
3. Combining the results in a hierarchical manner to produce a cohesive solution

## Architecture

The system consists of 14 separate AI agents, each with its own dedicated Gemini-2.0-Flash API key:

- **1 Task Divider**: Splits the user request into 10 subtasks
- **10 Thinkers**: Each solves one subtask independently
- **2 Mid-Level Combiners**: Each combines the output of 5 Thinkers
- **1 Final Combiner**: Merges the output of the 2 Mid-Level Combiners

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/paradoxgpt.git
   cd paradoxgpt
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Create a `.env` file with your API keys:
   ```
   DIVIDER_API_KEY=your_divider_api_key_here
   THINKER_1_API_KEY=your_thinker_1_api_key_here
   ...
   FINAL_COMBINER_API_KEY=your_final_combiner_api_key_here
   ```

## Usage

### Command Line

You can use ParadoxGPT from the command line:

```
python main.py --task "Create a Python function that sorts a list of dictionaries by a specified key"
```

Or provide a task from a file:

```
python main.py --file task.txt
```

### Python API

You can also use ParadoxGPT as a Python module:

```python
from orchestrator import ParadoxGPTOrchestrator
from utils import save_result_to_file, print_summary

# Initialize the orchestrator
orchestrator = ParadoxGPTOrchestrator()

# Process a task
task = "Create a Python function that sorts a list of dictionaries by a specified key"
result = orchestrator.process_task(task)

# Save the result to a file
output_file = save_result_to_file(result)

# Print a summary of the result
print_summary(result)
```

## Output

ParadoxGPT generates two output files:

1. `solution_TIMESTAMP.py`: The generated code solution
2. `metadata_TIMESTAMP.json`: Metadata about the generation process

## License

[MIT License](LICENSE)

## Acknowledgements

This project uses the Gemini-2.0-Flash API from Google.
