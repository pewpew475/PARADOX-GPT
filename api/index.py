from flask import Flask, render_template, request, jsonify
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from orchestrator import ParadoxGPTOrchestrator
import logging
from config import validate_api_keys

# Configure logging for Vercel
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

app = Flask(__name__, 
           template_folder=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'templates'),
           static_folder=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static'))

# Initialize the orchestrator
try:
    orchestrator = ParadoxGPTOrchestrator()
except Exception as e:
    logger.error(f"Error initializing orchestrator: {str(e)}")
    orchestrator = None

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        if orchestrator is None:
            return jsonify({'error': 'Service temporarily unavailable'}), 503
            
        data = request.json
        task = data.get('message')

        if not task:
            return jsonify({'error': 'No message provided'}), 400

        # Process the task
        result = orchestrator.process_task(task)

        if "final_solution" in result and result["final_solution"]:
            # Detect content type for enhanced frontend handling
            content = result["final_solution"]
            content_type = detect_content_type(content)

            response = {
                'success': True,
                'message': content,
                'content_type': content_type,
                'metadata': {
                    'has_html': content_type == 'html' or 'html' in content_type,
                    'has_code': '```' in content,
                    'generated_by': 'ParadoxGPT'
                }
            }
        else:
            response = {
                'success': False,
                'message': result.get('error', 'Failed to generate a solution'),
                'content_type': 'text',
                'metadata': {
                    'generated_by': 'ParadoxGPT'
                }
            }

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({'error': str(e)}), 500

def detect_content_type(content):
    """Detect the type of content for enhanced frontend handling."""
    content_lower = content.lower()

    # Check for HTML content
    if ('<!doctype html' in content_lower or
        '<html' in content_lower or
        ('<div' in content_lower and '<style' in content_lower) or
        ('```html' in content_lower)):
        return 'html'

    # Check for other code types
    if '```' in content:
        # Extract language from code blocks
        import re
        code_blocks = re.findall(r'```(\w+)', content)
        if code_blocks:
            return f"code_{code_blocks[0]}"
        return 'code'

    # Default to text
    return 'text'

# This is the entry point for Vercel
def handler(request):
    return app(request.environ, lambda status, headers: None)

if __name__ == '__main__':
    app.run(debug=True)
