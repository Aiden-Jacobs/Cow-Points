// Import Current Supabase library
import "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
const { createClient } = supabase;
// Initialize Supabase
const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co'; // supabase url
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc'; // anon key
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


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
        window.location.href = `user_dashboard.html`;
    }
});

