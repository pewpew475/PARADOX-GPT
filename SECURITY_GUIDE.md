# 🔒 Security Guide for ParadoxGPT

This guide outlines security best practices and configurations for ParadoxGPT deployment.

## 🚨 Critical Security Issues Fixed

### **1. Removed Hardcoded Credentials**
- ✅ **Fixed**: Hardcoded Firebase API keys in `templates/index.html`
- ✅ **Fixed**: Real private keys in `.env.example` file
- ✅ **Fixed**: Exposed service account credentials

### **2. Environment Variable Security**
All sensitive data is now properly configured via environment variables:

#### **Backend Firebase Configuration**
```bash
FIREBASE_TYPE="service_account"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY_ID="your-private-key-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_CLIENT_ID="your-client-id"
FIREBASE_UNIVERSE_DOMAIN="googleapis.com"
```

#### **Frontend Firebase Configuration**
```bash
FIREBASE_WEB_API_KEY="your-web-api-key"
FIREBASE_WEB_AUTH_DOMAIN="your-project.firebaseapp.com"
FIREBASE_WEB_PROJECT_ID="your-project-id"
FIREBASE_WEB_STORAGE_BUCKET="your-project.appspot.com"
FIREBASE_WEB_MESSAGING_SENDER_ID="123456789"
FIREBASE_WEB_APP_ID="1:123456789:web:abcdef123456"
FIREBASE_WEB_MEASUREMENT_ID="G-XXXXXXXXXX"
```

#### **API Keys**
```bash
GEMINI_API_KEY="your-gemini-api-key"
DIVIDER_API_KEY="your-divider-api-key"
THINKER_1_API_KEY="your-thinker-1-api-key"
# ... (continue for all 14 API keys)
```

## 🛡️ Security Best Practices

### **1. Environment Variables**
- ✅ **Never commit `.env` files** to version control
- ✅ **Use different keys** for development, staging, and production
- ✅ **Rotate API keys** regularly (every 90 days recommended)
- ✅ **Use secure secret management** in production (AWS Secrets Manager, Azure Key Vault, etc.)

### **2. Firebase Security**
- ✅ **Firestore Security Rules** are configured to restrict access
- ✅ **Service account keys** are properly secured
- ✅ **Frontend config** is loaded from environment variables
- ✅ **Authentication required** for chat storage

### **3. Production Deployment**
- ✅ **HTTPS only** in production
- ✅ **Secure headers** configured
- ✅ **Rate limiting** implemented
- ✅ **Input validation** on all endpoints

## 🔧 Configuration Steps

### **1. Development Setup**
```bash
# Copy the example file
cp .env.example .env

# Edit with your actual values
nano .env

# Never commit the .env file
echo ".env" >> .gitignore
```

### **2. Production Setup**
Use the automated setup script:
```bash
python setup_production.py
```

Or manually set environment variables in your deployment platform:
- **Heroku**: `heroku config:set VARIABLE_NAME=value`
- **Vercel**: Add in project settings
- **AWS**: Use Parameter Store or Secrets Manager
- **Google Cloud**: Use Secret Manager
- **Azure**: Use Key Vault

### **3. Docker Deployment**
```bash
# Use the generated docker.env file
docker run --env-file docker.env your-app
```

## 🚫 What NOT to Do

### **❌ Never Do These:**
1. **Commit API keys** to version control
2. **Hardcode credentials** in source code
3. **Share `.env` files** via email or chat
4. **Use production keys** in development
5. **Store secrets** in client-side code
6. **Use weak passwords** for service accounts
7. **Ignore security warnings** from Firebase Console

### **❌ Avoid These Patterns:**
```javascript
// DON'T DO THIS
const apiKey = "AIzaSyBdyL8uJAVuCFdQBvTCoBL54zw-M8Z8svk";

// DON'T DO THIS
const config = {
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg..."
};
```

## ✅ Secure Patterns

### **✅ Use Environment Variables:**
```javascript
// DO THIS
const apiKey = process.env.FIREBASE_WEB_API_KEY;
```

### **✅ Template Variables:**
```html
<!-- DO THIS -->
apiKey: "{{ firebase_config.api_key | default('') }}"
```

### **✅ Server-Side Configuration:**
```python
# DO THIS
firebase_config = {
    'api_key': os.getenv('FIREBASE_WEB_API_KEY'),
    'project_id': os.getenv('FIREBASE_WEB_PROJECT_ID')
}
```

## 🔍 Security Checklist

### **Before Deployment:**
- [ ] All API keys moved to environment variables
- [ ] No hardcoded credentials in source code
- [ ] `.env` files added to `.gitignore`
- [ ] Firebase security rules configured
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] Error messages don't expose sensitive data
- [ ] Logging doesn't include secrets
- [ ] Dependencies are up to date

### **Regular Maintenance:**
- [ ] Rotate API keys every 90 days
- [ ] Review Firebase security rules
- [ ] Update dependencies
- [ ] Monitor for security alerts
- [ ] Review access logs
- [ ] Test backup and recovery procedures

## 🚨 Incident Response

### **If Credentials Are Compromised:**
1. **Immediately revoke** the compromised keys
2. **Generate new keys** in Firebase Console
3. **Update environment variables** in all environments
4. **Review access logs** for unauthorized usage
5. **Monitor for suspicious activity**
6. **Document the incident** for future prevention

### **Emergency Contacts:**
- Firebase Support: https://firebase.google.com/support
- Google Cloud Security: https://cloud.google.com/security

## 📚 Additional Resources

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/security)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Google Cloud Security](https://cloud.google.com/security/best-practices)
- [Environment Variable Security](https://12factor.net/config)

## 🔄 Updates

This security guide should be reviewed and updated:
- **Monthly**: Check for new security best practices
- **After incidents**: Update based on lessons learned
- **Before major releases**: Ensure all security measures are in place
- **When adding new features**: Review security implications

---

**Remember**: Security is an ongoing process, not a one-time setup. Stay vigilant and keep your systems updated!
