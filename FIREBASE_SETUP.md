# Firebase Setup Guide for ParadoxGPT

This guide will help you set up Firebase Authentication and Firestore for ParadoxGPT's user login system and temporary chat storage.

## Prerequisites

- A Google account
- Node.js installed (for Firebase CLI)
- Python environment with required packages

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "paradoxgpt-chat")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project console, click "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the following sign-in providers:
   - **Email/Password**: Click on it and toggle "Enable"
   - **Google**: Click on it, toggle "Enable", and add your project's domain

## Step 3: Set up Firestore Database

1. In your Firebase project console, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll configure security rules later)
4. Select a location for your database (choose the closest to your users)
5. Click "Done"

## Step 4: Configure Security Rules

1. In Firestore, go to the "Rules" tab
2. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chat messages - users can only access their own messages
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
                         request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                    request.auth.uid == request.resource.data.userId &&
                    request.resource.data.expiresAt is timestamp &&
                    request.resource.data.expiresAt > request.time;
    }
  }
}
```

3. Click "Publish"

## Step 5: Get Firebase Configuration

1. In your Firebase project console, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click "Add app" and select the web icon (`</>`)
5. Register your app with a nickname (e.g., "ParadoxGPT Web")
6. Copy the Firebase configuration object

## Step 6: Configure Frontend

1. Open `templates/index.html`
2. Find the Firebase configuration section (around line 15-30)
3. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-actual-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
};
```

## Step 7: Set up Firebase Admin SDK (Backend)

1. In Firebase Console, go to Project Settings → Service accounts
2. Choose **Node.js** as the language (the JSON format works for Python too)
3. Click "Generate new private key"
4. Download the JSON file and save it securely

### Production Environment Variables

For production deployment, use these environment variables:

#### **Option A: Individual Environment Variables (Most Secure)**
```bash
# Firebase Service Account Configuration
export FIREBASE_TYPE="service_account"
export FIREBASE_PROJECT_ID="paradox-gpt"
export FIREBASE_PRIVATE_KEY_ID="your_private_key_id_here"
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
export FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@paradox-gpt.iam.gserviceaccount.com"
export FIREBASE_CLIENT_ID="your_client_id_here"
export FIREBASE_AUTH_URI="https://accounts.google.com/o/oauth2/auth"
export FIREBASE_TOKEN_URI="https://oauth2.googleapis.com/token"
export FIREBASE_AUTH_PROVIDER_X509_CERT_URL="https://www.googleapis.com/oauth2/v1/certs"
export FIREBASE_CLIENT_X509_CERT_URL="https://www.googleapis.com/oauth2/v1/certs/firebase-adminsdk-xxxxx%40paradox-gpt.iam.gserviceaccount.com"

# Application Configuration
export GEMINI_API_KEY="your_gemini_api_key_here"
export FLASK_ENV="production"
export PORT="8080"
export HOST="0.0.0.0"
```

#### **Option B: Base64 Encoded JSON (Alternative)**
```bash
# Encode your service account JSON file
export FIREBASE_SERVICE_ACCOUNT_BASE64="$(base64 -w 0 /path/to/service-account.json)"
export GEMINI_API_KEY="your_gemini_api_key_here"
export FLASK_ENV="production"
export PORT="8080"
export HOST="0.0.0.0"
```

#### **Option C: Direct JSON String (Less Secure)**
```bash
export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"paradox-gpt","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

## Step 8: Install Dependencies

```bash
pip install firebase-admin
```

## Step 9: Test the Setup

1. Start your ParadoxGPT server:
```bash
python app.py
```

2. Open your browser and navigate to the application
3. Try signing up with a new account
4. Send a message and verify it's saved to Firestore
5. Sign out and sign back in to verify chat history is restored

## Security Considerations

### Firestore Security Rules
The provided rules ensure:
- Users can only access their own chat messages
- Messages must have a valid expiration time
- Messages automatically expire after 6 hours

### Environment Variables
- Never commit service account keys to version control
- Use environment variables or secure secret management
- In production, use Google Cloud IAM roles instead of service account keys

### Authentication
- Firebase handles secure authentication
- ID tokens are verified server-side
- Tokens automatically expire and refresh

## Troubleshooting

### Common Issues

1. **"Firebase not initialized" error**
   - Check that your Firebase config is correct
   - Ensure all required fields are filled

2. **Authentication not working**
   - Verify that Email/Password and Google sign-in are enabled
   - Check that your domain is authorized in Firebase Console

3. **Firestore permission denied**
   - Verify your security rules are correctly configured
   - Check that the user is properly authenticated

4. **Backend Firebase errors**
   - Ensure the service account key is properly configured
   - Check that the Firebase Admin SDK is installed

### Debug Mode

To enable debug logging, add this to your environment:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
export FIREBASE_DEBUG=true
```

## Features

### Automatic Chat Cleanup
- Chats automatically expire after 6 hours
- Cleanup runs every 30 minutes on the frontend
- Manual cleanup endpoint available at `/api/admin/cleanup`

### User Statistics
- Track message counts and activity
- Available at `/api/user/stats` endpoint

### Offline Support
- App works without authentication
- Chat history only available when logged in
- Seamless transition between authenticated/unauthenticated states

## Production Deployment

For production deployment:

1. Use Firebase security rules in production mode
2. Set up proper environment variables
3. Use HTTPS for all communications
4. Consider implementing rate limiting
5. Set up monitoring and logging
6. Use Firebase App Check for additional security

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the Python server logs
3. Verify Firebase Console for authentication/database issues
4. Ensure all environment variables are properly set
