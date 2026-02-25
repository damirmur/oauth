import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('bd/auth.db');

// ==================== Database Initialization ====================

// Initialize roles table
db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT UNIQUE NOT NULL
  )
`);

// Insert default roles
const insertRole = db.prepare('INSERT OR IGNORE INTO roles (role) VALUES (?)');
insertRole.run('user');
insertRole.run('admin');
insertRole.run('moderator');

// Initialize users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT,
    is_verified INTEGER DEFAULT 1,
    token TEXT,
    reset_token TEXT,
    reset_token_expires INTEGER,
    google_id TEXT UNIQUE,
    facebook_id TEXT UNIQUE,
    vk_id TEXT UNIQUE,
    telegram_id TEXT UNIQUE,
    oauth_provider TEXT,
    avatar_url TEXT
  )
`);

// Initialize users_profile table
db.exec(`
  CREATE TABLE IF NOT EXISTS users_profile (
    user_id INTEGER PRIMARY KEY,
    name TEXT,
    role_id INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
  )
`);

// Helper: Get role ID by name
const getRoleIdByName = (roleName) => {
  const result = db.prepare('SELECT id FROM roles WHERE role = ?').get(roleName);
  return result ? result.id : null;
};

// ==================== User Methods ====================

export const getUserByEmail = (email) => 
    db.prepare('SELECT * FROM users WHERE email = ?').get(email);

export const getUserById = (id) => 
    db.prepare('SELECT * FROM users WHERE id = ?').get(id);

export const getUserByToken = (token) => 
    db.prepare('SELECT * FROM users WHERE token = ?').get(token);

export const createUser = (email, hash, token) => {
    const result = db.prepare('INSERT INTO users (email, password_hash, token) VALUES (?, ?, ?)').run(email, hash, token);
    const userId = result.lastInsertRowid;
    
    // Auto-create profile with "user" role
    const userRoleId = getRoleIdByName('user');
    db.prepare('INSERT INTO users_profile (user_id, name, role_id) VALUES (?, ?, ?)').run(userId, '', userRoleId);
    
    return result;
};

export const verifyUser = (id) => 
    db.prepare('UPDATE users SET is_verified = 1, token = NULL WHERE id = ?').run(id);

export const setResetToken = (email, token, expires) => 
    db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?').run(token, expires, email);

export const getUserByResetToken = (token) => 
    db.prepare('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?').get(token, Date.now());

export const updatePassword = (id, hash) => 
    db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?').run(hash, id);

// ==================== OAuth Methods ====================

export const getUserByGoogleId = (googleId) => 
    db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);

export const getUserByFacebookId = (facebookId) => 
    db.prepare('SELECT * FROM users WHERE facebook_id = ?').get(facebookId);

export const getUserByVkId = (vkId) => 
    db.prepare('SELECT * FROM users WHERE vk_id = ?').get(vkId);

export const getUserByTelegramId = (telegramId) => 
    db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId);

export const createOAuthUser = (email, provider, providerId, name, avatarUrl) => {
    const result = db.prepare(
        `INSERT INTO users (email, ${provider}_id, oauth_provider, avatar_url, is_verified) 
         VALUES (?, ?, ?, ?, 1)`
    ).run(email, providerId, provider, avatarUrl);
    
    const userId = result.lastInsertRowid;
    
    // Auto-create profile with "user" role
    const userRoleId = getRoleIdByName('user');
    db.prepare('INSERT INTO users_profile (user_id, name, role_id) VALUES (?, ?, ?)').run(userId, name || '', userRoleId);
    
    return userId;
};

export const updateUserAvatar = (userId, avatarUrl) => 
    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, userId);

// ==================== Profile Methods ====================

export const getUserProfile = (userId) => 
    db.prepare('SELECT up.*, r.role FROM users_profile up LEFT JOIN roles r ON up.role_id = r.id WHERE up.user_id = ?').get(userId);

export const updateUserProfile = (userId, name, roleId) => 
    db.prepare('UPDATE users_profile SET name = ? WHERE user_id = ?').run(name, userId);

export const getAllRoles = () => 
    db.prepare('SELECT * FROM roles').all();

export default db;

