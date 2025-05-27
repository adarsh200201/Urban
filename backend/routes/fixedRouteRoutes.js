const express = require('express');
const router = express.Router();
const { 
  createFixedRoute, 
  getAllFixedRoutes, 
  getFixedRouteById, 
  updateFixedRoute, 
  deleteFixedRoute,
  checkFixedRoute 
} = require('../controllers/fixedRouteController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/check', checkFixedRoute);
router.get('/', getAllFixedRoutes);

// Admin only routes
router.post('/', protect, admin, createFixedRoute);
router.get('/:id', protect, admin, getFixedRouteById);
router.put('/:id', protect, admin, updateFixedRoute);
router.delete('/:id', protect, admin, deleteFixedRoute);

module.exports = router;
