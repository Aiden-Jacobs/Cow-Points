// imports the supabase client from the cdn
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
// Initialize Supabase
const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co'; // supabase url
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc'; // anon key
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 


// Fetches the leaderboard data and populates the leaderboard table
async function fetchLeaderboard() {
    // supabase query to get the leaderboard data
    const { data, error } = await _supabase
        .from('Total_points') // Replace with your table name
        .select('*')
        .order('num_points', { ascending: false });
    if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
    }
    // select the leaderboard table body so that the rows can be added to it
    const leaderboardTableBody = document.querySelector('.leaderboard-table tbody');
    leaderboardTableBody.innerHTML = ''; // Clear existing rows
    // add a row to the leaderboard table for each entry in the supabase data
    data.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}. ${entry.name}</td>
            <td>${entry.num_points}</td>
        `;
        leaderboardTableBody.appendChild(row);
    });
}

//randomly select and set an image for the background so that the page has random backgrounds of cows
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
    document.body.style.background = `url('${backgroundImages[randomIndex]}') center center fixed`;
}

// Set random background image
setRandomBackground();
// Fetches the leaderboard data and populates the leaderboard table
fetchLeaderboard();
try {
    let session = await _supabase.auth.getSession();
    console.log("session", session);
    if (session.data.session !== null) {
        // gets the sign in button so that it can be changed to the user profile button when the user is logged in
        const button = document.getElementById("sign-in");
        const link = document.getElementById("sign-in-link");
        button.textContent = "User Profile";
        link.href = "user_dashboard.html";
        button.classList.remove("sign-in-button");
        button.classList.add("user-profile-button");
        // create the log out button when the user is logged in so that they can log out
        const logoutButton = document.createElement("button");
        logoutButton.textContent = "LOG OUT";
        logoutButton.classList.add("log-out-button");
        logoutButton.onclick = async () => {
            await _supabase.auth.signOut();
            window.location.reload();
        }
        // this adds the log out button to the header so that it is visible when the user is logged in
        document.getElementById("header-buttons").appendChild(logoutButton);                
    }
} catch (error) { 
    console.error("user not logged in");
}