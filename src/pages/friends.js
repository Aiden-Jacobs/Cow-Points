import { setRandomBackground } from '../utils/utils.js';
import {
    sendFriendRequest,
    acceptFriendRequest,
    listFriends,
    getPendingFriendRequests,
    createFriendLeaderboard
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
            acceptBtn.onclick = () => acceptFriendRequest(userId.id, req.id);

            li.appendChild(acceptBtn);
            ul.appendChild(li);
        });

    } catch (err) {
        alert(err.message);
    }
}


async function renderFriendsList() {
    try {
        const friends = await listFriends(userId.id);
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

async function renderFriendsLeaderboard() {
    try {
        const leaderboard = await createFriendLeaderboard(userId);
        const table = document.getElementById('friend-leaderboard-table');
        // table.innerHTML = '';



        // Create table body
        const tbody = document.createElement('tbody');

        leaderboard.forEach(friend => {
            const row = document.createElement('tr');

            const usernameCell = document.createElement('td');
            usernameCell.textContent = friend.username;

            const pointsCell = document.createElement('td');
            pointsCell.textContent = friend.points;

            row.appendChild(usernameCell);
            row.appendChild(pointsCell);
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
    } catch (err) {
        console.error(err);
        // alert('Failed to load friends leaderboard.');
    }
}

renderFriendsLeaderboard(userId);
renderFriendsList();  
displayPendingRequests();