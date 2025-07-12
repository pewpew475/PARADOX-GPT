from flask import Flask, render_template, request, jsonify
from orchestrator import ParadoxGPTOrchestrator
import logging
import sys
import os
import re
from config import validate_api_keys
from firebase_admin_config import verify_token, save_chat, get_user_chats, is_firebase_ready
from functools import wraps

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

def is_mobile_device(user_agent):
    """
    Enhanced mobile device detection
    """
    if not user_agent:
        return False

    user_agent_lower = user_agent.lower()

    # Primary mobile patterns - most reliable
    primary_mobile_patterns = [
        r'android.*mobile', r'iphone', r'ipod', r'blackberry',
        r'windows phone', r'mobile.*safari', r'opera.*mini',
        r'opera.*mobi', r'mobile.*firefox'
    ]

    # Check primary patterns first
    for pattern in primary_mobile_patterns:
        if re.search(pattern, user_agent_lower):
            return True

    # Tablet patterns (also considered mobile for our purposes)
    tablet_patterns = [
        r'ipad', r'android(?!.*mobile)', r'tablet', r'kindle',
        r'silk', r'playbook', r'bb10'
    ]

    for pattern in tablet_patterns:
        if re.search(pattern, user_agent_lower):
            return True

    # Additional mobile keywords
    mobile_keywords = [
        'mobile', 'phone', 'mobi', 'mini', 'palm', 'pocket',
        'psp', 'symbian', 'smartphone', 'treo', 'up.browser',
        'up.link', 'vodafone', 'wap', 'wireless', 'nokia',
        'samsung', 'htc', 'lg', 'motorola', 'sony'
    ]

    # Check for mobile keywords
    for keyword in mobile_keywords:
        if keyword in user_agent_lower:
            return True

    # Check for specific mobile OS versions
    mobile_os_patterns = [
        r'android \d+\.\d+', r'ios \d+\.\d+', r'windows phone \d+\.\d+'
    ]

    for pattern in mobile_os_patterns:
        if re.search(pattern, user_agent_lower):
            return True

    return False

# Authentication decorator
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if Firebase is ready
        if not is_firebase_ready():
            logger.warning("Firebase not initialized, allowing unauthenticated access")
            return f(*args, **kwargs)

        # Get authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No valid authorization token provided'}), 401

        # Extract token
        token = auth_header.split(' ')[1]

        # Verify token
        user_info = verify_token(token)
        if not user_info:
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Add user info to request context
        request.user = user_info
        return f(*args, **kwargs)

    return decorated_function

# Optional authentication decorator (allows both authenticated and unauthenticated access)
def optional_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        request.user = None

        # Check if Firebase is ready
        if not is_firebase_ready():
            return f(*args, **kwargs)

        # Get authorization header
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
except Exception as e:
    logger.error(f"Error initializing orchestrator: {str(e)}")
    raise

@app.route('/')
def home():
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

    # Check for manual mobile override in URL parameters
    force_mobile = request.args.get('mobile', '').lower() in ['true', '1', 'yes']
    force_desktop = request.args.get('desktop', '').lower() in ['true', '1', 'yes']

    # Get user agent and other headers for debugging
    user_agent = request.headers.get('User-Agent', '')
    accept_header = request.headers.get('Accept', '')

    # Detect if request is from mobile device
    is_mobile = False
    detection_method = 'default'

    if force_mobile:
        is_mobile = True
        detection_method = 'forced_mobile'
    elif force_desktop:
        is_mobile = False
        detection_method = 'forced_desktop'
    else:
        is_mobile = is_mobile_device(user_agent)
        detection_method = 'auto_detected'

    # Enhanced logging for debugging
    logger.info(f"=== Device Detection Debug ===")
    logger.info(f"User Agent: {user_agent}")
    logger.info(f"Accept Header: {accept_header}")
    logger.info(f"Is Mobile: {is_mobile}")
    logger.info(f"Detection Method: {detection_method}")
    logger.info(f"Request Args: {dict(request.args)}")
    logger.info(f"All Headers: {dict(request.headers)}")
    logger.info(f"==============================")

    # Serve appropriate template based on device
    if is_mobile:
        logger.info("Serving mobile template")
        return render_template('mobile.html', firebase_config=firebase_config, is_mobile=True)
    else:
        logger.info("Serving desktop template")
        return render_template('index.html', firebase_config=firebase_config, is_mobile=False)

@app.route('/mobile')
def mobile():
    """Dedicated mobile route"""
    firebase_config = {
        'api_key': os.getenv('FIREBASE_WEB_API_KEY'),
        'auth_domain': os.getenv('FIREBASE_WEB_AUTH_DOMAIN'),
        'project_id': os.getenv('FIREBASE_WEB_PROJECT_ID'),
        'storage_bucket': os.getenv('FIREBASE_WEB_STORAGE_BUCKET'),
        'messaging_sender_id': os.getenv('FIREBASE_WEB_MESSAGING_SENDER_ID'),
        'app_id': os.getenv('FIREBASE_WEB_APP_ID'),
        'measurement_id': os.getenv('FIREBASE_WEB_MEASUREMENT_ID')
    }

    logger.info("Serving mobile template via /mobile route")
    return render_template('mobile.html', firebase_config=firebase_config, is_mobile=True)

@app.route('/debug')
def debug_device():
    """Debug endpoint to check device detection"""
    user_agent = request.headers.get('User-Agent', '')
    is_mobile = is_mobile_device(user_agent)

    debug_info = {
        'user_agent': user_agent,
        'is_mobile_detected': is_mobile,
        'all_headers': dict(request.headers),
        'request_args': dict(request.args),
        'mobile_url': request.url_root + '?mobile=true',
        'desktop_url': request.url_root + '?desktop=true'
    }

    return f"""
    <html>
    <head>
        <title>Device Detection Debug</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            .info {{ background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px; }}
            .mobile {{ background: #e8f5e8; }}
            .desktop {{ background: #f5e8e8; }}
            pre {{ background: #f8f8f8; padding: 10px; overflow-x: auto; }}
            a {{ display: inline-block; margin: 5px; padding: 10px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <h1>Device Detection Debug</h1>
        <div class="info {'mobile' if is_mobile else 'desktop'}">
            <h2>Detection Result: {'MOBILE' if is_mobile else 'DESKTOP'}</h2>
        </div>

        <div class="info">
            <h3>User Agent:</h3>
            <pre>{user_agent}</pre>
        </div>

        <div class="info">
            <h3>Test Links:</h3>
            <a href="{debug_info['mobile_url']}">Force Mobile Version</a>
            <a href="{debug_info['desktop_url']}">Force Desktop Version</a>
            <a href="/">Auto Detect</a>
        </div>

        <div class="info">
            <h3>All Request Headers:</h3>
            <pre>{str(debug_info['all_headers'])}</pre>
        </div>

        <div class="info">
            <h3>Request Arguments:</h3>
            <pre>{str(debug_info['request_args'])}</pre>
        </div>
    </body>
    </html>
    """

@app.route('/mobile-content')
def mobile_content():
    """Serve just the mobile HTML content for dynamic loading"""
    firebase_config = {
        'api_key': os.getenv('FIREBASE_WEB_API_KEY'),
        'auth_domain': os.getenv('FIREBASE_WEB_AUTH_DOMAIN'),
        'project_id': os.getenv('FIREBASE_WEB_PROJECT_ID'),
        'storage_bucket': os.getenv('FIREBASE_WEB_STORAGE_BUCKET'),
        'messaging_sender_id': os.getenv('FIREBASE_WEB_MESSAGING_SENDER_ID'),
        'app_id': os.getenv('FIREBASE_WEB_APP_ID'),
        'measurement_id': os.getenv('FIREBASE_WEB_MEASUREMENT_ID')
    }

    # Return just the body content of mobile template
    mobile_body = f"""
    <!-- Mobile App Container -->
    <div class="mobile-app">
        <!-- Mobile Header -->
        <header class="mobile-header">
            <button class="menu-btn" id="menuBtn" aria-label="Menu">
                <i class="fas fa-bars"></i>
            </button>
            <h1 class="app-title">ParadoxGPT</h1>
            <button class="user-btn" id="userBtn" aria-label="User menu">
                <i class="fas fa-user"></i>
            </button>
        </header>

        <!-- Mobile Sidebar -->
        <aside class="mobile-sidebar" id="mobileSidebar">
            <div class="sidebar-header">
                <h2>Chat History</h2>
                <button class="close-sidebar" id="closeSidebar" aria-label="Close menu">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <button class="new-chat-mobile" id="newChatMobile">
                <i class="fas fa-plus"></i>
                New Chat
            </button>

            <div class="chat-history-mobile" id="chatHistoryMobile">
                <!-- Chat history will be populated here -->
            </div>

            <div class="sidebar-footer-mobile">
                <!-- User profile for mobile -->
                <div id="userProfileMobile" class="user-profile-mobile" style="display: none;">
                    <div class="user-avatar-mobile" id="userAvatarMobile"></div>
                    <div class="user-info-mobile">
                        <p class="user-name-mobile" id="userNameMobile"></p>
                        <p class="user-email-mobile" id="userEmailMobile"></p>
                    </div>
                    <button id="logoutBtnMobile" class="logout-btn-mobile">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>

                <!-- Login section for mobile -->
                <div id="loginSectionMobile" class="login-section-mobile">
                    <button id="loginBtnMobile" class="login-btn-mobile">
                        <i class="fas fa-sign-in-alt"></i>
                        Sign In to Save Chats
                    </button>
                </div>
            </div>
        </aside>

        <!-- Mobile Overlay -->
        <div class="mobile-overlay" id="mobileOverlay"></div>

        <!-- Main Chat Area -->
        <main class="mobile-main">
            <div class="chat-container-mobile" id="chatContainerMobile">
                <!-- Welcome Screen -->
                <div class="welcome-mobile" id="welcomeMobile">
                    <div class="welcome-icon">
                        <i class="fas fa-brain"></i>
                    </div>
                    <h2>Welcome to ParadoxGPT</h2>
                    <p>Your AI coding assistant</p>
                    <div class="quick-actions">
                        <button class="quick-action" data-prompt="Help me write a Python function">
                            <i class="fab fa-python"></i>
                            Python Help
                        </button>
                        <button class="quick-action" data-prompt="Create a React component">
                            <i class="fab fa-react"></i>
                            React Code
                        </button>
                        <button class="quick-action" data-prompt="Debug my JavaScript code">
                            <i class="fab fa-js"></i>
                            Debug JS
                        </button>
                        <button class="quick-action" data-prompt="Explain this code">
                            <i class="fas fa-question-circle"></i>
                            Explain Code
                        </button>
                    </div>
                </div>

                <!-- Messages will be added here -->
            </div>
        </main>

        <!-- Mobile Input Area -->
        <div class="mobile-input-area">
            <form class="mobile-chat-form" id="mobileChatForm">
                <div class="input-container-mobile">
                    <textarea
                        class="message-input-mobile"
                        id="messageInputMobile"
                        placeholder="Ask me anything..."
                        rows="1"
                        maxlength="4000"
                    ></textarea>
                    <button type="submit" class="send-btn-mobile" id="sendBtnMobile">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </form>
        </div>

        <!-- Mobile Loading -->
        <div class="mobile-loading" id="mobileLoading">
            <div class="loading-spinner-mobile">
                <div class="spinner"></div>
            </div>
            <p>Thinking...</p>
        </div>
    </div>

    <!-- Mobile Auth Modal -->
    <div id="authModalMobile" class="auth-modal-mobile">
        <div class="auth-content-mobile">
            <div class="auth-header-mobile">
                <h3>Sign In</h3>
                <button class="auth-close-mobile" id="authCloseMobile">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="auth-body-mobile">
                <!-- Auth content will be populated by JavaScript -->
            </div>
        </div>
    </div>

    <!-- Firebase Config Script -->
    <script type="module">
        import {{ initializeApp }} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        import {{ getAuth }} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
        import {{ getFirestore }} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
        import {{ getAnalytics }} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

        const firebaseConfig = {{
            apiKey: "{firebase_config.get('api_key', 'your-api-key-here')}",
            authDomain: "{firebase_config.get('auth_domain', 'your-project-id.firebaseapp.com')}",
            projectId: "{firebase_config.get('project_id', 'your-project-id')}",
            storageBucket: "{firebase_config.get('storage_bucket', 'your-project-id.appspot.com')}",
            messagingSenderId: "{firebase_config.get('messaging_sender_id', 'your-sender-id')}",
            appId: "{firebase_config.get('app_id', 'your-app-id')}",
            measurementId: "{firebase_config.get('measurement_id', '')}"
        }};

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        window.firebaseApp = app;
        window.firebaseAuth = auth;
        window.firebaseDb = db;
        window.firebaseReady = true;
        window.dispatchEvent(new CustomEvent('firebaseReady'));

        try {{
            window.firebaseAnalytics = getAnalytics(app);
        }} catch (error) {{
            console.log('Analytics not available:', error);
        }}
    </script>
    """

    return mobile_body

@app.route('/api/chat', methods=['POST'])
@optional_auth
def chat():
    try:
        data = request.json
        task = data.get('message')

        if not task:
            return jsonify({'error': 'No message provided'}), 400

        # Save user message if authenticated
        if hasattr(request, 'user') and request.user:
            save_chat(request.user['uid'], task, is_user=True)

        # Process the task
        result = orchestrator.process_task(task)

        if "final_solution" in result and result["final_solution"]:
            # Detect content type for enhanced frontend handling
            content = result["final_solution"]
            content_type = detect_content_type(content)

            # Save AI response if authenticated
            if hasattr(request, 'user') and request.user:
                save_chat(request.user['uid'], content, is_user=False)

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
                    'generated_by': 'ParadoxGPT'
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

@app.route('/api/chat/history', methods=['GET'])
@require_auth
def get_chat_history():
    """Get user's chat history"""
    try:
        limit = request.args.get('limit', 50, type=int)
        user_id = request.user['uid']

        logger.info(f"Chat history request from user: {user_id}, limit: {limit}")

        chats = get_user_chats(user_id, limit)

        logger.info(f"Retrieved {len(chats)} chats for user {user_id}")

        return jsonify({
            'success': True,
            'chats': chats,
            'count': len(chats)
        })

    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/stats', methods=['GET'])
@require_auth
def get_user_stats():
    """Get user statistics"""
    try:
        from firebase_admin_config import get_stats
        stats = get_stats(request.user['uid'])

        return jsonify({
            'success': True,
            'stats': stats
        })

    except Exception as e:
        logger.error(f"Error getting user stats: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/cleanup', methods=['POST'])
def cleanup_expired_chats():
    """Clean up expired chat messages (admin endpoint)"""
    try:
        from firebase_admin_config import cleanup_expired
        deleted_count = cleanup_expired()

        return jsonify({
            'success': True,
            'deleted_count': deleted_count
        })

    except Exception as e:
        logger.error(f"Error cleaning up chats: {str(e)}")
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