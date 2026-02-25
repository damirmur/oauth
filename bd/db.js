
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('bd/auth.db');

// Инициализация таблицы roles
db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT UNIQUE NOT NULL
  )
`);

// Вставка ролей по умолчанию
const insertRole = db.prepare('INSERT OR IGNORE INTO roles (role) VALUES (?)');
insertRole.run('user');
insertRole.run('admin');
insertRole.run('moderator');

// Инициализация таблицы users
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

// Инициализация таблицы users_profile (подчиненная users)
db.exec(`
  CREATE TABLE IF NOT EXISTS users_profile (
    user_id INTEGER PRIMARY KEY,
    name TEXT,
    role_id INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
  )
`);

// Получение ID роли по имени
const getRoleIdByName = (roleName) => {
  const result = db.prepare('SELECT id FROM roles WHERE role = ?').get(roleName);
  return result ? result.id : null;
};

export const getUserByEmail = (email) => 
    db.prepare('SELECT * FROM users WHERE email = ?').get(email);

export const getUserByToken = (token) => 
    db.prepare('SELECT * FROM users WHERE token = ?').get(token);

export const createUser = (email, hash, token) => {
    const result = db.prepare('INSERT INTO users (email, password_hash, token) VALUES (?, ?, ?)').run(email, hash, token);
    const userId = result.lastInsertRowid;
    
    // Автоматически создаем профиль с ролью "user" (role_id = 1)
    const userRoleId = getRoleIdByName('user');
    db.prepare('INSERT INTO users_profile (user_id, name, role_id) VALUES (?, ?, ?)').run(userId, '', userRoleId);
    
    return result;
};

export const getUserProfile = (userId) => 
    db.prepare('SELECT up.*, r.role FROM users_profile up LEFT JOIN roles r ON up.role_id = r.id WHERE up.user_id = ?').get(userId);

export const updateUserProfile = (userId, name, roleId) => 
    db.prepare('UPDATE users_profile SET name = ? WHERE user_id = ?').run(name, userId);

export const getAllRoles = () => 
    db.prepare('SELECT * FROM roles').all();

export const verifyUser = (id) => 
    db.prepare('UPDATE users SET is_verified = 1, token = NULL WHERE id = ?').run(id);

export const setResetToken = (email, token, expires) => 
    db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?').run(token, expires, email);

export const getUserByResetToken = (token) => 
    db.prepare('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?').get(token, Date.now());

export const updatePassword = (id, hash) => 
    db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?').run(hash, id);

export default db;