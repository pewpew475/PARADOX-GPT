from flask import Flask, render_template, request, jsonify
import sys
import os
from functools import wraps

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from orchestrator import ParadoxGPTOrchestrator
    from config import validate_api_keys
    from firebase_admin_config import verify_token, save_chat, get_user_chats, is_firebase_ready
except ImportError as e:
    print(f"Import error: {e}")
    # Create dummy functions for missing imports
    def verify_token(token): return None
    def save_chat(*args, **kwargs): pass
    def get_user_chats(*args, **kwargs): return []
    def is_firebase_ready(): return False

import logging

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

# Authentication decorators
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_firebase_ready():
            logger.warning("Firebase not initialized, allowing unauthenticated access")
            return f(*args, **kwargs)

        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No valid authorization token provided'}), 401

        token = auth_header.split(' ')[1]
        user_info = verify_token(token)
        if not user_info:
            return jsonify({'error': 'Invalid or expired token'}), 401

        request.user = user_info
        return f(*args, **kwargs)
    return decorated_function

def optional_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            user_info = verify_token(token)
            if user_info:
                request.user = user_info
        return f(*args, **kwargs)
    return decorated_function

# Initialize the orchestrator
try:
    orchestrator = ParadoxGPTOrchestrator()
    logger.info("Orchestrator initialized successfully")
except Exception as e:
    logger.error(f"Error initializing orchestrator: {str(e)}")
    orchestrator = None

@app.route('/')
def home():
    try:
        # Firebase frontend configuration from environment variables
        firebase_config = {
            'api_key': os.getenv('FIREBASE_WEB_API_KEY'),
            'auth_domain': os.getenv('FIREBASE_WEB_AUTH_DOMAIN'),
            'project_id': os.getenv('FIREBASE_WEB_PROJECT_ID'),
            'storage_bucket': os.getenv('FIREBASE_WEB_STORAGE_BUCKET'),
            'messaging_sender_id': os.getenv('FIREBASE_WEB_MESSAGING_SENDER_ID'),
            'app_id': os.getenv('FIREBASE_WEB_APP_ID'),
            'measurement_id': os.getenv('FIREBASE_WEB_MEASUREMENT_ID')
        }

        logger.info(f"Firebase config loaded: {list(firebase_config.keys())}")
        return render_template('index.html', firebase_config=firebase_config)
    except Exception as e:
        logger.error(f"Error in home route: {str(e)}")
        return f"Error loading application: {str(e)}", 500

@app.route('/api/chat', methods=['POST'])
@optional_auth
def chat():
    try:
        if orchestrator is None:
            return jsonify({'error': 'Service temporarily unavailable'}), 503

        data = request.json
        task = data.get('message')

        if not task:
            return jsonify({'error': 'No message provided'}), 400

        # Save user message if authenticated
        if hasattr(request, 'user') and request.user:
            try:
                save_chat(request.user['uid'], task, is_user=True)
            except Exception as e:
                logger.warning(f"Failed to save user message: {e}")

        # Process the task
        result = orchestrator.process_task(task)

        if "final_solution" in result and result["final_solution"]:
            # Detect content type for enhanced frontend handling
            content = result["final_solution"]
            content_type = detect_content_type(content)

            # Save AI response if authenticated
            if hasattr(request, 'user') and request.user:
                try:
                    save_chat(request.user['uid'], content, is_user=False)
                except Exception as e:
                    logger.warning(f"Failed to save AI response: {e}")

            response = {
                'success': True,
                'message': content,
                'content_type': content_type,
                'metadata': {
                    'has_html': content_type == 'html' or 'html' in content_type,
                    'has_code': '```' in content,
                    'generated_by': 'ParadoxGPT',
                    'user_authenticated': hasattr(request, 'user') and request.user is not None
                }
            }
        else:
            response = {
                'success': False,
                'message': result.get('error', 'Failed to generate a solution'),
                'content_type': 'text',
                'metadata': {
                    'generated_by': 'ParadoxGPT',
                    'user_authenticated': hasattr(request, 'user') and request.user is not None
                }
            }

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/verify', methods=['POST'])
def verify_auth():
    """Verify user authentication token"""
    try:
        data = request.json
        token = data.get('token')

        if not token:
            return jsonify({'error': 'No token provided'}), 400

        user_info = verify_token(token)
        if user_info:
            return jsonify({
                'success': True,
                'user': user_info
            })
        else:
            return jsonify({'error': 'Invalid token'}), 401

    except Exception as e:
        logger.error(f"Error verifying auth: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chats', methods=['GET'])
@require_auth
def get_chats():
    """Get user's chat history"""
    try:
        user_id = request.user['uid']
        chats = get_user_chats(user_id)
        return jsonify({'success': True, 'chats': chats})
    except Exception as e:
        logger.error(f"Error getting chats: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    try:
        status = {
            'status': 'healthy',
            'orchestrator': orchestrator is not None,
            'firebase': is_firebase_ready(),
            'environment': os.getenv('FLASK_ENV', 'unknown')
        }
        return jsonify(status)
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

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

# Add error handling for missing environment variables
@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({
        'error': 'Internal server error',
        'message': 'Please check server logs for details'
    }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

# This is the entry point for Vercel - Flask app should be exposed as 'app'
# No handler function needed for WSGI applications

# Log startup information
logger.info("ParadoxGPT API starting...")
logger.info(f"Orchestrator status: {'Ready' if orchestrator else 'Failed'}")
logger.info(f"Firebase status: {'Ready' if is_firebase_ready() else 'Not ready'}")

if __name__ == '__main__':
    app.run(debug=True)
