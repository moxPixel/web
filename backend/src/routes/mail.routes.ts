import { Router } from 'express';
import mailController from '../controllers/mail.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin-only: email composer is a backoffice feature
router.post('/send', authenticate, requireAdmin, (req, res, next) => mailController.send(req, res, next));

export default router;

