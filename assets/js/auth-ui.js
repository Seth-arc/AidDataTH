// auth-ui.js - UI integration for authentication

import {
    registerUser,
    loginUser,
    logoutUser,
    resetPassword,
    onAuthChange,
    isAdmin,
    isInstructor,
    getCurrentUser
} from './auth.js';

// Initialize auth state when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Set up auth state listener
    onAuthChange((user) => {
        if (user?.emailVerified === false) {
            showVerificationBanner();
        } else {
            hideVerificationBanner();
        }
        updateUIState(user);
    });
});

// Handle login form submission
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const email = document.querySelector('#loginForm input[type="email"]').value;
        const password = document.querySelector('#loginForm input[type="password"]').value;
        
        const result = await loginUser(email, password);
        
        if (result.success) {
            closeLoginModal();
            showToast(result.message, 'success');
            
            // Redirect if on main page
            if (window.location.pathname.includes('lms.html')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Handle signup form submission
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const email = document.querySelector('#signupForm input[type="email"]').value;
        const password = document.querySelector('#signupForm input[type="password"]').value;
        const fullName = document.querySelector('#signupForm input[name="fullName"]').value;
        const organization = document.querySelector('#signupForm input[name="organization"]')?.value || '';
        const newsletter = document.querySelector('#signupForm input[name="newsletter"]')?.checked || false;
        
        const result = await registerUser(email, password, fullName, organization, newsletter);
        
        if (result.success) {
            closeSignupModal();
            showWelcomeMessage(fullName);
            showToast(result.message, 'success');
            toggleDrawer();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Handle logout
document.querySelectorAll('.logout-button, #logoutLink').forEach(button => {
    button?.addEventListener('click', async () => {
        try {
            const result = await logoutUser();
            if (result.success) {
                showToast(result.message, 'success');
                window.location.href = 'lms.html';
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('Failed to log out. Please try again.', 'error');
        }
    });
});

// Handle forgot password
document.querySelector('.forgot-password a')?.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = prompt('Please enter your email address to reset your password:');
    
    if (!email) return;
    
    try {
        const result = await resetPassword(email);
        if (result.success) {
            showToast(result.message, 'success');
            closeLoginModal();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Failed to send password reset email. Please try again.', 'error');
    }
});

// Update UI based on auth state
async function updateUIState(user) {
    const isAuthenticated = !!user;
    
    // Update header
    document.querySelectorAll('.auth-only').forEach(el => {
        el.style.display = isAuthenticated ? 'block' : 'none';
    });
    
    document.querySelectorAll('.guest-only').forEach(el => {
        el.style.display = isAuthenticated ? 'none' : 'block';
    });
    
    // Update course buttons
    const courseButtons = document.querySelectorAll('.start-learning');
    courseButtons.forEach(button => {
        if (isAuthenticated) {
            button.textContent = 'Continue Course';
            button.removeEventListener('click', openAuthModal);
            button.addEventListener('click', () => {
                const courseCard = button.closest('.featured-course');
                if (courseCard) {
                    const courseTitle = courseCard.querySelector('.preview-content h3').textContent;
                    const courseSlug = courseTitle.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
                    window.location.href = `course-${courseSlug}.html`;
                }
            });
        } else {
            button.textContent = 'Start Learning';
            button.removeEventListener('click', openAuthModal);
            button.addEventListener('click', openAuthModal);
        }
    });
    
    // Update admin/instructor elements
    if (isAuthenticated) {
        const [adminStatus, instructorStatus] = await Promise.all([
            isAdmin(),
            isInstructor()
        ]);
        
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = adminStatus ? 'block' : 'none';
        });
        
        document.querySelectorAll('.instructor-only').forEach(el => {
            el.style.display = (adminStatus || instructorStatus) ? 'block' : 'none';
        });
    }
    
    // Update user info if available
    if (user) {
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = user.displayName || user.email.split('@')[0];
        });
        
        document.querySelectorAll('.user-email').forEach(el => {
            el.textContent = user.email;
        });
        
        document.querySelectorAll('.profile-avatar').forEach(el => {
            el.src = user.photoURL || 'img/default-avatar.png';
        });
    }
}

// Show verification banner for unverified users
function showVerificationBanner() {
    let banner = document.querySelector('.verification-banner');
    
    if (!banner) {
        banner = document.createElement('div');
        banner.className = 'verification-banner';
        banner.innerHTML = `
            <div class="verification-content">
                <p>Please verify your email address to access all features. 
                   <button class="resend-verification">Resend verification email</button>
                </p>
                <button class="close-banner">&times;</button>
            </div>
        `;
        
        document.body.insertBefore(banner, document.body.firstChild);
        
        // Add event listeners
        banner.querySelector('.close-banner').addEventListener('click', () => {
            banner.remove();
        });
        
        banner.querySelector('.resend-verification').addEventListener('click', async () => {
            try {
                const result = await resendVerificationEmail();
                if (result.success) {
                    showToast(result.message, 'success');
                } else {
                    showToast(result.message, 'error');
                }
            } catch (error) {
                showToast('Failed to resend verification email. Please try again.', 'error');
            }
        });
    }
}

// Hide verification banner
function hideVerificationBanner() {
    const banner = document.querySelector('.verification-banner');
    if (banner) {
        banner.remove();
    }
}

// Show welcome message for new users
function showWelcomeMessage(name) {
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'welcome-toast';
    welcomeMessage.innerHTML = `
        <div class="welcome-toast-content">
            <h3>Welcome, ${name}! 👋</h3>
            <p>Please check your email to verify your account.</p>
        </div>
    `;
    document.body.appendChild(welcomeMessage);
    
    setTimeout(() => {
        welcomeMessage.remove();
    }, 5000);
}

// Show toast notification
function showToast(message, type = 'info') {
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
    
    toastContainer.appendChild(toast);
    
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        toast.remove();
    });
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Helper functions for modals
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeSignupModal() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Make functions globally available
window.updateUIState = updateUIState;
window.closeLoginModal = closeLoginModal;
window.closeSignupModal = closeSignupModal;
window.showToast = showToast; 