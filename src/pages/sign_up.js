// Import Singleton Supabase Client
import { supabase as _supabase } from '../utils/supabaseClient.js';

// Handle Sign-Up Form Submission
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    // on form submission, get user input
    const email = document.getElementById('email').value;
    const displayName = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    // Clear previous messages
    errorMessage.textContent = '';
    successMessage.textContent = '';
    // Sign up with Supabase
    const { user, error } = await _supabase.auth.signUp({ email, password, data: { full_name: displayName } });
    if (error) {
        errorMessage.textContent = 'Sign-up failed: ' + error.message;
    } else {
        const { data: { user } } = await _supabase.auth.getUser()
        const userId = user.id; // UUID of the signed-up user
        const { error: dbError } = await _supabase
            .from('users')
            .insert([{ UID: userId, username: displayName }]);
        if (dbError) {
            errorMessage.textContent = 'Failed to save user data: ' + dbError.message;
            return;
        }
        successMessage.textContent = 'Sign-up successful! Please check your email to confirm your account.';
        // redirect to the user dashboard
        window.location.href = `user_dashboard.html`;
    }
});