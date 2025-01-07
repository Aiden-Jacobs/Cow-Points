// import a function from main.js
//randomly select and set an image for the background
function setRandomBackground() {
    const backgroundImages = [
        'Assets/Art/jpg/snow_cow.jpg',
        'Assets/Art/jpg/storm_cow.jpg',
        'Assets/Art/jpg/fall_cow.jpg',
        'Assets/Art/jpg/fall1_cow.jpg',
        'Assets/Art/jpg/openart-image_-xUOUzzX_1733088256941_raw.jpg',
        'Assets/Art/jpg/sunset_cow2.jpg',
        'Assets/Art/jpg/sunset_cow3.jpg',
        'Assets/Art/jpg/sunset_cow4.jpg',
        'Assets/Art/jpg/stars_cow1.jpg',
        'Assets/Art/jpg/stars_cow2.jpg',
        'Assets/Art/jpg/rainbow_cow1.jpg',
        'Assets/Art/jpg/rainbow_cow2.jpg',
        'Assets/Art/jpg/Tile_cow2.jpg',
        'Assets/Art/jpg/Tile_cow1.jpg',
    ];
    const randomIndex = Math.floor(Math.random() * backgroundImages.length);
    // make sure that the image is no-repeat center center fill
    // document.body.style.background = `url('${backgroundImages[randomIndex]}') no-repeat center center fixed`;
    document.body.style.background = `url('${backgroundImages[randomIndex]}') center center fixed`;
    // document.body.style.backgroundSize = 'cover';
}
setRandomBackground();
// Extract UUID from URL so we can use it to populate
// the page with the user's data
const params = new URLSearchParams(window.location.search);
// const uuid = params.get('uuid');
// console.log("uuid", uuid);

import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
// Initialize Supabase
const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc'; // Replace with your anon key
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const session = await _supabase.auth.getSession();
console.log("session", session.data);
const uuid = session.data.session.user.id;

// get the user's id from the users table
async function getUserId() {
    const { data, error } = await _supabase
        .from('users')
        .select('*')
        .eq("UID", uuid)
        .single();

    if (error) {
        console.error('Error fetching id data:', error);
        return;
    }

    document.getElementById('Username').textContent = data.username;
    return data;
}

// Fetch user data
async function fetchUserData(userId) {
    const { data, error } = await _supabase
        .from('Total_points')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user data:', error);
        document.getElementById('userPoints').textContent = '0';
        return;
        
    }

    // Populate user data id userPoints
    document.getElementById('userPoints').textContent = data.num_points;
}

// Fetch leaderboard position
async function fetchLeaderboardPosition(uuid) {
    try {
        // Fetch all users sorted by num_points in descending order
        const { data: leaderboard, error } = await _supabase
            .from('Total_points')
            .select('id, num_points')
            .order('num_points', { ascending: false });

        console.log('Leaderboard:', leaderboard);

        if (error) {
            console.error('Error fetching leaderboard:', error.message);
            document.getElementById('leaderboardPosition').textContent = 'N/A';
            return;
        }

        // Find the user's position in the leaderboard
        const position = leaderboard.findIndex(user => user.id === uuid) + 1;

        if (position > 0) {
            console.log('Leaderboard Position:', position);
            document.getElementById('leaderboardPosition').textContent = "#"+position;
        } else {
            console.error('User not found in leaderboard');
            document.getElementById('leaderboardPosition').textContent = 'N/A';
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
        document.getElementById('leaderboardPosition').textContent = 'Error';
    }
}


const userData = await getUserId();
const id = userData.id;
const username = userData.username;

// console.log("id", id);

document.addEventListener('DOMContentLoaded', fetchUserData(id));
document.addEventListener('DOMContentLoaded', fetchLeaderboardPosition(id));
//http://127.0.0.1:5500/user_dashboard.html?uuid=a99e9b0b-63a0-4171-abef-ab665a6c5c7f


// submit the form
document.getElementById('submit').addEventListener('click', async (e) => {
    e.preventDefault();
    const location = document.getElementById('location').value;
    const lat = location.split(',')[0];
    const lng = location.split(',')[1];
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;

    console.log('lat', lat, 'lng', lng, 'description', description, 'date', date);

    // // Insert the new task into the tasks table
    const { data, error } = await _supabase
        .from('Points')
        .insert([
            { lat, lng, description, date_and_time: date, user: id }
        ]);

    if (error) {
        console.error('Error inserting task:', error.message);
        return;
    }

    console.log('Task inserted:', data);
    console.log('error', error);
    alert('Task added successfully!');
    document.getElementById('location').value = '';
    document.getElementById('description').value = '';
    document.getElementById('date').value = '';
    document.getElementById('location').focus();
    window.location.href = `user_dashboard.html`;
});

// lat 36.82084886647265 lng  -108.05170803923144 description hello date 2025-01-03T14:47