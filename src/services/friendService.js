import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co'; // supabase url
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc'; // anon key
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Send a friend request
/**
 * this function sends a friend request to the user with the given username
 * @param {string} currentUserId - The ID of the current user
 * @param {string} friendUsername - The username of the user to send a friend request to
 * @returns {void} - If there is an error, it will throw an error
 */
export async function sendFriendRequest(currentUserId, friendUsername) {
    const { data: user, error: userError } = await _supabase
        .from('users')
        .select('id')
        .eq('username', friendUsername)
        .single();

    if (userError || !user) throw new Error('User not found');

    console.log('user', user.id);
    console.log('currentUserId', currentUserId);


    const { error } = await _supabase
        .from('friends')
        .insert({ user_id: currentUserId, friend_id: user.id, status: 'pending' });

    if (error) throw new Error('Failed to send friend request,' + error.message);
}

// Accept a friend request
/**
 * this function accepts a friend request from the user with the given ID
 * @param {string} currentUserId - The ID of the current user
 * @param {string} requesterId - The ID of the user who sent the friend request
 * @returns {void} - If there is an error, it will throw an error
 * */
export async function acceptFriendRequest(currentUserId, requesterId) {
    const { error } = await _supabase
        .from('friends')
        .update({ status: 'accepted' })
        .match({ user_id: requesterId, friend_id: currentUserId });

    if (error) throw new Error('Failed to accept friend request');
}

// list friends
/**
 * this function lists all the friends of the current user
 * @param {string} currentUserId - The ID of the current user
 * @return {Array} - An array of friend objects containing their usernames and IDs
 * @throws {Error} - If there is an error fetching the friend relations or usernames
 * */
export async function listFriends(currentUserId) {
    const { data: relations, error } = await _supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${currentUserId},status.eq.accepted),and(friend_id.eq.${currentUserId},status.eq.accepted)`);
  
    if (error) throw new Error('Failed to fetch friend relations');
  
    const friendIds = relations.map(rel =>
      rel.user_id === currentUserId ? rel.friend_id : rel.user_id
    );
  
    const { data: friends, error: friendError } = await _supabase
      .from('users')
      .select('username, id')
      .in('id', friendIds);
  
    if (friendError) throw new Error('Failed to fetch friend usernames');
  
    return friends; // Array of { username, id }
  }


// create friend leaderboard
export async function createFriendLeaderboard(currentUser) {
    const friends = await listFriends(currentUser.id);
    // add the current user to the friends list so that they can be displayed in the leaderboard
    friends.push({ username: currentUser.username, id: currentUser.id });
    // console.log('friends', friends);

    // for each friend, get their points and add them to leaderboard
    for (const friend of friends) {
        // console.log('friend', friend);
        const { data, error } = await _supabase
            .from('Points')
            .select('id, lat, lng, date_and_time, friend_approved')
            .eq('user', friend.id);
        if (data) {
            const approvedPoints = data.filter(point => (point.friend_approved == true));
            friend.points = approvedPoints.length;
        } else {
            friend.points = 0;
        }
    }
    return friends.sort((a, b) => b.points - a.points); // Sort by points in descending order

}


// Get incoming pending friend requests (requests received by current user)
/**
 * this function fetches the pending friend requests for the current user
 * @param {string} currentUserId - The ID of the current user
 * @returns {Array} - An array of objects containing the usernames and IDs of users who sent friend requests
 * @throws {Error} - If there is an error fetching the pending requests or usernames
 * */
export async function getPendingFriendRequests(currentUserId) {
    // console.log('currentUserId', currentUserId);
    const { data, error } = await _supabase
        .from('friends')
        .select('user_id')
        .eq('friend_id', currentUserId)
        .eq('status', 'pending');

    if (error) {
        console.error('Error fetching pending requests:', error.message);
        throw new Error('Failed to fetch pending requests');
    }

    // Fetch usernames for those IDs
    const pendingIds = data.map(r => r.user_id);
    const { data: users, error: userError } = await _supabase
        .from('users')
        .select('id, username')
        .in('id', pendingIds);

    if (userError) {
        console.error('Error fetching usernames:', userError.message);
        throw new Error('Failed to fetch requester info');
    }

    return users; // Returns array of { id, username }
}

// Render friends leaderboard
/**
 * this function renders the friends leaderboard for the current user
 * @param {string} userId - The ID of the current user
 * @returns {void} - If there is an error, it will log the error to the console
 * */
export async function renderFriendsLeaderboard(userId) {
    try {
        const leaderboard = await createFriendLeaderboard(userId);
        const div = document.getElementById('friends-leaderboard-container');
        if (!div) {
            console.error('Friends leaderboard container not found.');
            return;
        }
        // Clear previous content
        div.innerHTML = ''; // Clear previous content

        // add section title for friends leaderboard
        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'section-title';
        sectionTitle.textContent = 'Friends Leaderboard';
        div.appendChild(sectionTitle); // Append the section title

        // Clear previous content and create a new table
        const table = document.createElement('table');
        table.id = 'friends-leaderboard-table';
        table.innerHTML = '';

        // Create table headers
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const usernameHeader = document.createElement('th');
        usernameHeader.textContent = 'USERNAME';
        const pointsHeader = document.createElement('th');
        pointsHeader.textContent = 'POINTS';
        headerRow.appendChild(usernameHeader);
        headerRow.appendChild(pointsHeader);
        thead.appendChild(headerRow);
        table.appendChild(thead);
        // div.innerHTML = ''; // Clear previous content
        
        div.appendChild(table); // Append the new table

        // Create table body
        const tbody = document.createElement('tbody');
        var i = 1; // Initialize a counter for ranking
        leaderboard.forEach(friend => {
            const row = document.createElement('tr');

            const usernameCell = document.createElement('td');
            usernameCell.textContent = i+". "+friend.username;

            const pointsCell = document.createElement('td');
            pointsCell.textContent = friend.points;
            
            row.appendChild(usernameCell);
            row.appendChild(pointsCell);
            tbody.appendChild(row);
            i++; // Increment the counter for the next row
        });

        table.appendChild(tbody);
    } catch (err) {
        console.error(err);
        // alert('Failed to load friends leaderboard.');
    }
}
// Fetch user username by id
/**
 * this function fetches the username of a user by their ID
* @param {string} userId - The ID of the user
* @param {Array} friends - An array of friend objects containing their usernames and IDs
* @returns {string} - The username of the user with the given ID
* @throws {Error} - If the user is not found in the friends list
*/
export async function getUsernameFromId(userId, friends) {
    // console.log('Fetching username for userId:', userId);
    // console.log('friends', friends);
    // console.log('username', friends.find(friend => friend.id === userId)?.username);
    
    const username = await friends.find(friend => friend.id === userId)?.username;
    if (!username) {
        throw new Error('User not found');
    }
    return username  
}