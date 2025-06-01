from flask import Flask, render_template, request, jsonify
from orchestrator import ParadoxGPTOrchestrator
import logging
import sys
import os
from config import validate_api_keys

# Configure logging
try:
    # Get the directory where the script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    log_dir = os.path.join(script_dir, "logs")

    # Create logs directory if it doesn't exist
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    log_file = os.path.join(log_dir, "paradoxgpt.log")

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )
except Exception as e:
    # Fallback to console-only logging if file logging fails
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler(sys.stdout)]
    )
    logging.warning(f"Could not set up file logging: {str(e)}. Using console logging only.")

logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize the orchestrator
try:
    orchestrator = ParadoxGPTOrchestrator()
except Exception as e:
    logger.error(f"Error initializing orchestrator: {str(e)}")
    raise

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
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

if __name__ == '__main__':
    if not validate_api_keys():
        logger.error("Missing required API keys. Please check your .env file.")
        sys.exit(1)
    
    import socket
    import time
    
    def is_port_available(port, host='127.0.0.1'):
        """Check if a port is available for binding."""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                s.bind((host, port))
                return True
        except (socket.error, OSError):
            return False
    
    def find_available_port(start_port=8000, max_attempts=50):
        """Find an available port starting from start_port."""
        # Try higher port ranges to avoid Windows reserved ports
        port_ranges = [
            range(8000, 8050),  # Common development ports
            range(3000, 3050),  # Alternative development ports
            range(9000, 9050),  # High range ports
            range(8080, 8130),  # HTTP alternative ports
        ]
        
        for port_range in port_ranges:
            for port in port_range:
                if is_port_available(port):
                    return port
        return None
    
    def start_server_with_fallback():
        """Start server with multiple fallback options for Windows."""
        try:
            # Find an available port
            available_port = find_available_port()
            
            if available_port is None:
                logger.error("Could not find any available port to start the server")
                logger.error("Please try running as administrator or check firewall settings")
                return False
            
            logger.info(f"Starting server on port {available_port}...")
            logger.info(f"Server will be available at: http://127.0.0.1:{available_port}")
            
            # Try different server configurations for Windows compatibility
            server_configs = [
                {'debug': False, 'threaded': True, 'use_reloader': False},
                {'debug': False, 'threaded': False, 'use_reloader': False, 'processes': 1},
                {'debug': False, 'threaded': True, 'use_reloader': False, 'host': '0.0.0.0'},
            ]
            
            for i, config in enumerate(server_configs):
                try:
                    logger.info(f"Trying server configuration {i+1}...")
                    app.run(port=available_port, host='127.0.0.1', **config)
                    return True
                except Exception as e:
                    logger.warning(f"Server configuration {i+1} failed: {str(e)}")
                    if i < len(server_configs) - 1:
                        logger.info("Trying next configuration...")
                        time.sleep(1)
                    else:
                        raise e
            
            return False
            
        except Exception as e:
            logger.error(f"All server configurations failed: {str(e)}")
            return False
    
    try:
        success = start_server_with_fallback()
        if not success:
            logger.error("Failed to start server with any configuration")
            logger.error("\nTroubleshooting steps:")
            logger.error("1. Run Command Prompt as Administrator")
            logger.error("2. Check Windows Defender Firewall settings")
            logger.error("3. Disable any VPN or proxy software temporarily")
            logger.error("4. Try running: netsh int ipv4 reset")
            logger.error("5. Restart your computer")
            sys.exit(1)
        
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error("Please try running as administrator")
        sys.exit(1) 