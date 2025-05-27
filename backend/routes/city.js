const express = require('express');
const {
  getAllCities,
  getPopularCities,
  getCity,
  createCity,
  updateCity,
  deleteCity,
  getAllRoutes,
  getPopularRoutes,
  createRoute,
  getRouteBySourceAndDestination
} = require('../controllers/cityController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// City routes
router.get('/', getAllCities);
router.get('/popular', getPopularCities);
router.get('/:id', getCity);
router.post('/', protect, authorize('admin'), createCity);
router.put('/:id', protect, authorize('admin'), updateCity);
router.delete('/:id', protect, authorize('admin'), deleteCity);

// Route routes
router.get('/routes', getAllRoutes);
router.get('/routes/popular', getPopularRoutes);
router.post('/route', protect, authorize('admin'), createRoute);
router.get('/route/:sourceId/:destinationId', getRouteBySourceAndDestination);

module.exports = router;
