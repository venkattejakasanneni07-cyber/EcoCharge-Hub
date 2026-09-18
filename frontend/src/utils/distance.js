/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format distance for display
 * @param {number} km - Distance in kilometers
 * @returns {string} Formatted distance (e.g., "1.8 km" or "850 m")
 */
export const formatDistance = (km) => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
};

/**
 * Get user's current location as a promise
 * @returns {Promise<{lat: number, lng: number}>}
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        let message = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
          default:
            message = 'Unknown location error';
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
};

/**
 * Sort stations by distance from a given location
 * @param {Array} stations - Array of station objects
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @returns {Array} Sorted stations with distance property added
 */
export const sortStationsByDistance = (stations, userLat, userLng) => {
  return stations
    .map((station) => {
      const lat = parseFloat(station.latitude);
      const lng = parseFloat(station.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        return { ...station, distance: Infinity };
      }

      const distance = calculateDistance(userLat, userLng, lat, lng);
      return { ...station, distance };
    })
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Filter stations within a radius
 * @param {Array} stations - Array of station objects
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Array} Filtered stations within radius
 */
export const filterStationsByRadius = (stations, userLat, userLng, radiusKm) => {
  return stations.filter((station) => {
    const lat = parseFloat(station.latitude);
    const lng = parseFloat(station.longitude);
    if (isNaN(lat) || isNaN(lng)) return false;
    const distance = calculateDistance(userLat, userLng, lat, lng);
    return distance <= radiusKm;
  });
};