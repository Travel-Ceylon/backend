import axios from "axios";

export const getDistanceORS = async (origin, destination) => {
  try {
    if (!origin || !destination) {
      throw new Error("Please provide origin and destination");
    }

    const apiKey = process.env.ORS_API_KEY;

    // 1. Geocode origin
    const originRes = await axios.get("https://api.openrouteservice.org/geocode/search", {
      params: { api_key: apiKey, text: origin }
    });
    if (!originRes.data.features.length) {
      throw new Error("Origin not found");
    }
    const [originLon, originLat] = originRes.data.features[0].geometry.coordinates;

    // 2. Geocode destination
    const destRes = await axios.get("https://api.openrouteservice.org/geocode/search", {
      params: { api_key: apiKey, text: destination }
    });
    if (!destRes.data.features.length) {
      throw new Error("Destination not found");
    }
    const [destLon, destLat] = destRes.data.features[0].geometry.coordinates;

    // 3. Get distance via Directions API
    const directionsRes = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        coordinates: [
          [originLon, originLat],
          [destLon, destLat]
        ]
      },
      {
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json"
        }
      }
    );

    // ✅ FIXED: Use routes[0].summary, not features[0].properties.summary
    const summary = directionsRes.data.routes[0].summary;

    // Return distance in km (rounded down)
    return Math.floor(summary.distance / 1000);
  } catch (error) {
    console.error("ORS error:", error.response?.data || error.message);
    return -1;
  }
};
