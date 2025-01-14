import { setRandomBackground } from './js/utils.js';
setRandomBackground();


import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
// Initialize Supabase
const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co'; // supabase url
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc'; // anon key
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 
const session = await _supabase.auth.getSession();
const uuid = session.data.session.user.id;

/**
 * fetches the users id number from the database this is not the same as the uuid
 * @param {string} input_uuid
 * @returns {object} the user data
 * @returns {void} if there is an error
 */
async function getUserId(input_uuid) {
    const { data, error } = await _supabase
        .from('users')
        .select('*')
        .eq("UID", input_uuid)
        .single();

    if (error) {
        console.error('Error fetching id data:', error);
        return;
    }
    return data;
}

/**
 * this function fetches the users points from the database
 * @param {string} userId 
 * @returns {number} the number of points the user has 
 * @returns {void} if there is an error
 */
async function fetchUserPoints(userId) {
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
    return data.num_points;
}

/**
 * this function fetches the users position in the leaderboard
 * @param {string} uuid 
 * @returns {number} the users position in the leaderboard
 * @returns {void} if there is an error
 */
async function fetchLeaderboardPosition(uuid) {
    try {
        // Fetch all users sorted by num_points in descending order so that the user's position can be found
        const { data: leaderboard, error } = await _supabase
            .from('Total_points')
            .select('id, num_points')
            .order('num_points', { ascending: false });
        if (error) {
            console.error('Error fetching leaderboard:', error.message);
            return;
        }
        // Finds the user's position in the leaderboard
        const position = leaderboard.findIndex(user => user.id === uuid) + 1;
        return position;
    } catch (err) {
        console.error('Unexpected Error:', err);
        return ;
    }
}

/**
 * this function sets the users position in the leaderboard on the page
 * @param {number} position
 * @returns {void}
 */
function set_leaderboard_position(position) {
    if (position > 0) {
        console.log('Leaderboard Position:', position);
        document.getElementById('leaderboardPosition').textContent = "#"+position;
    } else {
        console.error('User not found in leaderboard');
        document.getElementById('leaderboardPosition').textContent = 'N/A';
    }
}

// set the user's username, points, and leaderboard position on the page
const userData = await getUserId(uuid);
const id = userData.id;
document.getElementById('Username').textContent = userData.username;
document.getElementById('userPoints').textContent = await fetchUserPoints(id)
set_leaderboard_position(await fetchLeaderboardPosition(id));


// submits a point to the database
document.getElementById('submit').addEventListener('click', async (e) => {
    e.preventDefault();
    // Get the values from the form fields so that they can be inserted into the database
    const location = document.getElementById('location').value;
    const lat = location.split(',')[0];
    const lng = location.split(',')[1];
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;
    // Check if the user wants to submit the point
    if (!confirm('Are you sure you want to submit this point?')) {
        return;
    }
    // Insert the new point into the Points table
    // on the backend, the database will automatically add a point to the user's total points
    const { data, error } = await _supabase
        .from('Points')
        .insert([
            { lat, lng, description, date_and_time: date, user: id }
        ]);
    if (error) {
        console.error('Error inserting task:', error.message);
        return;
    }
    alert('Task added successfully!');
    // Clear the form fields
    document.getElementById('location').value = '';
    document.getElementById('description').value = '';
    document.getElementById('date').value = '';
    document.getElementById('location').focus();
    window.location.href = `user_dashboard.html`;
});
