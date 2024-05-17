const axios = require('axios');

const apiKey = 'AIzaSyB0Nh3kX7SSHkYgO-AnAJmDrXzRwGUEyMY';

async function calculateRoute(address, distance) {
  try {
    const startLocation = await geocodeAddress(address);
    let waypoints = createCircularWaypoints(startLocation, distance);
    const route = await getRoute(startLocation, waypoints);

    if (route) {
      const totalDistance = calculateTotalDistance(route.legs);
      return {
        start_location: startLocation,
        waypoints: waypoints.map(wp => ({ location: wp })),
        route,
        total_distance: totalDistance
      };
    } else {
      throw new Error('No route found');
    }
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
      optimizeWaypoints: false, // Ensure the waypoints are respected
    }
  });

  if (response.data.status === 'OK') {
    return response.data.routes[0];
  } else if (response.data.status === 'ZERO_RESULTS') {
    console.error('Directions request returned zero results');
    return null;
  } else {
    throw new Error('Directions API request failed');
  }
}

function createCircularWaypoints(startLocation, totalDistance) {
  const numWaypoints = Math.min(8, Math.ceil(totalDistance / 500)); // Ensure at least 8 waypoints
  const angleIncrement = 360 / numWaypoints;
  const distanceBetweenPoints = Math.max(200, totalDistance / numWaypoints); // Ensure minimum spacing
  const R = 6371e3; // Radius of the Earth in meters
  const waypoints = [];

  for (let i = 0; i < numWaypoints; i++) {
    const angle = i * angleIncrement + (Math.random() * 100 - 5);
    const bearing = angle * (Math.PI / 180);
    const randomDistance = distanceBetweenPoints * (1 + (Math.random() * 0.2 - 0.1)); // Randomize distance slightly
    const lat1 = startLocation.lat * (Math.PI / 180);
    const lng1 = startLocation.lng * (Math.PI / 180);

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(randomDistance / R) +
    Math.cos(lat1) * Math.sin(randomDistance / R) * Math.cos(bearing));
  const lng2 = lng1 + Math.atan2(Math.sin(bearing) * Math.sin(randomDistance / R) * Math.cos(lat1),
    Math.cos(randomDistance / R) - Math.sin(lat1) * Math.sin(lat2));

    waypoints.push({
      lat: lat2 * (180 / Math.PI),
      lng: lng2 * (180 / Math.PI)
    });
  }

  return waypoints;
}

async function snapToRoads(waypoints) {
    const path = waypoints.map(wp => `${wp.lat},${wp.lng}`).join('|');
    const response = await axios.get('https://roads.googleapis.com/v1/nearestRoads', {
      params: {
        points: path,
        key: apiKey,
      }
    });
  
    if (response.data.snappedPoints) {
      return response.data.snappedPoints.map(point => ({
        lat: point.location.latitude,
        lng: point.location.longitude
      }));
    } else {
      throw new Error('Roads API request failed');
    }
  }

function calculateTotalDistance(legs) {
  let totalDistance = 0;
  for (const leg of legs) {
    totalDistance += leg.distance.value; // Distance in meters
  }
  return totalDistance;
}

module.exports = { calculateRoute };
