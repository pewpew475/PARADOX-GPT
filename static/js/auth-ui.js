// Authentication UI Components
import firebaseService from './firebase-service.js';

class AuthUI {
    constructor() {
        this.isLoginMode = true;
        this.init();
    }

    init() {
        this.createAuthModal();
        this.bindEvents();
    }

    createAuthModal() {
        const modalHTML = `
            <div id="authModal" class="auth-modal" style="display: none;">
                <div class="auth-modal-content">
                    <div class="auth-header">
                        <h2 id="authTitle">Sign In to ParadoxGPT</h2>
                        <button id="closeAuthModal" class="auth-close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="auth-body">
                        <div id="authError" class="auth-error" style="display: none;"></div>
                        
                        <form id="authForm" class="auth-form">
                            <div class="auth-field" id="nameField" style="display: none;">
                                <label for="displayName">Full Name</label>
                                <input type="text" id="displayName" placeholder="Enter your full name" />
                            </div>
                            
                            <div class="auth-field">
                                <label for="email">Email</label>
                                <input type="email" id="email" placeholder="Enter your email" required />
                            </div>
                            
                            <div class="auth-field">
                                <label for="password">Password</label>
                                <input type="password" id="password" placeholder="Enter your password" required />
                            </div>
                            
                            <button type="submit" id="authSubmitBtn" class="auth-submit-btn">
                                <span id="authSubmitText">Sign In</span>
                                <i id="authSubmitLoader" class="fas fa-spinner fa-spin" style="display: none;"></i>
                            </button>
                        </form>
                        
                        <div class="auth-divider">
                            <span>or</span>
                        </div>
                        
                        <button id="googleSignInBtn" class="google-signin-btn">
                            <i class="fab fa-google"></i>
                            <span>Continue with Google</span>
                        </button>
                        
                        <div class="auth-switch">
                            <span id="authSwitchText">Don't have an account?</span>
                            <button type="button" id="authSwitchBtn" class="auth-switch-btn">Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    bindEvents() {
        const authModal = document.getElementById('authModal');
        const closeBtn = document.getElementById('closeAuthModal');
        const authForm = document.getElementById('authForm');
        const switchBtn = document.getElementById('authSwitchBtn');
        const googleBtn = document.getElementById('googleSignInBtn');

        // Close modal events
        closeBtn.addEventListener('click', () => this.hideModal());
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) this.hideModal();
        });

        // Form submission
        authForm.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Switch between login/signup
        switchBtn.addEventListener('click', () => this.toggleMode());

        // Google sign in
        googleBtn.addEventListener('click', () => this.handleGoogleSignIn());

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && authModal.style.display !== 'none') {
                this.hideModal();
            }
        });
    }

    showModal() {
        const modal = document.getElementById('authModal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus on email field
        setTimeout(() => {
            document.getElementById('email').focus();
        }, 100);
    }

    hideModal() {
        const modal = document.getElementById('authModal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        this.clearForm();
        this.hideError();
    }

    toggleMode() {
        this.isLoginMode = !this.isLoginMode;
        this.updateUI();
        this.clearForm();
        this.hideError();
    }

    updateUI() {
        const title = document.getElementById('authTitle');
        const nameField = document.getElementById('nameField');
        const submitText = document.getElementById('authSubmitText');
        const switchText = document.getElementById('authSwitchText');
        const switchBtn = document.getElementById('authSwitchBtn');

        if (this.isLoginMode) {
            title.textContent = 'Sign In to ParadoxGPT';
            nameField.style.display = 'none';
            submitText.textContent = 'Sign In';
            switchText.textContent = "Don't have an account?";
            switchBtn.textContent = 'Sign Up';
        } else {
            title.textContent = 'Create Your Account';
            nameField.style.display = 'block';
            submitText.textContent = 'Sign Up';
            switchText.textContent = 'Already have an account?';
            switchBtn.textContent = 'Sign In';
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        this.setLoading(true);
        this.hideError();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const displayName = document.getElementById('displayName').value;

        let result;
        if (this.isLoginMode) {
            result = await firebaseService.signInWithEmail(email, password);
        } else {
            if (!displayName.trim()) {
                this.showError('Please enter your full name');
                this.setLoading(false);
                return;
            }
            result = await firebaseService.signUpWithEmail(email, password, displayName);
        }

        this.setLoading(false);

        if (result.success) {
            this.hideModal();
        } else {
            this.showError(result.error);
        }
    }

    async handleGoogleSignIn() {
        this.setLoading(true);
        this.hideError();

        const result = await firebaseService.signInWithGoogle();
        this.setLoading(false);

        if (result.success) {
            this.hideModal();
        } else {
            this.showError(result.error);
        }
    }

    setLoading(loading) {
        const submitBtn = document.getElementById('authSubmitBtn');
        const submitText = document.getElementById('authSubmitText');
        const submitLoader = document.getElementById('authSubmitLoader');
        const googleBtn = document.getElementById('googleSignInBtn');

        if (loading) {
            submitBtn.disabled = true;
            submitText.style.display = 'none';
            submitLoader.style.display = 'inline-block';
            googleBtn.disabled = true;
        } else {
            submitBtn.disabled = false;
            submitText.style.display = 'inline-block';
            submitLoader.style.display = 'none';
            googleBtn.disabled = false;
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('authError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideError() {
        const errorDiv = document.getElementById('authError');
        errorDiv.style.display = 'none';
    }

    clearForm() {
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        document.getElementById('displayName').value = '';
    }
}

// Create and export singleton instance
const authUI = new AuthUI();
export default authUI;
