// Mobile Firebase Integration for ParadoxGPT

class MobileFirebaseIntegration {
    constructor(mobileApp) {
        this.mobileApp = mobileApp;
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.authUnsubscribe = null;
        
        this.init();
    }
    
    async init() {
        if (!window.firebaseAuth || !window.firebaseDb) {
            console.error('Firebase not initialized');
            return;
        }
        
        this.auth = window.firebaseAuth;
        this.db = window.firebaseDb;
        
        try {
            await this.setupAuthListener();
            console.log('Mobile Firebase integration initialized');
        } catch (error) {
            console.error('Error initializing mobile Firebase integration:', error);
        }
    }
    
    async setupAuthListener() {
        try {
            const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            this.authUnsubscribe = onAuthStateChanged(this.auth, (user) => {
                this.currentUser = user;
                this.mobileApp.updateAuthUI(user);
                
                if (user) {
                    this.loadUserChats();
                } else {
                    this.clearChats();
                }
            });
        } catch (error) {
            console.error('Error setting up auth listener:', error);
        }
    }
    
    async showAuthModal() {
        const authBody = document.querySelector('.auth-body-mobile');
        if (!authBody) return;
        
        authBody.innerHTML = `
            <div class="auth-error-mobile" id="authErrorMobile" style="display: none;"></div>

            <button class="google-signin-btn-mobile" id="googleSigninMobile">
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
            </button>

            <div class="auth-divider-mobile">
                <span>or</span>
            </div>
            
            <form id="emailAuthFormMobile">
                <div class="auth-field-mobile">
                    <label for="emailInputMobile">Email Address</label>
                    <input type="email" id="emailInputMobile" required placeholder="Enter your email">
                </div>
                <div class="auth-field-mobile">
                    <label for="passwordInputMobile">Password</label>
                    <input type="password" id="passwordInputMobile" required placeholder="Enter your password">
                </div>
                <button type="submit" id="authSubmitMobile" class="auth-submit-mobile">
                    Sign In
                </button>
            </form>

            <div class="auth-switch-mobile">
                <span>Don't have an account? </span>
                <button id="switchToSignupMobile" class="auth-switch-btn-mobile">Sign Up</button>
            </div>
        `;
        
        this.setupAuthEventListeners();
    }
    
    setupAuthEventListeners() {
        const googleSigninBtn = document.getElementById('googleSigninMobile');
        const emailForm = document.getElementById('emailAuthFormMobile');
        const switchToSignup = document.getElementById('switchToSignupMobile');
        
        if (googleSigninBtn) {
            googleSigninBtn.addEventListener('click', () => this.signInWithGoogle());
        }
        
        if (emailForm) {
            emailForm.addEventListener('submit', (e) => this.handleEmailAuth(e));
        }
        
        if (switchToSignup) {
            switchToSignup.addEventListener('click', () => this.switchAuthMode());
        }
    }
    
    async signInWithGoogle() {
        try {
            const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(this.auth, provider);
            
            console.log('Google sign-in successful:', result.user);
            this.mobileApp.hideAuthModal();
            this.mobileApp.hapticFeedback('medium');
        } catch (error) {
            console.error('Google sign-in error:', error);
            this.showAuthError('Failed to sign in with Google. Please try again.');
        }
    }
    
    async handleEmailAuth(e) {
        e.preventDefault();
        
        const email = document.getElementById('emailInputMobile').value;
        const password = document.getElementById('passwordInputMobile').value;
        const submitBtn = document.getElementById('authSubmitMobile');
        const isSignUp = submitBtn.textContent === 'Sign Up';
        
        submitBtn.disabled = true;
        submitBtn.textContent = isSignUp ? 'Signing Up...' : 'Signing In...';
        
        try {
            const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            let result;
            if (isSignUp) {
                result = await createUserWithEmailAndPassword(this.auth, email, password);
            } else {
                result = await signInWithEmailAndPassword(this.auth, email, password);
            }
            
            console.log('Email auth successful:', result.user);
            this.mobileApp.hideAuthModal();
            this.mobileApp.hapticFeedback('medium');
        } catch (error) {
            console.error('Email auth error:', error);
            let errorMessage = 'Authentication failed. Please try again.';
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email. Please sign up first.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists. Please sign in instead.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters long.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            }
            
            this.showAuthError(errorMessage);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
        }
    }
    
    switchAuthMode() {
        const submitBtn = document.getElementById('authSubmitMobile');
        const switchBtn = document.getElementById('switchToSignupMobile');
        const authHeader = document.querySelector('.auth-header-mobile h3');
        const emailInput = document.getElementById('emailInputMobile');
        const passwordInput = document.getElementById('passwordInputMobile');

        if (submitBtn.textContent.trim() === 'Sign In') {
            submitBtn.textContent = 'Sign Up';
            switchBtn.textContent = 'Sign In';
            authHeader.textContent = 'Create Account';
            emailInput.placeholder = 'Enter your email';
            passwordInput.placeholder = 'Create a password (min 6 characters)';

            // Update switch text
            const switchContainer = switchBtn.parentElement;
            switchContainer.innerHTML = '<span>Already have an account? </span><button id="switchToSignupMobile" class="auth-switch-btn-mobile">Sign In</button>';

            // Re-attach event listener
            document.getElementById('switchToSignupMobile').addEventListener('click', () => this.switchAuthMode());
        } else {
            submitBtn.textContent = 'Sign In';
            switchBtn.textContent = 'Sign Up';
            authHeader.textContent = 'Welcome Back';
            emailInput.placeholder = 'Enter your email';
            passwordInput.placeholder = 'Enter your password';

            // Update switch text
            const switchContainer = switchBtn.parentElement;
            switchContainer.innerHTML = '<span>Don\'t have an account? </span><button id="switchToSignupMobile" class="auth-switch-btn-mobile">Sign Up</button>';

            // Re-attach event listener
            document.getElementById('switchToSignupMobile').addEventListener('click', () => this.switchAuthMode());
        }

        this.hideAuthError();
    }
    
    showAuthError(message) {
        const errorDiv = document.getElementById('authErrorMobile');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
    
    hideAuthError() {
        const errorDiv = document.getElementById('authErrorMobile');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }
    
    async logout() {
        try {
            const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            await signOut(this.auth);
            console.log('User signed out');
            this.mobileApp.hapticFeedback('light');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }
    
    async loadUserChats() {
        if (!this.currentUser) return;
        
        try {
            const response = await fetch('/api/chat/history?limit=20', {
                headers: {
                    'Authorization': `Bearer ${await this.currentUser.getIdToken()}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.mobileApp.loadChatHistory(data.chats);
                }
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }
    
    clearChats() {
        this.mobileApp.loadChatHistory([]);
    }
    
    destroy() {
        if (this.authUnsubscribe) {
            this.authUnsubscribe();
        }
    }
}

// Make available globally
window.MobileFirebaseIntegration = MobileFirebaseIntegration;
