import { jwtVerify } from 'jose';

/**
 * JWT Secret - should be imported from config
 */
const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-3d');

/**
 * Middleware to redirect already authenticated users
 * Use for pages like login, register where authenticated users shouldn't go
 */
export const guest = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return next();
    }

    try {
        const { payload } = await jwtVerify(token, getSecret());
        // User is authenticated, redirect to home
        req.flash('success', 'С возвращением!');
        return res.redirect('/');
    } catch (err) {
        // Token invalid, allow access
        return next();
    }
};

