// import { createClient } from '@supabase/supabase-js';
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
// Initialize Supabase
const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc'; // Replace with your anon key
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var session = null;

// initialize the map and set the view to the given coordinates
const map = L.map('map').setView([40, -103], 3); // Default to London

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

  // Add the full-screen control to the map
  L.control.fullscreen().addTo(map);

  // Optional: Handle full-screen events
  map.on('enterFullscreen', () => {
    console.log('Entered full-screen mode');
  });

  map.on('exitFullscreen', () => {
    console.log('Exited full-screen mode');
  });

// load all of the locations from the database
async function fetchLocations() {
    // run the get_points_with_coordinates
    const { data, error } = await _supabase.rpc('get_points_with_coordinates');
    if (error) {
        console.error('Error fetching locations:', error);
        return;
    }
    console.log('Locations:', data);


    var temp_marker = L.marker([0, 0]);
    data.forEach((location) => {
        const { lat, lng, name } = location;
        temp_marker = L.marker([lat, lng])
        // add a popup to the marker
        // temp_marker.bindPopup(name);
        temp_marker.addTo(map);



        console.log("lat, lng", lat, lng);
    });
}

fetchLocations();

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
        document.getElementById("header-buttons").appendChild(logoutButton);

        
    }
} catch (error) { 
    console.error("user not logged in");
}