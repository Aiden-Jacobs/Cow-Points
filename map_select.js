// Description: This file is used to create a map and select a location on the map.

// initialize the map and set the view to the given coordinates
  const map = L.map('map').setView([40, -103], 3); // Default to London

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  // Add the full-screen control to the map
  L.control.fullscreen().addTo(map);

  // Optional: Handle full-screen events
  map.on('enterFullscreen', () => {
    console.log('Entered full-screen mode');
  });

  map.on('exitFullscreen', () => {
    console.log('Exited full-screen mode');
  });

  // Add a marker to the map
  let marker = L.marker([40, -103], { draggable: true }).addTo(map);

  // Update input field with marker's position
  function updateLocationInput(lat, lng) {
    document.getElementById('location').value = `${lat}, ${lng}`;
  }

  // Set initial input value
//   updateLocationInput(40, -103);

  // Listen for map click event to move the marker
  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    console.log("lat, lng", lat, lng);
    marker.setLatLng(e.latlng);
    updateLocationInput(lat, lng);
    
  });

  // Update input field when the marker is dragged
  marker.on('dragend', () => {
    const { lat, lng } = marker.getLatLng();
    updateLocationInput(lat, lng);
  });

  
