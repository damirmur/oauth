import express from 'express';
import * as authController from '../controllers/authController.js';
import { guest } from '../middleware/guestMiddleware.js';

const router = express.Router();

// ==================== Page Routes ====================

// GET /register - Registration page
router.get('/register', guest, authController.getRegisterPage);

// GET /login - Login page  
router.get('/login', guest, authController.getLoginPage);

// GET /forgot-password - Forgot password page
router.get('/forgot-password', guest, authController.getForgotPasswordPage);

// GET /reset-password - Redirect to auth version
router.get('/reset-password', authController.resetPasswordRedirect);

// GET /auth/reset-password - Reset password form
router.get('/auth/reset-password', guest, authController.getResetPasswordPage);

// ==================== Auth Action Routes ====================

// POST /auth/register - Handle registration
router.post('/auth/register', authController.register);

// GET /auth/confirm - Confirm email
router.get('/auth/confirm', authController.confirmEmail);

// POST /auth/login - Handle login
router.post('/auth/login', authController.login);

// POST /auth/logout - Handle logout
router.post('/auth/logout', authController.logout);

// POST /auth/forgot-password - Handle forgot password
router.post('/auth/forgot-password', authController.forgotPassword);

// POST /auth/reset-password - Handle password reset
router.post('/auth/reset-password', authController.resetPassword);

export default router;

