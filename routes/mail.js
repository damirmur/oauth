import express from 'express';
import * as mailController from '../controllers/mailController.js';

const router = express.Router();

// 1. Страница интерфейса
router.get('/mail', mailController.getMailPage);

// 2. API для данных
router.get('/api/mail/emails', mailController.getEmails);

// 3. API для удаления
router.delete('/api/mail/emails/delete/:id', mailController.deleteEmail);

export default router;

