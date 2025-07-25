// Initialise the Leaflet map and load food bank data
document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([54.5, -3.0], 5); // centre roughly over the UK

    // Add base tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const markers = [];
    let foodbankData = [];

    // Fetch the food bank dataset. The JSON file contains a list of food banks with
    // coordinates and basic details. For deployment on GitHub Pages we keep the
    // dataset reasonably small to ensure it can be loaded quickly.
    // See README for details on how to update this file with a larger dataset.
    fetch('data/foodbanks.json')
        .then(response => response.json())
        .then(data => {
            foodbankData = data;
            addMarkers(data);
        })
        .catch(err => {
            console.error('Error loading food bank data:', err);
        });

    function addMarkers(data) {
        data.forEach(item => {
            const marker = L.marker([item.lat, item.lon]);
            marker.bindPopup(`<strong>${item.name}</strong><br>${item.location_name ? item.location_name + '<br>' : ''}${item.address}<br>` +
                             `${item.postcode} (${item.country})<br>` +
                             `${item.network ? 'Network: ' + item.network : ''}<br>` +
                             `${item.url ? '<a href="' + item.url + '" target="_blank">Website</a>' : ''}`);
            marker.addTo(map);
            markers.push({ marker, data: item });
        });
    }

    // Filter markers based on search and network
    const searchBox = document.getElementById('searchBox');
    const networkFilter = document.getElementById('networkFilter');

    searchBox.addEventListener('input', filterMarkers);
    networkFilter.addEventListener('change', filterMarkers);

    function filterMarkers() {
        const searchText = searchBox.value.trim().toLowerCase();
        const networkVal = networkFilter.value;
        markers.forEach(item => {
            const { marker, data } = item;
            // check network
            const networkMatch = networkVal === 'All' || (data.network && data.network.toLowerCase() === networkVal.toLowerCase());
            // check search in name, location_name, address, postcode
            const combined = `${data.name} ${data.location_name || ''} ${data.address || ''} ${data.postcode || ''}`.toLowerCase();
            const searchMatch = combined.includes(searchText);
            if (networkMatch && searchMatch) {
                if (!map.hasLayer(marker)) marker.addTo(map);
            } else {
                if (map.hasLayer(marker)) map.removeLayer(marker);
            }
        });
    }
});
