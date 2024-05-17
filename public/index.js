document.getElementById('route-form').addEventListener('submit', async function(event) {
    event.preventDefault();
  
    const address = document.getElementById('address').value;
    const distance = document.getElementById('distance').value;
  
    try {
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, distance }),
      });
  
      if (response.ok) {
        const routeData = await response.json();
        displayRoute(routeData);
        displayTotalDistance(routeData.total_distance);
      } else {
        alert('Error calculating route');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error calculating route');
    }
  });
  
  function displayRoute(route) {
    const map = new google.maps.Map(document.getElementById('map'), {
      zoom: 14,
      center: { lat: route.start_location.lat, lng: route.start_location.lng },
    });
  
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
  
    const directionsService = new google.maps.DirectionsService();
    const waypoints = route.waypoints.map(wp => ({
      location: new google.maps.LatLng(wp.location.lat, wp.location.lng),
      stopover: false
    }));
  
    directionsService.route({
      origin: new google.maps.LatLng(route.start_location.lat, route.start_location.lng),
      destination: new google.maps.LatLng(route.start_location.lat, route.start_location.lng),
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.WALKING,
      optimizeWaypoints: true
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(result);
      } else {
        console.error('Directions request failed due to ' + status);
      }
    });
  }
  
  function displayTotalDistance(distance) {
    const distanceInKm = (distance / 1000).toFixed(2);
    document.getElementById('total-distance').innerText = `Total Distance: ${distanceInKm} km`;
  }
  