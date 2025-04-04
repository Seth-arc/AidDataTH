document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features
    initScrollReveal();
    initMobileMenu();
    initSearch();
    initNotifications();
    initParallaxEffects();
    initCourseInteractions();
    initSmoothScroll();
    initHeaderScroll();
    initFilterFunctionality();
    initDrawer();
});

// Enhanced scroll reveal with stagger effect
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add stagger delay based on index
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '50px'
    });

    document.querySelectorAll('.course-card, .path-card').forEach(el => {
        el.classList.add('scroll-reveal');
        observer.observe(el);
    });
}

// Parallax effects for welcome section
function initParallaxEffects() {
    const welcomeSection = document.querySelector('.welcome-section');
    if (!welcomeSection) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.5;
        
        welcomeSection.style.backgroundPosition = `center ${-rate}px`;
        
        // Fade out effect
        const opacity = 1 - (scrolled / 500);
        welcomeSection.style.opacity = Math.max(opacity, 0.1);
    });
}

// Enhanced search functionality with suggestions
function initSearch() {
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-button');
    
    if (searchInput && searchButton) {
        let searchTimeout;
        let suggestionsPanel;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value;
                if (query.length >= 2) {
                    showSearchSuggestions(query);
                } else if (suggestionsPanel) {
                    suggestionsPanel.remove();
                    suggestionsPanel = null;
                }
            }, 300);
        });
        
        // Close suggestions on click outside
        document.addEventListener('click', (e) => {
            if (suggestionsPanel && !e.target.closest('.search-bar')) {
                suggestionsPanel.remove();
                suggestionsPanel = null;
            }
        });
    }
}

function showSearchSuggestions(query) {
    // Mock suggestions - replace with actual API call
    const suggestions = [
        { type: 'course', title: 'Credit Shopper Tool', match: 'Popular course' },
        { type: 'path', title: 'Project Finance Specialist', match: 'Learning path' },
        { type: 'course', title: 'Sustainable Finance', match: 'Upcoming course' }
    ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()));

    let panel = document.querySelector('.search-suggestions');
    if (!panel) {
        panel = document.createElement('div');
        panel.className = 'search-suggestions';
        document.querySelector('.search-bar').appendChild(panel);
    }

    panel.innerHTML = suggestions.map(item => `
        <div class="suggestion-item">
            <div class="suggestion-icon">${item.type === 'course' ? '📚' : '🎯'}</div>
            <div class="suggestion-content">
                <h4>${item.title}</h4>
                <span>${item.match}</span>
            </div>
        </div>
    `).join('') || '<div class="no-results">No matches found</div>';
}

// Enhanced course interactions
function initCourseInteractions() {
    document.querySelectorAll('.course-card').forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            const button = card.querySelector('.course-button');
            if (button && !button.classList.contains('enrolled')) {
                button.innerHTML = 'Start Learning →';
            }
        });

        card.addEventListener('mouseleave', (e) => {
            const button = card.querySelector('.course-button');
            if (button && !button.classList.contains('enrolled')) {
                button.innerHTML = button.dataset.originalText || 'Start Course';
            }
        });
    });
}

// Smooth scroll functionality
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Enhanced notification system
function createNotificationsPanel() {
    const panel = document.createElement('div');
    panel.className = 'notifications-panel';
    
    const header = document.createElement('div');
    header.className = 'notifications-header';
    header.innerHTML = `
        <h3>Notifications</h3>
        <div class="notification-actions">
            <button class="mark-all-read">Mark all as read</button>
            <button class="close-notifications">×</button>
        </div>
    `;
    
    const content = document.createElement('div');
    content.className = 'notifications-content';
    
    // Add notification groups
    const today = createNotificationGroup('Today');
    const earlier = createNotificationGroup('Earlier');
    
    content.appendChild(today);
    content.appendChild(earlier);
    
    panel.appendChild(header);
    panel.appendChild(content);
    
    // Add event listeners
    const closeButton = header.querySelector('.close-notifications');
    const markAllRead = header.querySelector('.mark-all-read');
    
    closeButton.addEventListener('click', () => {
        panel.classList.remove('active');
    });
    
    markAllRead.addEventListener('click', () => {
        panel.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            animateNotificationRead(item);
        });
    });
    
    return panel;
}

function createNotificationItem({ icon, title, message, time, unread = false }) {
    const item = document.createElement('div');
    item.className = `notification-item${unread ? ' unread' : ''}`;
    
    item.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
            <h4>${title}</h4>
            <p>${message}</p>
            <span class="notification-time">${time}</span>
        </div>
    `;
    
    // Add click interaction
    item.addEventListener('click', () => {
        if (item.classList.contains('unread')) {
            item.classList.remove('unread');
            animateNotificationRead(item);
        }
    });
    
    return item;
}

function createNotificationGroup(title) {
    const group = document.createElement('div');
    group.className = 'notification-group';
    
    const groupHeader = document.createElement('h4');
    groupHeader.className = 'notification-group-header';
    groupHeader.textContent = title;
    
    group.appendChild(groupHeader);
    
    // Add notifications based on group
    if (title === 'Today') {
        group.appendChild(createNotificationItem({
            icon: '📚',
            title: 'New Course Available',
            message: 'Sustainable Finance Fundamentals is now available for preview.',
            time: '2 hours ago',
            unread: true
        }));
    } else {
        group.appendChild(createNotificationItem({
            icon: '🏆',
            title: 'Achievement Unlocked',
            message: 'You\'ve completed 50% of the Credit Shopper Tool course!',
            time: '2 days ago',
            unread: false
        }));
    }
    
    return group;
}

function animateNotificationRead(element) {
    element.style.transition = 'all 0.3s ease-out';
    element.style.transform = 'translateX(10px)';
    element.style.opacity = '0.7';
    
    setTimeout(() => {
        element.style.transform = '';
        element.style.opacity = '';
    }, 300);
}

// Enhanced loading states
function showLoading(element) {
    element.classList.add('loading');
    element.dataset.originalContent = element.innerHTML;
    
    // Create loading content
    element.innerHTML = `
        <div class="loading-brand">
            <img src="img/logodark.png" alt="AidData Logo" class="loading-logo">
        </div>
        <svg class="loading-spinner" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke-width="5"/>
        </svg>
        <div class="loading-text">Loading</div>
        <div class="loading-progress"></div>
    `;
}

function hideLoading(element) {
    // Add fade out animation
    element.style.opacity = '0';
    
    setTimeout(() => {
        element.classList.remove('loading');
        element.innerHTML = element.dataset.originalContent;
        delete element.dataset.originalContent;
        
        // Restore opacity with transition
        requestAnimationFrame(() => {
            element.style.transition = 'opacity 0.3s ease';
            element.style.opacity = '1';
            
            // Clean up transition
            setTimeout(() => {
                element.style.transition = '';
            }, 300);
        });
    }, 300);
}

// Global loading overlay
function showGlobalLoading(message = 'Loading') {
    let overlay = document.querySelector('.loading-overlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        
        overlay.innerHTML = `
            <div class="loading-shapes">
                <div class="loading-shape"></div>
                <div class="loading-shape"></div>
            </div>
            <div class="loading-content">
                <div class="loading-brand">
                    <img src="img/logodark.png" alt="AidData Logo" class="loading-logo">
                </div>
                <svg class="loading-spinner" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" stroke-width="5"/>
                </svg>
                <div class="loading-text">${message}</div>
                <div class="loading-progress"></div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    // Trigger reflow before adding active class for animation
    overlay.offsetHeight;
    overlay.classList.add('active');
}

function hideGlobalLoading() {
    const overlay = document.querySelector('.loading-overlay');
    
    if (overlay) {
        overlay.classList.remove('active');
        
        // Remove overlay after animation
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}

// Initialize mobile menu
function initMobileMenu() {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const nav = document.querySelector('.header-nav');
    
    if (mobileMenuButton && nav) {
        mobileMenuButton.addEventListener('click', () => {
            nav.classList.toggle('active');
            mobileMenuButton.classList.toggle('active');
        });
    }
}

// Initialize notifications
function initNotifications() {
    const notificationButton = document.querySelector('.notification-button');
    
    if (notificationButton) {
        notificationButton.addEventListener('click', () => {
            // Toggle notifications panel
            toggleNotificationsPanel();
        });
    }
}

function toggleNotificationsPanel() {
    // Create notifications panel if it doesn't exist
    let panel = document.querySelector('.notifications-panel');
    
    if (!panel) {
        panel = createNotificationsPanel();
        document.body.appendChild(panel);
    }
    
    panel.classList.toggle('active');
}

// Header scroll behavior
function initHeaderScroll() {
    const header = document.querySelector('.lms-header');
    let lastScroll = 0;
    let scrollTimeout;

    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);

        const currentScroll = window.pageYOffset;
        
        // Show/hide header based on scroll direction
        if (currentScroll > lastScroll && currentScroll > 100) {
            // Scrolling down & past threshold
            header.classList.add('header-scrolled');
            header.classList.remove('header-visible');
        } else {
            // Scrolling up or at top
            header.classList.remove('header-scrolled');
            header.classList.add('header-visible');
        }

        lastScroll = currentScroll;

        // Remove classes after scroll stops
        scrollTimeout = setTimeout(() => {
            if (currentScroll < 100) {
                header.classList.remove('header-scrolled', 'header-visible');
            }
        }, 150);
    });
}

// Initialize filter functionality
function initFilterFunctionality() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.featured-course');
    const emptyState = document.querySelector('.empty-state');

    if (!filterBtns || !cards || !emptyState) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            let hasVisibleCourses = false;

            // Filter cards
            cards.forEach(card => {
                if (filter === 'all' || card.dataset.type === filter) {
                    card.classList.remove('hidden');
                    hasVisibleCourses = true;
                } else {
                    card.classList.add('hidden');
                }
            });

            // Show/hide empty state
            if (!hasVisibleCourses) {
                emptyState.classList.add('visible');
            } else {
                emptyState.classList.remove('visible');
            }
        });
    });
}

// Drawer functionality
function toggleDrawer() {
    const infoDrawer = document.querySelector('.info-drawer');
    const body = document.body;
    
    if (infoDrawer) {
        if (!infoDrawer.classList.contains('open')) {
            // Opening drawer
            infoDrawer.classList.add('open');
            body.style.overflow = 'hidden';
            // Reset scroll position
            setTimeout(() => {
                infoDrawer.scrollTo(0, 0);
            }, 100);
        } else {
            // Closing drawer
            infoDrawer.classList.remove('open');
            body.style.overflow = '';
        }
    }
}

// Initialize drawer functionality
function initDrawer() {
    const learnMoreBtn = document.querySelector('.learn-more-btn');
    const infoDrawer = document.querySelector('.info-drawer');
    const closeDrawerBtn = document.querySelector('.close-drawer');

    if (learnMoreBtn && infoDrawer && closeDrawerBtn) {
        // Add click event listener to the learn more button
        learnMoreBtn.addEventListener('click', () => {
            toggleDrawer();
        });
        
        // Add click event listener to the close button
        closeDrawerBtn.addEventListener('click', () => {
            toggleDrawer();
        });

        // Close drawer when clicking outside
        infoDrawer.addEventListener('click', (e) => {
            if (e.target === infoDrawer) {
                toggleDrawer();
            }
        });

        // Close drawer on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && infoDrawer.classList.contains('open')) {
                toggleDrawer();
            }
        });
    }
}

// Make drawer functionality globally available
window.toggleDrawer = toggleDrawer; 