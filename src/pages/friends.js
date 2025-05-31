import { setRandomBackground } from '../utils/utils.js';
import {
    sendFriendRequest,
    acceptFriendRequest,
    listFriends,
    getPendingFriendRequests,
    createFriendLeaderboard,
    renderFriendsLeaderboard,
    getUsernameFromId
  } from '../services/friendService.js';
import { getUserId } from '../services/userService.js';
setRandomBackground();



import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
// Initialize Supabase
const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co'; // supabase url
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc'; // anon key
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 
const session = await _supabase.auth.getSession();
const uuid = session.data.session.user.id;
const userId = await getUserId(uuid);

document.getElementById('add-friend-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const friendUsername = document.getElementById('friend-username').value.trim();
    try {
      await sendFriendRequest(userId.id, friendUsername);
      alert('Friend request sent!');
    // TODO: add message to the page that says friend request sent
    } catch (err) {
      alert(err.message);
    }
  });
  

  async function displayPendingRequests() {
    try {
        const requests = await getPendingFriendRequests(userId.id); 
        const ul = document.getElementById('pending-requests-ul');
        ul.innerHTML = '';

        requests.forEach(req => {
            const li = document.createElement('li');
            li.textContent = req.username;

            const acceptBtn = document.createElement('button');
            acceptBtn.textContent = 'Accept';
            acceptBtn.onclick = async () => {
                try {
                    await acceptFriendRequest(userId.id, req.id);
                    alert(`Friend request from ${req.username} accepted!`);
                    li.remove(); // Remove the request from the list
                    // Re-render the friends list and leaderboard
                    // and map points
                    const list_of_friend = await listFriends(userId.id);
                    renderFriendsList(list_of_friend);
                    renderFriendsLeaderboard(userId);
                    const friendPointsForMap = await prepMapPoints(list_of_friend);
                    await renderMapPoints(friendPointsForMap, list_of_friend);
                } catch (err) {
                    alert(`Failed to accept friend request: ${err.message}`);
                }
            };

            li.appendChild(acceptBtn);
            ul.appendChild(li);
        });

    } catch (err) {
        alert(err.message);
    }
}


async function renderFriendsList(friends) {
    try {
        const ul = document.getElementById('friend-list-ul');
        ul.innerHTML = '';

        friends.forEach(friend => {
            const li = document.createElement('li');
            li.textContent = friend.username;
            ul.appendChild(li);
        });
    } catch (err) {
        console.error(err);
        // alert('Failed to load friends list.');
    }
}

async function prepMapPoints(friends){
    // console.log('Preparing map points for friends:', friends);
    const list_of_friend_ids = friends.map(friend => friend.id);
    list_of_friend_ids.push(userId.id); // Include the current user ID
    // console.log('List of friend IDs:', list_of_friend_ids);
    // Fetch user points
    const { data: points, error: pointsError } = await _supabase
        .from('Points')
        .select('*')
        .in('user', list_of_friend_ids)
        .eq('friend_approved', true);

    if (pointsError) {
        console.error('Error fetching points:', pointsError);
    }
    return points;
}

async function renderMapPoints(points, friends) {
    // console.log('Rendering map points for friends:', friends);
    // add self id and username to friends array
    friends.push({  username: 'You', id: userId.id });
    // console.log('Rendering map points:', points);
    // Update map with points
    if (L.DomUtil.get('map') != null) {
        L.DomUtil.get('map')._leaflet_id = null;
    }
    const map = L.map('map').setView([0, 0], 3);
    

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    }).addTo(map);

    points.forEach(async point => {
    const marker = L.marker([point.lat, point.lng]).addTo(map);
    const username = await getUsernameFromId(point.user, friends);
    marker.bindPopup(`<h2>${username}</h2><b>${point.description}</b><br>${new Date(point.date_and_time).toLocaleString()}`);
    });

    if (points.length > 0) {
    map.setView([points[0].lat, points[0].lng], 3);
    }
}

const friends = await listFriends(userId.id);


renderFriendsLeaderboard(userId);
renderFriendsList(friends);
const friendPointsForMap = await prepMapPoints(friends);
await renderMapPoints(friendPointsForMap,friends);
displayPendingRequests();

