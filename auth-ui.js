// Initialize auth state when page loads
document.addEventListener('DOMContentLoaded', () => {
    const user = auth.initAuth();
    if (user?.isNewUser) {
        // Redirect new users to onboarding
        window.location.href = '/onboarding';
    }
    updateUIState();
});

// Handle login form submission
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const email = document.querySelector('#loginForm input[type="email"]').value;
        const password = document.querySelector('#loginForm input[type="password"]').value;
        
        await auth.login(email, password);
        closeLoginModal();
        updateUIState();
    } catch (error) {
        showError(error.message);
    }
});

// Handle signup form submission
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const email = document.querySelector('#signupForm input[type="email"]').value;
        const password = document.querySelector('#signupForm input[type="password"]').value;
        const name = document.querySelector('#signupForm input[name="fullName"]').value;
        
        const user = await auth.register(email, password, name);
        if (user.isNewUser) {
            // Close signup modal
            closeSignupModal();
            // Show welcome message
            showWelcomeMessage(user.name);
            // Open the about drawer
            toggleDrawer();
        }
        updateUIState();
    } catch (error) {
        showError(error.message);
    }
});

// Handle logout
document.querySelectorAll('.logout-button').forEach(button => {
    button?.addEventListener('click', () => {
        auth.logout();
        updateUIState();
    });
});

// Update UI based on auth state
function updateUIState() {
    const isAuthenticated = auth.isAuthenticated();
    const user = auth.getCurrentUser();
    
    // Update header
    document.querySelectorAll('.auth-only').forEach(el => {
        el.style.display = isAuthenticated ? 'block' : 'none';
    });
    
    document.querySelectorAll('.guest-only').forEach(el => {
        el.style.display = isAuthenticated ? 'none' : 'block';
    });
    
    // Update user info if available
    if (user) {
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = user.name;
        });
        document.querySelectorAll('.user-email').forEach(el => {
            el.textContent = user.email;
        });
    }
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

function showError(message) {
    // You can implement your own error display logic here
    alert(message);
}

function showWelcomeMessage(name) {
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'welcome-toast';
    welcomeMessage.innerHTML = `
        <div class="welcome-toast-content">
            <h3>Welcome, ${name}! 👋</h3>
            <p>Let's get you started with our training platform.</p>
        </div>
    `;
    document.body.appendChild(welcomeMessage);
    
    // Remove the message after 5 seconds
    setTimeout(() => {
        welcomeMessage.remove();
    }, 5000);
}

// Make functions globally available
window.updateUIState = updateUIState;
window.closeLoginModal = closeLoginModal;
window.closeSignupModal = closeSignupModal;
window.showError = showError; 