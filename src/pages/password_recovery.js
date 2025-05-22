import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc'; // anon key

const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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