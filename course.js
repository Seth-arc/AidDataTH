document.addEventListener('DOMContentLoaded', function() {
    // Initialize all course page features
    initModuleAccordions();
    initCourseNavigation();
    initDiscussionFilters();
    initNotifications();
    initVideoPlayer();
    initProgressTracking();
    initResponsiveBehavior();
});

// Module accordion functionality
function initModuleAccordions() {
    const moduleHeaders = document.querySelectorAll('.module-header');
    
    moduleHeaders.forEach(header => {
        header.addEventListener('click', () => {
            // Don't allow toggling locked modules
            if (header.closest('.module-item').classList.contains('locked')) {
                return;
            }
            
            const moduleItem = header.closest('.module-item');
            
            // Toggle active class on clicked module
            moduleItem.classList.toggle('active');
        });
    });
    
    // Auto-expand first module and in-progress module on page load
    const firstModule = document.querySelector('.module-item:first-child');
    const inProgressModule = document.querySelector('.module-item.in-progress');
    
    if (firstModule && !firstModule.classList.contains('locked')) {
        firstModule.classList.add('active');
    }
    
    if (inProgressModule && !inProgressModule.classList.contains('locked')) {
        inProgressModule.classList.add('active');
    }
}

// Course navigation with smooth scroll and active state
function initCourseNavigation() {
    const navLinks = document.querySelectorAll('.course-nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Scroll to section
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                // Calculate scroll offset accounting for fixed header and navigation
                const headerHeight = document.querySelector('.lms-header').offsetHeight;
                const navHeight = document.querySelector('.course-navigation').offsetHeight;
                const offset = headerHeight + navHeight;
                
                const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Update active nav item on scroll
    window.addEventListener('scroll', () => {
        let currentSection = '';
        const scrollPosition = window.scrollY;
        const headerHeight = document.querySelector('.lms-header').offsetHeight;
        const navHeight = document.querySelector('.course-navigation').offsetHeight;
        const offset = headerHeight + navHeight + 20; // Extra padding
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - offset;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });
}

// Discussion filters
function initDiscussionFilters() {
    const filterButtons = document.querySelectorAll('.discussion-filters .filter-button');
    const discussionItems = document.querySelectorAll('.discussion-item');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Filter discussions
            const filter = button.textContent.trim().toLowerCase();
            
            discussionItems.forEach(item => {
                if (filter === 'all topics') {
                    item.style.display = 'grid';
                } else {
                    const tags = Array.from(item.querySelectorAll('.discussion-tag'))
                        .map(tag => tag.textContent.trim().toLowerCase());
                    
                    if (tags.includes(filter)) {
                        item.style.display = 'grid';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        });
    });
    
    // Make discussion items clickable
    discussionItems.forEach(item => {
        item.addEventListener('click', () => {
            // In a real implementation, this would navigate to the discussion detail page
            console.log('Clicked discussion:', item.querySelector('.discussion-title').textContent);
        });
    });
    
    // Initialize pagination
    const prevButton = document.querySelector('.discussion-navigation .prev-button');
    const nextButton = document.querySelector('.discussion-navigation .next-button');
    const pageNumbers = document.querySelectorAll('.page-number');
    
    pageNumbers.forEach(page => {
        page.addEventListener('click', () => {
            pageNumbers.forEach(p => p.classList.remove('active'));
            page.classList.add('active');
            
            // Update prev/next button states
            prevButton.disabled = page.textContent.trim() === '1';
            nextButton.disabled = page.textContent.trim() === '3';
            
            // In a real implementation, this would load the next page of discussions
            console.log('Navigated to page:', page.textContent.trim());
        });
    });
    
    nextButton.addEventListener('click', () => {
        const currentPage = document.querySelector('.page-number.active');
        const nextPage = currentPage.nextElementSibling;
        
        if (nextPage) {
            currentPage.classList.remove('active');
            nextPage.classList.add('active');
            
            // Update button states
            prevButton.disabled = false;
            nextButton.disabled = nextPage.textContent.trim() === '3';
            
            console.log('Navigated to page:', nextPage.textContent.trim());
        }
    });
    
    prevButton.addEventListener('click', () => {
        const currentPage = document.querySelector('.page-number.active');
        const prevPage = currentPage.previousElementSibling;
        
        if (prevPage) {
            currentPage.classList.remove('active');
            prevPage.classList.add('active');
            
            // Update button states
            nextButton.disabled = false;
            prevButton.disabled = prevPage.textContent.trim() === '1';
            
            console.log('Navigated to page:', prevPage.textContent.trim());
        }
    });
}

// Notification system
function initNotifications() {
    const notificationButton = document.querySelector('.notification-button');
    
    if (notificationButton) {
        notificationButton.addEventListener('click', () => {
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
    
    // Close when clicking outside
    if (panel.classList.contains('active')) {
        document.addEventListener('click', closeOnClickOutside);
    } else {
        document.removeEventListener('click', closeOnClickOutside);
    }
}

function closeOnClickOutside(event) {
    const panel = document.querySelector('.notifications-panel');
    const notificationButton = document.querySelector('.notification-button');
    
    if (panel && !panel.contains(event.target) && !notificationButton.contains(event.target)) {
        panel.classList.remove('active');
        document.removeEventListener('click', closeOnClickOutside);
    }
}

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
        document.removeEventListener('click', closeOnClickOutside);
    });
    
    markAllRead.addEventListener('click', () => {
        panel.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
        });
        
        // Remove notification badge from header
        document.querySelector('.notification-badge').style.display = 'none';
    });
    
    return panel;
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
            title: 'Module 2 Quiz Available',
            message: 'The quiz for Data Journalism is now available. Complete it to unlock the next module.',
            time: '2 hours ago',
            unread: true
        }));
        
        group.appendChild(createNotificationItem({
            icon: '📝',
            title: 'Instructor Feedback',
            message: 'John Custer provided feedback on your Data Visualization exercise.',
            time: '5 hours ago',
            unread: true
        }));
    } else {
        group.appendChild(createNotificationItem({
            icon: '🏆',
            title: 'Module 1 Completed',
            message: 'Congratulations! You have completed the Data Foundations module.',
            time: '2 days ago',
            unread: false
        }));
        
        group.appendChild(createNotificationItem({
            icon: '📅',
            title: 'Live Webinar Reminder',
            message: 'Don\'t forget the upcoming "Data Analysis Best Practices" webinar tomorrow.',
            time: '3 days ago',
            unread: false
        }));
    }
    
    return group;
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
            
            // Check if there are any remaining unread notifications
            const remainingUnread = document.querySelectorAll('.notification-item.unread').length;
            if (remainingUnread === 0) {
                document.querySelector('.notification-badge').style.display = 'none';
            }
        }
    });
    
    return item;
}

// Video player functionality
function initVideoPlayer() {
    const videoContainer = document.querySelector('.course-trailer .video-container');
    
    if (videoContainer) {
        // Add play button overlay (optional enhancement)
        const playButton = document.createElement('div');
        playButton.className = 'video-play-button';
        playButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16" fill="currentColor"></polygon>
            </svg>
        `;
        
        // Add custom video controls if needed
        // This is just a placeholder for potential enhancements
        // In a real implementation, you might want to add custom video controls
    }
    
    // Handle continue learning button
    const continueButton = document.querySelector('.continue-button');
    if (continueButton) {
        continueButton.addEventListener('click', () => {
            // In a real implementation, this would navigate to the current lesson
            const currentLesson = document.querySelector('.current-lesson h5').textContent;
            console.log('Continuing lesson:', currentLesson);
            
            // For demo purposes, we'll scroll to the modules section
            const modulesSection = document.getElementById('modules');
            if (modulesSection) {
                const navHeight = document.querySelector('.course-navigation').offsetHeight;
                const headerHeight = document.querySelector('.lms-header').offsetHeight;
                const offset = headerHeight + navHeight;
                
                const targetPosition = modulesSection.getBoundingClientRect().top + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Also expand the in-progress module
                const inProgressModule = document.querySelector('.module-item.in-progress');
                if (inProgressModule && !inProgressModule.classList.contains('active')) {
                    inProgressModule.classList.add('active');
                }
            }
        });
    }
}

// Progress tracking functionality
function initProgressTracking() {
    // This would typically involve API calls to track user progress
    // For this demo, we'll simulate progress updates
    
    // Update header progress bar on lesson completion
    const lessonItems = document.querySelectorAll('.lesson-item:not(.locked)');
    
    lessonItems.forEach(item => {
        if (!item.classList.contains('completed')) {
            item.addEventListener('click', () => {
                // Don't allow clicking locked lessons
                if (item.classList.contains('locked')) {
                    return;
                }
                
                // For demo purposes, toggle completed state on click
                if (item.classList.contains('in-progress')) {
                    item.classList.remove('in-progress');
                    item.classList.add('completed');
                    
                    // Add check icon
                    const statusDiv = item.querySelector('.lesson-status');
                    statusDiv.innerHTML = `
                        <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    `;
                    
                    // Update progress percentage
                    updateProgressPercentage();
                }
                
                // In a real implementation, this would navigate to the lesson page
                console.log('Navigating to lesson:', item.querySelector('.lesson-title').textContent);
            });
        }
    });
}

function updateProgressPercentage() {
    // Calculate progress based on completed lessons
    const totalLessons = document.querySelectorAll('.lesson-item').length;
    const completedLessons = document.querySelectorAll('.lesson-item.completed').length;
    
    const progressPercentage = Math.round((completedLessons / totalLessons) * 100);
    
    // Update all progress bars and text
    const progressBars = document.querySelectorAll('.progress-fill');
    const progressTexts = document.querySelectorAll('.progress-text');
    
    progressBars.forEach(bar => {
        bar.style.width = `${progressPercentage}%`;
    });
    
    document.querySelector('.course-progress .progress-text strong').textContent = `${progressPercentage}%`;
    document.querySelectorAll('.stat-value')[0].textContent = `${progressPercentage}%`;
    
    // Update progress text in sidebar
    const sidebarProgressText = document.querySelector('.sidebar .progress-text');
    if (sidebarProgressText) {
        sidebarProgressText.textContent = `${progressPercentage}% Complete`;
    }
    
    // If a module is completed, update its status
    if (progressPercentage > 25) {
        const firstModule = document.querySelector('.module-item:first-child');
        if (firstModule && !firstModule.classList.contains('completed')) {
            firstModule.classList.add('completed');
            firstModule.classList.remove('in-progress');
            
            // Update the progress indicator
            const indicator = firstModule.querySelector('.module-progress-indicator');
            indicator.innerHTML = `
                <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            
            // Update modules completed stat
            document.querySelectorAll('.stat-value')[1].textContent = '1/4';
        }
    }
}

// Responsive behavior
function initResponsiveBehavior() {
    // Handle sidebar on small screens
    const sidebar = document.querySelector('.sidebar');
    
    if (window.innerWidth < 992) {
        // On mobile, move the "Continue Learning" section to the top of the main content
        const continueSection = sidebar.querySelector('.sidebar-section:first-child');
        const mainContent = document.querySelector('.main-content');
        
        if (continueSection && mainContent) {
            const mobileSection = continueSection.cloneNode(true);
            mobileSection.classList.add('mobile-continue-section');
            mainContent.prepend(mobileSection);
            
            // Add event listener to the cloned button
            const continueButton = mobileSection.querySelector('.continue-button');
            if (continueButton) {
                continueButton.addEventListener('click', () => {
                    const modulesSection = document.getElementById('modules');
                    if (modulesSection) {
                        const navHeight = document.querySelector('.course-navigation').offsetHeight;
                        const headerHeight = document.querySelector('.lms-header').offsetHeight;
                        const offset = headerHeight + navHeight;
                        
                        const targetPosition = modulesSection.getBoundingClientRect().top + window.pageYOffset - offset;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                        
                        const inProgressModule = document.querySelector('.module-item.in-progress');
                        if (inProgressModule && !inProgressModule.classList.contains('active')) {
                            inProgressModule.classList.add('active');
                        }
                    }
                });
            }
        }
    }
    
    // Handle course navigation on scroll
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const courseNav = document.querySelector('.course-navigation');
        
        // Add shadow to course navigation on scroll
        if (currentScrollTop > 100) {
            courseNav.classList.add('shadow-on-scroll');
        } else {
            courseNav.classList.remove('shadow-on-scroll');
        }
        
        // Hide/show course navigation on scroll down/up
        if (currentScrollTop > lastScrollTop && currentScrollTop > 300) {
            // Scrolling down
            courseNav.classList.add('nav-hidden');
        } else {
            // Scrolling up
            courseNav.classList.remove('nav-hidden');
        }
        
        lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop; // For Mobile or negative scrolling
    }, false);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // Adjust course navigation visibility on resize
        const courseNav = document.querySelector('.course-navigation');
        
        if (window.innerWidth < 768) {
            // On very small screens, simplify the navigation
            courseNav.classList.add('simplified-nav');
        } else {
            courseNav.classList.remove('simplified-nav');
        }
    });
    
    // Initial check for small screens
    if (window.innerWidth < 768) {
        document.querySelector('.course-navigation').classList.add('simplified-nav');
    }
}

// Add these CSS classes to support the JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .shadow-on-scroll {
            box-shadow: 0 4px 12px rgba(17, 87, 64, 0.1);
        }
        
        .nav-hidden {
            transform: translateY(-100%);
        }
        
        .simplified-nav .course-nav-item {
            padding: 0.8rem 0.5rem;
            font-size: 0.85rem;
        }
        
        .mobile-continue-section {
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(17, 87, 64, 0.08);
        }
        
        .video-play-button {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            color: white;
            background: rgba(17, 87, 64, 0.8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 5;
        }
        
        .video-play-button:hover {
            transform: translate(-50%, -50%) scale(1.1);
            background: var(--primary-color);
        }
        
        .video-play-button svg {
            width: 40px;
            height: 40px;
        }
    `;
    
    document.head.appendChild(styleElement);
});

// Initialize any additional features needed for the course page
function initAdditionalFeatures() {
    // Add profile dropdown functionality
    const profileButton = document.querySelector('.profile-button');
    
    if (profileButton) {
        profileButton.addEventListener('click', () => {
            // Toggle profile dropdown
            let dropdown = document.querySelector('.profile-dropdown');
            
            if (!dropdown) {
                // Create dropdown if it doesn't exist
                dropdown = document.createElement('div');
                dropdown.className = 'profile-dropdown';
                dropdown.innerHTML = `
                    <div class="dropdown-header">
                        <img src="img/profile-avatar.jpg" alt="User profile" class="dropdown-avatar">
                        <div class="dropdown-user-info">
                            <h4>James Wilson</h4>
                            <p>james.wilson@example.com</p>
                        </div>
                    </div>
                    <div class="dropdown-menu">
                        <a href="#" class="dropdown-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            My Profile
                        </a>
                        <a href="#" class="dropdown-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                            </svg>
                            My Courses
                        </a>
                        <a href="#" class="dropdown-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Learning History
                        </a>
                        <a href="#" class="dropdown-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            Settings
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Sign Out
                        </a>
                    </div>
                `;
                
                document.body.appendChild(dropdown);
                
                // Position dropdown
                const rect = profileButton.getBoundingClientRect();
                dropdown.style.position = 'fixed';
                dropdown.style.top = `${rect.bottom + 10}px`;
                dropdown.style.right = `${window.innerWidth - rect.right}px`;
                
                // Add event listener to close dropdown when clicking outside
                document.addEventListener('click', closeDropdownOnClickOutside);
            } else {
                dropdown.remove();
                document.removeEventListener('click', closeDropdownOnClickOutside);
            }
        });
    }
    
    function closeDropdownOnClickOutside(event) {
        const dropdown = document.querySelector('.profile-dropdown');
        const profileButton = document.querySelector('.profile-button');
        
        if (dropdown && !dropdown.contains(event.target) && !profileButton.contains(event.target)) {
            dropdown.remove();
            document.removeEventListener('click', closeDropdownOnClickOutside);
        }
    }
    
    // Add styles for profile dropdown
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .profile-dropdown {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(17, 87, 64, 0.15);
            width: 280px;
            z-index: 1000;
            overflow: hidden;
            animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .dropdown-header {
            padding: 1.5rem;
            border-bottom: 1px solid rgba(17, 87, 64, 0.1);
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .dropdown-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            object-fit: cover;
        }
        
        .dropdown-user-info h4 {
            font-size: 1rem;
            font-weight: 500;
            color: var(--dark-text);
            margin: 0 0 0.25rem;
        }
        
        .dropdown-user-info p {
            font-size: 0.85rem;
            color: var(--light-text);
            margin: 0;
        }
        
        .dropdown-menu {
            padding: 0.75rem 0;
        }
        
        .dropdown-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1.5rem;
            color: var(--dark-text);
            text-decoration: none;
            font-size: 0.95rem;
            transition: all 0.2s ease;
        }
        
        .dropdown-item:hover {
            background: rgba(17, 87, 64, 0.05);
            color: var(--primary-color);
        }
        
        .dropdown-item svg {
            width: 18px;
            height: 18px;
            color: var(--light-text);
        }
        
        .dropdown-item:hover svg {
            color: var(--primary-color);
        }
        
        .dropdown-divider {
            height: 1px;
            background: rgba(17, 87, 64, 0.1);
            margin: 0.5rem 0;
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Call additional initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    initAdditionalFeatures();
});