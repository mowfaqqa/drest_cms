import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { authValidators } from '../validators/auth.validator';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', validateRequest(authValidators.login), authController.login);

// Protected routes
router.use(authMiddleware);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.put('/profile', validateRequest(authValidators.updateProfile), authController.updateProfile);
router.post('/change-password', validateRequest(authValidators.changePassword), authController.changePassword);
router.get('/sessions', authController.getSessions);
router.delete('/sessions/:sessionId', authController.revokeSession);
router.get('/validate', authController.validateToken);

export default router;