import express from 'express';
import * as mail from '../mail_dev/mail.js';

const router = express.Router();

// 1. Страница интерфейса
router.get('/mail', (req, res) => {
    res.send(mail.getHtmlTemplate(process.env.PORT || 3000));
});

// 2. API для данных
router.get('/api/mail/emails', async (req, res) => {
    res.json(await mail.getEmails());
});

// 3. API для удаления
router.delete('/api/mail/emails/delete/:id', (req, res) => {
    res.sendStatus(mail.deleteEmail(req.params.id) ? 200 : 404);
});

export default router;

