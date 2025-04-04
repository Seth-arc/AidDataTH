// auth.js - Authentication service for the LMS platform

// Firebase Auth with Web SDK
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    arrayUnion, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Initialize Firebase Auth & Firestore
const auth = getAuth();
const db = getFirestore();

// Session timer for auto-refresh (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000; 
let sessionTimer;

// Default user roles
const USER_ROLES = {
    STUDENT: 'student',
    INSTRUCTOR: 'instructor',
    ADMIN: 'admin'
};

// Authentication state management
let currentUser = null;

// Simple in-memory user store (for demo purposes)
const users = new Map();

/**
 * User registration function
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} fullName - User's full name
 * @param {string} organization - User's organization (optional)
 * @param {boolean} newsletter - User newsletter preference
 * @returns {Promise} - Result of the registration process
 */
async function registerUser(email, password, fullName, organization = '', newsletter = false) {
    try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update profile with full name
        await updateProfile(user, {
            displayName: fullName
        });
        
        // Send email verification
        await sendEmailVerification(user);
        
        // Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
            fullName: fullName,
            email: email,
            organization: organization,
            role: USER_ROLES.STUDENT,  // Default role
            newsletter: newsletter,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            isVerified: false,
            courses: [],
            progress: {},
            certificates: []
        });
        
        return {
            success: true,
            message: "Account created successfully. Please check your email to verify your account."
        };
    } catch (error) {
        console.error("Error registering user:", error);
        return {
            success: false,
            message: getAuthErrorMessage(error),
            error: error
        };
    }
}

/**
 * User login function
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} - Result of the login process
 */
async function loginUser(email, password) {
    try {
        // Sign in user with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Check if email is verified
        if (!user.emailVerified) {
            // Allow login but warn the user
            console.warn("Email not verified. Limited functionality available.");
        }
        
        // Update last login timestamp
        await updateDoc(doc(db, "users", user.uid), {
            lastLogin: serverTimestamp()
        });
        
        // Start session timer
        startSessionTimer();
        
        return {
            success: true,
            verified: user.emailVerified,
            message: user.emailVerified 
                ? "Login successful." 
                : "Login successful. Please verify your email to access all features."
        };
    } catch (error) {
        console.error("Error logging in:", error);
        return {
            success: false,
            message: getAuthErrorMessage(error),
            error: error
        };
    }
}

/**
 * User logout function
 * @returns {Promise} - Result of the logout process
 */
async function logoutUser() {
    try {
        await signOut(auth);
        clearSessionTimer();
        return {
            success: true,
            message: "Logged out successfully."
        };
    } catch (error) {
        console.error("Error logging out:", error);
        return {
            success: false,
            message: "Failed to log out. Please try again.",
            error: error
        };
    }
}

/**
 * Password reset request function
 * @param {string} email - User email
 * @returns {Promise} - Result of the password reset request
 */
async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return {
            success: true,
            message: "Password reset email sent. Please check your inbox."
        };
    } catch (error) {
        console.error("Error sending password reset:", error);
        return {
            success: false,
            message: getAuthErrorMessage(error),
            error: error
        };
    }
}

/**
 * Resend verification email function
 * @returns {Promise} - Result of the verification email request
 */
async function resendVerificationEmail() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No user is currently logged in.");
        }
        
        await sendEmailVerification(user);
        
        return {
            success: true,
            message: "Verification email sent. Please check your inbox."
        };
    } catch (error) {
        console.error("Error sending verification email:", error);
        return {
            success: false,
            message: getAuthErrorMessage(error),
            error: error
        };
    }
}

/**
 * Update user profile function
 * @param {object} profileData - User profile data to update
 * @returns {Promise} - Result of the profile update
 */
async function updateUserProfile(profileData) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No user is currently logged in.");
        }
        
        // Update display name if provided
        if (profileData.fullName) {
            await updateProfile(user, {
                displayName: profileData.fullName
            });
        }
        
        // Update photo URL if provided
        if (profileData.photoURL) {
            await updateProfile(user, {
                photoURL: profileData.photoURL
            });
        }
        
        // Update Firestore document with remaining fields
        const userDocRef = doc(db, "users", user.uid);
        
        const updateData = {
            updatedAt: serverTimestamp()
        };
        
        // Only include fields that are provided
        if (profileData.fullName) updateData.fullName = profileData.fullName;
        if (profileData.organization) updateData.organization = profileData.organization;
        if (profileData.bio) updateData.bio = profileData.bio;
        if (profileData.jobTitle) updateData.jobTitle = profileData.jobTitle;
        if (profileData.phone) updateData.phone = profileData.phone;
        if (profileData.address) updateData.address = profileData.address;
        if (profileData.newsletter !== undefined) updateData.newsletter = profileData.newsletter;
        
        await updateDoc(userDocRef, updateData);
        
        return {
            success: true,
            message: "Profile updated successfully."
        };
    } catch (error) {
        console.error("Error updating profile:", error);
        return {
            success: false,
            message: "Failed to update profile. Please try again.",
            error: error
        };
    }
}

/**
 * Change user email function
 * @param {string} newEmail - New email address
 * @param {string} password - Current password for verification
 * @returns {Promise} - Result of the email change
 */
async function changeUserEmail(newEmail, password) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No user is currently logged in.");
        }
        
        // Reauthenticate the user first
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        
        // Update email in Auth
        await updateEmail(user, newEmail);
        
        // Send verification email
        await sendEmailVerification(user);
        
        // Update email in Firestore
        await updateDoc(doc(db, "users", user.uid), {
            email: newEmail,
            isVerified: false,
            updatedAt: serverTimestamp()
        });
        
        return {
            success: true,
            message: "Email updated successfully. Please verify your new email address."
        };
    } catch (error) {
        console.error("Error changing email:", error);
        return {
            success: false,
            message: getAuthErrorMessage(error),
            error: error
        };
    }
}

/**
 * Change user password function
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise} - Result of the password change
 */
async function changeUserPassword(currentPassword, newPassword) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No user is currently logged in.");
        }
        
        // Reauthenticate the user first
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        // Update password
        await updatePassword(user, newPassword);
        
        // Update timestamp in Firestore
        await updateDoc(doc(db, "users", user.uid), {
            updatedAt: serverTimestamp(),
            passwordLastChanged: serverTimestamp()
        });
        
        return {
            success: true,
            message: "Password changed successfully."
        };
    } catch (error) {
        console.error("Error changing password:", error);
        return {
            success: false,
            message: getAuthErrorMessage(error),
            error: error
        };
    }
}

/**
 * Check user role function
 * @param {string} role - Role to check
 * @returns {Promise<boolean>} - Whether user has the specified role
 */
async function hasRole(role) {
    try {
        const user = auth.currentUser;
        if (!user) {
            return false;
        }
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            return false;
        }
        
        const userData = userDoc.data();
        return userData.role === role;
    } catch (error) {
        console.error("Error checking role:", error);
        return false;
    }
}

/**
 * Check if user is an instructor
 * @returns {Promise<boolean>} - Whether user is an instructor
 */
async function isInstructor() {
    return hasRole(USER_ROLES.INSTRUCTOR) || hasRole(USER_ROLES.ADMIN);
}

/**
 * Check if user is an admin
 * @returns {Promise<boolean>} - Whether user is an admin
 */
async function isAdmin() {
    return hasRole(USER_ROLES.ADMIN);
}

/**
 * Get currently logged in user with extended profile
 * @returns {Promise<object>} - User object with profile data
 */
async function getCurrentUser() {
    try {
        const user = auth.currentUser;
        if (!user) {
            return null;
        }
        
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified,
                // Basic info if Firestore document doesn't exist
                role: USER_ROLES.STUDENT
            };
        }
        
        const userData = userDoc.data();
        
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            // Additional info from Firestore
            fullName: userData.fullName,
            organization: userData.organization,
            role: userData.role,
            newsletter: userData.newsletter,
            bio: userData.bio,
            jobTitle: userData.jobTitle,
            createdAt: userData.createdAt,
            lastLogin: userData.lastLogin,
            courses: userData.courses || [],
            progress: userData.progress || {},
            certificates: userData.certificates || []
        };
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

/**
 * Set up auth state listener
 * @param {function} callback - Function to call on auth state change
 * @returns {function} - Unsubscribe function
 */
function onAuthChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in
            startSessionTimer();
            
            // Get extended user profile
            const extendedUser = await getCurrentUser();
            callback(extendedUser);
        } else {
            // User is signed out
            clearSessionTimer();
            callback(null);
        }
    });
}

/**
 * Start the session timer for token refresh
 */
function startSessionTimer() {
    clearSessionTimer();
    sessionTimer = setTimeout(() => {
        refreshSession();
    }, SESSION_TIMEOUT);
}

/**
 * Clear the session timer
 */
function clearSessionTimer() {
    if (sessionTimer) {
        clearTimeout(sessionTimer);
        sessionTimer = null;
    }
}

/**
 * Refresh the user session
 */
async function refreshSession() {
    const user = auth.currentUser;
    if (user) {
        try {
            // Force a token refresh
            await user.getIdToken(true);
            console.log("Session refreshed.");
            
            // Restart timer
            startSessionTimer();
        } catch (error) {
            console.error("Error refreshing session:", error);
            // Log the user out if refresh fails
            await logoutUser();
        }
    }
}

/**
 * Get user-friendly error message for auth errors
 * @param {Error} error - Authentication error
 * @returns {string} - User-friendly error message
 */
function getAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return 'This email is already in use. Please try a different one or login.';
        case 'auth/invalid-email':
            return 'Invalid email address. Please check and try again.';
        case 'auth/weak-password':
            return 'Password is too weak. Please use a stronger password.';
        case 'auth/user-not-found':
            return 'User not found. Please check your email or create an account.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again or reset your password.';
        case 'auth/too-many-requests':
            return 'Too many unsuccessful login attempts. Please try again later.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Please contact support.';
        case 'auth/requires-recent-login':
            return 'This operation requires a recent login. Please log out and log back in.';
        case 'auth/popup-closed-by-user':
            return 'Authentication popup was closed before completion.';
        default:
            return error.message || 'An unexpected error occurred. Please try again.';
    }
}

// Auth service object
const authService = {
    // Check if user is authenticated
    isAuthenticated() {
        return currentUser !== null;
    },

    // Get current user
    getCurrentUser() {
        return currentUser;
    },

    // Login user
    async login(email, password) {
        // For demo purposes, simple validation
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const user = users.get(email);
        if (!user || user.password !== password) {
            throw new Error('Invalid credentials');
        }

        currentUser = {
            email: user.email,
            name: user.name,
            isNewUser: false
        };

        // Store auth state
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(currentUser));

        return currentUser;
    },

    // Register new user
    async register(email, password, name) {
        if (users.has(email)) {
            throw new Error('User already exists');
        }

        const user = {
            email,
            password, // In production, hash the password
            name,
            isNewUser: true
        };

        users.set(email, user);
        
        // Auto login after registration
        currentUser = {
            email: user.email,
            name: user.name,
            isNewUser: true
        };

        // Store auth state
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(currentUser));

        return currentUser;
    },

    // Logout user
    logout() {
        currentUser = null;
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
    },

    // Initialize auth state from storage
    initAuth() {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        if (isAuthenticated) {
            const userData = localStorage.getItem('user');
            if (userData) {
                currentUser = JSON.parse(userData);
            }
        }
        return currentUser;
    }
};

// Make auth service globally available
window.auth = authService;