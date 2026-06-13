const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public route to log and sync user login
router.post('/sync', authController.syncUser);

// Protected route to fetch operator audit logs
router.get('/logs', authMiddleware, authController.getLogs);

module.exports = router;
