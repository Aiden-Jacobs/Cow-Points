import { setRandomBackground } from '../utils/utils.js';
setRandomBackground();

import { supabase as _supabase } from '../utils/supabaseClient.js';

// ──────────────────────────────────────────────
// Auth guard — redirect to sign-in if not logged in
// ──────────────────────────────────────────────
const session = await _supabase.auth.getSession();
const uuid = session.data?.session?.user?.id;

if (!uuid) {
    window.location.href = 'sign_in.html';
}

// ──────────────────────────────────────────────
// Helper: show feedback message
// ──────────────────────────────────────────────

/**
 * Displays a success or error message in the given element.
 * @param {HTMLElement} element - The feedback span/div to write into.
 * @param {string} message - Text to display.
 * @param {'success'|'error'} type - Visual style.
 */
function showFeedback(element, message, type) {
    element.textContent = message;
    element.className = 'settings-feedback ' + type;
    // auto-clear after 5 seconds
    setTimeout(() => {
        element.textContent = '';
        element.className = 'settings-feedback';
    }, 5000);
}

// ──────────────────────────────────────────────
// Load current user data on page load
// ──────────────────────────────────────────────

/**
 * Fetches the current user row from the users table.
 * @param {string} uid - Supabase auth UID.
 * @returns {object|null} User row or null on error.
 */
async function loadUserProfile(uid) {
    const { data, error } = await _supabase
        .from('users')
        .select('*')
        .eq('UID', uid)
        .single();

    if (error) {
        console.error('Error loading user profile:', error);
        return null;
    }
    return data;
}

const userData = await loadUserProfile(uuid);

if (userData) {
    const usernameInput = document.getElementById('settings-username');

    usernameInput.value = userData.username || '';
    usernameInput.disabled = false;

    // Notifications toggle — default to enabled if column doesn't exist yet
    const notificationsEnabled = userData.notifications_enabled !== false;
    document.getElementById('toggle-notifications').checked = notificationsEnabled;
}

// ──────────────────────────────────────────────
// Update Username
// ──────────────────────────────────────────────
document.getElementById('username-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const feedback = document.getElementById('username-feedback');
    const newUsername = document.getElementById('settings-username').value.trim();

    if (!newUsername) {
        showFeedback(feedback, 'Username cannot be empty.', 'error');
        return;
    }

    const { error } = await _supabase
        .from('users')
        .update({ username: newUsername })
        .eq('UID', uuid);

    if (error) {
        showFeedback(feedback, 'Failed to update: ' + error.message, 'error');
    } else {
        showFeedback(feedback, 'Username updated!', 'success');
    }
});

// ──────────────────────────────────────────────
// Change Password
// ──────────────────────────────────────────────
document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const feedback = document.getElementById('password-feedback');
    const userEmail = session.data.session.user.email;

    const { error } = await _supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: window.location.origin + '/reset_password.html',
    });

    if (error) {
        showFeedback(feedback, 'Failed to send reset email: ' + error.message, 'error');
    } else {
        showFeedback(feedback, 'Password reset email sent! Check your inbox.', 'success');
    }
});

// ──────────────────────────────────────────────
// Notifications Toggle
// ──────────────────────────────────────────────
document.getElementById('toggle-notifications').addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    const feedback = document.getElementById('notifications-feedback');

    const { error } = await _supabase
        .from('users')
        .update({ notifications_enabled: enabled })
        .eq('UID', uuid);

    if (error) {
        showFeedback(feedback, 'Failed to save preference.', 'error');
        // revert toggle on failure
        e.target.checked = !enabled;
    } else {
        showFeedback(feedback, enabled ? 'Notifications enabled.' : 'Notifications disabled.', 'success');
    }
});

// ──────────────────────────────────────────────
// Sign Out
// ──────────────────────────────────────────────
document.getElementById('sign-out-btn').addEventListener('click', async () => {
    await _supabase.auth.signOut();
    window.location.href = 'index.html';
});

