import express from 'express';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// ==================== Profile Routes ====================

// GET /me - User profile page
router.get('/me', userController.getProfilePage);

// POST /me/update-name - Update user name
router.post('/me/update-name', userController.updateName);

export default router;

