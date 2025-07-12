document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('messageInput');
    const chatContainer = document.getElementById('chatContainer');
    const newChatBtn = document.getElementById('newChatBtn');
    const sendButton = document.getElementById('sendBtn');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    // Create mobile overlay for sidebar
    let sidebarOverlay = null;

    // Mobile floating login button
    const mobileLoginFab = document.getElementById('mobileLoginFab');

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
        setupMobileFeatures();
        initParticleSystem();
        focusInput();
        updateToggleButtonVisibility(); // Initialize toggle button visibility
        updateMobileLoginButton(); // Initialize mobile login button visibility

        // Initialize Firebase integration
        setTimeout(() => {
            firebaseIntegration = window.firebaseIntegration;
            if (firebaseIntegration) {
                // Make functions available globally for Firebase integration
                window.addMessageToChat = addMessage;
                window.showWelcomeSection = showWelcomeSection;
                window.startNewChat = startNewChat;
                window.updateMobileLoginButton = updateMobileLoginButton;
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

        // Setup mobile login button
        if (mobileLoginFab) {
            mobileLoginFab.addEventListener('click', () => {
                // Trigger the main login button click
                const mainLoginBtn = document.getElementById('loginBtn');
                if (mainLoginBtn) {
                    mainLoginBtn.click();
                }
            });
        }
    }

    function setupMobileFeatures() {
        // Create mobile overlay
        createMobileOverlay();

        // Setup touch gestures
        setupTouchGestures();

        // Handle viewport changes (for mobile keyboards)
        setupViewportHandling();

        // Improve mobile input handling
        setupMobileInputHandling();

        // Add mobile-specific interactions
        setupMobileInteractions();

        // Optimize performance for mobile
        setupMobilePerformanceOptimizations();
    }

    function createMobileOverlay() {
        if (!sidebarOverlay) {
            sidebarOverlay = document.createElement('div');
            sidebarOverlay.className = 'sidebar-overlay';
            sidebarOverlay.addEventListener('click', closeSidebar);
            document.body.appendChild(sidebarOverlay);
        }
    }

    function setupTouchGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        let isSwiping = false;

        // Swipe to open sidebar from left edge
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;

            // Only allow swipe from left edge when sidebar is closed
            if (touchStartX < 20 && sidebar.classList.contains('collapsed')) {
                isSwiping = true;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;

            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;

            // Prevent scrolling during swipe
            if (Math.abs(touchEndX - touchStartX) > Math.abs(touchEndY - touchStartY)) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (!isSwiping) return;

            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = Math.abs(touchEndY - touchStartY);

            // Swipe right to open sidebar (minimum 50px swipe, mostly horizontal)
            if (deltaX > 50 && deltaY < 100) {
                openSidebar();
            }

            isSwiping = false;
        }, { passive: true });

        // Swipe to close sidebar
        sidebar.addEventListener('touchstart', (e) => {
            if (!sidebar.classList.contains('collapsed')) {
                touchStartX = e.changedTouches[0].screenX;
                touchStartY = e.changedTouches[0].screenY;
                isSwiping = true;
            }
        }, { passive: true });

        sidebar.addEventListener('touchend', (e) => {
            if (!isSwiping) return;

            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;

            const deltaX = touchStartX - touchEndX;
            const deltaY = Math.abs(touchEndY - touchStartY);

            // Swipe left to close sidebar (minimum 50px swipe, mostly horizontal)
            if (deltaX > 50 && deltaY < 100) {
                closeSidebar();
            }

            isSwiping = false;
        }, { passive: true });
    }

    function setupViewportHandling() {
        // Handle viewport height changes (mobile keyboard)
        let initialViewportHeight = window.innerHeight;

        function handleViewportChange() {
            const currentHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;

            // If height decreased significantly (keyboard opened)
            if (heightDifference > 150) {
                document.body.classList.add('keyboard-open');
                // Scroll to input when keyboard opens
                setTimeout(() => {
                    userInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            } else {
                document.body.classList.remove('keyboard-open');
            }
        }

        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                initialViewportHeight = window.innerHeight;
                handleViewportChange();
            }, 500);
        });
    }

    function setupMobileInputHandling() {
        // Prevent zoom on input focus for iOS
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            userInput.addEventListener('focus', () => {
                const viewport = document.querySelector('meta[name=viewport]');
                if (viewport) {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                }
            });

            userInput.addEventListener('blur', () => {
                const viewport = document.querySelector('meta[name=viewport]');
                if (viewport) {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
                }
            });
        }

        // Better mobile input handling
        userInput.addEventListener('input', () => {
            // Auto-resize with better mobile handling
            const isSmallScreen = window.innerWidth <= 480;
            const maxHeight = isSmallScreen ? 80 : parseInt(getComputedStyle(document.documentElement)
                .getPropertyValue('--input-max-height'));

            userInput.style.height = 'auto';
            const newHeight = Math.min(userInput.scrollHeight, maxHeight);
            userInput.style.height = newHeight + 'px';
        });

        // Improve mobile input experience
        userInput.addEventListener('focus', () => {
            // Scroll input into view on mobile
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    userInput.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }, 300); // Wait for keyboard animation
            }
        });

        // Handle mobile keyboard done button
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && window.innerWidth <= 768) {
                // On mobile, Enter should submit unless Shift is held
                if (!e.shiftKey) {
                    e.preventDefault();
                    if (userInput.value.trim() && !isProcessing) {
                        chatForm.dispatchEvent(new Event('submit'));
                    }
                }
            }
        });

        // Better paste handling on mobile
        userInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                // Trigger resize after paste
                userInput.dispatchEvent(new Event('input'));
            }, 0);
        });

        // Handle mobile selection and cursor positioning
        userInput.addEventListener('selectionchange', () => {
            if (document.activeElement === userInput && window.innerWidth <= 768) {
                // Ensure cursor is visible on mobile
                setTimeout(() => {
                    const rect = userInput.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;

                    if (rect.bottom > viewportHeight * 0.7) {
                        userInput.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                }, 100);
            }
        });
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

    function setupMobileInteractions() {
        // Add haptic feedback for supported devices
        function addHapticFeedback(element, type = 'light') {
            if ('vibrate' in navigator) {
                element.addEventListener('touchstart', () => {
                    // Light haptic feedback
                    if (type === 'light') {
                        navigator.vibrate(10);
                    } else if (type === 'medium') {
                        navigator.vibrate(20);
                    } else if (type === 'heavy') {
                        navigator.vibrate(30);
                    }
                });
            }
        }

        // Add haptic feedback to key interactive elements
        if (window.innerWidth <= 768) {
            addHapticFeedback(sidebarToggle, 'light');
            addHapticFeedback(sendButton, 'medium');
            addHapticFeedback(newChatBtn, 'light');

            // Add to dynamically created elements
            document.addEventListener('click', (e) => {
                if (e.target.matches('.message-action-btn, .code-controls button, .preview-btn')) {
                    if ('vibrate' in navigator) {
                        navigator.vibrate(10);
                    }
                }
            });
        }

        // Improve touch feedback with visual indicators
        function addTouchFeedback(element) {
            element.addEventListener('touchstart', () => {
                element.style.transform = 'scale(0.95)';
                element.style.opacity = '0.8';
            });

            element.addEventListener('touchend', () => {
                element.style.transform = '';
                element.style.opacity = '';
            });

            element.addEventListener('touchcancel', () => {
                element.style.transform = '';
                element.style.opacity = '';
            });
        }

        // Add touch feedback to buttons
        [sidebarToggle, sendButton, newChatBtn].forEach(addTouchFeedback);

        // Add double-tap to scroll to top
        let lastTap = 0;
        chatContainer.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;

            if (tapLength < 500 && tapLength > 0) {
                // Double tap detected
                chatContainer.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });

                // Haptic feedback for double tap
                if ('vibrate' in navigator) {
                    navigator.vibrate([10, 50, 10]);
                }
            }

            lastTap = currentTime;
        });

        // Add long press context menu for messages (mobile)
        let longPressTimer;
        let isLongPress = false;

        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.message')) {
                isLongPress = false;
                longPressTimer = setTimeout(() => {
                    isLongPress = true;
                    showMessageContextMenu(e.target.closest('.message'), e.touches[0]);
                }, 500);
            }
        });

        document.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer);
        });

        document.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });

        // Prevent context menu on long press for better UX
        document.addEventListener('contextmenu', (e) => {
            if (window.innerWidth <= 768 && e.target.closest('.message')) {
                e.preventDefault();
            }
        });
    }

    function showMessageContextMenu(messageElement, touch) {
        // Create a simple context menu for mobile
        const existingMenu = document.querySelector('.mobile-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'mobile-context-menu';
        menu.style.cssText = `
            position: fixed;
            top: ${touch.clientY - 50}px;
            left: ${touch.clientX - 50}px;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-xl);
            z-index: 1000;
            padding: var(--spacing-sm);
            display: flex;
            gap: var(--spacing-sm);
        `;

        // Add copy button
        const copyBtn = document.createElement('button');
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.className = 'mobile-context-btn';
        copyBtn.style.cssText = `
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: var(--spacing-sm);
            cursor: pointer;
            color: var(--text-primary);
            min-width: 40px;
            min-height: 40px;
        `;

        copyBtn.addEventListener('click', () => {
            const textContent = messageElement.querySelector('.message-content').textContent;
            navigator.clipboard.writeText(textContent).then(() => {
                // Show feedback
                copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    menu.remove();
                }, 1000);
            });
        });

        menu.appendChild(copyBtn);

        // Add share button if supported
        if (navigator.share) {
            const shareBtn = document.createElement('button');
            shareBtn.innerHTML = '<i class="fas fa-share"></i>';
            shareBtn.className = 'mobile-context-btn';
            shareBtn.style.cssText = copyBtn.style.cssText;

            shareBtn.addEventListener('click', () => {
                const textContent = messageElement.querySelector('.message-content').textContent;
                navigator.share({
                    title: 'ParadoxGPT Response',
                    text: textContent
                });
                menu.remove();
            });

            menu.appendChild(shareBtn);
        }

        document.body.appendChild(menu);

        // Remove menu after 3 seconds or on touch outside
        setTimeout(() => {
            if (menu.parentNode) {
                menu.remove();
            }
        }, 3000);

        document.addEventListener('touchstart', function removeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('touchstart', removeMenu);
            }
        });

        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }

    function setupMobilePerformanceOptimizations() {
        if (window.innerWidth > 768) return; // Only apply on mobile

        // Throttle scroll events for better performance
        let scrollTimeout;
        const throttledScrollHandler = () => {
            if (scrollTimeout) return;

            scrollTimeout = setTimeout(() => {
                // Handle scroll-based optimizations
                const scrollTop = chatContainer.scrollTop;
                const containerHeight = chatContainer.clientHeight;

                // Hide/show elements based on scroll position for performance
                const messages = chatContainer.querySelectorAll('.message');
                messages.forEach((message, index) => {
                    const messageRect = message.getBoundingClientRect();
                    const isVisible = messageRect.top < containerHeight + 100 && messageRect.bottom > -100;

                    // Optimize rendering for off-screen messages
                    if (!isVisible) {
                        message.style.contain = 'strict';
                    } else {
                        message.style.contain = 'layout style paint';
                    }
                });

                scrollTimeout = null;
            }, 16); // ~60fps
        };

        chatContainer.addEventListener('scroll', throttledScrollHandler, { passive: true });

        // Optimize input handling
        let inputTimeout;
        const originalInputHandler = userInput.oninput;
        userInput.oninput = (e) => {
            clearTimeout(inputTimeout);
            inputTimeout = setTimeout(() => {
                if (originalInputHandler) originalInputHandler.call(userInput, e);
            }, 50); // Debounce input handling
        };

        // Optimize resize handling
        let resizeTimeout;
        const optimizedResizeHandler = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                updateToggleButtonVisibility();
                updateMobileOverlay();
            }, 100);
        };

        window.addEventListener('resize', optimizedResizeHandler, { passive: true });

        // Preload critical resources
        const preloadCriticalResources = () => {
            // Preload commonly used icons
            const iconPreload = document.createElement('link');
            iconPreload.rel = 'preload';
            iconPreload.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2';
            iconPreload.as = 'font';
            iconPreload.type = 'font/woff2';
            iconPreload.crossOrigin = 'anonymous';
            document.head.appendChild(iconPreload);
        };

        // Use requestIdleCallback for non-critical optimizations
        if ('requestIdleCallback' in window) {
            requestIdleCallback(preloadCriticalResources);
        } else {
            setTimeout(preloadCriticalResources, 1000);
        }

        // Optimize memory usage
        const optimizeMemoryUsage = () => {
            // Limit the number of messages in DOM for performance
            const messages = chatContainer.querySelectorAll('.message');
            const maxMessages = 50; // Keep only last 50 messages in DOM

            if (messages.length > maxMessages) {
                const messagesToRemove = messages.length - maxMessages;
                for (let i = 0; i < messagesToRemove; i++) {
                    if (messages[i]) {
                        messages[i].remove();
                    }
                }
            }
        };

        // Run memory optimization periodically
        setInterval(optimizeMemoryUsage, 30000); // Every 30 seconds

        // Optimize touch event handling
        const optimizeTouchEvents = () => {
            // Use passive listeners where possible
            document.addEventListener('touchstart', () => {}, { passive: true });
            document.addEventListener('touchmove', () => {}, { passive: true });
            document.addEventListener('touchend', () => {}, { passive: true });
        };

        optimizeTouchEvents();

        // Reduce animation complexity on low-end devices
        const reduceAnimationsForLowEndDevices = () => {
            // Detect low-end devices (rough heuristic)
            const isLowEndDevice = navigator.hardwareConcurrency <= 2 ||
                                   navigator.deviceMemory <= 2 ||
                                   /Android.*Chrome\/[0-5]/.test(navigator.userAgent);

            if (isLowEndDevice) {
                document.documentElement.style.setProperty('--transition-fast', '0.1s');
                document.documentElement.style.setProperty('--transition-normal', '0.15s');
                document.documentElement.style.setProperty('--transition-slow', '0.2s');

                // Disable complex animations
                const style = document.createElement('style');
                style.textContent = `
                    @media (max-width: 768px) {
                        .loading-spinner,
                        .typing-dots,
                        .message {
                            animation: none !important;
                        }

                        .sidebar-overlay,
                        .loading-overlay {
                            backdrop-filter: none !important;
                            -webkit-backdrop-filter: none !important;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        };

        reduceAnimationsForLowEndDevices();

        // Optimize code highlighting for mobile
        const optimizeCodeHighlighting = () => {
            // Delay code highlighting to improve initial render performance
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const codeBlock = entry.target;
                        if (window.hljs && !codeBlock.classList.contains('hljs')) {
                            window.hljs.highlightElement(codeBlock);
                        }
                        observer.unobserve(codeBlock);
                    }
                });
            }, { rootMargin: '50px' });

            // Observe existing code blocks
            document.querySelectorAll('pre code').forEach(block => {
                observer.observe(block);
            });

            // Store observer for future use
            window.codeHighlightObserver = observer;
        };

        // Initialize code highlighting optimization
        if ('IntersectionObserver' in window) {
            optimizeCodeHighlighting();
        }
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
        updateMobileOverlay();
    }

    function updateToggleButtonVisibility() {
        const isMobile = window.innerWidth <= 768;

        if (sidebar.classList.contains('collapsed')) {
            sidebarToggle.style.opacity = '1';
            sidebarToggle.style.pointerEvents = 'auto';
            sidebarToggle.style.transform = 'translateX(0)';
        } else {
            if (isMobile) {
                // On mobile, keep toggle visible but move it
                sidebarToggle.style.opacity = '0.7';
                sidebarToggle.style.pointerEvents = 'auto';
                sidebarToggle.style.transform = 'translateX(280px)';
            } else {
                // On desktop, hide completely
                sidebarToggle.style.opacity = '0';
                sidebarToggle.style.pointerEvents = 'none';
                sidebarToggle.style.transform = 'translateX(-100%)';
            }
        }
    }

    function updateMobileOverlay() {
        if (!sidebarOverlay) return;

        const isMobile = window.innerWidth <= 768;

        if (isMobile && !sidebar.classList.contains('collapsed')) {
            sidebarOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        } else {
            sidebarOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }

        // Update mobile login button visibility
        updateMobileLoginButton();
    }

    function updateMobileLoginButton() {
        if (!mobileLoginFab) return;

        const isMobile = window.innerWidth <= 768;
        const sidebarCollapsed = sidebar.classList.contains('collapsed');
        const loginSection = document.getElementById('loginSection');
        const userProfile = document.getElementById('userProfile');
        const mobileLoginPrompt = document.getElementById('mobileLoginPrompt');

        // Check if user is logged in
        const isLoggedIn = userProfile && userProfile.style.display !== 'none';
        const isNotLoggedIn = loginSection && loginSection.style.display !== 'none';

        // Show mobile login FAB if:
        // - On mobile device
        // - Sidebar is collapsed
        // - User is not logged in
        const shouldShowMobileFab = isMobile &&
                                   sidebarCollapsed &&
                                   isNotLoggedIn &&
                                   !isLoggedIn;

        if (shouldShowMobileFab) {
            mobileLoginFab.classList.add('show');
            mobileLoginFab.style.display = 'flex';
        } else {
            mobileLoginFab.classList.remove('show');
            mobileLoginFab.style.display = 'none';
        }

        // Show/hide mobile login prompt in welcome section
        if (mobileLoginPrompt) {
            if (isMobile && isNotLoggedIn && !isLoggedIn) {
                mobileLoginPrompt.style.display = 'block';
            } else {
                mobileLoginPrompt.style.display = 'none';
            }
        }
    }

    function closeSidebar() {
        sidebar.classList.add('collapsed');
        updateToggleButtonVisibility();
        updateMobileOverlay();
    }

    function openSidebar() {
        sidebar.classList.remove('collapsed');
        updateToggleButtonVisibility();
        updateMobileOverlay();
    }

    function handleOutsideClick(e) {
        const isMobile = window.innerWidth <= 768;

        if (!sidebar.classList.contains('collapsed')) {
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                // On mobile, always close when clicking outside
                // On desktop, only close if clicking on main content
                if (isMobile || e.target.closest('.main-content')) {
                    closeSidebar();
                }
            }
        }
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        updateToggleButtonVisibility();
        updateMobileOverlay();
        updateMobileLoginButton();

        // Close sidebar on orientation change for mobile
        if (window.innerWidth <= 768 && !sidebar.classList.contains('collapsed')) {
            setTimeout(() => {
                closeSidebar();
            }, 100);
        }
    });

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

        // Note: We don't clear the sidebar history here - it should remain visible
        // The sidebar shows past conversations, not the current one
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

        // For assistant messages, use typewriter effect unless it's a restored message
        if (role === 'assistant' && !metadata?.skipFirebase && !metadata?.skipTypewriter) {
            // Start with empty content and animate
            messageContent.innerHTML = '';

            // Assemble message first (without content processing)
            messageDiv.appendChild(messageAvatar);
            messageDiv.appendChild(messageContent);
            chatContainer.appendChild(messageDiv);

            // Scroll to bottom
            requestAnimationFrame(() => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            });

            // Start typewriter effect
            startTypewriterEffect(messageContent, content, messageDiv, metadata);
            return; // Exit early for typewriter effect
        }

        // Process markdown and code blocks for immediate display (user messages or restored messages)
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
                        showHTMLPreview(codeBlock, messageDiv);
                    });
                    controls.appendChild(previewBtn);
                }

                // Check if it's React/JSX code
                const isReact = language && (language[1] === 'jsx' || language[1] === 'tsx' || language[1] === 'react') ||
                               detectCodeLanguage(codeBlock, codeBlock.textContent) === 'react';

                if (isReact) {
                    const previewBtn = document.createElement('button');
                    previewBtn.innerHTML = '<i class="fab fa-react"></i> Preview React';
                    previewBtn.className = 'preview-button react-preview';
                    previewBtn.title = 'Preview React component';
                    previewBtn.addEventListener('click', () => {
                        showReactPreview(codeBlock, messageDiv);
                    });
                    controls.appendChild(previewBtn);
                }

                // Add preview button for any code block that might be part of a web project
                if (!isHTML && !isReact && (language && (language[1] === 'css' || language[1] === 'javascript'))) {
                    const previewBtn = document.createElement('button');
                    previewBtn.innerHTML = '<i class="fas fa-play"></i> Run All';
                    previewBtn.className = 'preview-button';
                    previewBtn.title = 'Combine with other code blocks from this message and preview';
                    previewBtn.addEventListener('click', () => {
                        showHTMLPreview(codeBlock, messageDiv);
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

    function startTypewriterEffect(messageContent, content, messageDiv, metadata) {
        // Split content into chunks (text and code blocks)
        const chunks = parseContentIntoChunks(content);
        let currentChunkIndex = 0;

        // Speed settings - much faster like ChatGPT/Claude
        const typeSpeed = 8; // milliseconds per character (faster)
        const codeTypeSpeed = 3; // even faster for code
        const chunkDelay = 50; // small delay between chunks

        function typeNextChunk() {
            if (currentChunkIndex >= chunks.length) {
                // Remove cursor and typing class, then finalize message
                messageContent.classList.remove('typewriter-cursor');
                messageDiv.classList.remove('typing');
                finalizeMessage(messageContent, content, messageDiv, metadata);
                return;
            }

            const chunk = chunks[currentChunkIndex];

            if (chunk.type === 'text') {
                typeTextChunk(chunk.content, () => {
                    currentChunkIndex++;
                    setTimeout(typeNextChunk, chunkDelay);
                });
            } else if (chunk.type === 'code') {
                typeCodeChunk(chunk.content, chunk.language, () => {
                    currentChunkIndex++;
                    setTimeout(typeNextChunk, chunkDelay);
                });
            } else {
                // Other HTML elements - type as text
                typeTextChunk(chunk.content, () => {
                    currentChunkIndex++;
                    setTimeout(typeNextChunk, chunkDelay);
                });
            }
        }

        function typeTextChunk(text, callback) {
            let charIndex = 0;

            // Process the text through markdown for proper formatting
            const processedText = marked.parseInline(text);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = processedText;

            // If it's just plain text, type it directly
            if (tempDiv.textContent === text.trim()) {
                const textNode = document.createTextNode('');
                messageContent.appendChild(textNode);

                function typeChar() {
                    if (charIndex < text.length) {
                        textNode.textContent = text.substring(0, charIndex + 1);
                        charIndex++;

                        // Scroll to bottom during typing
                        requestAnimationFrame(() => {
                            chatContainer.scrollTop = chatContainer.scrollHeight;
                        });

                        setTimeout(typeChar, typeSpeed);
                    } else {
                        callback();
                    }
                }

                typeChar();
            } else {
                // For formatted text, add it instantly to preserve formatting
                const wrapper = document.createElement('span');
                wrapper.innerHTML = processedText;
                messageContent.appendChild(wrapper);

                // Small delay to simulate typing
                setTimeout(callback, text.length * typeSpeed * 0.3);
            }
        }

        function typeCodeChunk(codeContent, language, callback) {
            // Create code block structure
            const preElement = document.createElement('pre');
            const codeElement = document.createElement('code');

            if (language) {
                codeElement.className = `language-${language}`;
            }

            // Add typing effect class
            preElement.classList.add('typing-code');

            preElement.appendChild(codeElement);
            messageContent.appendChild(preElement);

            let charIndex = 0;

            function typeCodeChar() {
                if (charIndex < codeContent.length) {
                    codeElement.textContent = codeContent.substring(0, charIndex + 1);

                    // Apply syntax highlighting periodically for performance
                    if (charIndex % 10 === 0 && window.hljs) {
                        hljs.highlightElement(codeElement);
                    }

                    charIndex++;

                    // Scroll to bottom during typing
                    requestAnimationFrame(() => {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    });

                    setTimeout(typeCodeChar, codeTypeSpeed);
                } else {
                    // Remove typing class and apply final highlighting
                    preElement.classList.remove('typing-code');
                    if (window.hljs) {
                        hljs.highlightElement(codeElement);
                    }
                    callback();
                }
            }

            typeCodeChar();
        }

        // Add cursor and typing class
        messageContent.classList.add('typewriter-cursor');
        messageDiv.classList.add('typing');
        typeNextChunk();
    }

    function parseContentIntoChunks(content) {
        const chunks = [];

        // Split content by code blocks first
        const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            // Add text before code block
            if (match.index > lastIndex) {
                const textContent = content.substring(lastIndex, match.index);
                if (textContent.trim()) {
                    // Split text into smaller chunks for better pacing
                    const textChunks = splitTextIntoChunks(textContent);
                    chunks.push(...textChunks);
                }
            }

            // Add code block
            chunks.push({
                type: 'code',
                language: match[1] || 'text',
                content: match[2].trim()
            });

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < content.length) {
            const textContent = content.substring(lastIndex);
            if (textContent.trim()) {
                const textChunks = splitTextIntoChunks(textContent);
                chunks.push(...textChunks);
            }
        }

        return chunks;
    }

    function splitTextIntoChunks(text) {
        const chunks = [];

        // Split by paragraphs and sentences for natural pacing
        const paragraphs = text.split(/\n\s*\n/);

        paragraphs.forEach(paragraph => {
            const trimmed = paragraph.trim();
            if (trimmed) {
                // Split long paragraphs by sentences
                const sentences = trimmed.split(/(?<=[.!?])\s+/);

                sentences.forEach(sentence => {
                    if (sentence.trim()) {
                        chunks.push({
                            type: 'text',
                            content: sentence.trim() + ' '
                        });
                    }
                });

                // Add paragraph break
                if (paragraphs.length > 1) {
                    chunks.push({
                        type: 'text',
                        content: '\n\n'
                    });
                }
            }
        });

        return chunks;
    }

    function finalizeMessage(messageContent, originalContent, messageDiv, metadata) {
        // Process the original content with markdown
        const processedContent = marked.parse(originalContent);

        // Set the final content
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
                        showHTMLPreview(codeBlock, messageDiv);
                    });
                    controls.appendChild(previewBtn);
                }

                // Check if it's React/JSX code
                const isReact = language && (language[1] === 'jsx' || language[1] === 'tsx' || language[1] === 'react') ||
                               detectCodeLanguage(codeBlock, codeBlock.textContent) === 'react';

                if (isReact) {
                    const previewBtn = document.createElement('button');
                    previewBtn.innerHTML = '<i class="fab fa-react"></i> Preview React';
                    previewBtn.className = 'preview-button react-preview';
                    previewBtn.title = 'Preview React component';
                    previewBtn.addEventListener('click', () => {
                        showReactPreview(codeBlock, messageDiv);
                    });
                    controls.appendChild(previewBtn);
                }

                // Add preview button for any code block that might be part of a web project
                if (!isHTML && !isReact && (language && (language[1] === 'css' || language[1] === 'javascript'))) {
                    const previewBtn = document.createElement('button');
                    previewBtn.innerHTML = '<i class="fas fa-play"></i> Run All';
                    previewBtn.className = 'preview-button';
                    previewBtn.title = 'Combine with other code blocks from this message and preview';
                    previewBtn.addEventListener('click', () => {
                        showHTMLPreview(codeBlock, messageDiv);
                    });
                    controls.appendChild(previewBtn);
                }

                // Replace the original pre with the container
                pre.parentNode.replaceChild(container, pre);
                container.appendChild(pre);
                container.appendChild(controls);
            }
        });

        // Add metadata footer if available
        if (metadata && metadata.generated_by) {
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

        // Save to Firebase if user is authenticated
        if (firebaseIntegration && firebaseIntegration.currentUser && !metadata?.skipFirebase) {
            firebaseIntegration.saveMessage(messageContent.textContent, false);
        }

        // Final scroll to bottom
        requestAnimationFrame(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });
    }

    function showHTMLPreview(triggerCodeBlock, messageElement = null) {
        // Collect code blocks from specific message or entire conversation
        const codeBlocks = messageElement ?
            collectCodeBlocksFromMessage(messageElement) :
            collectCodeBlocksFromConversation();

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

    function showReactPreview(triggerCodeBlock, messageElement = null) {
        // Collect code blocks from specific message or entire conversation
        const codeBlocks = messageElement ?
            collectCodeBlocksFromMessage(messageElement) :
            collectCodeBlocksFromConversation();

        // Create a React preview HTML document
        const reactHTML = createReactPreviewDocument(codeBlocks, triggerCodeBlock);

        // Create a blob URL for the HTML content
        const blob = new Blob([reactHTML], { type: 'text/html' });
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

    function createReactPreviewDocument(codeBlocks, triggerCodeBlock) {
        const triggerContent = triggerCodeBlock ? triggerCodeBlock.textContent.trim() : '';

        // Build a complete HTML document with React support
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Component Preview</title>

    <!-- React CDN -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

    <!-- Babel for JSX transformation -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <!-- Basic styling -->
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        #root {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            min-height: 200px;
        }
        .error {
            color: #d32f2f;
            background: #ffebee;
            padding: 16px;
            border-radius: 4px;
            border-left: 4px solid #d32f2f;
            margin: 10px 0;
        }
`;

        // Add CSS from code blocks
        if (codeBlocks.css && codeBlocks.css.length > 0) {
            codeBlocks.css.forEach(css => {
                html += css + '\n';
            });
        }

        html += `
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect, useCallback, useMemo, useRef } = React;

        try {
            // Component code
`;

        // Add React component code
        if (codeBlocks.javascript && codeBlocks.javascript.length > 0) {
            codeBlocks.javascript.forEach(js => {
                html += js + '\n\n';
            });
        } else if (triggerContent) {
            html += triggerContent + '\n\n';
        }

        // Add default component if none found
        html += `
            // Default component if none defined
            if (typeof App === 'undefined') {
                function App() {
                    return React.createElement('div', {},
                        React.createElement('h1', {}, 'React Component Preview'),
                        React.createElement('p', {}, 'Your React component will appear here.')
                    );
                }
            }

            // Render the component
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(App));

        } catch (error) {
            console.error('React component error:', error);
            document.getElementById('root').innerHTML =
                '<div class="error"><strong>Error:</strong> ' + error.message + '</div>';
        }
    </script>
</body>
</html>`;

        return html;
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
                } else if (language === 'javascript' || language === 'react') {
                    codeBlocks.javascript.push(content);
                } else {
                    codeBlocks.other.push({ language, content });
                }
            });
        });

        return codeBlocks;
    }

    function collectCodeBlocksFromMessage(messageElement) {
        const codeBlocks = {
            html: [],
            css: [],
            javascript: [],
            other: []
        };

        const codeElements = messageElement.querySelectorAll('pre code');
        codeElements.forEach(code => {
            const content = code.textContent.trim();
            const language = detectCodeLanguage(code, content);

            if (language === 'html') {
                codeBlocks.html.push(content);
            } else if (language === 'css') {
                codeBlocks.css.push(content);
            } else if (language === 'javascript' || language === 'react') {
                codeBlocks.javascript.push(content);
            } else {
                codeBlocks.other.push({ language, content });
            }
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

        // React/JSX detection (check before general JavaScript)
        if (lowerContent.includes('react') ||
            lowerContent.includes('jsx') ||
            lowerContent.includes('usestate') ||
            lowerContent.includes('useeffect') ||
            lowerContent.includes('component') ||
            lowerContent.includes('props') ||
            lowerContent.includes('return (') ||
            (lowerContent.includes('<') && lowerContent.includes('/>')) ||
            (lowerContent.includes('<') && lowerContent.includes('className')) ||
            lowerContent.includes('export default') && lowerContent.includes('<')) {
            return 'react';
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

    // Theme Toggle Functionality
    function initializeThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');

        if (!themeToggle) {
            console.warn('Theme toggle button not found');
            return;
        }

        // Load saved theme or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);

        // Add click event listener
        themeToggle.addEventListener('click', toggleTheme);

        // Add keyboard support
        themeToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleTheme();
            }
        });

        console.log('Theme toggle initialized with theme:', savedTheme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);

        // Add a subtle animation effect
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.style.transform = 'scale(0.9)';
            setTimeout(() => {
                themeToggle.style.transform = '';
            }, 150);
        }
    }

    function setTheme(theme) {
        // Set the theme attribute on the document element
        document.documentElement.setAttribute('data-theme', theme);

        // Save to localStorage
        localStorage.setItem('theme', theme);

        // Update the toggle button title
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const newTitle = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
            themeToggle.setAttribute('title', newTitle);
            themeToggle.setAttribute('aria-label', `Toggle to ${theme === 'light' ? 'dark' : 'light'} mode`);
        }

        // Dispatch custom event for other components that might need to know about theme changes
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme }
        }));

        console.log('Theme set to:', theme);
    }

    // Expose theme functions globally for debugging
    window.setTheme = setTheme;
    window.toggleTheme = toggleTheme;

    // Initialize send button state
    updateSendButtonState();

    // Initialize theme toggle
    initializeThemeToggle();

    // Make functions globally available for debugging
    window.collectCodeBlocks = collectCodeBlocksFromConversation;
    window.showHTMLPreview = showHTMLPreview;
    window.showReactPreview = showReactPreview;

    window.testReactPreview = function() {
        const testReactCode = `function App() {
    const [count, setCount] = useState(0);
    const [message, setMessage] = useState('Hello React!');

    return (
        <div style={{ padding: '30px', textAlign: 'center', fontFamily: 'Arial' }}>
            <h1 style={{ color: '#61dafb', marginBottom: '20px' }}>{message}</h1>
            <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '18px' }}>Counter: <strong>{count}</strong></p>
                <button
                    onClick={() => setCount(count + 1)}
                    style={{
                        background: 'linear-gradient(135deg, #61dafb, #21d4fd)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        margin: '5px'
                    }}
                >
                    Increment
                </button>
                <button
                    onClick={() => setCount(count - 1)}
                    style={{
                        background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        margin: '5px'
                    }}
                >
                    Decrement
                </button>
            </div>
            <div>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter a message"
                    style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: '2px solid #61dafb',
                        fontSize: '16px',
                        width: '250px',
                        marginBottom: '10px'
                    }}
                />
            </div>
        </div>
    );
}

export default App;`;

        console.log('Testing React preview...');
        const codeBlocks = { javascript: [testReactCode], css: [], html: [], other: [] };
        const reactHTML = createReactPreviewDocument(codeBlocks, { textContent: testReactCode });

        const blob = new Blob([reactHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        previewFrame.src = url;
        showModal(previewModal);

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 2000);
    };

    // Theme testing function
    window.testThemeToggle = function() {
        console.log('Testing theme toggle...');
        console.log('Current theme:', document.documentElement.getAttribute('data-theme') || 'light');

        // Test automatic toggling
        setTimeout(() => {
            console.log('Switching to dark mode...');
            setTheme('dark');
        }, 1000);

        setTimeout(() => {
            console.log('Switching to light mode...');
            setTheme('light');
        }, 3000);

        setTimeout(() => {
            console.log('Using toggle function...');
            toggleTheme();
        }, 5000);
    };
});