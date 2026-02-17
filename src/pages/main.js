import { setRandomBackground, add_header_buttons } from '../utils/utils.js';
import { supabase } from '../utils/supabaseClient.js';
// console.log('Dashboard loaded');


// Fetches the leaderboard data and populates the leaderboard table
async function fetchLeaderboard() {
  // supabase query to get the leaderboard data
  const { data, error } = await supabase
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
add_header_buttons(supabase);
// Add rules popup button functionality
addRulesPopup();