document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('messageInput');
    const chatContainer = document.getElementById('chatContainer');
    const newChatBtn = document.getElementById('newChatBtn');
    const sendButton = document.getElementById('sendBtn');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    // Modal elements
    const previewModal = document.getElementById('previewModal');
    const previewFrame = document.getElementById('previewFrame');
    const closePreviewBtn = document.getElementById('closePreviewBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // State management
    let isProcessing = false;
    let conversationHistory = [];

    // Firebase integration
    let firebaseIntegration = null;

    // Initialize the application
    init();

    function init() {
        setupEventListeners();
        setupAutoResize();
        setupKeyboardShortcuts();
        initParticleSystem();
        focusInput();
        updateToggleButtonVisibility(); // Initialize toggle button visibility

        // Initialize Firebase integration
        setTimeout(() => {
            firebaseIntegration = window.firebaseIntegration;
            if (firebaseIntegration) {
                // Make functions available globally for Firebase integration
                window.addMessageToChat = addMessage;
                window.showWelcomeSection = showWelcomeSection;
                window.startNewChat = startNewChat;
            }
        }, 100);
    }

    function setupEventListeners() {
        // Form submission
        chatForm.addEventListener('submit', handleFormSubmit);

        // New chat button
        newChatBtn.addEventListener('click', startNewChat);

        // Sidebar toggle
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', toggleSidebar);
        }

        // Preview modal controls
        if (closePreviewBtn) {
            closePreviewBtn.addEventListener('click', closePreview);
        }

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', toggleFullscreen);
        }

        // Close modal when clicking outside
        if (previewModal) {
            previewModal.addEventListener('click', handleModalClick);
        }

        // Close sidebar when clicking outside
        document.addEventListener('click', handleOutsideClick);
    }

    function setupAutoResize() {
        userInput.addEventListener('input', () => {
            // Reset height to auto to get the correct scrollHeight
            userInput.style.height = 'auto';

            // Set height based on content, with min and max constraints
            const maxHeight = parseInt(getComputedStyle(document.documentElement)
                .getPropertyValue('--input-max-height'));
            const newHeight = Math.min(userInput.scrollHeight, maxHeight);

            userInput.style.height = newHeight + 'px';

            // Update send button state
            updateSendButtonState();
        });
    }

    function setupKeyboardShortcuts() {
        // Handle Enter key for submission (Shift + Enter for new line)
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isProcessing && userInput.value.trim()) {
                    handleFormSubmit(e);
                }
            }
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape key to close modals
            if (e.key === 'Escape') {
                if (previewModal && previewModal.style.display === 'block') {
                    closePreview();
                }
                if (sidebar && !sidebar.classList.contains('collapsed')) {
                    closeSidebar();
                }
            }

            // Ctrl/Cmd + K for new chat
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                startNewChat();
            }

            // Ctrl/Cmd + L to focus input
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                focusInput();
            }
        });
    }

    function updateSendButtonState() {
        const hasContent = userInput.value.trim().length > 0;
        sendButton.disabled = !hasContent || isProcessing;
    }

    function focusInput() {
        userInput.focus();
        userInput.setSelectionRange(userInput.value.length, userInput.value.length);
    }

    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        updateToggleButtonVisibility();
    }

    function updateToggleButtonVisibility() {
        if (sidebar.classList.contains('collapsed')) {
            sidebarToggle.style.opacity = '1';
            sidebarToggle.style.pointerEvents = 'auto';
            sidebarToggle.style.transform = 'translateX(0)';
        } else {
            sidebarToggle.style.opacity = '0';
            sidebarToggle.style.pointerEvents = 'none';
            sidebarToggle.style.transform = 'translateX(-100%)';
        }
    }

    function closeSidebar() {
        sidebar.classList.add('collapsed');
        updateToggleButtonVisibility();
    }

    function openSidebar() {
        sidebar.classList.remove('collapsed');
        updateToggleButtonVisibility();
    }

    function handleOutsideClick(e) {
        if (!sidebar.classList.contains('collapsed')) {
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                closeSidebar();
            }
        }
    }

    function closePreview() {
        hideModal(previewModal);
        previewModal.classList.remove('fullscreen');
    }

    function toggleFullscreen() {
        previewModal.classList.toggle('fullscreen');
        const icon = fullscreenBtn.querySelector('i');
        if (previewModal.classList.contains('fullscreen')) {
            icon.className = 'fas fa-compress';
            fullscreenBtn.title = 'Exit Fullscreen';
        } else {
            icon.className = 'fas fa-expand';
            fullscreenBtn.title = 'Toggle fullscreen';
        }
    }

    function handleModalClick(e) {
        if (e.target === previewModal) {
            closePreview();
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        const message = userInput.value.trim();
        if (!message || isProcessing) return;

        // Set processing state
        isProcessing = true;
        updateSendButtonState();

        // Hide welcome section if it exists
        hideWelcomeSection();

        // Add user message to chat
        addMessage(message, 'user');

        // Clear input and reset height
        userInput.value = '';
        userInput.style.height = 'auto';

        // Show typing indicator
        const typingIndicator = addTypingIndicator();

        try {
            // Send message to backend
            const headers = {
                'Content-Type': 'application/json',
            };

            // Add authentication header if user is logged in
            if (firebaseIntegration && firebaseIntegration.currentUser) {
                try {
                    const token = await firebaseIntegration.currentUser.getIdToken();
                    headers['Authorization'] = `Bearer ${token}`;
                } catch (error) {
                    console.warn('Failed to get auth token:', error);
                }
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Remove typing indicator
            removeTypingIndicator(typingIndicator);

            if (data.success) {
                // Add assistant's response
                addMessage(data.message, 'assistant', data.metadata);

                // Add to conversation history
                conversationHistory.push(
                    { role: 'user', content: message },
                    { role: 'assistant', content: data.message }
                );
            } else {
                // Show error message
                addMessage('Sorry, I encountered an error: ' + (data.message || 'Unknown error'), 'assistant');
            }
        } catch (error) {
            // Remove typing indicator
            removeTypingIndicator(typingIndicator);

            // Show error message
            const errorMessage = error.message.includes('fetch')
                ? 'Unable to connect to the server. Please check your connection and try again.'
                : 'Sorry, I encountered an error while processing your request.';

            addMessage(errorMessage, 'assistant');
            console.error('Error:', error);
        } finally {
            // Reset processing state
            isProcessing = false;
            updateSendButtonState();
            focusInput();
        }
    }

    function startNewChat() {
        // Clear conversation history
        conversationHistory = [];

        // Clear chat container and show welcome section
        chatContainer.innerHTML = '';
        showWelcomeSection();

        // Reset input
        userInput.value = '';
        userInput.style.height = 'auto';
        updateSendButtonState();

        // Close sidebar if open
        closeSidebar();

        // Focus input
        focusInput();
    }

    function hideWelcomeSection() {
        const welcomeSection = chatContainer.querySelector('.welcome-section');
        if (welcomeSection) {
            welcomeSection.style.display = 'none';
        }
    }

    function showWelcomeSection() {
        const welcomeSection = createWelcomeSection();
        chatContainer.appendChild(welcomeSection);
    }

    function createWelcomeSection() {
        const welcomeSection = document.createElement('div');
        welcomeSection.className = 'welcome-section';
        welcomeSection.innerHTML = `
            <div class="welcome-content">
                <div class="welcome-logo">
                    <i class="fas fa-brain"></i>
                </div>
                <h1 class="welcome-title">ParadoxGPT</h1>
                <p class="welcome-subtitle">How can I help you today?</p>
            </div>
        `;
        return welcomeSection;
    }

    function addMessage(content, role, metadata = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        // Create message avatar
        const messageAvatar = document.createElement('div');
        messageAvatar.className = 'message-avatar';

        if (role === 'user') {
            messageAvatar.innerHTML = '<i class="fas fa-user"></i>';
        } else {
            messageAvatar.innerHTML = '<i class="fas fa-brain"></i>';
        }

        // Create message content
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        // Process markdown and code blocks
        const processedContent = marked.parse(content);
        messageContent.innerHTML = processedContent;

        // Apply syntax highlighting and add controls to code blocks
        messageContent.querySelectorAll('pre').forEach((pre) => {
            const codeBlock = pre.querySelector('code');
            if (codeBlock) {
                hljs.highlightElement(codeBlock);

                // Detect language for enhanced styling
                const detectedLanguage = detectLanguageFromCode(codeBlock);

                // Wrap in container for controls
                const container = document.createElement('div');
                container.className = 'code-block-container';

                // Add language data attribute for CSS styling
                if (detectedLanguage) {
                    container.setAttribute('data-language', detectedLanguage);
                }

                // Create controls
                const controls = document.createElement('div');
                controls.className = 'code-controls';

                // Copy button
                const copyBtn = document.createElement('button');
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                copyBtn.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(codeBlock.textContent);
                        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                        }, 2000);
                    } catch (err) {
                        console.error('Failed to copy text: ', err);
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = codeBlock.textContent;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                        }, 2000);
                    }
                });

                controls.appendChild(copyBtn);

                // Check if it's HTML code
                const language = codeBlock.className.match(/language-(\w+)/);
                const isHTML = language && (language[1] === 'html' || language[1] === 'xml') ||
                              codeBlock.textContent.trim().startsWith('<!DOCTYPE') ||
                              codeBlock.textContent.includes('<html') ||
                              (codeBlock.textContent.includes('<div') && codeBlock.textContent.includes('<style'));

                if (isHTML) {
                    const previewBtn = document.createElement('button');
                    previewBtn.innerHTML = '<i class="fas fa-eye"></i> Preview';
                    previewBtn.className = 'preview-button';
                    previewBtn.addEventListener('click', () => {
                        showHTMLPreview(codeBlock);
                    });
                    controls.appendChild(previewBtn);
                }

                // Add preview button for any code block that might be part of a web project
                if (!isHTML && (language && (language[1] === 'css' || language[1] === 'javascript'))) {
                    const previewBtn = document.createElement('button');
                    previewBtn.innerHTML = '<i class="fas fa-play"></i> Run All';
                    previewBtn.className = 'preview-button';
                    previewBtn.title = 'Combine with other code blocks and preview';
                    previewBtn.addEventListener('click', () => {
                        showHTMLPreview(codeBlock);
                    });
                    controls.appendChild(previewBtn);
                }

                // Replace the original pre with the container
                pre.parentNode.replaceChild(container, pre);
                container.appendChild(pre);
                container.appendChild(controls);
            }
        });

        // Assemble message
        messageDiv.appendChild(messageAvatar);
        messageDiv.appendChild(messageContent);

        // Add metadata footer if available
        if (metadata && metadata.generated_by && role === 'assistant') {
            const footer = document.createElement('div');
            footer.className = 'message-footer';
            footer.innerHTML = `
                <small>Generated by ${metadata.generated_by}</small>
                <div class="message-actions">
                    <button class="message-action-btn" onclick="regenerateResponse(this)" title="Regenerate response">
                        <i class="fas fa-redo"></i>
                    </button>
                </div>
            `;
            messageContent.appendChild(footer);
        }

        chatContainer.appendChild(messageDiv);

        // Save to Firebase if user is authenticated (only for new messages, not restored ones)
        if (firebaseIntegration && firebaseIntegration.currentUser && !metadata?.skipFirebase) {
            const isUser = role === 'user';
            firebaseIntegration.saveMessage(content, isUser);
        }

        // Scroll to bottom smoothly
        requestAnimationFrame(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });
    }

    function showHTMLPreview(triggerCodeBlock) {
        // Collect all code blocks from the conversation
        const codeBlocks = collectCodeBlocksFromConversation();

        // Create a complete HTML document by merging all relevant code blocks
        const fullHTML = createMergedHTMLDocument(codeBlocks, triggerCodeBlock);

        // Create a blob URL for the HTML content
        const blob = new Blob([fullHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        // Set the iframe source
        previewFrame.src = url;

        // Show the modal with animation
        showModal(previewModal);

        // Clean up the blob URL after a delay
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 2000);
    }

    function collectCodeBlocksFromConversation() {
        const messages = chatContainer.querySelectorAll('.message');
        const codeBlocks = {
            html: [],
            css: [],
            javascript: [],
            other: []
        };

        messages.forEach(message => {
            const codeElements = message.querySelectorAll('pre code');
            codeElements.forEach(code => {
                const content = code.textContent.trim();
                const language = detectCodeLanguage(code, content);

                if (language === 'html') {
                    codeBlocks.html.push(content);
                } else if (language === 'css') {
                    codeBlocks.css.push(content);
                } else if (language === 'javascript') {
                    codeBlocks.javascript.push(content);
                } else {
                    codeBlocks.other.push({ language, content });
                }
            });
        });

        return codeBlocks;
    }

    function detectLanguageFromCode(codeElement) {
        // Check highlight.js detected language first
        const hlClasses = Array.from(codeElement.classList).find(cls => cls.startsWith('hljs-'));
        if (hlClasses) {
            const detectedLang = codeElement.getAttribute('data-highlighted');
            if (detectedLang) return detectedLang;
        }

        // Check class name
        const className = codeElement.className;
        const langMatch = className.match(/(?:language-|hljs-)(\w+)/);
        if (langMatch) {
            const lang = langMatch[1].toLowerCase();
            // Normalize common language names
            if (lang === 'js') return 'javascript';
            if (lang === 'py') return 'python';
            if (lang === 'ts') return 'typescript';
            if (lang === 'jsx') return 'javascript';
            if (lang === 'tsx') return 'typescript';
            return lang;
        }

        // Content-based detection
        return detectCodeLanguage(codeElement, codeElement.textContent);
    }

    function detectCodeLanguage(codeElement, content) {
        // Check class name first
        const className = codeElement.className;
        if (className.includes('language-html') || className.includes('language-xml')) {
            return 'html';
        }
        if (className.includes('language-css')) {
            return 'css';
        }
        if (className.includes('language-javascript') || className.includes('language-js')) {
            return 'javascript';
        }
        if (className.includes('language-python') || className.includes('language-py')) {
            return 'python';
        }
        if (className.includes('language-json')) {
            return 'json';
        }
        if (className.includes('language-sql')) {
            return 'sql';
        }

        // Content-based detection
        const lowerContent = content.toLowerCase();

        // JSON detection (check first as it's more specific)
        try {
            JSON.parse(content.trim());
            if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
                return 'json';
            }
        } catch (e) {
            // Not JSON, continue with other checks
        }

        // Python detection
        if (lowerContent.includes('def ') ||
            lowerContent.includes('import ') ||
            lowerContent.includes('from ') ||
            lowerContent.includes('print(') ||
            lowerContent.includes('if __name__') ||
            lowerContent.includes('class ') && lowerContent.includes(':')) {
            return 'python';
        }

        // HTML detection
        if (lowerContent.includes('<!doctype') ||
            lowerContent.includes('<html') ||
            lowerContent.includes('<div') ||
            lowerContent.includes('<span') ||
            lowerContent.includes('<p>') ||
            lowerContent.includes('<h1') ||
            lowerContent.includes('<body')) {
            return 'html';
        }

        // CSS detection
        if (lowerContent.includes('{') && lowerContent.includes('}') &&
            (lowerContent.includes(':') || lowerContent.includes('color') ||
             lowerContent.includes('background') || lowerContent.includes('margin') ||
             lowerContent.includes('padding') || lowerContent.includes('font'))) {
            return 'css';
        }

        // SQL detection
        if (lowerContent.includes('select ') ||
            lowerContent.includes('insert ') ||
            lowerContent.includes('update ') ||
            lowerContent.includes('delete ') ||
            lowerContent.includes('create table') ||
            lowerContent.includes('alter table')) {
            return 'sql';
        }

        // JavaScript detection
        if (lowerContent.includes('function') ||
            lowerContent.includes('const ') ||
            lowerContent.includes('let ') ||
            lowerContent.includes('var ') ||
            lowerContent.includes('document.') ||
            lowerContent.includes('console.') ||
            lowerContent.includes('=>')) {
            return 'javascript';
        }

        return 'other';
    }

    function createMergedHTMLDocument(codeBlocks, triggerCodeBlock) {
        // If trigger is a complete HTML document, use it as base
        const triggerContent = triggerCodeBlock ? triggerCodeBlock.textContent.trim() : '';

        if (triggerContent.includes('<!DOCTYPE') || triggerContent.includes('<html')) {
            return triggerContent;
        }

        // Merge all CSS
        const mergedCSS = codeBlocks.css.join('\n\n');

        // Merge all HTML (prioritize the trigger block if it's HTML)
        let mergedHTML = '';
        if (triggerCodeBlock && detectCodeLanguage(triggerCodeBlock, triggerContent) === 'html') {
            mergedHTML = triggerContent + '\n\n' + codeBlocks.html.filter(html => html !== triggerContent).join('\n\n');
        } else {
            mergedHTML = codeBlocks.html.join('\n\n');
        }

        // Merge all JavaScript
        const mergedJS = codeBlocks.javascript.join('\n\n');

        // Create complete HTML document
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ParadoxGPT Live Preview</title>
    <style>
        /* Default styling */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            background: #ffffff;
            color: #333333;
        }

        /* User CSS */
        ${mergedCSS}
    </style>
</head>
<body>
    ${mergedHTML}

    ${mergedJS ? `<script>\n${mergedJS}\n</script>` : ''}
</body>
</html>`;
    }

    function addTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message assistant';

        // Create avatar
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<i class="fas fa-brain"></i>';

        // Create content with typing animation
        const content = document.createElement('div');
        content.className = 'message-content';

        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';

        const dotsDiv = document.createElement('div');
        dotsDiv.className = 'typing-dots';
        dotsDiv.innerHTML = '<span></span><span></span><span></span>';

        typingDiv.appendChild(dotsDiv);
        content.appendChild(typingDiv);

        indicator.appendChild(avatar);
        indicator.appendChild(content);
        chatContainer.appendChild(indicator);

        // Scroll to bottom
        requestAnimationFrame(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });

        return indicator;
    }

    function removeTypingIndicator(indicator) {
        if (indicator && indicator.parentNode) {
            indicator.remove();
        }
    }

    // Global function for regenerating responses
    window.regenerateResponse = function(button) {
        // Find the message element
        const messageElement = button.closest('.message');
        if (!messageElement) return;

        // Get the previous user message
        const userMessage = messageElement.previousElementSibling;
        if (!userMessage || !userMessage.classList.contains('user')) return;

        // Get the user's message content
        const userContent = userMessage.querySelector('.message-content').textContent.trim();

        // Remove the current assistant message
        messageElement.remove();

        // Regenerate the response
        if (!isProcessing) {
            isProcessing = true;
            updateSendButtonState();

            const typingIndicator = addTypingIndicator();

            // Prepare headers
            const headers = {
                'Content-Type': 'application/json',
            };

            // Add authentication header if user is logged in
            if (firebaseIntegration && firebaseIntegration.currentUser) {
                firebaseIntegration.currentUser.getIdToken().then(token => {
                    headers['Authorization'] = `Bearer ${token}`;
                }).catch(error => {
                    console.warn('Failed to get auth token:', error);
                });
            }

            fetch('/api/chat', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ message: userContent }),
            })
            .then(response => response.json())
            .then(data => {
                removeTypingIndicator(typingIndicator);

                if (data.success) {
                    addMessage(data.message, 'assistant', data.metadata);
                } else {
                    addMessage('Sorry, I encountered an error: ' + (data.message || 'Unknown error'), 'assistant');
                }
            })
            .catch(error => {
                removeTypingIndicator(typingIndicator);
                addMessage('Sorry, I encountered an error while regenerating the response.', 'assistant');
                console.error('Error:', error);
            })
            .finally(() => {
                isProcessing = false;
                updateSendButtonState();
            });
        }
    };

    // Particle System for Futuristic Effect
    function initParticleSystem() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        // Check if user prefers reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            createParticle(particlesContainer);
        }
    }

    function createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';

        // Random animation delay
        particle.style.animationDelay = Math.random() * 6 + 's';

        // Random size variation
        const size = Math.random() * 3 + 1;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';

        // Random opacity
        particle.style.opacity = Math.random() * 0.5 + 0.1;

        container.appendChild(particle);

        // Remove and recreate particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.remove();
                createParticle(container);
            }
        }, 6000 + Math.random() * 3000);
    }

    // Enhanced modal display function
    function showModal(modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('fade-in');
        document.body.style.overflow = 'hidden';
    }

    function hideModal(modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('fade-in');
        document.body.style.overflow = '';
    }

    // Initialize send button state
    updateSendButtonState();
});