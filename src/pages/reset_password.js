import { setRandomBackground } from '../utils/utils.js';
// Import Singleton Supabase Client
import { supabase as _supabase } from '../utils/supabaseClient.js';

document.getElementById('reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const messageBox = document.getElementById('reset-message');

    // Check if passwords match to confirm knows their password
    if (newPassword !== confirmPassword) {
        messageBox.style.color = 'red';
        messageBox.textContent = 'Passwords do not match!';
        return;
    }

    messageBox.textContent = '';
    // Call Supabase to update the password so the user can sign in with the new password
    const { data, error } = await _supabase.auth.updateUser({
        password: newPassword
    });

    // Messages to the user so that they know what happened
    if (error) {
        messageBox.style.color = 'red';
        messageBox.textContent = 'Error: ' + error.message;
    } else {
        messageBox.style.color = 'lightgreen';
        messageBox.textContent = 'Password updated! You can now sign in.';
        setTimeout(() => {
            window.location.href = 'sign_in.html';
        }, 2000);
    }
});

// Set random background image
setRandomBackground();