import { setRandomBackground, add_header_buttons } from '../utils/utils.js';
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

// add rules popup button functionality
function addRulesPopup() {
    const rulesButton = document.getElementById('rules-button');
    const rulesModal = document.getElementById('rules-modal');
    const closeModal = document.getElementById('close-modal');

    rulesButton.addEventListener('click', () => {
      rulesModal.style.display = 'flex';
    });

    closeModal.addEventListener('click', () => {
      rulesModal.style.display = 'none';
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
      if (e.target === rulesModal) {
        rulesModal.style.display = 'none';
      }
    });
}
// Set random background image
setRandomBackground();
// Fetches the leaderboard data and populates the leaderboard table
fetchLeaderboard();
// Add header buttons
add_header_buttons(_supabase);
// Add rules popup button functionality
addRulesPopup();