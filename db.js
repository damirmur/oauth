
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('auth.db');

// Инициализация таблицы
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT,
    is_verified INTEGER DEFAULT 0,
    token TEXT,
    reset_token TEXT,
    reset_token_expires INTEGER
  )
`);

export const getUserByEmail = (email) => 
    db.prepare('SELECT * FROM users WHERE email = ?').get(email);

export const getUserByToken = (token) => 
    db.prepare('SELECT * FROM users WHERE token = ?').get(token);

export const createUser = (email, hash, token) => 
    db.prepare('INSERT INTO users (email, password_hash, token) VALUES (?, ?, ?)').run(email, hash, token);

export const verifyUser = (id) => 
    db.prepare('UPDATE users SET is_verified = 1, token = NULL WHERE id = ?').run(id);

export const setResetToken = (email, token, expires) => 
    db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?').run(token, expires, email);

export const getUserByResetToken = (token) => 
    db.prepare('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?').get(token, Date.now());

export const updatePassword = (id, hash) => 
    db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?').run(hash, id);

export default db;