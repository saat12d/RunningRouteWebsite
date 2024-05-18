const axios = require('axios');

const apiKey = 'AIzaSyB0Nh3kX7SSHkYgO-AnAJmDrXzRwGUEyMY';
const TOLERANCE = 0.1;

async function calculateRoute(address, targetDistance) {
  try {
    const startLocation = await geocodeAddress(address);
    let waypoints, route, totalDistance;

    for (let attempt = 0; attempt < 5; attempt++) {
      waypoints = createEquidistantWaypoints(startLocation, targetDistance);
      waypoints = await snapToRoads(waypoints); // Ensure waypoints are on roads
      route = await getRoute(startLocation, waypoints);
      if (route) {
        totalDistance = calculateTotalDistance(route.legs);
        if (Math.abs(totalDistance - targetDistance) / targetDistance <= TOLERANCE) {
          break; // Exit loop if within tolerance
        }
      }
    }


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

// function createCircularWaypoints(startLocation, targetDistance, attempt) {
//     const numWaypoints = Math.ceil(targetDistance / 500);
//     const angleIncrement = 360 / numWaypoints;
//     const distanceBetweenPoints = Math.max(200, targetDistance / numWaypoints) * (1 + attempt * 0.1);
//     const R = 6371e3;
//     const waypoints = [];
  
//     for (let i = 0; i < numWaypoints; i++) {
//       const angle = i * angleIncrement + (Math.random() * 100 - 5); // Randomize angle slightly
//       const randomDistance = distanceBetweenPoints * (1 + (Math.random() * 0.2 - 0.1)); // Randomize distance slightly
//       const bearing = angle * (Math.PI / 180);
//       const lat1 = startLocation.lat * (Math.PI / 180);
//       const lng1 = startLocation.lng * (Math.PI / 180);
  
//       const lat2 = Math.asin(Math.sin(lat1) * Math.cos(randomDistance / R) +
//         Math.cos(lat1) * Math.sin(randomDistance / R) * Math.cos(bearing));
//       const lng2 = lng1 + Math.atan2(Math.sin(bearing) * Math.sin(randomDistance / R) * Math.cos(lat1),
//         Math.cos(randomDistance / R) - Math.sin(lat1) * Math.sin(lat2));
  
//       waypoints.push({
//         lat: lat2 * (180 / Math.PI),
//         lng: lng2 * (180 / Math.PI)
//       });
//     }
  
//     return waypoints;
//   }

// function createEquidistantWaypoints(startLocation, targetDistance) {
//     const R = 6371e3; // Earth's radius in meters
//     const numWaypoints = Math.max(8, Math.ceil(targetDistance / 500));
//     const distanceBetweenPoints = targetDistance / numWaypoints;
//     const angleIncrement = 360 / numWaypoints;
//     const waypoints = [];
  
//     for (let i = 0; i < numWaypoints; i++) {
//       const angle = i * angleIncrement;
//       const bearing = angle * (Math.PI / 180);
//       const lat1 = startLocation.lat * (Math.PI / 180);
//       const lng1 = startLocation.lng * (Math.PI / 180);
  
//       const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distanceBetweenPoints / R) +
//         Math.cos(lat1) * Math.sin(distanceBetweenPoints / R) * Math.cos(bearing));
//       const lng2 = lng1 + Math.atan2(Math.sin(bearing) * Math.sin(distanceBetweenPoints / R) * Math.cos(lat1),
//         Math.cos(distanceBetweenPoints / R) - Math.sin(lat1) * Math.sin(lat2));
  
//       waypoints.push({
//         lat: lat2 * (180 / Math.PI),
//         lng: lng2 * (180 / Math.PI)
//       });
//     }
//     // console.log(waypoints)
//     return waypoints;
//   }

function createEquidistantWaypoints(startLocation, targetDistance) {
    // const numWaypoints = Math.max(8, Math.ceil(targetDistance / 500));
    console.log('Start location - ')
    console.log(startLocation)
    let numWaypoints = Math.ceil(targetDistance / 500);
    if(numWaypoints < 3){
        numWaypoints = 3;
    }
    const angleIncrement = 360 / numWaypoints;
    const waypoints = [];
  
    for (let i = 0; i < numWaypoints; i++) {
      const angle = i * angleIncrement * Math.random();
      const bearing = angle * (Math.PI / 180); // Convert bearing to radians
      const waypoint = computeDestinationPoint(startLocation, targetDistance / (numWaypoints), bearing);
      waypoints.push(waypoint);
    }
  
    // Ensure the waypoints loop back to the start
    // waypoints.push(startLocation);
    return waypoints;
}


function computeDestinationPoint(startLocation, distance, bearing) {
    const R = 6371e3; // Earth's radius in meters
    const lat1 = startLocation.lat * (Math.PI / 180);
    const lng1 = startLocation.lng * (Math.PI / 180);

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / R) +
        Math.cos(lat1) * Math.sin(distance / R) * Math.cos(bearing));
    const lng2 = lng1 + Math.atan2(Math.sin(bearing) * Math.sin(distance / R) * Math.cos(lat1),
        Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2));

    return {
        lat: lat2 * (180 / Math.PI),
        lng: lng2 * (180 / Math.PI)
    };
}

async function snapToRoads(waypoints) {
    console.log(waypoints)
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
        console.log(response.error)
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
