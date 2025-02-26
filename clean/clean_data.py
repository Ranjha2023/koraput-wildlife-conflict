import json

# Load the JSON file
with open("data.json", "r", encoding="utf-8") as file:
    data = json.load(file)

cleaned_data = []

for year, incidents in data.items():
    for incident in incidents:
        names = incident["name"]  # Village names
        impact = incident["impact"]  # Impact level

        # Convert lat/lng to string if they are float (to prevent AttributeError)
        lat_values = str(incident["lat"]).split(" | ")  # Ensure it's a string before splitting
        lng_values = str(incident["lng"]).split(" | ")

        # Ensure both lists have the same number of entries
        if len(lat_values) == len(lng_values):
            for i in range(len(lat_values)):
                cleaned_data.append({
                    "year": year,
                    "name": names,
                    "latitude": float(lat_values[i].strip()),
                    "longitude": float(lng_values[i].strip()),
                    "impact": impact
                })

print("Data cleaned successfully! Found", len(cleaned_data), "entries.")

# Convert cleaned data to GeoJSON format
geojson = {
    "type": "FeatureCollection",
    "features": []
}

for incident in cleaned_data:
    feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [incident["longitude"], incident["latitude"]]
        },
        "properties": {
            "year": incident["year"],
            "name": incident["name"],
            "impact": incident["impact"]
        }
    }
    geojson["features"].append(feature)

# Save the GeoJSON file
with open("conflict_hotspots.geojson", "w", encoding="utf-8") as file:
    json.dump(geojson, file, indent=4)

print("✅ GeoJSON file 'conflict_hotspots.geojson' created successfully!")
