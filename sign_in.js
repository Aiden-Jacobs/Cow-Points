import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
// Initialize Supabase
const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc'; // Replace with your anon key
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


const delay = (delayInms) => {
    return new Promise(resolve => setTimeout(resolve, delayInms));
  };

// Handle Sign-In Form Submission
document.getElementById('signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    // Clear previous error messages
    errorMessage.textContent = '';
    console.log(email);
    // Sign in with Supabase
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

    // console.log("data, error", {data, error});
    // console.log("data.user", data.user.id);
    if (error) {
        errorMessage.textContent = 'Sign-in failed: ' + error.message;
    } else {
        window.location.href = `user_dashboard.html`;
    }
});

