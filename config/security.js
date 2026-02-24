// config/security.js
export const CORS_OPTIONS = {
  origin: ['https://astro3d.ru', 'https://admin.astro3d.ru'],
  credentials: true
};

export const COOKIE_SETTINGS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000 // 24 часа
};