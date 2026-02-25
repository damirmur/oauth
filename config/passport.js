// config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as VkontakteStrategy } from 'passport-vkontakte';
import * as User from '../models/User.js';
import { OAUTH } from './oauth.js';

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
    try {
        const user = User.getUserById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// ==================== Google Strategy ====================
if (OAUTH.google.clientID && OAUTH.google.clientSecret) {
    passport.use(new GoogleStrategy({
        clientID: OAUTH.google.clientID,
        clientSecret: OAUTH.google.clientSecret,
        callbackURL: OAUTH.google.callbackURL
    }, (accessToken, refreshToken, profile, done) => {
        try {
            let user = User.getUserByGoogleId(profile.id);
            
            if (!user) {
                const email = profile.emails?.[0]?.value;
                const name = profile.displayName || profile.name?.givenName;
                const avatar = profile.photos?.[0]?.value;
                
                if (!email) {
                    return done(new Error('Google email not available'), null);
                }
                
                const userId = User.createOAuthUser(email, 'google', profile.id, name, avatar);
                user = User.getUserById(userId);
            }
            
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
}

// ==================== Facebook Strategy ====================
if (OAUTH.facebook.clientID && OAUTH.facebook.clientSecret) {
    passport.use(new FacebookStrategy({
        clientID: OAUTH.facebook.clientID,
        clientSecret: OAUTH.facebook.clientSecret,
        callbackURL: OAUTH.facebook.callbackURL,
        profileFields: ['id', 'displayName', 'emails', 'photos', 'name']
    }, (accessToken, refreshToken, profile, done) => {
        try {
            let user = User.getUserByFacebookId(profile.id);
            
            if (!user) {
                const email = profile.emails?.[0]?.value;
                const name = profile.displayName;
                const avatar = profile.photos?.[0]?.value;
                
                if (!email) {
                    return done(new Error('Facebook email not available'), null);
                }
                
                const userId = User.createOAuthUser(email, 'facebook', profile.id, name, avatar);
                user = User.getUserById(userId);
            }
            
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
}

// ==================== VK Strategy ====================
if (OAUTH.vk.clientID && OAUTH.vk.clientSecret) {
    passport.use(new VkontakteStrategy({
        clientID: OAUTH.vk.clientID,
        clientSecret: OAUTH.vk.clientSecret,
        callbackURL: OAUTH.vk.callbackURL,
        apiVersion: OAUTH.vk.apiVersion
    }, (accessToken, refreshToken, params, profile, done) => {
        try {
            let user = User.getUserByVkId(profile.id);
            
            if (!user) {
                const email = profile.emails?.[0]?.value;
                const name = profile.displayName;
                const avatar = profile.photos?.[0]?.value;
                
                // VK doesn't always provide email, create user if available
                const userId = User.createOAuthUser(email || `vk_${profile.id}@oauth.local`, 'vk', profile.id, name, avatar);
                user = User.getUserById(userId);
            }
            
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
}

export default passport;

