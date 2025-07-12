#!/usr/bin/env python3
"""
Alternative server launcher using waitress for better Windows compatibility.
Run this if app.py fails to start due to socket permission issues.
"""

import sys
import os
import logging
from config import validate_api_keys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

def find_available_port(start_port=8000, max_attempts=50):
    """Find an available port starting from start_port."""
    import socket
    
    port_ranges = [
        range(8000, 8050),
        range(3000, 3050),
        range(9000, 9050),
        range(8080, 8130),
    ]
    
    for port_range in port_ranges:
        for port in port_range:
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                    s.bind(('127.0.0.1', port))
                    return port
            except (socket.error, OSError):
                continue
    return None

def main():
    """Main function to start the server."""
    if not validate_api_keys():
        logger.error("Missing required API keys. Please check your .env file.")
        sys.exit(1)
    
    # Try to use waitress server (more Windows-friendly)
    try:
        from waitress import serve
        from app import app
        
        port = find_available_port()
        if port is None:
            logger.error("Could not find any available port")
            sys.exit(1)
        
        logger.info(f"Starting Waitress server on port {port}...")
        logger.info(f"Server will be available at: http://127.0.0.1:{port}")
        logger.info("Press Ctrl+C to stop the server")
        
        serve(app, host='127.0.0.1', port=port, threads=4)
        
    except ImportError:
        logger.warning("Waitress not installed. Installing...")
        try:
            import subprocess
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'waitress'])
            logger.info("Waitress installed successfully. Please run this script again.")
        except Exception as e:
            logger.error(f"Failed to install waitress: {e}")
            logger.info("Falling back to Flask development server...")
            fallback_to_flask()
    except Exception as e:
        logger.error(f"Waitress server failed: {e}")
        logger.info("Falling back to Flask development server...")
        fallback_to_flask()

def fallback_to_flask():
    """Fallback to Flask development server."""
    try:
        from app import app
        
        port = find_available_port()
        if port is None:
            logger.error("Could not find any available port")
            sys.exit(1)
        
        logger.info(f"Starting Flask development server on port {port}...")
        logger.info(f"Server will be available at: http://127.0.0.1:{port}")
        
        app.run(debug=False, port=port, host='127.0.0.1', threaded=True, use_reloader=False)
        
    except Exception as e:
        logger.error(f"Flask server also failed: {e}")
        logger.error("Please try running as administrator or check firewall settings")
        sys.exit(1)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)