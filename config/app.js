// config/app.js
export const APP = {
  PORT: process.env.PORT || 3000,
  HOST:
    process.env.NODE_ENV === "production"
      ? "https://astro3d.ru"
      : `http://localhost:${process.env.PORT}`,
  MAIL:
    process.env.NODE_ENV === "production"
      ? ''
      : `${process.env.USER}@localhost`,
  API_PREFIX: '/api/v1',
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 минут
  RATE_LIMIT_MAX: 100,
  SESSION_TTL: 24 * 60 * 60, // 86400 секунд
  LOG_LEVEL: 'info'
};