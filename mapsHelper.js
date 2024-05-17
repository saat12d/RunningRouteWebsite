const axios = require('axios');

const apiKey = 'AIzaSyB0Nh3kX7SSHkYgO-AnAJmDrXzRwGUEyMY';

async function calculateRoute(address, distance) {
  try {
    const startLocation = await geocodeAddress(address);
    const { waypoints, totalDistance } = createCircularWaypoints(startLocation, distance);
    const route = await getRoute(startLocation, waypoints);
    return {
      start_location: startLocation,
      waypoints: waypoints.map(wp => ({ location: wp })),
      route,
      total_distance: totalDistance // Include total distance in the response
    };
  } catch (error) {
    console.error('Error calculating route:', error);
    throw new Error('Route calculation failed');
  }
}

async function geocodeAddress(address) {
  const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
    params: {
      address: address,
      key: apiKey
    }
  });

  if (response.data.status === 'OK') {
    return response.data.results[0].geometry.location;
  } else {
    throw new Error('Geocoding failed');
  }
}

async function getRoute(startLocation, waypoints) {
  const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
    params: {
      origin: `${startLocation.lat},${startLocation.lng}`,
      destination: `${startLocation.lat},${startLocation.lng}`,
      waypoints: waypoints.map(wp => `${wp.lat},${wp.lng}`).join('|'),
      key: apiKey,
      mode: 'walking',
      optimizeWaypoints: true,
    }
  });

  if (response.data.status === 'OK') {
    return response.data.routes[0];
  } else {
    throw new Error('Directions API request failed');
  }
}

function createCircularWaypoints(startLocation, totalDistance) {
  const numWaypoints = Math.max(8, Math.ceil(totalDistance / 500)); // Minimum 8 waypoints, more if distance is less than 4 km
  const angleIncrement = 360 / numWaypoints;
  const distanceBetweenPoints = totalDistance / numWaypoints;
  const R = 6371e3; // Radius of the Earth in meters
  const waypoints = [];
  let totalDistanceMeters = 0;

  for (let i = 0; i < numWaypoints; i++) {
    const angle = i * angleIncrement;
    const bearing = angle * (Math.PI / 180);
    const lat1 = startLocation.lat * (Math.PI / 180);
    const lng1 = startLocation.lng * (Math.PI / 180);

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distanceBetweenPoints / R) +
      Math.cos(lat1) * Math.sin(distanceBetweenPoints / R) * Math.cos(bearing));
    const lng2 = lng1 + Math.atan2(Math.sin(bearing) * Math.sin(distanceBetweenPoints / R) * Math.cos(lat1),
      Math.cos(distanceBetweenPoints / R) - Math.sin(lat1) * Math.sin(lat2));

    const waypoint = {
      lat: lat2 * (180 / Math.PI),
      lng: lng2 * (180 / Math.PI)
    };

    waypoints.push(waypoint);
    totalDistanceMeters += distanceBetweenPoints; // Sum up the distance between each point
  }

  return { waypoints, totalDistance: totalDistanceMeters };
}

module.exports = { calculateRoute };
