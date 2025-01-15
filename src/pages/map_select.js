// Description: This file is used to create the map and select a location on the map to submit to the database

// initialize the map and set the view centered on the United States
  const map = L.map('map').setView([40, -103], 3);

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

  // Adds a marker to the map in the center of the United States so that the user
  // can select the location of their point to submit.
  let marker = L.marker([40, -103], { draggable: true }).addTo(map);

  /**
   * this function updates the location input field with the given lat and lng 
   * @param {float} lat
   * @param {float} lng
   */
  function updateLocationInput(lat, lng) {
    document.getElementById('location').value = `${lat}, ${lng}`;
  }

  // Listen for click events on the map and update the marker location
  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    console.log("lat, lng", lat, lng);
    marker.setLatLng(e.latlng);
    updateLocationInput(lat, lng);
    
  });

  // Listen for drag events on the marker and update the location input
  marker.on('dragend', () => {
    const { lat, lng } = marker.getLatLng();
    updateLocationInput(lat, lng);
  });

  
