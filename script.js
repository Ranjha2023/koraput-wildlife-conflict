// Initialize the map and set the view to Koraput region with a closer zoom
var map = L.map('map').setView([18.8130, 82.7100], 10); // Zoom level 10 for Koraput

// Load OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Function to check if a point is inside Koraput district
function isInsideKoraput(lat, lng) {
    return lat >= 18.5 && lat <= 19.5 && lng >= 82.0 && lng <= 83.5; // Koraput boundary
}

// 🟢 Load and Draw Koraput District Boundary
fetch("koraput_boundary.geojson")
    .then(response => response.json())
    .then(boundaryData => {
        L.geoJSON(boundaryData, {
            style: {
                color: "black", // Border color
                weight: 2,
                fillOpacity: 0.1  // Slight transparency for visibility
            }
        }).addTo(map);
        console.log("✅ Koraput boundary loaded successfully!");
    })
    .catch(error => console.error("🚨 Error loading Koraput boundary:", error));

// 🔴 Load and Filter Conflict Hotspots for Koraput
fetch("conflict_hotspots.geojson")
    .then(response => response.json())
    .then(data => {
        let filteredData = {
            "type": "FeatureCollection",
            "features": data.features.filter(feature => 
                isInsideKoraput(feature.geometry.coordinates[1], feature.geometry.coordinates[0])
            )
        };

        L.geoJSON(filteredData, {
            pointToLayer: function (feature, latlng) {
                let color = feature.properties.impact === "High" ? "red" :
                            feature.properties.impact === "Medium" ? "orange" : "green";

                return L.circleMarker(latlng, {
                    radius: 5,  // Slightly larger for better visibility
                    fillColor: color,
                    color: "#000",
                    weight: 0.7,
                    opacity: 1,
                    fillOpacity: 0.8
                }).bindPopup(
                    `<b>Location:</b> ${feature.properties.name}<br>
                     <b>Impact Level:</b> ${feature.properties.impact}<br>
                     <b>Year:</b> ${feature.properties.year}`
                );
            }
        }).addTo(map);

        console.log("✅ Conflict hotspots loaded successfully!");
    })
    .catch(error => console.error("🚨 Error loading GeoJSON:", error));
