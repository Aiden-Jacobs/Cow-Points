import { setRandomBackground, add_header_buttons } from '../utils/utils.js';
// import { createClient } from '@supabase/supabase-js';
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
// Initialize Supabase
const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co'; // supabase url
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc'; // anon key
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 


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


/**
 * this function fetches the locations from the database and adds them to the map as markers
 * @returns {void} if there is an error
 */
async function fetchLocations() {
    // supabase query to get the locations data using a stored procedure
    const { data, error } = await _supabase.rpc('get_points_with_coordinates');
    if (error) {
        console.error('Error fetching locations:', error);
        return;
    }
    // add a markers to the map for each location
    var temp_marker = L.marker([0, 0]);
    data.forEach((location) => {
        const { lat, lng, name } = location;
        temp_marker = L.marker([lat, lng])
        temp_marker.addTo(map);
    });
}

fetchLocations();
setRandomBackground();
add_header_buttons(_supabase);
