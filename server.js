import express from 'express';
import flash from 'connect-flash';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';
import 'dotenv/config';
import { env } from 'node:process';
import argon2 from 'argon2';
import { SignJWT, jwtVerify } from 'jose';

import { APP } from './config/app.js';
import { PATHS } from './config/paths.js';
import { COOKIE_SETTINGS } from './config/security.js';
import * as db from './db.js'; // Импортируем наши методы

const app = express();
app.set('trust proxy', 1); // Доверяем прокси-серверу (Nginx)
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', PATHS.VIEWS);
const SECRET = new TextEncoder().encode(env.JWT_SECRET || 'super-secret-key-3d');
app.use(session({
    secret: SECRET,
    resave: false,
    saveUninitialized: true
}));
app.use(flash());
app.use((req, res, next) => {
    res.locals.flash_success = req.flash('success');
    res.locals.flash_error = req.flash('error');
    next();
});
app.use(express.static(PATHS.PUBLIC));


// 
app.get('/register', async (req, res) => {
    let user = null;
    const token = req.cookies.token;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, SECRET);
            user = payload;
        } catch (err) {
            // Токен невалидный
        }
    }

    if (user) {
        return res.redirect('/');
    }

    return res.render('register', { error: null, success: null });
});
//
app.get('/', async (req, res) => {
    let user = null;

    // Проверяем токен из куки
    const token = req.cookies.token;
    if (token) {
        try {
            const { payload } = await jwtVerify(token, SECRET);
            user = payload;
        } catch (err) {
            // Токен невалидный или просрочен — игнорируем
        }
    }

    // Рендерим шаблон с передачей user
    return res.render('index', { user });
});
// Регистрация: отправка ссылки
app.post('/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email.includes('@') || password.length < 6) {
        return res.status(400).send('Некорректный email или слишком короткий пароль');
    }
    const token = crypto.randomUUID();

    try {
        const hash = await argon2.hash(password);
        db.createUser(email, hash, token);

        const confirmLink = `${APP.HOST}/auth/confirm?token=${token}`;
        const mailCmd = `echo "Для подтверждения перейдите по ссылке: ${confirmLink}" | mail -s "Активация" -r admin@astro3d.ru ${APP.MAIL || email}`;
        exec(mailCmd, (error) => {
            if (error) console.error(`Ошибка отправки на ${email}:`, error);
        });
        res.send('Ссылка отправлена на почту!');
    } catch (e) {
        res.status(400).send('Email уже существует');
    }
});

// Подтверждение по ссылке
app.get('/auth/confirm', (req, res) => {
    const { token } = req.query;
    const user = db.getUserByToken(token);

    if (!user) return res.status(400).send('Ссылка невалидна');

    db.verifyUser(user.id);
    res.send('Почта подтверждена! <a href="/login">Войти</a>');
});

// Вход (Login)
// Страница входа
app.get('/login', async (req, res) => {
    let user = null;
    const token = req.cookies.token;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, SECRET);
            user = payload;
        } catch (err) {
            // Токен невалидный — игнорируем
        }
    }
    // Если пользователь уже авторизован — редирект на главную
    if (user) {
        req.flash('success', 'С возвращением!');
        res.redirect('/');
    } 
    res.render('login', { user: null }); 
});
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = db.getUserByEmail(email);

    if (user && await argon2.verify(user.password_hash, password)) {
        if (!user.is_verified) return res.status(403).send('Подтвердите почту!');

        // Генерация JWT
        const jwt = await new SignJWT({ email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(SECRET);

        // Сохранение токена в куки
        res.cookie('token', jwt, COOKIE_SETTINGS);

        return res.redirect('/');
    }
    res.status(401).send('Ошибка входа');
});
app.post('/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});
// Страница "Забыли пароль"
app.get('/forgot-password', async (req, res) => {
    let user = null;
    const token = req.cookies.token;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, SECRET);
            user = payload;
        } catch (err) {
            // Токен невалидный — игнорируем
        }
    }

    // Если пользователь уже авторизован — не нужно сбрасывать
    if (user) {
        return res.redirect('/');
    }

    return res.render('forgot-password');
});
app.post('/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = db.getUserByEmail(email);

    if (user) {
        const token = crypto.randomUUID();
        const expires = Date.now() + 3600000; // 1 час
        db.setResetToken(email, token, expires);

        const link = `${APP.HOST}/reset-password?token=${token}`;
        const mailCmd = `echo "Ссылка для сброса пароля: ${link}" | mail -s "Сброс пароля" -r admin@astro3d.ru ${APP.MAIL || email}`;
        exec(mailCmd, (error) => {
            if (error) console.error(`Ошибка отправки на ${email}:`, error);
        });
    }
    res.send('Если email есть в базе, ссылка отправлена.');
});
// Редирект с /reset-password на /auth/reset-password
app.get('/reset-password', (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).send('Токен не указан');

    return res.redirect(`/auth/reset-password?token=${token}`);
});
app.get('/auth/reset-password', (req, res) => {
    const { token } = req.query;
    const user = db.getUserByResetToken(token);
    if (!user) return res.status(400).send('Ссылка недействительна или истекла.');

    res.render('reset_password_form', { token }); // Создай простую форму с полем password
});
app.post('/auth/reset-password', async (req, res) => {
    const { token, password } = req.body;
    const user = db.getUserByResetToken(token);

    if (user) {
        const hash = await argon2.hash(password);
        db.updatePassword(user.id, hash);
        return res.send('Пароль успешно изменен! <a href="/login">Войти</a>');
    }
    res.status(400).send('Ошибка при сбросе.');
});
// ЗАЩИЩЕННЫЙ РОУТ (Пример авторизации)
app.get('/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send();

    try {
        const { payload } = await jwtVerify(token, SECRET);
        res.json({ user: payload });
    } catch (e) {
        res.status(403).json({ error: 'Токен протух' });
    }
});
const PORT = APP.PORT || env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`App running on host ${APP.HOST}`);
});
