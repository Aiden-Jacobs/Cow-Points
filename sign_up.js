// import { createClient } from '@supabase/supabase-js';
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
// Initialize Supabase
const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc'; // Replace with your anon key
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// console.log(_supabase);

// Handle Sign-Up Form Submission
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();

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
    // console.log("user, error", {user, error});
    if (error) {
        errorMessage.textContent = 'Sign-up failed: ' + error.message;
    } else {
        // console.log("user test");
        const { data: { user } } = await _supabase.auth.getUser()
        // console.log("user", user);
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
        window.location.href = `user_dashboard.html?uuid=${encodeURIComponent(userId)}`;
        //Navigated to http://127.0.0.1:5500/user_dashboard.html?uuid=a99e9b0b-63a0-4171-abef-ab665a6c5c7f
    }
});