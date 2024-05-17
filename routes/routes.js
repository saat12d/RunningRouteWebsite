const express = require('express');
const router = express.Router();
const mapsService = require('../mapsHelper');

router.post('/', async (req, res) => {
    console.log('hit')

  const { address, distance } = req.body;
  try {
    const route = await mapsService.calculateRoute(address, distance);
    res.json(route);
  } catch (error) {
    res.status(500).send('Error calculating route');
  }
});

module.exports = router;