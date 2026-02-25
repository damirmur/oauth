// config/oauth.js
import { APP } from './app.js';

export const OAUTH = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: `${APP.HOST}/auth/google/callback`
  },
  facebook: {
    clientID: process.env.FACEBOOK_APP_ID || '',
    clientSecret: process.env.FACEBOOK_APP_SECRET || '',
    callbackURL: `${APP.HOST}/auth/facebook/callback`
  },
  vk: {
    clientID: process.env.VK_APP_ID || '',
    clientSecret: process.env.VK_APP_SECRET || '',
    callbackURL: `${APP.HOST}/auth/vk/callback`,
    apiVersion: '5.131'
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || ''
  }
};

