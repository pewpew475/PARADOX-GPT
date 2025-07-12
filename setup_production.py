#!/usr/bin/env python3
"""
ParadoxGPT Production Environment Setup Script
Cross-platform script to set up environment variables for production deployment
"""

import json
import os
import sys
import base64
import secrets
from pathlib import Path

def print_status(message):
    print(f"✓ {message}")

def print_warning(message):
    print(f"⚠ {message}")

def print_error(message):
    print(f"✗ {message}")

def print_info(message):
    print(f"ℹ {message}")

def validate_firebase_json(json_file):
    """Validate Firebase service account JSON file"""
    if not os.path.exists(json_file):
        print_error(f"Firebase service account file not found: {json_file}")
        return False
    
    try:
        with open(json_file, 'r') as f:
            data = json.load(f)
        
        required_fields = ["type", "project_id", "private_key_id", "private_key", "client_email", "client_id"]
        for field in required_fields:
            if field not in data:
                print_error(f"Missing required field '{field}' in Firebase service account file")
                return False
        
        print_status("Firebase service account file is valid")
        return True
        
    except json.JSONDecodeError:
        print_error("Invalid JSON in Firebase service account file")
        return False
    except Exception as e:
        print_error(f"Error validating Firebase file: {e}")
        return False

def load_firebase_config(json_file):
    """Load Firebase configuration from JSON file"""
    with open(json_file, 'r') as f:
        return json.load(f)

def create_production_env(firebase_config, gemini_key, output_file="production.env"):
    """Create production environment file with individual variables"""
    print_info(f"Creating production environment file: {output_file}")
    
    # Generate a secure secret key
    secret_key = secrets.token_hex(32)
    
    env_content = f"""# ParadoxGPT Production Environment
# Generated automatically - DO NOT COMMIT TO VERSION CONTROL

# =============================================================================
# REQUIRED CONFIGURATION
# =============================================================================

# API Keys
GEMINI_API_KEY={gemini_key}

# =============================================================================
# FIREBASE CONFIGURATION (Individual Environment Variables)
# =============================================================================

FIREBASE_TYPE={firebase_config['type']}
FIREBASE_PROJECT_ID={firebase_config['project_id']}
FIREBASE_PRIVATE_KEY_ID={firebase_config['private_key_id']}
FIREBASE_PRIVATE_KEY="{firebase_config['private_key']}"
FIREBASE_CLIENT_EMAIL={firebase_config['client_email']}
FIREBASE_CLIENT_ID={firebase_config['client_id']}
FIREBASE_AUTH_URI={firebase_config.get('auth_uri', 'https://accounts.google.com/o/oauth2/auth')}
FIREBASE_TOKEN_URI={firebase_config.get('token_uri', 'https://oauth2.googleapis.com/token')}
FIREBASE_AUTH_PROVIDER_X509_CERT_URL={firebase_config.get('auth_provider_x509_cert_url', 'https://www.googleapis.com/oauth2/v1/certs')}
FIREBASE_CLIENT_X509_CERT_URL={firebase_config.get('client_x509_cert_url', '')}
FIREBASE_UNIVERSE_DOMAIN={firebase_config.get('universe_domain', 'googleapis.com')}

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================

# Flask Environment
FLASK_ENV=production
FLASK_DEBUG=false

# Server Settings
PORT=8080
HOST=0.0.0.0

# Security Settings
SECRET_KEY={secret_key}

# =============================================================================
# OPTIONAL CONFIGURATION
# =============================================================================

# Logging Level
LOG_LEVEL=INFO

# Firebase Debug Mode
FIREBASE_DEBUG=false

# Rate Limiting (requests per minute)
RATE_LIMIT=60

# Session Timeout (in seconds)
SESSION_TIMEOUT=3600
"""

    with open(output_file, 'w') as f:
        f.write(env_content)
    
    print_status(f"Production environment file created: {output_file}")

def create_docker_env(firebase_config, gemini_key, output_file="docker.env"):
    """Create Docker environment file with base64 encoded Firebase config"""
    print_info(f"Creating Docker environment file: {output_file}")
    
    # Encode Firebase config as base64
    firebase_json_str = json.dumps(firebase_config)
    firebase_base64 = base64.b64encode(firebase_json_str.encode()).decode()
    
    # Generate a secure secret key
    secret_key = secrets.token_hex(32)
    
    env_content = f"""# ParadoxGPT Docker Environment
# Generated automatically - DO NOT COMMIT TO VERSION CONTROL

GEMINI_API_KEY={gemini_key}
FIREBASE_SERVICE_ACCOUNT_BASE64={firebase_base64}
FLASK_ENV=production
FLASK_DEBUG=false
PORT=8080
HOST=0.0.0.0
SECRET_KEY={secret_key}
LOG_LEVEL=INFO
FIREBASE_DEBUG=false
PYTHONUNBUFFERED=1
"""

    with open(output_file, 'w') as f:
        f.write(env_content)
    
    print_status(f"Docker environment file created: {output_file}")

def create_powershell_script(firebase_config, gemini_key, output_file="set_env_vars.ps1"):
    """Create PowerShell script to set environment variables"""
    print_info(f"Creating PowerShell script: {output_file}")
    
    secret_key = secrets.token_hex(32)
    
    ps_content = f"""# ParadoxGPT Production Environment Variables (PowerShell)
# Run this script to set environment variables for the current session

Write-Host "Setting ParadoxGPT environment variables..." -ForegroundColor Green

# API Keys
$env:GEMINI_API_KEY = "{gemini_key}"

# Firebase Configuration
$env:FIREBASE_TYPE = "{firebase_config['type']}"
$env:FIREBASE_PROJECT_ID = "{firebase_config['project_id']}"
$env:FIREBASE_PRIVATE_KEY_ID = "{firebase_config['private_key_id']}"
$env:FIREBASE_PRIVATE_KEY = "{firebase_config['private_key']}"
$env:FIREBASE_CLIENT_EMAIL = "{firebase_config['client_email']}"
$env:FIREBASE_CLIENT_ID = "{firebase_config['client_id']}"
$env:FIREBASE_AUTH_URI = "{firebase_config.get('auth_uri', 'https://accounts.google.com/o/oauth2/auth')}"
$env:FIREBASE_TOKEN_URI = "{firebase_config.get('token_uri', 'https://oauth2.googleapis.com/token')}"
$env:FIREBASE_AUTH_PROVIDER_X509_CERT_URL = "{firebase_config.get('auth_provider_x509_cert_url', 'https://www.googleapis.com/oauth2/v1/certs')}"
$env:FIREBASE_CLIENT_X509_CERT_URL = "{firebase_config.get('client_x509_cert_url', '')}"
$env:FIREBASE_UNIVERSE_DOMAIN = "{firebase_config.get('universe_domain', 'googleapis.com')}"

# Server Configuration
$env:FLASK_ENV = "production"
$env:FLASK_DEBUG = "false"
$env:PORT = "8080"
$env:HOST = "0.0.0.0"
$env:SECRET_KEY = "{secret_key}"
$env:LOG_LEVEL = "INFO"
$env:FIREBASE_DEBUG = "false"

Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host "You can now run: python app.py" -ForegroundColor Yellow
"""

    with open(output_file, 'w') as f:
        f.write(ps_content)
    
    print_status(f"PowerShell script created: {output_file}")

def main():
    print("🚀 ParadoxGPT Production Environment Setup")
    print("=" * 50)
    
    # Check if required files exist
    if not os.path.exists("app.py"):
        print_error("app.py not found! Make sure you're in the correct directory.")
        sys.exit(1)
    
    # Get Firebase service account file
    firebase_json = input("Enter path to Firebase service account JSON file: ").strip()
    
    if not validate_firebase_json(firebase_json):
        sys.exit(1)
    
    # Get Gemini API key
    gemini_key = input("Enter your Gemini API key: ").strip()
    
    if not gemini_key:
        print_error("Gemini API key is required!")
        sys.exit(1)
    
    # Load Firebase configuration
    firebase_config = load_firebase_config(firebase_json)
    
    print("\nChoose deployment method:")
    print("1) Standard production environment file (.env)")
    print("2) Docker environment file")
    print("3) PowerShell script (Windows)")
    print("4) All of the above")
    
    choice = input("Enter choice (1-4): ").strip()
    
    if choice == "1":
        create_production_env(firebase_config, gemini_key)
    elif choice == "2":
        create_docker_env(firebase_config, gemini_key)
    elif choice == "3":
        create_powershell_script(firebase_config, gemini_key)
    elif choice == "4":
        create_production_env(firebase_config, gemini_key)
        create_docker_env(firebase_config, gemini_key)
        create_powershell_script(firebase_config, gemini_key)
    else:
        print_error("Invalid choice!")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print_status("Environment setup complete!")
    print("\n" + "⚠" + " IMPORTANT SECURITY NOTES:")
    print("• Never commit environment files to version control")
    print("• Store environment variables securely in your deployment platform")
    print("• Rotate your API keys and Firebase credentials regularly")
    print("• Use proper access controls in production")
    print("\n" + "ℹ" + " Next steps:")
    print("• Copy the environment variables to your production platform")
    print("• Install dependencies: pip install -r requirements.txt")
    print("• Run the application: python app.py")

if __name__ == "__main__":
    main()
