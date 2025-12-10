// Import Current Supabase library
import "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
const { createClient } = supabase;

const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co'; // supabase url
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc'; // anon key
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * fetches the users id number from the database this is not the same as the uuid
 * @param {string} input_uuid
 * @returns {object} the user data
 * @returns {void} if there is an error
 */
export async function getUserId(input_uuid) {
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
export async function fetchUserPoints(userId) {
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
 * this function fetches the users points count from the database
 * @param {string} userId
 * @returns {string} the number of points the user has
 * @returns {void} if there is an error
 */
export async function fetchUserPointsCount(userId) {
    const { data, error } = await _supabase
        .from('Points')
        .select('*')
        .eq('user', parseInt(userId));
    if (error) {
        console.error('Error fetching user points count:', error);
        return;
    }
    var point_count = data.length;
    // check to see if the there are any points where admin_approved is true false
    const approvedPoints = data.filter(point => point.admin_approved == true);
    if (approvedPoints.length != point_count) {
        // after we have checked if the user has any points that are not approved we can indicate that to the user in the return value
        document.getElementById('not-approved-message').textContent = '* points not yet approved';
        return String(point_count) + "*";
    }

    return String(data.length);
}



/**
 * this function fetches the users position in the leaderboard
 * @param {string} uuid 
 * @returns {number} the users position in the leaderboard
 * @returns {void} if there is an error
 */
export async function fetchLeaderboardPosition(uuid) {
    try {
        // Fetch all users sorted by num_points in descending order so that the 
        // user's position can be found
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
