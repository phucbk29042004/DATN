/**
 * Authentication & Authorization Service (JWT + Role-Based Access Control)
 * Quản lý xác thực người dùng và phân quyền (Admin / Viewer) tích hợp SQLite Database.
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import db, { ghiNhatKyHeThong } from '../database/sqlite.js';

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'logpulse_default_secret_key_change_in_prod';
if (!process.env.JWT_SECRET) {
  console.warn('[Auth Security Warning] JWT_SECRET chưa được cấu hình trong .env, đang dùng khóa mặc định phát triển.');
}
const TOKEN_EXPIRES_IN = '24h';

/**
 * Xác thực đăng nhập qua cơ sở dữ liệu SQLite (bảng nguoi_dung)
 * @param {string} username 
 * @param {string} password 
 * @param {string} [ipAddress]
 * @returns {Promise<Object>} { token, user }
 */
export async function loginUser(username, password, ipAddress = '') {
  if (!username || !password) {
    throw new Error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
  }

  const cleanUsername = username.trim();
  const stmt = db.prepare('SELECT * FROM nguoi_dung WHERE LOWER(ten_dang_nhap) = LOWER(?)');
  const user = stmt.get(cleanUsername);

  if (!user) {
    ghiNhatKyHeThong(cleanUsername, 'LOGIN_FAILED', 'Auth', { reason: 'Tài khoản không tồn tại' }, ipAddress);
    throw new Error('Tài khoản không tồn tại trên hệ thống');
  }

  const isMatch = await bcrypt.compare(password, user.mat_khau_hash);
  if (!isMatch) {
    ghiNhatKyHeThong(user.ten_dang_nhap, 'LOGIN_FAILED', 'Auth', { reason: 'Sai mật khẩu' }, ipAddress);
    throw new Error('Mật khẩu không chính xác');
  }

  // Cập nhật mốc thời gian đăng nhập gần nhất
  db.prepare('UPDATE nguoi_dung SET lan_cuoi_dang_nhap = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  ghiNhatKyHeThong(user.ten_dang_nhap, 'LOGIN_SUCCESS', 'Auth', { vai_tro: user.vai_tro }, ipAddress);

  const payload = {
    id: user.id,
    username: user.ten_dang_nhap,
    role: user.vai_tro,
    displayName: user.ten_hien_thi
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

  return {
    token,
    user: payload
  };
}

/**
 * Đổi mật khẩu người dùng trong SQLite
 * @param {string} userId 
 * @param {string} currentPassword 
 * @param {string} newPassword 
 */
export async function changePassword(userId, currentPassword, newPassword) {
  if (!userId || !currentPassword || !newPassword) {
    throw new Error('Vui lòng điền đầy đủ mật khẩu hiện tại và mật khẩu mới');
  }

  if (newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
  }

  const user = db.prepare('SELECT * FROM nguoi_dung WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('Không tìm thấy tài khoản người dùng');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.mat_khau_hash);
  if (!isMatch) {
    throw new Error('Mật khẩu hiện tại không chính xác');
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE nguoi_dung SET mat_khau_hash = ? WHERE id = ?').run(newHash, userId);

  ghiNhatKyHeThong(user.ten_dang_nhap, 'CHANGE_PASSWORD', 'Auth', { userId, status: 'SUCCESS' });
  return { success: true, message: 'Đổi mật khẩu thành công' };
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
