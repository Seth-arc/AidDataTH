// verify-email.js - Email verification functionality for the LMS platform

import { 
    getAuth, 
    applyActionCode,
    signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import { 
    getFirestore, 
    doc, 
    updateDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Initialize Firebase Auth & Firestore
const auth = getAuth();
const db = getFirestore();

// DOM Elements
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const successState = document.getElementById('success-state');

// Action code from URL
let actionCode = null;
let continueUrl = null;

/**
 * Initialize the email verification page
 */
function initEmailVerification() {
    // Get action code from URL
    const urlParams = new URLSearchParams(window.location.search);
    actionCode = urlParams.get('oobCode');
    continueUrl = urlParams.get('continueUrl');
    
    // Verify the action code
    verifyEmail();
}

/**
 * Verify the email address
 */
async function verifyEmail() {
    if (!actionCode) {
        showErrorState('No verification code provided. Please check your email for a valid verification link.');
        return;
    }
    
    try {
        // Apply the action code to verify the email
        await applyActionCode(auth, actionCode);
        
        // Get the current user
        const user = auth.currentUser;
        
        // Update Firestore document if user is already signed in
        if (user) {
            try {
                await updateDoc(doc(db, "users", user.uid), {
                    isVerified: true,
                    updatedAt: serverTimestamp()
                });
            } catch (firestoreError) {
                console.error('Error updating Firestore:', firestoreError);
                // Continue anyway, the email has been verified
            }
        } else {
            // Try to get email from the URL
            const email = urlParams.get('email');
            
            if (email) {
                try {
                    // Try to sign in with the email link
                    await signInWithEmailLink(auth, email, window.location.href);
                    
                    // Now user should be signed in, update Firestore
                    const newUser = auth.currentUser;
                    if (newUser) {
                        await updateDoc(doc(db, "users", newUser.uid), {
                            isVerified: true,
                            updatedAt: serverTimestamp()
                        });
                        
                        // Sign out to avoid unexpected behavior
                        await auth.signOut();
                    }
                } catch (signInError) {
                    console.error('Error signing in with email link:', signInError);
                    // Continue anyway, the email has been verified
                }
            }
        }
        
        // Show success state
        hideLoadingState();
        showSuccessState();
    } catch (error) {
        console.error('Error verifying email:', error);
        showErrorState('This verification link is invalid or has expired. Please request a new verification email.');
    }
}

/**
 * Show error state
 * @param {string} message - Error message
 */
function showErrorState(message = null) {
    if (loadingState) loadingState.style.display = 'none';
    if (successState) successState.style.display = 'none';
    
    if (errorState) {
        errorState.style.display = 'flex';
        
        if (message) {
            const errorText = errorState.querySelector('p');
            if (errorText) {
                errorText.textContent = message;
            }
        }
    }
}

/**
 * Show success state
 */
function showSuccessState() {
    if (loadingState) loadingState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
    
    if (successState) {
        successState.style.display = 'flex';
        
        // If there's a continue URL, update the button
        if (continueUrl && successState) {
            const button = successState.querySelector('.primary-button');
            if (button) {
                button.href = continueUrl;
            }
        }
    }
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    if (loadingState) loadingState.style.display = 'none';
}

/**
 * Show toast notification
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

// Initialize verification page when DOM is ready
document.addEventListener('DOMContentLoaded', initEmailVerification);