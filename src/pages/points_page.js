import { setRandomBackground } from '../utils/utils.js';
setRandomBackground();

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc'; // anon key

const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get session and user ID
const session = await _supabase.auth.getSession();
const uuid = session.data.session.user.id;

// Fetch user info
const { data: userData, error: userError } = await _supabase
  .from('users')
  .select('*')
  .eq('UID', uuid)
  .single();

if (userError) {
  console.error('Error fetching user:', userError);
}

// Fetch user points
const { data: points, error: pointsError } = await _supabase
  .from('Points')
  .select('*')
  .eq('user', userData.id);

if (pointsError) {
  console.error('Error fetching points:', pointsError);
}

// Update map with points
if (L.DomUtil.get('map') != null) {
    L.DomUtil.get('map')._leaflet_id = null;
  }
  const map = L.map('map').setView([0, 0], 3);
  

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
}).addTo(map);

points.forEach(point => {
  const marker = L.marker([point.lat, point.lng]).addTo(map);
  marker.bindPopup(`<b>${point.description}</b><br>${new Date(point.date_and_time).toLocaleString()}`);
});

if (points.length > 0) {
  map.setView([points[0].lat, points[0].lng], 3);
}

// Sort points by date so that the most recent points are at the top
points.sort((a, b) => new Date(b.date_and_time) - new Date(a.date_and_time));

// Populate points list
const listContainer = document.getElementById('points-list-ul');
listContainer.innerHTML = ''; // Clear placeholder content
if (!points || points.length === 0) {
  listContainer.innerHTML = '<li>No points found.</li>';
}

points.forEach(point => {
  const li = document.createElement('li');
  li.style.marginBottom = '10px';

  li.innerHTML = `
    <span><strong>${new Date(point.date_and_time).toLocaleString()}</strong> — ${point.description}</span><br>
    <small>(${point.lat}, ${point.lng})</small><br>
  `;
// buttons for edit and delete functionality can be added here if needed
//  <button onclick="editPoint(${point.id})">Edit</button>
//  <button onclick="deletePoint(${point.id})" style="margin-left: 5px;">Delete</button>

  listContainer.appendChild(li);
});

// Edit point (placeholder logic)
window.editPoint = async (id) => {
  alert(`Edit functionality for point ID ${id} coming soon.`);
};

// Delete point
window.deletePoint = async (id) => {
  const confirmed = confirm("Are you sure you want to delete this point?");
  if (!confirmed) return;

  const { error } = await _supabase.from('Points').delete().eq('id', id);
  if (error) {
    alert('Error deleting point.');
    console.error(error);
  } else {
    alert('Point deleted.');
    location.reload(); // Refresh to show updated list
  }
};

// Fetch total points
const { data: totalData, error: totalError } = await _supabase
  .from('Total_points')
  .select('*')
  .eq('id', userData.id)
  .single();

if (!totalError) {
  document.getElementById('userPoints').textContent = totalData.num_points;
}

// Fetch leaderboard position
const { data: leaderboard } = await _supabase
  .from('Total_points')
  .select('id, num_points')
  .order('num_points', { ascending: false });

const position = leaderboard.findIndex(entry => entry.id === userData.id) + 1;
document.getElementById('leaderboardPosition').textContent = `#${position}`;
