// import { createClient } from '@supabase/supabase-js';
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
// Initialize Supabase
const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc'; // Replace with your anon key
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// console.log(_supabase);

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


// Fetch leaderboard data on page load
document.addEventListener('DOMContentLoaded', fetchLeaderboard);