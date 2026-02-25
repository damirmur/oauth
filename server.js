import express from 'express';
import flash from 'connect-flash';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { jwtVerify } from 'jose';
import passport from 'passport';
import 'dotenv/config';
import { env } from 'node:process';

import { PATHS } from './config/paths.js';
import * as db from './bd/db.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import mailRouter from './routes/mail.js';
import './config/passport.js';

const app = express();

// JWT Secret
const SECRET = new TextEncoder().encode(env.JWT_SECRET || 'super-secret-key-3d');

// Middleware setup
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', PATHS.VIEWS);

app.use(session({
    secret: SECRET,
    resave: false,
    saveUninitialized: true
}));

app.use(flash());

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.flash_success = req.flash('success');
    res.locals.flash_error = req.flash('error');
    res.locals.flash_info = req.flash('info');
    next();
});

app.use(express.static(PATHS.PUBLIC));

// ==================== Routes ====================

// Mail routes
app.use(mailRouter);

// Auth routes (/login, /register, /forgot-password, /auth/*)
app.use(authRouter);

// User routes (/me, /me/update-name)
app.use(userRouter);

// Home page
app.get('/', async (req, res) => {
    let user = null;
    let profile = null;
    
    const token = req.cookies.token;
    if (token) {
        try {
            const { payload } = await jwtVerify(token, SECRET);
            user = payload;
            
            const dbUser = db.getUserByEmail(user.email);
            if (dbUser) {
                profile = db.getUserProfile(dbUser.id);
            }
        } catch (err) {
            // Token invalid or expired
        }
    }

    return res.render('index', { user, profile });
});

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`App running on host http://localhost:${PORT}`);
    console.log(`Mail running http://localhost:${PORT}/mail`);
});

