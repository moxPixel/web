import { Router } from 'express';
import mailController from '../controllers/mail.controller';

const router = Router();

router.post('/send', (req, res, next) => mailController.send(req, res, next));

export default router;

