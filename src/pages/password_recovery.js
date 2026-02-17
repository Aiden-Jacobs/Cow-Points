// Import Singleton Supabase Client
import { supabase as _supabase } from '../utils/supabaseClient.js';

document.getElementById('recovery-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('recovery-email').value;
    const messageBox = document.getElementById('recovery-message');

    messageBox.textContent = '';

    // sends the password reset email to the user so that they can reset their password
    const { data, error } = await _supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://cowpoints.com/reset_password.html'
    });

    // messages to the user so that they know what is going on
    if (error) {
        messageBox.style.color = 'red';
        messageBox.textContent = 'Error: ' + error.message;
    } else {
        messageBox.style.color = 'lightgreen';
        messageBox.textContent = 'Reset email sent. Check your inbox.';
    }
});