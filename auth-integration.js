// auth-integration.js - Integration of authentication with the LMS main pages

import {
    registerUser,
    loginUser,
    logoutUser,
    resetPassword,
    onAuthChange,
    isAdmin,
    isInstructor
} from './auth.js';

// DOM Elements
const authModal = document.getElementById('authModal');
const signupModal = document.getElementById('signupModal');
const loginModal = document.getElementById('loginModal');
const startButtons = document.querySelectorAll('.start-learning');
const closeAuthBtn = authModal?.querySelector('.close-auth');
const closeSignupBtn = signupModal?.querySelector('.close-signup');
const closeLoginBtn = loginModal?.querySelector('.close-login');
const loginBtn = authModal?.querySelector('.login-button');
const signupBtn = authModal?.querySelector('.signup-button');
const loginLink = signupModal?.querySelector('.login-link');
const signupLink = loginModal?.querySelector('.signup-link');
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const forgotPasswordLink = loginModal?.querySelector('.forgot-password a');
const logoutButton = document.getElementById('logoutButton');

// Header elements
const headerActions = document.querySelector('.header-actions');

/**
 * Initialize authentication on the LMS pages
 */
function initAuth() {
    // Set up auth state listener
    onAuthChange(handleAuthStateChange);
    
    // Add event listeners for modals
    setupAuthModals();
    
    // Add event listeners for forms
    setupAuthForms();
}

/**
 * Handle auth state changes
 * @param {Object} user - Current user or null if signed out
 */
function handleAuthStateChange(user) {
    if (user) {
        // User is signed in
        updateUIForLoggedInUser(user);
    } else {
        // User is signed out
        updateUIForLoggedOutUser();
    }
}

/**
 * Set up auth modal event listeners
 */
function setupAuthModals() {
    // Start learning buttons
    if (startButtons) {
        startButtons.forEach(button => {
            button.addEventListener('click', openAuthModal);
        });
    }
    
    // Close buttons
    if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeAuthModal);
    if (closeSignupBtn) closeSignupBtn.addEventListener('click', closeSignupModal);
    if (closeLoginBtn) closeLoginBtn.addEventListener('click', closeLoginModal);
    
    // Modal backdrop clicks
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === authModal) closeAuthModal();
        });
    }
    
    if (signupModal) {
        signupModal.addEventListener('click', function(e) {
            if (e.target === signupModal) closeSignupModal();
        });
    }
    
    if (loginModal) {
        loginModal.addEventListener('click', function(e) {
            if (e.target === loginModal) closeLoginModal();
        });
    }
    
    // Auth option buttons
    if (signupBtn) signupBtn.addEventListener('click', openSignupModal);
    if (loginBtn) loginBtn.addEventListener('click', openLoginModal);
    
    // Modal link buttons
    if (loginLink) {
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            closeSignupModal();
            openLoginModal();
        });
    }
    
    if (signupLink) {
        signupLink.addEventListener('click', function(e) {
            e.preventDefault();
            closeLoginModal();
            openSignupModal();
        });
    }
    
    // Escape key handler
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (authModal?.classList.contains('active')) closeAuthModal();
            if (signupModal?.classList.contains('active')) closeSignupModal();
            if (loginModal?.classList.contains('active')) closeLoginModal();
        }
    });
}

/**
 * Set up auth form event listeners
 */
function setupAuthForms() {
    // Signup form
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Forgot password
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
    
    // Logout button
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

/**
 * Open the auth modal
 */
function openAuthModal() {
    if (!authModal) return;
    
    authModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the auth modal
 */
function closeAuthModal() {
    if (!authModal) return;
    
    authModal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Open the signup modal
 */
function openSignupModal() {
    if (!signupModal) return;
    
    closeAuthModal();
    closeLoginModal();
    signupModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the signup modal
 */
function closeSignupModal() {
    if (!signupModal) return;
    
    signupModal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Open the login modal
 */
function openLoginModal() {
    if (!loginModal) return;
    
    closeAuthModal();
    closeSignupModal();
    loginModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the login modal
 */
function closeLoginModal() {
    if (!loginModal) return;
    
    loginModal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Handle signup form submission
 * @param {Event} e - Form submit event
 */
async function handleSignup(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(signupForm);
        
        const fullName = formData.get('fullName');
        const email = formData.get('email');
        const password = formData.get('password');
        const organization = formData.get('organization') || '';
        const newsletter = formData.has('newsletter');
        
        if (!fullName || !email || !password) {
            showToast('Please fill in all required fields', 'warning');
            return;
        }
        
        // Password strength validation
        if (password.length < 8) {
            showToast('Password must be at least 8 characters long', 'warning');
            return;
        }
        
        // Simple regex for password strength
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        if (!hasNumber || !hasSpecial) {
            showToast('Password must include at least one number and one special character', 'warning');
            return;
        }
        
        // Show loading state
        const submitButton = signupForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Creating Account...';
        
        const result = await registerUser(email, password, fullName, organization, newsletter);
        
        if (result.success) {
            showToast(result.message, 'success');
            closeSignupModal();
            // Clear form
            signupForm.reset();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error during signup:', error);
        showToast('Failed to create account. Please try again.', 'error');
    } finally {
        // Reset button
        const submitButton = signupForm.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
    }
}

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
async function handleLogin(e) {
    e.preventDefault();
    
    try {
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;
        
        if (!email || !password) {
            showToast('Please enter both email and password', 'warning');
            return;
        }
        
        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Logging In...';
        
        const result = await loginUser(email, password);
        
        if (result.success) {
            showToast('Login successful', 'success');
            closeLoginModal();
            // Redirect if needed (e.g., to dashboard)
            if (window.location.pathname.includes('lms.html')) {
                // Only redirect on main page, otherwise stay on current page
                window.location.href = 'dashboard.html';
            } else {
                // Just refresh the current page to update UI
                window.location.reload();
            }
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error during login:', error);
        showToast('Failed to log in. Please try again.', 'error');
    } finally {
        // Reset button
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Log In';
    }
}

/**
 * Handle forgot password
 * @param {Event} e - Click event
 */
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = prompt('Please enter your email address to reset your password:');
    
    if (!email) return;
    
    try {
        const result = await resetPassword(email);
        
        if (result.success) {
            showToast(result.message, 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error sending password reset:', error);
        showToast('Failed to send password reset email. Please try again.', 'error');
    }
}

/**
 * Handle logout
 * @param {Event} e - Click event
 */
async function handleLogout(e) {
    if (e) e.preventDefault();
    
    try {
        await logoutUser();
        
        // Redirect to home page
        window.location.href = 'lms.html';
    } catch (error) {
        console.error('Error logging out:', error);
        showToast('Failed to log out. Please try again.', 'error');
    }
}

/**
 * Update UI for logged in user
 * @param {Object} user - The current user
 */
async function updateUIForLoggedInUser(user) {
    if (!headerActions) return;
    
    // Check if user is admin
    const adminStatus = await isAdmin();
    const instructorStatus = await isInstructor();
    
    // Create profile menu
    const html = `
        <button class="header-button notification-button" aria-label="Notifications">
            <span class="notification-badge"></span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
        </button>
        <div class="user-profile-menu">
            <button class="profile-toggle" aria-label="User menu">
                <img src="${user.photoURL || 'img/default-avatar.png'}" alt="Profile" class="profile-avatar">
            </button>
            <div class="profile-dropdown">
                <div class="profile-header">
                    <img src="${user.photoURL || 'img/default-avatar.png'}" alt="Profile" class="dropdown-avatar">
                    <div class="profile-info">
                        <h4>${user.displayName || user.email.split('@')[0]}</h4>
                        <p>${user.email}</p>
                    </div>
                </div>
                <ul class="profile-menu">
                    <li><a href="profile.html">My Profile</a></li>
                    <li><a href="dashboard.html">My Courses</a></li>
                    <li><a href="certificates.html">Certificates</a></li>
                    ${adminStatus || instructorStatus ? '<li class="admin-only visible"><a href="admin.html">Admin Panel</a></li>' : ''}
                    <li class="divider"></li>
                    <li><a href="#" id="logoutLink">Log Out</a></li>
                </ul>
            </div>
        </div>
    `;
    
    // Update header
    headerActions.innerHTML = html;
    
    // Add event listeners
    const profileToggle = headerActions.querySelector('.profile-toggle');
    const profileMenu = headerActions.querySelector('.user-profile-menu');
    const logoutLink = headerActions.querySelector('#logoutLink');
    
    if (profileToggle) {
        profileToggle.addEventListener('click', () => {
            profileMenu.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileMenu.contains(e.target)) {
                profileMenu.classList.remove('active');
            }
        });
    }
    
    if (logoutLink) {
        logoutLink.addEventListener('click', handleLogout);
    }
    
    // Update course buttons if they exist
    const courseButtons = document.querySelectorAll('.start-learning');
    courseButtons.forEach(button => {
        button.textContent = 'Continue Course';
        
        // Remove the auth modal trigger and add course start function
        button.removeEventListener('click', openAuthModal);
        button.addEventListener('click', () => {
            // Navigate to course page
            const courseCard = button.closest('.featured-course');
            if (courseCard) {
                const courseTitle = courseCard.querySelector('.preview-content h3').textContent;
                // Convert to slug for URL
                const courseSlug = courseTitle.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
                window.location.href = `course-${courseSlug}.html`;
            }
        });
    });
}

/**
 * Update UI for logged out user
 */
function updateUIForLoggedOutUser() {
    if (!headerActions) return;
    
    // Clear header actions
    headerActions.innerHTML = '';
    
    // Reset course buttons
    const courseButtons = document.querySelectorAll('.start-learning');
    courseButtons.forEach(button => {
        button.textContent = 'Start Learning';
        
        // Ensure we only have one listener
        button.removeEventListener('click', openAuthModal);
        button.addEventListener('click', openAuthModal);
    });
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    // First check if toast container exists, if not create it
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon;
    switch (type) {
        case 'success':
            icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
            break;
        case 'error':
            icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
            break;
        case 'warning':
            icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
            break;
        default: // info
            icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
    
    toast.innerHTML = `
        ${icon}
        <div class="toast-content">
            <p>${message}</p>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Add click event for close button
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        toast.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Initialize authentication when DOM is ready
document.addEventListener('DOMContentLoaded', initAuth);

// Export functions for use in other scripts
export {
    showToast,
    handleLogout
};