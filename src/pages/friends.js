import { setRandomBackground } from '../utils/utils.js';
import { supabase } from '../utils/supabaseClient.js';
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  listFriends,
  getPendingFriendRequests,
  createFriendLeaderboard,
  renderFriendsLeaderboard,
  getUsernameFromId
} from '../services/friendService.js';
import { getUserId } from '../services/userService.js';
setRandomBackground();



const session = await supabase.auth.getSession();
const uuid = session.data.session.user.id;
const userId = await getUserId(uuid);

document.getElementById('add-friend-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const friendUsername = document.getElementById('friend-username').value.trim();
  try {
    if (!friendUsername) {
      alert('Please enter a username.');
      return;
    }
    await sendFriendRequest(userId.id, friendUsername);
    alert('Friend request sent!');
    // TODO: add message to the page that says friend request sent
  } catch (err) {
    alert(err.message);
  }
});

const friendInput = document.getElementById('friend-username');
const suggestionsContainer = document.getElementById('autocomplete-suggestions');
let debounceTimeout;
friendInput.addEventListener('input', () => {
  clearTimeout(debounceTimeout);
  const query = friendInput.value.trim();
  if (query.length < 2) {
    suggestionsContainer.innerHTML = '';
    return;
  }

  debounceTimeout = setTimeout(async () => {
    const results = await searchUsers(query);
    renderSuggestions(results);
  }, 300);
});

async function searchUsers(query) {
  const { data, error } = await supabase
    .rpc('search_users_autocomplete', { search_term: query });

  if (error) {
    console.error('Search failed:', error.message);
    return [];
  }

  // Filter out already-friends or pending requests
  const existingFriends = await listFriends(userId.id);
  const pendingRequests = await getPendingFriendRequests(userId.id);
  const existingUsernames = new Set([...existingFriends, ...pendingRequests].map(f => f.username));

  return data.filter(user => !existingUsernames.has(user.username));
}

function renderSuggestions(users) {
  suggestionsContainer.innerHTML = '';
  suggestionsContainer.style.position = 'absolute';
  suggestionsContainer.style.backgroundColor = '#fff';
  suggestionsContainer.style.border = '1px solid #ccc';
  suggestionsContainer.style.zIndex = '999';
  // this sets the position of the suggestions container so
  // that it appears below the input field so the user knows
  // that the suggestions are related to the input field
  const rect = friendInput.getBoundingClientRect();
  suggestionsContainer.style.top = `${rect.bottom + window.scrollY}px`;
  suggestionsContainer.style.left = `${rect.left + window.scrollX}px`;
  suggestionsContainer.style.width = `${friendInput.offsetWidth}px`;

  users.forEach(user => {
    const div = document.createElement('div');
    div.textContent = user.username;
    div.style.padding = '4px';
    div.style.cursor = 'pointer';
    div.addEventListener('click', () => {
      friendInput.value = user.username;
      suggestionsContainer.innerHTML = '';
    });
    suggestionsContainer.appendChild(div);
  });

  if (users.length === 0) {
    const noResult = document.createElement('div');
    noResult.textContent = 'No matches found';
    noResult.style.padding = '4px';
    suggestionsContainer.appendChild(noResult);
  }
}



async function displayPendingRequests() {
  try {
    const requests = await getPendingFriendRequests(userId.id);
    const ul = document.getElementById('pending-requests-ul');
    ul.innerHTML = '';

    requests.forEach(req => {
      // Create a list item for each pending request so
      // the user can accept it
      const li = document.createElement('li');
      li.textContent = req.username + " ";
      const acceptBtn = document.createElement('button');
      acceptBtn.className = 'accept-request-btn';
      acceptBtn.textContent = '+ ADD';
      acceptBtn.style.marginRight = '10px';
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

      const declineBtn = document.createElement('button');
      declineBtn.className = 'decline-request-btn';
      declineBtn.textContent = 'DECLINE';
      // Add red styling for decline button
      // declineBtn.style.backgroundColor = '#ff4d4d'; // Red color - moved to CSS
      declineBtn.onclick = async () => {
        try {
          if (!confirm(`Are you sure you want to decline the request from ${req.username}?`)) return;
          await declineFriendRequest(userId.id, req.id);
          alert(`Friend request from ${req.username} declined.`);
          li.remove();
        } catch (err) {
          alert(`Failed to decline friend request: ${err.message}`);
        }
      };

      li.appendChild(acceptBtn);
      li.appendChild(declineBtn);
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

async function prepMapPoints(friends) {
  // console.log('Preparing map points for friends:', friends);
  const list_of_friend_ids = friends.map(friend => friend.id);
  list_of_friend_ids.push(userId.id); // Include the current user ID
  // console.log('List of friend IDs:', list_of_friend_ids);
  // Fetch user points
  const { data: points, error: pointsError } = await supabase
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
  friends.push({ username: 'You', id: userId.id });
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
await renderMapPoints(friendPointsForMap, friends);
displayPendingRequests();

