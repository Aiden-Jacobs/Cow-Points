// import { createClient } from '@supabase/supabase-js';
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
// Initialize Supabase
const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc'; // Replace with your anon key
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var session = null;
// try to get the user's session so that we can provide the option to log out or to view the user's profile


// Fetch leaderboard data
async function fetchLeaderboard() {
    // console.log('Fetching leaderboard...');
    const { data, error } = await _supabase
        .from('Total_points') // Replace with your table name
        .select('*')
        .order('num_points', { ascending: false });

    if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
    }
    // console.log('Leaderboard data:', data);
    // Populate leaderboard
    const leaderboardTableBody = document.querySelector('.leaderboard-table tbody');
    leaderboardTableBody.innerHTML = ''; // Clear existing rows

    data.forEach((entry, index) => {
        console.log(entry);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}. ${entry.name}</td>
            <td>${entry.num_points}</td>
        `;
        leaderboardTableBody.appendChild(row);
    });
}

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

// Fetch leaderboard data on page load
document.addEventListener('DOMContentLoaded', fetchLeaderboard);
try {
    let session = await _supabase.auth.getSession();
    console.log("session", session);
    if (session.data.session !== null) {
        const button = document.getElementById("sign-in");
        const link = document.getElementById("sign-in-link");
        button.textContent = "User Profile";
        link.href = "user_dashboard.html";
        button.classList.remove("sign-in-button");
        button.classList.add("user-profile-button");
        // add a log out button
        const logoutButton = document.createElement("button");
        logoutButton.textContent = "LOG OUT";
        logoutButton.classList.add("log-out-button");
        logoutButton.onclick = async () => {
            await _supabase.auth.signOut();
            window.location.reload();
        }
        document.querySelector(".header").appendChild(logoutButton);

        
    }
} catch (error) { 
    console.error("user not logged in");
}