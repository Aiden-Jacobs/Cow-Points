// Import Singleton Supabase Client
import { supabase as _supabase } from '../utils/supabaseClient.js';


// Sign in form
document.getElementById('signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    // when the form is submitted, get the email and password values
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    // Clear previous error messages
    errorMessage.textContent = '';
    // attempt to sign in with the email and password so that the user can
    // access their account or an error message is displayed
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) {
        errorMessage.textContent = 'Sign-in failed: ' + error.message;
    } else {
        const { user } = data;
        // Backfill email if it's missing or update it to ensure correctness
        if (user && user.email) {
            await _supabase
                .from('users')
                .update({ email: user.email })
                .eq('UID', user.id);
        }
        window.location.href = `user_dashboard.html`;
    }
});

