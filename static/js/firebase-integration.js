// Firebase Integration for ParadoxGPT
class FirebaseIntegration {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.chatUnsubscribe = null;
        this.authUnsubscribe = null;
        this.chatCleanupInterval = null;

        this.waitForFirebase();
    }

    waitForFirebase() {
        console.log('Waiting for Firebase...', {
            firebaseReady: window.firebaseReady,
            firebaseAuth: window.firebaseAuth,
            firebaseDb: window.firebaseDb
        });

        if (window.firebaseReady && window.firebaseAuth && window.firebaseDb) {
            console.log('Firebase already ready, initializing...');
            this.auth = window.firebaseAuth;
            this.db = window.firebaseDb;
            this.init();
        } else {
            console.log('Firebase not ready, waiting for event...');
            // Wait for Firebase to be ready
            window.addEventListener('firebaseReady', () => {
                console.log('Firebase ready event received');
                this.auth = window.firebaseAuth;
                this.db = window.firebaseDb;
                this.init();
            });

            // Also try polling as a fallback
            let attempts = 0;
            const checkFirebase = () => {
                attempts++;
                console.log(`Checking Firebase readiness (attempt ${attempts})...`);

                if (window.firebaseAuth && window.firebaseDb) {
                    console.log('Firebase found via polling, initializing...');
                    this.auth = window.firebaseAuth;
                    this.db = window.firebaseDb;
                    this.init();
                } else if (attempts < 10) {
                    setTimeout(checkFirebase, 500);
                } else {
                    console.error('Firebase failed to initialize after 10 attempts');
                }
            };

            setTimeout(checkFirebase, 100);
        }
    }

    async init() {
        console.log('Firebase integration initializing...');

        if (!this.auth || !this.db) {
            console.error('Firebase not initialized', { auth: this.auth, db: this.db });
            return;
        }

        console.log('Firebase ready, setting up components...', { auth: this.auth, db: this.db });

        try {
            // Set up auth state listener
            await this.setupAuthListener();

            // Start chat cleanup
            this.startChatCleanup();

            // Set up UI event listeners
            this.setupUIEventListeners();

            // Create auth modal
            this.createAuthModal();

            console.log('Firebase integration initialized successfully');
        } catch (error) {
            console.error('Error initializing Firebase integration:', error);
        }
    }

    async setupAuthListener() {
        try {
            const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

            this.authUnsubscribe = onAuthStateChanged(this.auth, (user) => {
                this.currentUser = user;
                this.updateUI(user);

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

    updateUI(user) {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userProfile = document.getElementById('userProfile');
        const loginSection = document.getElementById('loginSection');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userAvatar = document.getElementById('userAvatar');

        if (user) {
            // Show user profile
            loginSection.style.display = 'none';
            userProfile.style.display = 'flex';
            
            // Update user info
            userName.textContent = user.displayName || 'User';
            userEmail.textContent = user.email;
            
            // Set avatar
            if (user.photoURL) {
                userAvatar.innerHTML = `<img src="${user.photoURL}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
            } else {
                const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
                userAvatar.textContent = initial;
            }
        } else {
            // Show login button
            loginSection.style.display = 'block';
            userProfile.style.display = 'none';
        }
    }

    setupUIEventListeners() {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (loginBtn) {
            console.log('Login button found, adding event listener');
            loginBtn.addEventListener('click', (e) => {
                console.log('Login button clicked');
                e.preventDefault();
                this.showAuthModal();
            });
        } else {
            console.error('Login button not found');
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.signOut());
        }
    }

    createAuthModal() {
        console.log('Creating auth modal...');

        // Check if modal already exists
        if (document.getElementById('authModal')) {
            console.log('Auth modal already exists');
            return;
        }

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
        console.log('Auth modal HTML added to DOM');

        // Verify modal was added
        const modal = document.getElementById('authModal');
        if (modal) {
            console.log('Auth modal successfully created and found in DOM');
        } else {
            console.error('Auth modal not found after creation');
        }

        this.setupAuthModalEvents();
    }

    setupAuthModalEvents() {
        const authModal = document.getElementById('authModal');
        const closeBtn = document.getElementById('closeAuthModal');
        const authForm = document.getElementById('authForm');
        const switchBtn = document.getElementById('authSwitchBtn');
        const googleBtn = document.getElementById('googleSignInBtn');

        let isLoginMode = true;

        // Close modal events
        closeBtn.addEventListener('click', () => this.hideAuthModal());
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) this.hideAuthModal();
        });

        // Form submission
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit(isLoginMode);
        });

        // Switch between login/signup
        switchBtn.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            this.updateAuthModalUI(isLoginMode);
        });

        // Google sign in
        googleBtn.addEventListener('click', () => this.signInWithGoogle());

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && authModal.style.display !== 'none') {
                this.hideAuthModal();
            }
        });
    }

    showAuthModal() {
        console.log('showAuthModal called');
        const modal = document.getElementById('authModal');
        if (!modal) {
            console.error('Auth modal not found');
            return;
        }
        console.log('Auth modal found, showing...');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.focus();
            }
        }, 100);
    }

    hideAuthModal() {
        const modal = document.getElementById('authModal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        this.clearAuthForm();
        this.hideAuthError();
    }

    updateAuthModalUI(isLoginMode) {
        const title = document.getElementById('authTitle');
        const nameField = document.getElementById('nameField');
        const submitText = document.getElementById('authSubmitText');
        const switchText = document.getElementById('authSwitchText');
        const switchBtn = document.getElementById('authSwitchBtn');

        if (isLoginMode) {
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

    async handleFormSubmit(isLoginMode) {
        this.setAuthLoading(true);
        this.hideAuthError();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const displayName = document.getElementById('displayName').value;

        try {
            if (isLoginMode) {
                const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
                await signInWithEmailAndPassword(this.auth, email, password);
            } else {
                if (!displayName.trim()) {
                    throw new Error('Please enter your full name');
                }
                const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
                const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
                await updateProfile(userCredential.user, { displayName });
            }
            
            this.hideAuthModal();
        } catch (error) {
            this.showAuthError(error.message);
        } finally {
            this.setAuthLoading(false);
        }
    }

    async signInWithGoogle() {
        this.setAuthLoading(true);
        this.hideAuthError();

        try {
            const { signInWithPopup, GoogleAuthProvider } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            const provider = new GoogleAuthProvider();
            await signInWithPopup(this.auth, provider);
            this.hideAuthModal();
        } catch (error) {
            this.showAuthError(error.message);
        } finally {
            this.setAuthLoading(false);
        }
    }

    async signOut() {
        try {
            const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            await signOut(this.auth);
            
            // Clear chat history from UI
            this.clearChats();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }

    setAuthLoading(loading) {
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

    showAuthError(message) {
        const errorDiv = document.getElementById('authError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideAuthError() {
        const errorDiv = document.getElementById('authError');
        errorDiv.style.display = 'none';
    }

    clearAuthForm() {
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        document.getElementById('displayName').value = '';
    }

    // Chat Management Methods
    async saveMessage(message, isUser = true) {
        if (!this.currentUser) {
            return { success: false, error: 'User must be authenticated' };
        }

        try {
            const { collection, addDoc, serverTimestamp, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            const chatData = {
                userId: this.currentUser.uid,
                message: message,
                isUser: isUser,
                timestamp: serverTimestamp(),
                expiresAt: Timestamp.fromDate(new Date(Date.now() + 6 * 60 * 60 * 1000)) // 6 hours from now
            };

            const docRef = await addDoc(collection(this.db, 'chats'), chatData);
            this.showChatSavedIndicator();
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error saving message:', error);
            return { success: false, error: error.message };
        }
    }

    async loadUserChats() {
        if (!this.currentUser) {
            return;
        }

        try {
            const { collection, query, where, orderBy, onSnapshot, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            const q = query(
                collection(this.db, 'chats'),
                where('userId', '==', this.currentUser.uid),
                where('expiresAt', '>', Timestamp.now()),
                orderBy('expiresAt'),
                orderBy('timestamp', 'asc')
            );

            this.chatUnsubscribe = onSnapshot(q, (querySnapshot) => {
                const chats = [];
                querySnapshot.forEach((doc) => {
                    chats.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                this.restoreChatHistory(chats);
            });
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    }

    restoreChatHistory(chats) {
        if (chats.length === 0) return;

        // Clear current chat
        const chatContainer = document.getElementById('chatContainer');
        const welcomeSection = chatContainer.querySelector('.welcome-section');
        if (welcomeSection) {
            welcomeSection.remove();
        }

        // Group messages and restore them
        chats.forEach(chat => {
            this.addMessageToUI(chat.message, chat.isUser, false); // false = don't save to Firebase
        });

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    addMessageToUI(message, isUser, saveToFirebase = true) {
        // This method should be called from main.js to add messages to UI
        // and optionally save to Firebase
        if (window.addMessageToChat) {
            const role = isUser ? 'user' : 'assistant';
            const metadata = saveToFirebase ? null : { skipFirebase: true };
            window.addMessageToChat(message, role, metadata);
        }

        // Save to Firebase if user is authenticated and saveToFirebase is true
        if (saveToFirebase && this.currentUser) {
            this.saveMessage(message, isUser);
        }
    }

    clearChats() {
        if (this.chatUnsubscribe) {
            this.chatUnsubscribe();
            this.chatUnsubscribe = null;
        }
    }

    showChatSavedIndicator() {
        const indicator = document.getElementById('chatHistoryIndicator');
        if (indicator) {
            indicator.classList.add('show');
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 3000);
        }
    }

    // Cleanup expired chats every 30 minutes
    startChatCleanup() {
        this.chatCleanupInterval = setInterval(async () => {
            await this.cleanupExpiredChats();
        }, 30 * 60 * 1000); // 30 minutes
    }

    async cleanupExpiredChats() {
        try {
            const { collection, query, where, getDocs, deleteDoc, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            const q = query(
                collection(this.db, 'chats'),
                where('expiresAt', '<=', Timestamp.now())
            );

            const querySnapshot = await getDocs(q);
            const deletePromises = [];

            querySnapshot.forEach((doc) => {
                deletePromises.push(deleteDoc(doc.ref));
            });

            await Promise.all(deletePromises);
            console.log(`Cleaned up ${deletePromises.length} expired chat messages`);
        } catch (error) {
            console.error('Error cleaning up expired chats:', error);
        }
    }

    // Cleanup method
    destroy() {
        if (this.authUnsubscribe) {
            this.authUnsubscribe();
        }
        if (this.chatUnsubscribe) {
            this.chatUnsubscribe();
        }
        if (this.chatCleanupInterval) {
            clearInterval(this.chatCleanupInterval);
        }
    }
}

// Initialize Firebase integration
window.firebaseIntegration = new FirebaseIntegration();

// Add a global test function to manually show the modal
window.testShowModal = function() {
    console.log('Testing modal display...');
    const modal = document.getElementById('authModal');
    if (modal) {
        console.log('Modal found, showing...');
        modal.style.display = 'flex';
        modal.style.zIndex = '9999';
    } else {
        console.error('Modal not found, creating it now...');
        window.firebaseIntegration.createAuthModal();
        setTimeout(() => {
            const newModal = document.getElementById('authModal');
            if (newModal) {
                console.log('Modal created and found, showing...');
                newModal.style.display = 'flex';
                newModal.style.zIndex = '9999';
            } else {
                console.error('Still no modal after creation attempt');
            }
        }, 100);
    }
};

// Add a function to force create the modal
window.forceCreateModal = function() {
    console.log('Force creating modal...');
    if (window.firebaseIntegration) {
        window.firebaseIntegration.createAuthModal();
    } else {
        console.error('Firebase integration not available');
    }
};
