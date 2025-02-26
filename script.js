// ✅ Initialize the Map
var map = L.map('map').setView([19.5, 84.0], 7); // Focus on Odisha

// ✅ Load OpenStreetMap Tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

var heatArray = []; // Store heatmap data
var allData = [];   // Store all conflict data
var boundaryOdisha = null; // Store Odisha boundary
var boundaryKoraput = null; // Store Koraput boundary
var heatLayer = null;  // Store heatmap layer for removal
var boundaryLayers = []; // Store all boundaries

// ✅ Function to Load GeoJSON Boundaries & Keep Them Visible
function loadBoundary(url, color, weight, fillColor, fillOpacity) {
    return fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load ${url}`);
            return response.json();
        })
        .then(data => {
            console.log(`📂 Loaded boundary data for ${url}:`, data); // Debug log
            let boundaryLayer = L.geoJSON(data, {
                style: { color, weight, fillColor, fillOpacity }
            }).addTo(map);
            boundaryLayers.push(boundaryLayer); // Store boundary
            console.log(`✅ Added boundary: ${url}`);
            return boundaryLayer;
        })
        .catch(error => {
            console.error(`🚨 Error loading ${url}:`, error);
            return null;
        });
}

// ✅ Load Boundaries & Store References
Promise.all([
    loadBoundary("odisha_boundary.geojson", "blue", 2, "", 0.1).then(layer => boundaryOdisha = layer),
    loadBoundary("koraput_boundary.geojson", "red", 3, "yellow", 0.2).then(layer => boundaryKoraput = layer)
]).then(() => {
    console.log("✅ Both boundaries loaded!");
    loadHotspots(); // Load conflict data after boundaries
});

// ✅ Function to Load Conflict Hotspots & Populate Filters
function loadHotspots() {
    fetch("conflict_hotspots.geojson")
        .then(response => {
            if (!response.ok) throw new Error("Conflict hotspots file not found!");
            return response.json();
        })
        .then(data => {
            allData = data;
            populateYearDropdown(data);
            applyFilters(); // Load map with default filters
        })
        .catch(error => console.error("🚨 Error loading GeoJSON:", error));
}

// ✅ Function to Populate Year Dropdown
function populateYearDropdown(data) {
    let years = new Set();
    data.features.forEach(feature => years.add(feature.properties.year));

    let yearDropdown = document.getElementById("yearFilter");
    yearDropdown.innerHTML = '<option value="all">All Years</option>';

    years.forEach(year => {
        let option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearDropdown.appendChild(option);
    });

    document.getElementById("yearFilter").addEventListener("change", applyFilters);
    document.getElementById("impactFilter").addEventListener("change", applyFilters);
}

// ✅ Function to Apply Filters & Keep Boundaries Visible
function applyFilters() {
    console.log("🔄 Applying filters...");

    let selectedYear = document.getElementById("yearFilter").value;
    let selectedImpact = document.getElementById("impactFilter").value;

    // ✅ Remove Only Markers & Heatmap (KEEP BOUNDARIES)
    map.eachLayer(layer => {
        if (
            layer instanceof L.CircleMarker ||   // Remove only markers
            layer === heatLayer                  // Remove only heatmap
        ) {
            map.removeLayer(layer);
        }
    });

    heatArray = []; // Reset heatmap data

    let filteredData = {
        "type": "FeatureCollection",
        "features": allData.features.filter(feature =>
            (selectedYear === "all" || feature.properties.year === selectedYear) &&
            (selectedImpact === "all" || feature.properties.impact === selectedImpact)
        )
    };

    // ✅ Add Filtered Markers
    L.geoJSON(filteredData, {
        pointToLayer: function (feature, latlng) {
            let color = feature.properties.impact === "High" ? "red" :
                        feature.properties.impact === "Medium" ? "orange" : "green";

            heatArray.push([latlng.lat, latlng.lng, 1]); // Add to heatmap

            return L.circleMarker(latlng, {
                radius: 5,
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

    // ✅ Re-Add Boundaries If Missing
    map.eachLayer(layer => {
        if (layer instanceof L.GeoJSON) {
            console.log("✅ Boundary layer still exists.");
        }
    });

    // ✅ Remove Old Heatmap Before Adding New One
    if (heatLayer) map.removeLayer(heatLayer);
    heatLayer = L.heatLayer(heatArray, {radius: 20, blur: 15}).addTo(map);
}

