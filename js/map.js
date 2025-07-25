// Initialise the Leaflet map and load food bank data
// This version fetches live data from the Give Food API so the map always reflects
// current food bank locations. It transforms the API response into the format
// expected by the map and adds markers for each location.

document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([54.5, -3.0], 5); // centre roughly over the UK

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const markers = [];
    let foodbankData = [];

    // Fetch the food bank data from the public Give Food API. This API returns
    // an array of food bank objects with various fields, including a `lat_lng`
    // string which we split into latitude and longitude values. See
    // https://www.givefood.org.uk/api/2/ for documentation. Using the API
    // avoids bundling a large static dataset in the repository and ensures the
    // map always shows up-to-date information.
    fetch('https://www.givefood.org.uk/api/2/foodbanks')
        .then(response => response.json())
        .then(apiData => {
            // Transform API data into a simpler format used by the map. Some fields
            // in the API may be null; provide empty strings where appropriate.
            const transformed = apiData.map(item => {
                let lat = null;
                let lon = null;
                if (item.lat_lng) {
                    const parts = item.lat_lng.split(',');
                    lat = parseFloat(parts[0]);
                    lon = parseFloat(parts[1]);
                }
                return {
                    name: item.name || '',
                    location_name: item.alt_name || '',
                    url: (item.urls && item.urls.homepage) ? item.urls.homepage : '',
                    shopping_list_url: (item.urls && item.urls.shopping_list) ? item.urls.shopping_list : '',
                    phone: item.phone || '',
                    email: item.email || '',
                    address: (item.address || '').replace(/\r\n/g, ', ').replace(/\n/g, ', '),
                    postcode: item.postcode || '',
                    country: item.country || '',
                    lat: lat,
                    lon: lon,
                    network: item.network || ''
                };
            }).filter(item => item.lat !== null && item.lon !== null);
            foodbankData = transformed;
            addMarkers(transformed);
        })
        .catch(err => {
            console.error('Error loading food bank data from API:', err);
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                mapContainer.innerHTML = '<p style="color:red;">Unable to load food bank data.</p>';
            }
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