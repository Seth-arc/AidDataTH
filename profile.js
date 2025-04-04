// profile.js - User profile management for the LMS platform

import {
    onAuthChange,
    getCurrentUser,
    updateUserProfile,
    changeUserEmail,
    changeUserPassword,
    logoutUser,
    resendVerificationEmail,
    isAdmin,
    isInstructor
} from './auth.js';

import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

import { 
    getFirestore, 
    doc,
    deleteDoc,
    updateDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import { 
    getAuth, 
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Initialize Firebase Storage and Firestore
const storage = getStorage();
const db = getFirestore();
const auth = getAuth();

// Current user data cache
let currentUser = null;

// DOM Elements
const profileMenuAvatar = document.getElementById('profileMenuAvatar');
const profileDropdownAvatar = document.getElementById('profileDropdownAvatar');
const profileDropdownName = document.getElementById('profileDropdownName');
const profileDropdownEmail = document.getElementById('profileDropdownEmail');
const profileSidebarAvatar = document.getElementById('profileSidebarAvatar');
const profileUsername = document.getElementById('profileUsername');
const profileRole = document.getElementById('profileRole');

// Form elements
const personalInfoForm = document.getElementById('personalInfoForm');
const changeEmailForm = document.getElementById('changeEmailForm');
const changePasswordForm = document.getElementById('changePasswordForm');
const notificationsForm = document.getElementById('notificationsForm');
const preferencesForm = document.getElementById('preferencesForm');
const uploadPhotoForm = document.getElementById('uploadPhotoForm');
const deleteAccountForm = document.getElementById('deleteAccountForm');

// Verification elements
const verificationStatus = document.getElementById('verificationStatus');
const verificationMessage = document.getElementById('verificationMessage');
const resendVerificationButton = document.getElementById('resendVerificationButton');
const lastLoginDate = document.getElementById('lastLoginDate');

// Button elements
const changePhotoButton = document.getElementById('changePhotoButton');
const browseButton = document.getElementById('browseButton');
const cancelUploadButton = document.getElementById('cancelUpload');
const deleteAccountButton = document.getElementById('deleteAccountButton');
const cancelDeleteButton = document.getElementById('cancelDelete');
const logoutButton = document.getElementById('logoutButton');

// File input
const photoInput = document.getElementById('photoInput');

// Modals
const uploadPhotoModal = document.getElementById('uploadPhotoModal');
const deleteAccountModal = document.getElementById('deleteAccountModal');

// Navigation tabs
const profileNavLinks = document.querySelectorAll('.profile-navigation a');
const profileSections = document.querySelectorAll('.profile-section');

// User Profile Dropdown
const profileToggle = document.querySelector('.profile-toggle');
const profileMenu = document.querySelector('.user-profile-menu');

/**
 * Initialize the profile page
 */
function initProfile() {
    // Set up authentication state listener
    onAuthChange(handleAuthStateChange);
    
    // Add event listeners
    setupEventListeners();
}

/**
 * Handle authentication state changes
 * @param {Object} user - The current user or null if signed out
 */
function handleAuthStateChange(user) {
    if (user) {
        // User is signed in, update UI
        currentUser = user;
        updateProfileUI(user);
        checkAdminStatus();
    } else {
        // User is not signed in, redirect to login
        window.location.href = 'lms.html';
    }
}

/**
 * Update profile UI with user data
 * @param {Object} user - The current user
 */
function updateProfileUI(user) {
    // Set user name and email
    profileDropdownName.textContent = user.displayName || user.email.split('@')[0];
    profileDropdownEmail.textContent = user.email;
    profileUsername.textContent = user.displayName || user.email.split('@')[0];
    
    // Set role badge
    profileRole.textContent = formatRoleText(user.role);
    
    // Set avatar images
    const photoURL = user.photoURL || 'img/default-avatar.png';
    profileMenuAvatar.src = photoURL;
    profileDropdownAvatar.src = photoURL;
    profileSidebarAvatar.src = photoURL;
    document.getElementById('photoPreview').src = photoURL;
    
    // Fill forms with user data
    if (personalInfoForm) {
        personalInfoForm.fullName.value = user.fullName || user.displayName || '';
        personalInfoForm.email.value = user.email;
        personalInfoForm.organization.value = user.organization || '';
        personalInfoForm.jobTitle.value = user.jobTitle || '';
        personalInfoForm.bio.value = user.bio || '';
        personalInfoForm.phone.value = user.phone || '';
    }
    
    // Set email verification status
    updateVerificationStatus(user.emailVerified);
    
    // Set email fields
    if (changeEmailForm) {
        changeEmailForm.currentEmail.value = user.email;
    }
    
    // Set preferences
    if (preferencesForm && user.newsletter !== undefined) {
        preferencesForm.newsletter.checked = user.newsletter;
    }
    
    // Set last login date
    if (lastLoginDate && user.lastLogin) {
        const date = user.lastLogin.toDate ? user.lastLogin.toDate() : new Date(user.lastLogin);
        lastLoginDate.textContent = formatDate(date);
    } else if (lastLoginDate) {
        lastLoginDate.textContent = 'No recent login data';
    }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Profile navigation
    profileNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            
            // Update active classes
            profileNavLinks.forEach(navLink => navLink.classList.remove('active'));
            profileSections.forEach(section => section.classList.remove('active'));
            
            link.classList.add('active');
            document.getElementById(targetSection).classList.add('active');
        });
    });
    
    // Profile dropdown toggle
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
    
    // Personal info form
    if (personalInfoForm) {
        personalInfoForm.addEventListener('submit', handlePersonalInfoUpdate);
    }
    
    // Email change form
    if (changeEmailForm) {
        changeEmailForm.addEventListener('submit', handleEmailChange);
    }
    
    // Password change form
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handlePasswordChange);
    }
    
    // Notification preferences form
    if (notificationsForm) {
        notificationsForm.addEventListener('submit', handleNotificationsUpdate);
    }
    
    // User preferences form
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', handlePreferencesUpdate);
    }
    
    // Resend verification email
    if (resendVerificationButton) {
        resendVerificationButton.addEventListener('click', handleResendVerification);
    }
    
    // Photo upload
    if (changePhotoButton) {
        changePhotoButton.addEventListener('click', () => {
            uploadPhotoModal.classList.add('active');
        });
    }
    
    // Photo input browse button
    if (browseButton) {
        browseButton.addEventListener('click', () => {
            photoInput.click();
        });
    }
    
    // Photo input change
    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoSelected);
    }
    
    // Upload photo form
    if (uploadPhotoForm) {
        uploadPhotoForm.addEventListener('submit', handlePhotoUpload);
    }
    
    // Cancel upload
    if (cancelUploadButton) {
        cancelUploadButton.addEventListener('click', () => {
            uploadPhotoModal.classList.remove('active');
            // Reset the file input
            photoInput.value = '';
            // Reset preview to current user photo
            document.getElementById('photoPreview').src = currentUser.photoURL || 'img/default-avatar.png';
        });
    }
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            modal.classList.remove('active');
        });
    });
    
    // Delete account
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', () => {
            deleteAccountModal.classList.add('active');
        });
    }
    
    // Cancel delete
    if (cancelDeleteButton) {
        cancelDeleteButton.addEventListener('click', () => {
            deleteAccountModal.classList.remove('active');
        });
    }
    
    // Delete account form
    if (deleteAccountForm) {
        deleteAccountForm.addEventListener('submit', handleAccountDeletion);
    }
    
    // Logout button
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

/**
 * Check admin status and update UI accordingly
 */
async function checkAdminStatus() {
    try {
        const isUserAdmin = await isAdmin();
        const isUserInstructor = await isInstructor();
        
        // Show admin panel link if user is admin or instructor
        const adminLink = document.querySelector('.admin-only');
        if (adminLink && (isUserAdmin || isUserInstructor)) {
            adminLink.classList.add('visible');
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
}

/**
 * Handle personal information form submission
 * @param {Event} e - Form submit event
 */
async function handlePersonalInfoUpdate(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(personalInfoForm);
        const profileData = {
            fullName: formData.get('fullName'),
            organization: formData.get('organization'),
            jobTitle: formData.get('jobTitle'),
            bio: formData.get('bio'),
            phone: formData.get('phone')
        };
        
        // Show loading state
        const submitButton = personalInfoForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        
        const result = await updateUserProfile(profileData);
        
        if (result.success) {
            showToast('Profile updated successfully', 'success');
            // Refresh user data
            currentUser = await getCurrentUser();
            updateProfileUI(currentUser);
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Failed to update profile. Please try again.', 'error');
    } finally {
        // Reset button
        const submitButton = personalInfoForm.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Save Changes';
    }
}

/**
 * Handle email change form submission
 * @param {Event} e - Form submit event
 */
async function handleEmailChange(e) {
    e.preventDefault();
    
    try {
        const newEmail = changeEmailForm.newEmail.value;
        const password = changeEmailForm.passwordForEmail.value;
        
        if (!newEmail || !password) {
            showToast('Please fill in all fields', 'warning');
            return;
        }
        
        // Show loading state
        const submitButton = changeEmailForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Updating...';
        
        const result = await changeUserEmail(newEmail, password);
        
        if (result.success) {
            showToast(result.message, 'success');
            // Refresh user data
            currentUser = await getCurrentUser();
            updateProfileUI(currentUser);
            // Reset form
            changeEmailForm.newEmail.value = '';
            changeEmailForm.passwordForEmail.value = '';
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error changing email:', error);
        showToast('Failed to update email. Please try again.', 'error');
    } finally {
        // Reset button
        const submitButton = changeEmailForm.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Update Email';
    }
}

/**
 * Handle password change form submission
 * @param {Event} e - Form submit event
 */
async function handlePasswordChange(e) {
    e.preventDefault();
    
    try {
        const currentPassword = changePasswordForm.currentPassword.value;
        const newPassword = changePasswordForm.newPassword.value;
        const confirmPassword = changePasswordForm.confirmPassword.value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Please fill in all fields', 'warning');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'warning');
            return;
        }
        
        if (newPassword.length < 8) {
            showToast('Password must be at least 8 characters long', 'warning');
            return;
        }
        
        // Show loading state
        const submitButton = changePasswordForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Updating...';
        
        const result = await changeUserPassword(currentPassword, newPassword);
        
        if (result.success) {
            showToast(result.message, 'success');
            // Reset form
            changePasswordForm.reset();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showToast('Failed to update password. Please try again.', 'error');
    } finally {
        // Reset button
        const submitButton = changePasswordForm.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Update Password';
    }
}

/**
 * Handle notifications form submission
 * @param {Event} e - Form submit event
 */
async function handleNotificationsUpdate(e) {
    e.preventDefault();
    
    try {
        // Get form data
        const formData = new FormData(notificationsForm);
        
        // Prepare notification preferences
        const notificationPreferences = {
            email: {
                courseUpdates: formData.has('courseUpdates'),
                newCourses: formData.has('newCourses'),
                completionReminders: formData.has('completionReminders')
            },
            platform: {
                discussionReplies: formData.has('discussionReplies'),
                certificateAwarded: formData.has('certificateAwarded'),
                systemAnnouncements: formData.has('systemAnnouncements')
            },
            updatedAt: serverTimestamp()
        };
        
        // Show loading state
        const submitButton = notificationsForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        
        // Update notifications preferences in Firestore
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user is logged in');
        }
        
        await updateDoc(doc(db, "users", user.uid), {
            notificationPreferences: notificationPreferences
        });
        
        showToast('Notification preferences updated', 'success');
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        showToast('Failed to update notification preferences', 'error');
    } finally {
        // Reset button
        const submitButton = notificationsForm.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Save Preferences';
    }
}

/**
 * Handle preferences form submission
 * @param {Event} e - Form submit event
 */
async function handlePreferencesUpdate(e) {
    e.preventDefault();
    
    try {
        // Get form data
        const formData = new FormData(preferencesForm);
        
        // Prepare user preferences
        const userPreferences = {
            language: formData.get('language'),
            timezone: formData.get('timezone'),
            darkMode: formData.has('darkMode'),
            newsletter: formData.has('newsletter'),
            updatedAt: serverTimestamp()
        };
        
        // Show loading state
        const submitButton = preferencesForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        
        // Update user preferences in Firestore
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user is logged in');
        }
        
        await updateDoc(doc(db, "users", user.uid), {
            preferences: userPreferences,
            newsletter: formData.has('newsletter')  // Update newsletter preference in root too
        });
        
        // Refresh user data
        currentUser = await getCurrentUser();
        
        showToast('Preferences updated successfully', 'success');
    } catch (error) {
        console.error('Error updating preferences:', error);
        showToast('Failed to update preferences', 'error');
    } finally {
        // Reset button
        const submitButton = preferencesForm.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Save Preferences';
    }
}

/**
 * Handle photo selection
 * @param {Event} e - Input change event
 */
function handlePhotoSelected(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showToast('Photo must be less than 2MB', 'warning');
        photoInput.value = '';
        return;
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        showToast('Only JPG, PNG, and GIF files are supported', 'warning');
        photoInput.value = '';
        return;
    }
    
    // Preview the selected image
    const preview = document.getElementById('photoPreview');
    const reader = new FileReader();
    
    reader.onload = (e) => {
        preview.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

/**
 * Handle photo upload
 * @param {Event} e - Form submit event
 */
async function handlePhotoUpload(e) {
    e.preventDefault();
    
    const file = photoInput.files[0];
    if (!file) {
        showToast('Please select a photo to upload', 'warning');
        return;
    }
    
    try {
        // Show loading state
        const submitButton = uploadPhotoForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Uploading...';
        
        // Get current user
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user is logged in');
        }
        
        // Create a storage reference
        const storageRef = ref(storage, `userProfiles/${user.uid}_${Date.now()}`);
        
        // Upload the file
        await uploadBytes(storageRef, file);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);
        
        // Update user profile with new photo URL
        await updateProfile(user, {
            photoURL: downloadURL
        });
        
        // Update user profile in Firestore
        await updateDoc(doc(db, "users", user.uid), {
            photoURL: downloadURL,
            updatedAt: serverTimestamp()
        });
        
        // Refresh user data
        currentUser = await getCurrentUser();
        updateProfileUI(currentUser);
        
        // Close the modal
        uploadPhotoModal.classList.remove('active');
        
        // Reset the file input
        photoInput.value = '';
        
        showToast('Profile photo updated successfully', 'success');
    } catch (error) {
        console.error('Error uploading photo:', error);
        showToast('Failed to upload photo. Please try again.', 'error');
    } finally {
        // Reset button
        const submitButton = uploadPhotoForm.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Save Photo';
    }
}

/**
 * Handle account deletion
 * @param {Event} e - Form submit event
 */
async function handleAccountDeletion(e) {
    e.preventDefault();
    
    try {
        const password = document.getElementById('deleteConfirmPassword').value;
        const isConfirmed = document.getElementById('confirmDelete').checked;
        
        if (!password) {
            showToast('Please enter your password', 'warning');
            return;
        }
        
        if (!isConfirmed) {
            showToast('Please confirm that you understand this action is permanent', 'warning');
            return;
        }
        
        // Show loading state
        const submitButton = deleteAccountForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Deleting...';
        
        // Get current user
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user is logged in');
        }
        
        // Re-authenticate user
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        
        // Delete user data from Firestore
        await deleteDoc(doc(db, "users", user.uid));
        
        // Delete user account
        await deleteUser(user);
        
        // Redirect to home page
        window.location.href = 'lms.html';
    } catch (error) {
        console.error('Error deleting account:', error);
        let errorMessage = 'Failed to delete account. Please try again.';
        
        if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/requires-recent-login') {
            errorMessage = 'For security reasons, please log out and log back in before deleting your account.';
        }
        
        showToast(errorMessage, 'error');
    } finally {
        // Reset button
        const submitButton = deleteAccountForm.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Delete My Account';
    }
}

/**
 * Handle resend verification email
 */
async function handleResendVerification() {
    try {
        // Disable button
        resendVerificationButton.disabled = true;
        resendVerificationButton.textContent = 'Sending...';
        
        const result = await resendVerificationEmail();
        
        if (result.success) {
            showToast(result.message, 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error resending verification email:', error);
        showToast('Failed to resend verification email', 'error');
    } finally {
        // Reset button after a delay
        setTimeout(() => {
            resendVerificationButton.disabled = false;
            resendVerificationButton.textContent = 'Resend verification email';
        }, 5000);
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    try {
        await logoutUser();
        window.location.href = 'lms.html';
    } catch (error) {
        console.error('Error logging out:', error);
        showToast('Failed to log out. Please try again.', 'error');
    }
}

/**
 * Update verification status UI
 * @param {boolean} isVerified - Whether the email is verified
 */
function updateVerificationStatus(isVerified) {
    if (!verificationStatus || !verificationMessage || !resendVerificationButton) {
        return;
    }
    
    if (isVerified) {
        verificationStatus.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="verified">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        `;
        verificationMessage.textContent = 'Your email is verified.';
        verificationStatus.classList.add('verified');
        verificationStatus.classList.remove('unverified');
        resendVerificationButton.style.display = 'none';
    } else {
        verificationStatus.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="unverified">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        `;
        verificationMessage.textContent = 'Please verify your email to access all features.';
        verificationStatus.classList.add('unverified');
        verificationStatus.classList.remove('verified');
        resendVerificationButton.style.display = 'inline-block';
    }
}

/**
 * Format role text for display
 * @param {string} role - User role
 * @returns {string} - Formatted role text
 */
function formatRoleText(role) {
    if (!role) return 'Student';
    
    return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    if (!date) return 'Unknown';
    
    // Format as "April 24, 2023 at 3:45 PM"
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }).format(date);
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;
    
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

// Initialize profile when DOM is ready
document.addEventListener('DOMContentLoaded', initProfile);