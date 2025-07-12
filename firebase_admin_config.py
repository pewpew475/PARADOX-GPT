# Firebase Admin SDK Configuration for ParadoxGPT
import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import json
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class FirebaseAdminService:
    def __init__(self):
        self.db = None
        self.app = None
        self.initialized = False
        self.init_firebase()

    def init_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if Firebase is already initialized
            if firebase_admin._apps:
                self.app = firebase_admin.get_app()
                self.db = firestore.client()
                self.initialized = True
                logger.info("Firebase Admin SDK already initialized")
                return

            cred = None

            # Method 1: Individual environment variables (most secure for production)
            if self._has_individual_env_vars():
                cred_dict = self._build_credentials_from_env()
                cred = credentials.Certificate(cred_dict)
                logger.info("Firebase initialized with individual environment variables")

            # Method 2: Base64 encoded service account
            elif os.getenv('FIREBASE_SERVICE_ACCOUNT_BASE64'):
                import base64
                encoded_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_BASE64')
                decoded_json = base64.b64decode(encoded_json).decode('utf-8')
                cred_dict = json.loads(decoded_json)
                cred = credentials.Certificate(cred_dict)
                logger.info("Firebase initialized with base64 encoded service account")

            # Method 3: Service account key file path
            elif os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY'):
                cred_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')
                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    logger.info("Firebase initialized with service account key file")
                else:
                    logger.error(f"Service account key file not found: {cred_path}")

            # Method 4: Direct JSON string
            elif os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON'):
                cred_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
                cred_dict = json.loads(cred_json)
                cred = credentials.Certificate(cred_dict)
                logger.info("Firebase initialized with service account JSON from environment")

            # Method 5: Default credentials (Google Cloud environments)
            else:
                logger.info("Attempting to use default credentials")

            # Initialize Firebase app
            if cred:
                self.app = firebase_admin.initialize_app(cred)
            else:
                self.app = firebase_admin.initialize_app()
                logger.info("Firebase initialized with default credentials")

            # Initialize Firestore
            self.db = firestore.client()
            self.initialized = True
            logger.info("Firebase Admin SDK initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
            self.initialized = False

    def _has_individual_env_vars(self):
        """Check if individual Firebase environment variables are set"""
        required_vars = [
            'FIREBASE_TYPE', 'FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY_ID',
            'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_CLIENT_ID'
        ]
        return all(os.getenv(var) for var in required_vars)

    def _build_credentials_from_env(self):
        """Build Firebase credentials dictionary from individual environment variables"""
        return {
            "type": os.getenv('FIREBASE_TYPE'),
            "project_id": os.getenv('FIREBASE_PROJECT_ID'),
            "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
            "private_key": os.getenv('FIREBASE_PRIVATE_KEY').replace('\\n', '\n'),
            "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
            "client_id": os.getenv('FIREBASE_CLIENT_ID'),
            "auth_uri": os.getenv('FIREBASE_AUTH_URI', 'https://accounts.google.com/o/oauth2/auth'),
            "token_uri": os.getenv('FIREBASE_TOKEN_URI', 'https://oauth2.googleapis.com/token'),
            "auth_provider_x509_cert_url": os.getenv('FIREBASE_AUTH_PROVIDER_X509_CERT_URL', 'https://www.googleapis.com/oauth2/v1/certs'),
            "client_x509_cert_url": os.getenv('FIREBASE_CLIENT_X509_CERT_URL'),
            "universe_domain": os.getenv('FIREBASE_UNIVERSE_DOMAIN', 'googleapis.com')
        }

    def verify_user_token(self, id_token):
        """Verify Firebase ID token and return user info"""
        if not self.initialized:
            return None

        try:
            decoded_token = auth.verify_id_token(id_token)
            return {
                'uid': decoded_token['uid'],
                'email': decoded_token.get('email'),
                'name': decoded_token.get('name'),
                'email_verified': decoded_token.get('email_verified', False)
            }
        except Exception as e:
            logger.error(f"Error verifying token: {e}")
            return None

    def get_user_chats(self, user_id, limit=50):
        """Get user's chat history that hasn't expired"""
        if not self.initialized:
            return []

        try:
            # Query for non-expired chats
            chats_ref = self.db.collection('chats')
            query = chats_ref.where('userId', '==', user_id)\
                            .where('expiresAt', '>', datetime.now())\
                            .order_by('expiresAt')\
                            .order_by('timestamp')\
                            .limit(limit)

            docs = query.stream()
            chats = []
            
            for doc in docs:
                chat_data = doc.to_dict()
                chat_data['id'] = doc.id
                chats.append(chat_data)

            return chats

        except Exception as e:
            logger.error(f"Error getting user chats: {e}")
            return []

    def save_chat_message(self, user_id, message, is_user=True):
        """Save a chat message to Firestore"""
        if not self.initialized:
            return False

        try:
            # Calculate expiration time (6 hours from now)
            expires_at = datetime.now() + timedelta(hours=6)
            
            chat_data = {
                'userId': user_id,
                'message': message,
                'isUser': is_user,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'expiresAt': expires_at
            }

            # Add document to collection
            doc_ref = self.db.collection('chats').add(chat_data)
            logger.info(f"Chat message saved with ID: {doc_ref[1].id}")
            return True

        except Exception as e:
            logger.error(f"Error saving chat message: {e}")
            return False

    def cleanup_expired_chats(self):
        """Clean up expired chat messages"""
        if not self.initialized:
            return 0

        try:
            # Query for expired chats
            chats_ref = self.db.collection('chats')
            query = chats_ref.where('expiresAt', '<=', datetime.now())

            docs = query.stream()
            deleted_count = 0

            # Delete expired documents
            for doc in docs:
                doc.reference.delete()
                deleted_count += 1

            if deleted_count > 0:
                logger.info(f"Cleaned up {deleted_count} expired chat messages")

            return deleted_count

        except Exception as e:
            logger.error(f"Error cleaning up expired chats: {e}")
            return 0

    def get_user_stats(self, user_id):
        """Get user statistics"""
        if not self.initialized:
            return {}

        try:
            # Count total messages
            chats_ref = self.db.collection('chats')
            query = chats_ref.where('userId', '==', user_id)\
                            .where('expiresAt', '>', datetime.now())

            docs = list(query.stream())
            total_messages = len(docs)
            
            user_messages = sum(1 for doc in docs if doc.to_dict().get('isUser', False))
            ai_messages = total_messages - user_messages

            return {
                'total_messages': total_messages,
                'user_messages': user_messages,
                'ai_messages': ai_messages,
                'last_activity': max([doc.to_dict().get('timestamp') for doc in docs], default=None)
            }

        except Exception as e:
            logger.error(f"Error getting user stats: {e}")
            return {}

    def is_initialized(self):
        """Check if Firebase is properly initialized"""
        return self.initialized

# Create global instance
firebase_service = FirebaseAdminService()

# Helper functions for easy access
def verify_token(id_token):
    return firebase_service.verify_user_token(id_token)

def get_user_chats(user_id, limit=50):
    return firebase_service.get_user_chats(user_id, limit)

def save_chat(user_id, message, is_user=True):
    return firebase_service.save_chat_message(user_id, message, is_user)

def cleanup_expired():
    return firebase_service.cleanup_expired_chats()

def get_stats(user_id):
    return firebase_service.get_user_stats(user_id)

def is_firebase_ready():
    return firebase_service.is_initialized()
