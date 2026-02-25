import crypto from 'node:crypto';
import { exec } from 'node:child_process';
import argon2 from 'argon2';
import { SignJWT, jwtVerify } from 'jose';
import passport from 'passport';
import * as User from '../models/User.js';
import { APP } from '../config/app.js';
import { COOKIE_SETTINGS } from '../config/security.js';

// JWT Secret
const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-3d');

// ==================== Render Pages ====================

export const getRegisterPage = async (req, res) => {
    const user = await getCurrentUserFromRequest(req);
    if (user) {
        return res.redirect('/');
    }
    return res.render('register', { error: null, success: null });
};

export const getLoginPage = async (req, res) => {
    const user = await getCurrentUserFromRequest(req);
    if (user) {
        req.flash('success', 'С возвращением!');
        return res.redirect('/');
    }
    return res.render('login', { user: null });
};

export const getForgotPasswordPage = async (req, res) => {
    const user = await getCurrentUserFromRequest(req);
    if (user) {
        return res.redirect('/');
    }
    return res.render('forgot-password');
};

export const getResetPasswordPage = async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).send('Токен не указан');

    const user = User.getUserByResetToken(token);
    if (!user) return res.status(400).send('Ссылка недействительна или истекла.');

    return res.render('reset_password_form', { token });
};

// ==================== Auth Actions ====================

export const register = async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email.includes('@') || password.length < 6) {
        req.flash('error', 'Некорректный email или слишком короткий пароль');
        return res.redirect('/register');
    }

    try {
        const token = crypto.randomUUID();
        const hash = await argon2.hash(password);
        User.createUser(email, hash, token);

        // Send confirmation email
        const confirmLink = `${APP.HOST}/auth/confirm?token=${token}`;
        const mailCmd = `echo "Для подтверждения перейдите по ссылке: ${confirmLink}" | mail -s "Активация" -r admin@astro3d.ru ${APP.MAIL || email}`;
        
        exec(mailCmd, (error) => {
            if (error) console.error(`Ошибка отправки:`, error);
        });

        req.flash('success', 'Ссылка для активации отправлена на почту!');
        return res.redirect('/login');
    } catch (e) {
        req.flash('error', 'Этот Email уже зарегистрирован');
        return res.redirect('/register');
    }
};

export const confirmEmail = (req, res) => {
    const { token } = req.query;
    const user = User.getUserByToken(token);

    if (!user) {
        req.flash('error', 'Ссылка невалидна или устарела');
        return res.redirect('/login');
    }

    User.verifyUser(user.id);
    req.flash('success', 'Почта подтверждена! Теперь вы можете войти');
    return res.redirect('/login');
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    const user = User.getUserByEmail(email);

    if (user && await argon2.verify(user.password_hash, password)) {
        if (!user.is_verified) {
            req.flash('error', 'Подтвердите вашу почту!');
            return res.redirect('/login');
        }

        const jwt = await new SignJWT({ email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(getSecret());

        res.cookie('token', jwt, COOKIE_SETTINGS);
        req.flash('success', 'Вы успешно вошли!');
        return res.redirect('/');
    }

    req.flash('error', 'Неверный email или пароль');
    return res.redirect('/login');
};

export const logout = (req, res) => {
    res.clearCookie('token');
    req.flash('info', 'Вы вышли из системы');
    return res.redirect('/');
};

export const forgotPassword = (req, res) => {
    const { email } = req.body;
    const user = User.getUserByEmail(email);

    if (user) {
        const token = crypto.randomUUID();
        const expires = Date.now() + 3600000;
        User.setResetToken(email, token, expires);

        const link = `${APP.HOST}/reset-password?token=${token}`;
        const mailCmd = `echo "Ссылка для сброса пароля: ${link}" | mail -s "Сброс пароля" -r admin@astro3d.ru ${APP.MAIL || email}`;
        exec(mailCmd);
    }
    
    // Always show same message to not reveal email existence
    req.flash('info', 'Если email есть в базе, ссылка для сброса отправлена.');
    return res.redirect('/login');
};

export const resetPasswordRedirect = (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).send('Токен не указан');
    return res.redirect(`/auth/reset-password?token=${token}`);
};

export const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    const user = User.getUserByResetToken(token);

    if (user) {
        const hash = await argon2.hash(password);
        User.updatePassword(user.id, hash);
        req.flash('success', 'Пароль успешно изменен!');
        return res.redirect('/login');
    }
    
    req.flash('error', 'Ошибка при сбросе. Возможно, ссылка истекла.');
    return res.redirect('/forgot-password');
};

// ==================== OAuth Routes ====================

export const authGoogle = passport.authenticate('google', { scope: ['profile', 'email'] });

export const authGoogleCallback = async (req, res) => {
    const user = req.user;
    if (user) {
        const jwt = await new SignJWT({ email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(getSecret());
        res.cookie('token', jwt, COOKIE_SETTINGS);
        req.flash('success', 'Вы вошли через Google!');
        return res.redirect('/');
    }
    req.flash('error', 'Ошибка авторизации через Google');
    return res.redirect('/login');
};

export const authFacebook = passport.authenticate('facebook', { scope: ['email'] });

export const authFacebookCallback = async (req, res) => {
    const user = req.user;
    if (user) {
        const jwt = await new SignJWT({ email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(getSecret());
        res.cookie('token', jwt, COOKIE_SETTINGS);
        req.flash('success', 'Вы вошли через Facebook!');
        return res.redirect('/');
    }
    req.flash('error', 'Ошибка авторизации через Facebook');
    return res.redirect('/login');
};

export const authVk = passport.authenticate('vkontakte');

export const authVkCallback = async (req, res) => {
    const user = req.user;
    if (user) {
        const jwt = await new SignJWT({ email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(getSecret());
        res.cookie('token', jwt, COOKIE_SETTINGS);
        req.flash('success', 'Вы вошли через VK!');
        return res.redirect('/');
    }
    req.flash('error', 'Ошибка авторизации через VK');
    return res.redirect('/login');
};

// Telegram OAuth (via Telegram Login Widget)
export const authTelegram = async (req, res) => {
    const { id, first_name, last_name, photo_url, hash } = req.body;
    
    if (!id || !hash) {
        req.flash('error', 'Неверные данные от Telegram');
        return res.redirect('/login');
    }
    
    // In production, verify hash (telegram login widget data)
    // For now, we'll create/find user by telegram_id
    try {
        let user = User.getUserByTelegramId(String(id));
        
        if (!user) {
            const name = [first_name, last_name].filter(Boolean).join(' ');
            const email = `telegram_${id}@oauth.local`;
            const userId = User.createOAuthUser(email, 'telegram', String(id), name, photo_url);
            user = User.getUserById(userId);
        }
        
        const jwt = await new SignJWT({ email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(getSecret());
        res.cookie('token', jwt, COOKIE_SETTINGS);
        req.flash('success', 'Вы вошли через Telegram!');
        return res.redirect('/');
    } catch (err) {
        console.error('Telegram OAuth error:', err);
        req.flash('error', 'Ошибка авторизации через Telegram');
        return res.redirect('/login');
    }
};

// ==================== Helpers ====================

const getCurrentUserFromRequest = async (req) => {
    const token = req.cookies.token;
    if (!token) return null;
    
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload;
    } catch (err) {
        return null;
    }
};

