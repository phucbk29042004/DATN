/**
 * Authentication & Authorization Service (JWT + Role-Based Access Control)
 * Quản lý xác thực người dùng và phân quyền (Admin / Viewer).
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'logpulse_default_secret_key_change_in_prod';
const TOKEN_EXPIRES_IN = '24h';

// Danh sách tài khoản chuẩn demo đồ án (Mật khẩu được băm sẵn bằng bcrypt)
// admin123  -> $2a$10$7h1d7zFkH5f.3aJ1qM7nK.6kQ9xU8wZ2eR4tY6uI8oP0aS2dF4gH6
// viewer123 -> $2a$10$8j2e8aGlI6g.4bK2rN8oL.7lR0yV9xZ3fS5uZ7vJ9pQ1bT3eG5hI7
const USERS = [
  {
    id: 'usr_admin',
    username: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
    displayName: 'Quản Trị Viên (Admin)',
    role: 'admin'
  },
  {
    id: 'usr_viewer',
    username: 'viewer',
    passwordHash: bcrypt.hashSync('viewer123', 10),
    displayName: 'Giám Sát Viên (Viewer)',
    role: 'viewer'
  }
];

/**
 * Xác thực đăng nhập
 * @param {string} username 
 * @param {string} password 
 * @returns {Object} { token, user }
 */
export async function loginUser(username, password) {
  if (!username || !password) {
    throw new Error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
  }

  const user = USERS.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user) {
    throw new Error('Tài khoản không tồn tại trên hệ thống');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Mật khẩu không chính xác');
  }

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

  return {
    token,
    user: payload
  };
}

/**
 * Middleware xác thực JWT Token từ Header Authorization: Bearer <token>
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Yêu cầu đăng nhập để thực hiện thao tác này' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ' });
    }
    req.user = decodedUser;
    next();
  });
}

/**
 * Middleware yêu cầu quyền Admin
 */
export function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này (Chỉ dành cho Admin)' });
  });
}

/**
 * Middleware kiểm tra token tùy chọn (Optional Auth)
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
      if (!err) {
        req.user = decodedUser;
      }
      next();
    });
  } else {
    next();
  }
}

