import { jwtVerify } from 'jose';
import * as User from '../models/User.js';

// JWT Secret
const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-3d');

// ==================== Render Pages ====================

export const getProfilePage = async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        req.flash('error', 'Сначала войдите в систему');
        return res.redirect('/login');
    }

    try {
        const { payload } = await jwtVerify(token, getSecret());
        
        // Get user from DB by email
        const user = User.getUserByEmail(payload.email);
        if (!user) {
            req.flash('error', 'Пользователь не найден');
            return res.redirect('/login');
        }
        
        // Get user profile
        const profile = User.getUserProfile(user.id);
        
        return res.render('user_profile', { user: payload, profile });
    } catch (e) {
        req.flash('error', 'Сессия истекла. Войдите заново');
        return res.redirect('/login');
    }
};

// ==================== Profile Actions ====================

export const updateName = async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        req.flash('error', 'Сначала войдите в систему');
        return res.redirect('/login');
    }

    try {
        const { payload } = await jwtVerify(token, getSecret());
        
        // Get user from DB by email
        const user = User.getUserByEmail(payload.email);
        if (!user) {
            req.flash('error', 'Пользователь не найден');
            return res.redirect('/login');
        }
        
        const { name } = req.body;
        User.updateUserProfile(user.id, name, null);
        
        req.flash('success', 'Имя успешно обновлено!');
        return res.redirect('/me');
    } catch (e) {
        req.flash('error', 'Ошибка при обновлении имени');
        return res.redirect('/me');
    }
};

