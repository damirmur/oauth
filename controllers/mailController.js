import * as Mail from '../models/Mail.js';

// ==================== Render Pages ====================

export const getMailPage = (req, res) => {
    res.send(Mail.getHtmlTemplate(process.env.PORT || 3000));
};

// ==================== API Actions ====================

export const getEmails = async (req, res) => {
    res.json(await Mail.getEmails());
};

export const deleteEmail = (req, res) => {
    res.sendStatus(Mail.deleteEmail(req.params.id) ? 200 : 404);
};

