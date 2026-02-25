import { jwtVerify } from 'jose';

/**
 * JWT Secret - should be imported from config
 */
const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-3d');

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const { payload } = await jwtVerify(token, getSecret());
        req.user = payload;
    } catch (err) {
        // Token invalid or expired - ignore
        req.user = null;
    }
    
    next();
};

/**
 * Middleware to require authentication
 * If not authenticated, redirect to login
 */
export const requireAuth = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        req.flash('error', 'Сначала войдите в систему');
        return res.redirect('/login');
    }

    try {
        const { payload } = await jwtVerify(token, getSecret());
        req.user = payload;
        return next();
    } catch (err) {
        req.flash('error', 'Сессия истекла. Войдите заново');
        return res.redirect('/login');
    }
};

/**
 * Helper to get current user (async)
 */
export const getCurrentUser = async (req) => {
    const token = req.cookies.token;
    if (!token) return null;
    
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload;
    } catch (err) {
        return null;
    }
};

