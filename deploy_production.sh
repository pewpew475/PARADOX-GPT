#!/bin/bash

# ParadoxGPT Production Deployment Script
# This script helps set up environment variables for production deployment

set -e  # Exit on any error

echo "🚀 ParadoxGPT Production Deployment Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if required files exist
check_requirements() {
    print_info "Checking requirements..."
    
    if [ ! -f "requirements.txt" ]; then
        print_error "requirements.txt not found!"
        exit 1
    fi
    
    if [ ! -f "app.py" ]; then
        print_error "app.py not found!"
        exit 1
    fi
    
    print_status "All required files found"
}

# Function to validate Firebase service account JSON
validate_firebase_json() {
    local json_file="$1"
    
    if [ ! -f "$json_file" ]; then
        print_error "Firebase service account file not found: $json_file"
        return 1
    fi
    
    # Check if it's valid JSON
    if ! python3 -m json.tool "$json_file" > /dev/null 2>&1; then
        print_error "Invalid JSON in Firebase service account file"
        return 1
    fi
    
    # Check required fields
    local required_fields=("type" "project_id" "private_key_id" "private_key" "client_email" "client_id")
    for field in "${required_fields[@]}"; do
        if ! grep -q "\"$field\"" "$json_file"; then
            print_error "Missing required field '$field' in Firebase service account file"
            return 1
        fi
    done
    
    print_status "Firebase service account file is valid"
    return 0
}

# Function to extract values from Firebase JSON
extract_firebase_values() {
    local json_file="$1"
    
    print_info "Extracting Firebase configuration..."
    
    # Use Python to extract values safely
    python3 << EOF
import json
import sys

try:
    with open('$json_file', 'r') as f:
        data = json.load(f)
    
    print(f"export FIREBASE_TYPE='{data['type']}'")
    print(f"export FIREBASE_PROJECT_ID='{data['project_id']}'")
    print(f"export FIREBASE_PRIVATE_KEY_ID='{data['private_key_id']}'")
    print(f"export FIREBASE_PRIVATE_KEY='{data['private_key']}'")
    print(f"export FIREBASE_CLIENT_EMAIL='{data['client_email']}'")
    print(f"export FIREBASE_CLIENT_ID='{data['client_id']}'")
    print(f"export FIREBASE_AUTH_URI='{data.get('auth_uri', 'https://accounts.google.com/o/oauth2/auth')}'")
    print(f"export FIREBASE_TOKEN_URI='{data.get('token_uri', 'https://oauth2.googleapis.com/token')}'")
    print(f"export FIREBASE_AUTH_PROVIDER_X509_CERT_URL='{data.get('auth_provider_x509_cert_url', 'https://www.googleapis.com/oauth2/v1/certs')}'")
    print(f"export FIREBASE_CLIENT_X509_CERT_URL='{data.get('client_x509_cert_url', '')}'")
    
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
EOF
}

# Function to create production environment file
create_production_env() {
    local firebase_json="$1"
    local gemini_key="$2"
    local output_file="${3:-production.env}"
    
    print_info "Creating production environment file: $output_file"
    
    cat > "$output_file" << EOF
# ParadoxGPT Production Environment
# Generated on $(date)

# =============================================================================
# REQUIRED CONFIGURATION
# =============================================================================

# API Keys
GEMINI_API_KEY=$gemini_key

# =============================================================================
# FIREBASE CONFIGURATION (Individual Environment Variables)
# =============================================================================

EOF

    # Add Firebase configuration
    extract_firebase_values "$firebase_json" >> "$output_file"
    
    cat >> "$output_file" << EOF

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
SECRET_KEY=$(openssl rand -hex 32)

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
EOF

    print_status "Production environment file created: $output_file"
}

# Function to create Docker environment file
create_docker_env() {
    local firebase_json="$1"
    local gemini_key="$2"
    
    print_info "Creating Docker environment file..."
    
    # Create base64 encoded version for Docker
    local base64_json=$(base64 -w 0 "$firebase_json" 2>/dev/null || base64 "$firebase_json")
    
    cat > "docker.env" << EOF
# ParadoxGPT Docker Environment
# Generated on $(date)

GEMINI_API_KEY=$gemini_key
FIREBASE_SERVICE_ACCOUNT_BASE64=$base64_json
FLASK_ENV=production
FLASK_DEBUG=false
PORT=8080
HOST=0.0.0.0
SECRET_KEY=$(openssl rand -hex 32)
LOG_LEVEL=INFO
FIREBASE_DEBUG=false
PYTHONUNBUFFERED=1
EOF

    print_status "Docker environment file created: docker.env"
}

# Main execution
main() {
    check_requirements
    
    echo ""
    print_info "This script will help you set up environment variables for production deployment."
    echo ""
    
    # Get Firebase service account file
    read -p "Enter path to Firebase service account JSON file: " firebase_json
    
    if ! validate_firebase_json "$firebase_json"; then
        exit 1
    fi
    
    # Get Gemini API key
    read -p "Enter your Gemini API key: " gemini_key
    
    if [ -z "$gemini_key" ]; then
        print_error "Gemini API key is required!"
        exit 1
    fi
    
    echo ""
    print_info "Choose deployment method:"
    echo "1) Standard production environment file"
    echo "2) Docker environment file"
    echo "3) Both"
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            create_production_env "$firebase_json" "$gemini_key"
            ;;
        2)
            create_docker_env "$firebase_json" "$gemini_key"
            ;;
        3)
            create_production_env "$firebase_json" "$gemini_key"
            create_docker_env "$firebase_json" "$gemini_key"
            ;;
        *)
            print_error "Invalid choice!"
            exit 1
            ;;
    esac
    
    echo ""
    print_status "Environment setup complete!"
    echo ""
    print_warning "IMPORTANT SECURITY NOTES:"
    echo "• Never commit environment files to version control"
    echo "• Store environment variables securely in your deployment platform"
    echo "• Rotate your API keys and Firebase credentials regularly"
    echo "• Use proper access controls in production"
    echo ""
    print_info "Next steps:"
    echo "• Copy the environment variables to your production platform"
    echo "• Install dependencies: pip install -r requirements.txt"
    echo "• Run the application: python app.py"
}

# Run main function
main "$@"
