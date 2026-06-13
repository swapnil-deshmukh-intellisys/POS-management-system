import { Router } from 'express';
import { login, register, me, forgotPassword, verifyResetToken, resetPassword, googleLogin, resetPasswordDirect } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticateToken as any, me as any);

// Password Reset endpoints
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-token', verifyResetToken);
router.post('/reset-password', resetPassword);
router.post('/reset-password-direct', resetPasswordDirect);

// Google Sign-In endpoint
router.post('/google', googleLogin);

export default router;
