// Mobile-Optimized JavaScript for ParadoxGPT

class MobileParadoxGPT {
    constructor() {
        this.isProcessing = false;
        this.conversationHistory = [];
        this.firebaseIntegration = null;
        
        // DOM Elements
        this.elements = {
            menuBtn: document.getElementById('menuBtn'),
            userBtn: document.getElementById('userBtn'),
            mobileSidebar: document.getElementById('mobileSidebar'),
            closeSidebar: document.getElementById('closeSidebar'),
            mobileOverlay: document.getElementById('mobileOverlay'),
            newChatMobile: document.getElementById('newChatMobile'),
            chatContainerMobile: document.getElementById('chatContainerMobile'),
            welcomeMobile: document.getElementById('welcomeMobile'),
            mobileChatForm: document.getElementById('mobileChatForm'),
            messageInputMobile: document.getElementById('messageInputMobile'),
            sendBtnMobile: document.getElementById('sendBtnMobile'),
            mobileLoading: document.getElementById('mobileLoading'),
            chatHistoryMobile: document.getElementById('chatHistoryMobile'),
            userProfileMobile: document.getElementById('userProfileMobile'),
            loginSectionMobile: document.getElementById('loginSectionMobile'),
            loginBtnMobile: document.getElementById('loginBtnMobile'),
            logoutBtnMobile: document.getElementById('logoutBtnMobile'),
            authModalMobile: document.getElementById('authModalMobile'),
            authCloseMobile: document.getElementById('authCloseMobile')
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupTouchGestures();
        this.setupInputHandling();
        this.setupQuickActions();
        this.initializeFirebase();
        this.updateSendButtonState();
        
        console.log('Mobile ParadoxGPT initialized');
    }
    
    setupEventListeners() {
        // Menu and sidebar
        this.elements.menuBtn.addEventListener('click', () => this.openSidebar());
        this.elements.closeSidebar.addEventListener('click', () => this.closeSidebar());
        this.elements.mobileOverlay.addEventListener('click', () => this.closeSidebar());
        
        // New chat
        this.elements.newChatMobile.addEventListener('click', () => this.startNewChat());
        
        // Chat form
        this.elements.mobileChatForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Auth
        this.elements.loginBtnMobile.addEventListener('click', () => this.showAuthModal());
        this.elements.logoutBtnMobile.addEventListener('click', () => this.logout());
        this.elements.authCloseMobile.addEventListener('click', () => this.hideAuthModal());
        
        // User button (show auth modal or user menu)
        this.elements.userBtn.addEventListener('click', () => this.handleUserButtonClick());
        
        // Input events
        this.elements.messageInputMobile.addEventListener('input', () => this.updateSendButtonState());
        
        // Keyboard events
        this.elements.messageInputMobile.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!this.isProcessing && this.elements.messageInputMobile.value.trim()) {
                    this.handleFormSubmit(e);
                }
            }
        });
        
        // Handle viewport changes (keyboard)
        window.addEventListener('resize', () => this.handleViewportChange());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleViewportChange(), 500);
        });

        // Preview modal controls
        const closePreviewBtn = document.getElementById('closePreviewBtnMobile');
        const fullscreenBtn = document.getElementById('fullscreenBtnMobile');
        const previewModal = document.getElementById('previewModalMobile');

        if (closePreviewBtn) {
            closePreviewBtn.addEventListener('click', () => this.closePreview());
        }

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        if (previewModal) {
            previewModal.addEventListener('click', (e) => {
                if (e.target === previewModal) {
                    this.closePreview();
                }
            });
        }
    }
    
    setupTouchGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        let isSwiping = false;
        
        // Swipe to open sidebar from left edge
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            
            // Only allow swipe from left edge when sidebar is closed
            if (touchStartX < 20 && !this.elements.mobileSidebar.classList.contains('open')) {
                isSwiping = true;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - touchStartX;
            const deltaY = Math.abs(touchY - touchStartY);
            
            // Prevent scrolling during horizontal swipe
            if (Math.abs(deltaX) > deltaY) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const deltaX = touchEndX - touchStartX;
            const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
            
            // Swipe right to open sidebar (minimum 50px swipe, mostly horizontal)
            if (deltaX > 50 && deltaY < 100) {
                this.openSidebar();
            }
            
            isSwiping = false;
        }, { passive: true });
        
        // Swipe to close sidebar
        this.elements.mobileSidebar.addEventListener('touchstart', (e) => {
            if (this.elements.mobileSidebar.classList.contains('open')) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isSwiping = true;
            }
        }, { passive: true });
        
        this.elements.mobileSidebar.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const deltaX = touchStartX - touchEndX;
            const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
            
            // Swipe left to close sidebar (minimum 50px swipe, mostly horizontal)
            if (deltaX > 50 && deltaY < 100) {
                this.closeSidebar();
            }
            
            isSwiping = false;
        }, { passive: true });
    }
    
    setupInputHandling() {
        // Auto-resize textarea
        this.elements.messageInputMobile.addEventListener('input', () => {
            this.elements.messageInputMobile.style.height = 'auto';
            const maxHeight = 120; // Max height in pixels
            const newHeight = Math.min(this.elements.messageInputMobile.scrollHeight, maxHeight);
            this.elements.messageInputMobile.style.height = newHeight + 'px';
        });
        
        // Handle focus for better mobile experience
        this.elements.messageInputMobile.addEventListener('focus', () => {
            setTimeout(() => {
                this.elements.messageInputMobile.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 300);
        });
    }
    
    setupQuickActions() {
        const quickActions = document.querySelectorAll('.quick-action');
        quickActions.forEach(action => {
            action.addEventListener('click', () => {
                const prompt = action.getAttribute('data-prompt');
                if (prompt) {
                    this.elements.messageInputMobile.value = prompt;
                    this.updateSendButtonState();
                    this.elements.messageInputMobile.focus();
                }
            });
        });
    }
    
    initializeFirebase() {
        // Wait for Firebase to be ready
        if (window.firebaseReady) {
            this.setupFirebaseIntegration();
        } else {
            window.addEventListener('firebaseReady', () => {
                this.setupFirebaseIntegration();
            });
        }
    }
    
    setupFirebaseIntegration() {
        // Initialize mobile Firebase integration
        if (window.MobileFirebaseIntegration) {
            this.firebaseIntegration = new window.MobileFirebaseIntegration(this);
            // Make it globally accessible for debugging
            window.mobileFirebaseIntegration = this.firebaseIntegration;
        }
    }
    
    openSidebar() {
        this.elements.mobileSidebar.classList.add('open');
        this.elements.mobileOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Refresh chat history when sidebar opens
        if (this.firebaseIntegration && this.firebaseIntegration.currentUser) {
            console.log('Sidebar opened, refreshing chat history...');
            this.firebaseIntegration.loadUserChats();
        }

        // Haptic feedback
        this.hapticFeedback('light');
    }
    
    closeSidebar() {
        this.elements.mobileSidebar.classList.remove('open');
        this.elements.mobileOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    startNewChat() {
        this.conversationHistory = [];
        this.elements.chatContainerMobile.innerHTML = '';
        this.showWelcomeScreen();
        this.elements.messageInputMobile.value = '';
        this.updateSendButtonState();
        this.closeSidebar();
        
        // Haptic feedback
        this.hapticFeedback('medium');
    }
    
    showWelcomeScreen() {
        this.elements.chatContainerMobile.innerHTML = `
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
        `;
        this.setupQuickActions();
    }
    
    hideWelcomeScreen() {
        const welcome = this.elements.chatContainerMobile.querySelector('.welcome-mobile');
        if (welcome) {
            welcome.remove();
        }
    }
    
    updateSendButtonState() {
        const hasContent = this.elements.messageInputMobile.value.trim().length > 0;
        this.elements.sendBtnMobile.disabled = !hasContent || this.isProcessing;
    }
    
    handleViewportChange() {
        // Handle mobile keyboard appearance
        const viewportHeight = window.innerHeight;
        const initialHeight = window.screen.height;
        
        if (viewportHeight < initialHeight * 0.75) {
            // Keyboard is likely open
            document.body.classList.add('keyboard-open');
        } else {
            document.body.classList.remove('keyboard-open');
        }
    }
    
    hapticFeedback(type = 'light') {
        if ('vibrate' in navigator) {
            const patterns = {
                light: 10,
                medium: 20,
                heavy: 30
            };
            navigator.vibrate(patterns[type] || 10);
        }
    }
    
    showLoading() {
        this.elements.mobileLoading.style.display = 'block';
    }
    
    hideLoading() {
        this.elements.mobileLoading.style.display = 'none';
    }
    
    showAuthModal() {
        this.elements.authModalMobile.style.display = 'flex';
        // Populate auth content via Firebase integration
        if (this.firebaseIntegration) {
            this.firebaseIntegration.showAuthModal();
        }
    }
    
    hideAuthModal() {
        this.elements.authModalMobile.style.display = 'none';
    }
    
    handleUserButtonClick() {
        // Check if user is logged in
        if (this.elements.userProfileMobile.style.display !== 'none') {
            // User is logged in, show user menu or profile
            this.openSidebar();
        } else {
            // User is not logged in, show auth modal
            this.showAuthModal();
        }
    }
    
    logout() {
        if (this.firebaseIntegration) {
            this.firebaseIntegration.logout();
        }
        this.closeSidebar();
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        const message = this.elements.messageInputMobile.value.trim();
        if (!message || this.isProcessing) return;

        // Set processing state
        this.isProcessing = true;
        this.updateSendButtonState();

        // Hide welcome screen
        this.hideWelcomeScreen();

        // Add user message
        this.addMessage(message, 'user');

        // Clear input
        this.elements.messageInputMobile.value = '';
        this.elements.messageInputMobile.style.height = 'auto';

        // Show loading
        this.showLoading();

        // Haptic feedback
        this.hapticFeedback('medium');

        try {
            // Prepare headers
            const headers = {
                'Content-Type': 'application/json',
            };

            // Add auth token if available
            if (this.firebaseIntegration && this.firebaseIntegration.currentUser) {
                try {
                    const token = await this.firebaseIntegration.currentUser.getIdToken();
                    headers['Authorization'] = `Bearer ${token}`;
                } catch (error) {
                    console.warn('Failed to get auth token:', error);
                }
            }

            // Send request
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Hide loading
            this.hideLoading();

            if (data.success) {
                // Add assistant response
                this.addMessage(data.message, 'assistant', data.metadata);

                // Update conversation history
                this.conversationHistory.push(
                    { role: 'user', content: message },
                    { role: 'assistant', content: data.message }
                );
            } else {
                this.addMessage('Sorry, I encountered an error: ' + (data.message || 'Unknown error'), 'assistant');
            }
        } catch (error) {
            this.hideLoading();

            const errorMessage = error.message.includes('fetch')
                ? 'Unable to connect to the server. Please check your connection and try again.'
                : 'Sorry, I encountered an error while processing your request.';

            this.addMessage(errorMessage, 'assistant');
            console.error('Error:', error);
        } finally {
            this.isProcessing = false;
            this.updateSendButtonState();
            this.elements.messageInputMobile.focus();
        }
    }

    addMessage(content, role, metadata = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-mobile ${role}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content-mobile';

        // Process content based on type
        if (metadata && metadata.content_type === 'html') {
            // Handle HTML content
            contentDiv.innerHTML = content;
        } else if (content.includes('```')) {
            // Handle code blocks
            contentDiv.innerHTML = this.processCodeBlocks(content);
        } else {
            // Handle regular text with markdown
            contentDiv.innerHTML = this.processMarkdown(content);
        }

        // Save to Firebase if user is authenticated (only for new messages, not restored ones)
        if (this.firebaseIntegration && this.firebaseIntegration.currentUser && !metadata?.skipFirebase) {
            const isUser = role === 'user';
            console.log('Saving message to Firebase:', { content: content.substring(0, 50), isUser });
            this.firebaseIntegration.saveMessage(content, isUser);
        }

        messageDiv.appendChild(contentDiv);
        this.elements.chatContainerMobile.appendChild(messageDiv);

        // Scroll to bottom
        this.scrollToBottom();

        // Highlight code if present
        if (window.hljs) {
            contentDiv.querySelectorAll('pre code').forEach(block => {
                window.hljs.highlightElement(block);
            });
        }
    }

    processCodeBlocks(content) {
        // Enhanced code block processing for mobile with controls
        return content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'text';
            const codeId = 'code-' + Math.random().toString(36).substr(2, 9);
            const escapedCode = this.escapeHtml(code.trim());

            // Check if it's HTML code
            const isHTML = language === 'html' || language === 'xml' ||
                          code.trim().startsWith('<!DOCTYPE') ||
                          code.includes('<html') ||
                          (code.includes('<div') && code.includes('<style'));

            // Check if it's CSS or JavaScript that could be part of a web project
            const isWebCode = language === 'css' || language === 'javascript' || language === 'js';

            let controls = `
                <div class="code-controls-mobile">
                    <button onclick="window.mobileApp.copyCode('${codeId}')" title="Copy code">
                        <i class="fas fa-copy"></i> Copy
                    </button>
            `;

            if (isHTML) {
                controls += `
                    <button class="preview-button-mobile" onclick="window.mobileApp.showCodePreview('${codeId}')" title="Preview HTML">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                `;
            } else if (isWebCode) {
                controls += `
                    <button class="preview-button-mobile" onclick="window.mobileApp.showCodePreview('${codeId}', true)" title="Run with other code">
                        <i class="fas fa-play"></i> Run All
                    </button>
                `;
            }

            controls += '</div>';

            return `
                <div class="code-block-container-mobile">
                    ${controls}
                    <pre><code id="${codeId}" class="language-${language}">${escapedCode}</code></pre>
                </div>
            `;
        });
    }

    processMarkdown(content) {
        // Simple markdown processing for mobile
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        setTimeout(() => {
            this.elements.chatContainerMobile.scrollTop = this.elements.chatContainerMobile.scrollHeight;
        }, 100);
    }

    // Update UI based on auth state
    updateAuthUI(user) {
        if (user) {
            // Show user profile
            this.elements.loginSectionMobile.style.display = 'none';
            this.elements.userProfileMobile.style.display = 'flex';

            // Update user info
            const userName = this.elements.userProfileMobile.querySelector('.user-name-mobile');
            const userEmail = this.elements.userProfileMobile.querySelector('.user-email-mobile');
            const userAvatar = this.elements.userProfileMobile.querySelector('.user-avatar-mobile');

            if (userName) userName.textContent = user.displayName || 'User';
            if (userEmail) userEmail.textContent = user.email;
            if (userAvatar) {
                const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
                userAvatar.textContent = initial;
            }
        } else {
            // Show login section
            this.elements.loginSectionMobile.style.display = 'block';
            this.elements.userProfileMobile.style.display = 'none';
        }
    }

    // Load chat history
    loadChatHistory(chats) {
        console.log('loadChatHistory called with:', chats?.length || 0, 'chats');
        console.log('Chat history container:', this.elements.chatHistoryMobile);

        if (!this.elements.chatHistoryMobile) {
            console.error('Chat history container not found!');
            return;
        }

        this.elements.chatHistoryMobile.innerHTML = '';

        if (!chats || chats.length === 0) {
            console.log('No chats to display, showing empty message');
            this.elements.chatHistoryMobile.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No chat history yet</p>';
            return;
        }

        console.log('Displaying', chats.length, 'chats');

        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-history-item-mobile';
            chatItem.innerHTML = `
                <div class="chat-title-mobile">${this.escapeHtml(chat.message.substring(0, 50))}${chat.message.length > 50 ? '...' : ''}</div>
                <div class="chat-time-mobile">${this.formatTime(chat.timestamp)}</div>
            `;

            chatItem.addEventListener('click', () => {
                // Load this chat conversation
                this.loadChatConversation(chat);
                this.closeSidebar();
            });

            this.elements.chatHistoryMobile.appendChild(chatItem);
        });
    }

    loadChatConversation(chat) {
        // This would load a specific chat conversation
        // For now, just start a new chat
        this.startNewChat();
    }

    // Code review functionality
    copyCode(codeId) {
        const codeElement = document.getElementById(codeId);
        if (!codeElement) return;

        const code = codeElement.textContent;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(() => {
                this.showToast('Code copied to clipboard!');
            }).catch(() => {
                this.fallbackCopyCode(code);
            });
        } else {
            this.fallbackCopyCode(code);
        }
    }

    fallbackCopyCode(code) {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            this.showToast('Code copied to clipboard!');
        } catch (err) {
            this.showToast('Failed to copy code');
        }

        document.body.removeChild(textArea);
    }

    showCodePreview(codeId, combineAll = false) {
        const codeElement = document.getElementById(codeId);
        if (!codeElement) return;

        let htmlContent;

        if (combineAll) {
            // Collect all code blocks from the current message
            const messageElement = codeElement.closest('.message-mobile');
            htmlContent = this.createMergedHTMLFromMessage(messageElement, codeElement);
        } else {
            // Use just this code block
            htmlContent = codeElement.textContent.trim();
        }

        this.showHTMLPreview(htmlContent);
    }

    createMergedHTMLFromMessage(messageElement, triggerCodeBlock) {
        if (!messageElement) return triggerCodeBlock.textContent.trim();

        const codeBlocks = {
            html: [],
            css: [],
            javascript: [],
            other: []
        };

        // Collect all code blocks from the message
        messageElement.querySelectorAll('code').forEach(code => {
            const content = code.textContent.trim();
            const language = this.detectLanguageFromCode(code);

            switch (language) {
                case 'html':
                case 'xml':
                    codeBlocks.html.push(content);
                    break;
                case 'css':
                    codeBlocks.css.push(content);
                    break;
                case 'javascript':
                case 'js':
                    codeBlocks.javascript.push(content);
                    break;
                default:
                    codeBlocks.other.push(content);
            }
        });

        return this.createMergedHTMLDocument(codeBlocks, triggerCodeBlock.textContent.trim());
    }

    detectLanguageFromCode(codeElement) {
        // Check class names for language
        const classes = Array.from(codeElement.classList);
        for (const cls of classes) {
            if (cls.startsWith('language-')) {
                return cls.replace('language-', '');
            }
        }

        const content = codeElement.textContent.trim();

        // HTML detection
        if (content.includes('<!DOCTYPE') || content.includes('<html') ||
            (content.includes('<div') && content.includes('<style'))) {
            return 'html';
        }

        // CSS detection
        if (content.includes('{') && content.includes('}') &&
            (content.includes(':') || content.includes('selector'))) {
            return 'css';
        }

        // JavaScript detection
        if (content.includes('function') || content.includes('const ') ||
            content.includes('let ') || content.includes('var ') ||
            content.includes('console.log')) {
            return 'javascript';
        }

        return 'other';
    }

    createMergedHTMLDocument(codeBlocks, triggerContent) {
        // If trigger is a complete HTML document, use it as base
        if (triggerContent.includes('<!DOCTYPE') || triggerContent.includes('<html')) {
            return triggerContent;
        }

        // Build a complete HTML document
        let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
        html += '<meta charset="UTF-8">\n';
        html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
        html += '<title>Code Preview</title>\n';

        // Add CSS
        if (codeBlocks.css.length > 0) {
            html += '<style>\n';
            codeBlocks.css.forEach(css => {
                html += css + '\n';
            });
            html += '</style>\n';
        }

        html += '</head>\n<body>\n';

        // Add HTML content
        if (codeBlocks.html.length > 0) {
            codeBlocks.html.forEach(htmlContent => {
                html += htmlContent + '\n';
            });
        } else if (triggerContent && !triggerContent.includes('function') && !triggerContent.includes('{')) {
            // If trigger is not CSS or JS, treat as HTML
            html += triggerContent + '\n';
        } else {
            // Default content
            html += '<div style="padding: 20px; font-family: Arial, sans-serif;">\n';
            html += '<h1>Code Preview</h1>\n';
            html += '<p>This is a preview of your code.</p>\n';
            html += '</div>\n';
        }

        // Add JavaScript
        if (codeBlocks.javascript.length > 0) {
            html += '<script>\n';
            codeBlocks.javascript.forEach(js => {
                html += js + '\n';
            });
            html += '</script>\n';
        }

        html += '</body>\n</html>';
        return html;
    }

    showHTMLPreview(htmlContent) {
        const modal = document.getElementById('previewModalMobile');
        const iframe = document.getElementById('previewFrameMobile');

        if (!modal || !iframe) return;

        // Create blob URL for the HTML content
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        // Set iframe source
        iframe.src = url;

        // Show modal
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');

        // Clean up blob URL after delay
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 2000);

        // Haptic feedback
        this.hapticFeedback('medium');
    }

    showToast(message) {
        // Simple toast notification for mobile
        const toast = document.createElement('div');
        toast.className = 'mobile-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--accent-color);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 0.9rem;
            z-index: 1001;
            animation: toastSlideUp 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideDown 0.3s ease forwards';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }

    closePreview() {
        const modal = document.getElementById('previewModalMobile');
        if (modal) {
            modal.classList.remove('show', 'fullscreen');
            modal.setAttribute('aria-hidden', 'true');

            // Clear iframe source to stop any running scripts
            const iframe = document.getElementById('previewFrameMobile');
            if (iframe) {
                iframe.src = 'about:blank';
            }
        }
    }

    toggleFullscreen() {
        const modal = document.getElementById('previewModalMobile');
        const fullscreenBtn = document.getElementById('fullscreenBtnMobile');

        if (modal && fullscreenBtn) {
            const isFullscreen = modal.classList.contains('fullscreen');

            if (isFullscreen) {
                modal.classList.remove('fullscreen');
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
                fullscreenBtn.title = 'Enter fullscreen';
            } else {
                modal.classList.add('fullscreen');
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
                fullscreenBtn.title = 'Exit fullscreen';
            }

            // Haptic feedback
            this.hapticFeedback('light');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    }
}

// Initialize mobile app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileApp = new MobileParadoxGPT();
});

// Add debugging functions for mobile code review
window.testMobileCodeReview = function() {
    console.log('Testing mobile code review feature...');

    // Test HTML code
    const testHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Test</title>
    <style>
        body { font-family: Arial; padding: 20px; }
        .test { color: blue; }
    </style>
</head>
<body>
    <h1 class="test">Hello World!</h1>
    <script>
        console.log('Hello from mobile preview!');
    </script>
</body>
</html>`;

    if (window.mobileApp) {
        window.mobileApp.showHTMLPreview(testHTML);
        console.log('Mobile preview should be showing...');
    } else {
        console.error('Mobile app not initialized');
    }
};

window.testMobileToast = function() {
    if (window.mobileApp) {
        window.mobileApp.showToast('Test toast notification!');
    }
};
