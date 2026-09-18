const express = require('express');
const router = express.Router();

// Placeholder OCM (Open Charge Map) routes
// Since we imported stations via JSON, this can be minimal

/**
 * GET /api/ocm/stations
 * Simple test endpoint
 */
router.get('/stations', (req, res) => {
  res.json({
    success: true,
    message: 'OCM endpoint ready',
    stations: [],
  });
});

/**
 * POST /api/ocm/import
 * Placeholder for bulk import (not needed since you imported via JSON)
 */
router.post('/import', (req, res) => {
  res.json({
    success: true,
    message: 'Import endpoint ready',
  });
});

module.exports = router;