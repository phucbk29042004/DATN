/**
 * SQLite Database Management Module for Enterprise SRE System
 * Lưu trữ dữ liệu quan hệ, RBAC, cấu hình, audit log và quản lý vòng đời sự cố.
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_PATH = process.env.SQLITE_DB_PATH
  ? path.resolve(process.env.SQLITE_DB_PATH)
  : path.resolve(DATA_DIR, 'sre_enterprise.sqlite');

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Tối ưu hóa hiệu năng và toàn vẹn dữ liệu
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Khởi tạo cấu trúc các bảng dữ liệu
 */
export function initDatabase() {
  const schema = `
    -- 1. Bảng người dùng và phân quyền (RBAC)
    CREATE TABLE IF NOT EXISTS nguoi_dung (
      id TEXT PRIMARY KEY,
      ten_dang_nhap TEXT UNIQUE NOT NULL,
      mat_khau_hash TEXT NOT NULL,
      ten_hien_thi TEXT NOT NULL,
      vai_tro TEXT NOT NULL DEFAULT 'viewer',
      ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
      lan_cuoi_dang_nhap DATETIME
    );

    -- 2. Bảng quản lý vòng đời sự cố (Incident Lifecycle)
    CREATE TABLE IF NOT EXISTS su_co (
      id TEXT PRIMARY KEY,
      trang_thai TEXT NOT NULL DEFAULT 'NEW',
      muc_do_uu_tien TEXT DEFAULT 'P2',
      nguyen_nhan_goc TEXT,
      bien_phap_xu_ly TEXT,
      nguoi_tiep_nhan TEXT,
      thoi_gian_tiep_nhan DATETIME,
      nguoi_xu_ly TEXT,
      thoi_gian_xu_ly DATETIME,
      ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Bảng nhật ký điều tra sự cố (Investigation Notes)
    CREATE TABLE IF NOT EXISTS ghi_chu_su_co (
      id TEXT PRIMARY KEY,
      su_co_id TEXT NOT NULL,
      tac_gia TEXT NOT NULL,
      vai_tro TEXT DEFAULT 'viewer',
      loai_ghi_chu TEXT DEFAULT 'NOTE',
      noi_dung TEXT NOT NULL,
      thoi_gian_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (su_co_id) REFERENCES su_co(id) ON DELETE CASCADE
    );

    -- 4. Bảng cấu hình hệ thống (Key-Value)
    CREATE TABLE IF NOT EXISTS cau_hinh_he_thong (
      khoa TEXT PRIMARY KEY,
      gia_tri TEXT NOT NULL,
      mo_ta TEXT,
      ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Bảng lịch bảo trì hệ thống (Maintenance Windows)
    CREATE TABLE IF NOT EXISTS lich_bao_tri (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kich_hoat INTEGER DEFAULT 0,
      ly_do TEXT,
      thoi_gian_bat_dau DATETIME,
      thoi_gian_ket_thuc DATETIME,
      nguoi_tao TEXT,
      ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Bảng nhật ký kiểm toán hệ thống (Audit Trail)
    CREATE TABLE IF NOT EXISTS nhat_ky_he_thong (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten_nguoi_dung TEXT,
      hanh_dong TEXT NOT NULL,
      doi_tuong TEXT,
      chi_tiet TEXT,
      dia_chi_ip TEXT,
      thoi_gian DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Bảng theo dõi lịch sử tác vụ nền (Cron Job History)
    CREATE TABLE IF NOT EXISTS lich_su_cron (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten_tac_vu TEXT NOT NULL,
      trang_thai TEXT NOT NULL,
      thoi_gian_chay DATETIME DEFAULT CURRENT_TIMESTAMP,
      thoi_luong_ms INTEGER,
      ket_qua TEXT
    );

    -- 8. Bảng tin nhắn nội bộ SRE (Admin <-> Viewer Chat)
    CREATE TABLE IF NOT EXISTS tin_nhan_noi_bo (
      id TEXT PRIMARY KEY,
      nguoi_gui TEXT NOT NULL,
      vai_tro TEXT NOT NULL DEFAULT 'viewer',
      ten_hien_thi TEXT NOT NULL,
      noi_dung TEXT NOT NULL,
      dinh_kem_log TEXT,
      thoi_gian DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 9. Bảng log dự phòng khi Collector / OpenSearch gián đoạn (Ingestion Fallback)
    CREATE TABLE IF NOT EXISTS log_du_phong (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      service TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      raw_payload TEXT,
      da_dong_bo INTEGER DEFAULT 0,
      thoi_gian_tao DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_su_co_trang_thai ON su_co(trang_thai);
    CREATE INDEX IF NOT EXISTS idx_ghi_chu_su_co ON ghi_chu_su_co(su_co_id);
    CREATE INDEX IF NOT EXISTS idx_nhat_ky_thoi_gian ON nhat_ky_he_thong(thoi_gian);
    CREATE INDEX IF NOT EXISTS idx_tin_nhan_thoi_gian ON tin_nhan_noi_bo(thoi_gian);
    CREATE INDEX IF NOT EXISTS idx_log_du_phong_sync ON log_du_phong(da_dong_bo, thoi_gian_tao);
  `;

  db.exec(schema);
  seedInitialData();
  migrateOldIncidentsFile();
}

/**
 * Khởi tạo dữ liệu người dùng và cấu hình mặc định nếu trống
 */
function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM nguoi_dung').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO nguoi_dung (id, ten_dang_nhap, mat_khau_hash, ten_hien_thi, vai_tro)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run(
      'usr_admin',
      'admin',
      bcrypt.hashSync('admin123', 10),
      'Quản Trị Viên (Admin)',
      'admin'
    );

    insertUser.run(
      'usr_viewer',
      'viewer',
      bcrypt.hashSync('viewer123', 10),
      'Giám Sát Viên (Viewer)',
      'viewer'
    );

    console.log('[SQLite] Đã tạo 2 tài khoản mặc định (admin/viewer).');
  }

  const configCount = db.prepare('SELECT COUNT(*) as count FROM cau_hinh_he_thong').get().count;
  if (configCount === 0) {
    const insertConfig = db.prepare(`
      INSERT OR REPLACE INTO cau_hinh_he_thong (khoa, gia_tri, mo_ta)
      VALUES (?, ?, ?)
    `);

    const envEmailEnabled = process.env.EMAIL_ALERT_ENABLED === 'true' ||
      Boolean(process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD && process.env.ADMIN_EMAIL);

    const defaultConfigs = [
      ['anomalyThreshold', '0.75', 'Ngưỡng điểm bất thường kích hoạt cảnh báo'],
      ['discordEnabled', process.env.DISCORD_ENABLED === 'false' ? 'false' : 'true', 'Bật / tắt kênh cảnh báo Discord Webhook'],
      ['discordWebhookUrl', process.env.DISCORD_WEBHOOK_URL || '', 'Webhook URL kênh cảnh báo Discord'],
      ['emailEnabled', envEmailEnabled ? 'true' : 'false', 'Bật / tắt gửi email cảnh báo qua SMTP'],
      ['smtpHost', process.env.SMTP_HOST || 'smtp.gmail.com', 'Máy chủ SMTP gửi mail'],
      ['smtpPort', process.env.SMTP_PORT || '587', 'Cổng SMTP'],
      ['smtpUser', process.env.SMTP_USERNAME || '', 'Tài khoản người dùng SMTP'],
      ['smtpPass', process.env.SMTP_PASSWORD || '', 'Mật khẩu ứng dụng SMTP'],
      ['receiverEmail', process.env.ADMIN_EMAIL || '', 'Email người nhận thông báo cảnh báo'],
      ['alertKeywords', JSON.stringify(['FATAL', 'Out of Memory', 'Connection refused', 'Database connection failed']), 'Từ khóa ưu tiên cảnh báo']
    ];

    const tx = db.transaction(() => {
      for (const [k, v, desc] of defaultConfigs) {
        insertConfig.run(k, v, desc);
      }
    });
    tx();
    console.log('[SQLite] Đã khởi tạo cấu hình hệ thống mặc định.');
  }
}

/**
 * Tự động di chuyển dữ liệu từ file incident_states.json cũ sang SQLite nếu có
 */
function migrateOldIncidentsFile() {
  try {
    const oldFile = path.resolve(__dirname, '../datasets/incident_states.json');
    if (!fs.existsSync(oldFile)) return;

    const raw = fs.readFileSync(oldFile, 'utf-8');
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return;

    const count = db.prepare('SELECT COUNT(*) as count FROM su_co').get().count;
    if (count > 0) return; // Đã có dữ liệu trong SQLite, không import lại

    const insertIncident = db.prepare(`
      INSERT OR REPLACE INTO su_co (
        id, trang_thai, muc_do_uu_tien, nguyen_nhan_goc, bien_phap_xu_ly,
        nguoi_tiep_nhan, thoi_gian_tiep_nhan, nguoi_xu_ly, thoi_gian_xu_ly, ngay_cap_nhat
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertNote = db.prepare(`
      INSERT OR REPLACE INTO ghi_chu_su_co (
        id, su_co_id, tac_gia, vai_tro, loai_ghi_chu, noi_dung, thoi_gian_tao
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const migrateTx = db.transaction(() => {
      for (const [id, item] of Object.entries(data)) {
        insertIncident.run(
          id,
          item.status || 'NEW',
          item.priority || 'P2',
          item.root_cause || null,
          item.action_taken || null,
          item.acknowledgedBy || null,
          item.acknowledgedAt || null,
          item.resolvedBy || null,
          item.resolvedAt || null,
          item.updatedAt || new Date().toISOString()
        );

        if (Array.isArray(item.notes)) {
          for (const note of item.notes) {
            insertNote.run(
              note.id || `note_${Date.now()}_${Math.random()}`,
              id,
              note.author || 'System',
              note.role || 'admin',
              note.type || 'NOTE',
              note.text || '',
              note.createdAt || new Date().toISOString()
            );
          }
        }
      }
    });

    migrateTx();
    console.log(`[SQLite] Đã di chuyển ${Object.keys(data).length} sự cố từ file JSON cũ sang SQLite.`);
  } catch (err) {
    console.warn('[SQLite] Không thể chuyển đổi file incident_states.json cũ:', err.message);
  }
}

/**
 * Ghi nhật ký kiểm toán hệ thống (Audit Trail)
 */
export function ghiNhatKyHeThong(tenNguoiDung, hanhDong, doiTuong = '', chiTiet = {}, diaChiIp = '') {
  try {
    const stmt = db.prepare(`
      INSERT INTO nhat_ky_he_thong (ten_nguoi_dung, hanh_dong, doi_tuong, chi_tiet, dia_chi_ip)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      tenNguoiDung || 'Anonymous',
      hanhDong,
      doiTuong,
      typeof chiTiet === 'string' ? chiTiet : JSON.stringify(chiTiet),
      diaChiIp
    );
  } catch (err) {
    console.error('[SQLite] Lỗi khi ghi nhật ký hệ thống:', err.message);
  }
}

/**
 * Ghi nhận lịch sử chạy Cron job
 */
export function ghiLichSuCron(tenTacVu, trangThai, thoiLuongMs = 0, ketQua = '') {
  try {
    const stmt = db.prepare(`
      INSERT INTO lich_su_cron (ten_tac_vu, trang_thai, thoi_luong_ms, ket_qua)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(
      tenTacVu,
      trangThai,
      thoiLuongMs,
      typeof ketQua === 'string' ? ketQua : JSON.stringify(ketQua)
    );
  } catch (err) {
    console.error('[SQLite] Lỗi khi ghi lịch sử cron:', err.message);
  }
}

/**
 * Lưu tin nhắn nội bộ SRE (Admin / Viewer)
 */
export function luuTinNhanNoiBo({ id, nguoiGui, vaiTro, tenHienThi, noiDung, dinhKemLog }) {
  try {
    const msgId = id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const stmt = db.prepare(`
      INSERT INTO tin_nhan_noi_bo (id, nguoi_gui, vai_tro, ten_hien_thi, noi_dung, dinh_kem_log)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      msgId,
      nguoiGui || 'anonymous',
      vaiTro || 'viewer',
      tenHienThi || 'Người dùng',
      noiDung,
      dinhKemLog ? (typeof dinhKemLog === 'string' ? dinhKemLog : JSON.stringify(dinhKemLog)) : null
    );
    return {
      id: msgId,
      nguoi_gui: nguoiGui,
      vai_tro: vaiTro,
      ten_hien_thi: tenHienThi,
      noi_dung: noiDung,
      dinh_kem_log: dinhKemLog,
      thoi_gian: new Date().toISOString()
    };
  } catch (err) {
    console.error('[SQLite] Lỗi khi lưu tin nhắn nội bộ:', err.message);
    return null;
  }
}

/**
 * Lấy danh sách tin nhắn nội bộ gần nhất (lấy N tin mới nhất, sắp xếp tăng dần để render chat)
 */
export function layDanhSachTinNhanNoiBo(limit = 50) {
  try {
    const rows = db.prepare(`
      SELECT id, nguoi_gui, vai_tro, ten_hien_thi, noi_dung, dinh_kem_log, thoi_gian FROM (
        SELECT rowid AS _rid, id, nguoi_gui, vai_tro, ten_hien_thi, noi_dung, dinh_kem_log, thoi_gian
        FROM tin_nhan_noi_bo
        ORDER BY thoi_gian DESC, rowid DESC
        LIMIT ?
      ) ORDER BY thoi_gian ASC, _rid ASC
    `).all(limit);

    return rows.map(r => ({
      ...r,
      dinh_kem_log: r.dinh_kem_log ? (() => { try { return JSON.parse(r.dinh_kem_log); } catch { return r.dinh_kem_log; } })() : null
    }));
  } catch (err) {
    console.error('[SQLite] Lỗi khi lấy tin nhắn nội bộ:', err.message);
    return [];
  }
}

/**
 * Lưu bản ghi log dự phòng vào SQLite khi Collector hoặc OpenSearch gián đoạn
 */
export function luuLogDuPhong(logEntry) {
  try {
    const logId = logEntry.id || logEntry.hash_id || `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    db.prepare(`
      INSERT OR IGNORE INTO log_du_phong (id, timestamp, service, level, message, raw_payload, da_dong_bo)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(
      logId,
      logEntry.timestamp || new Date().toISOString(),
      logEntry.service || logEntry.service_name || 'unknown',
      (logEntry.level || 'INFO').toUpperCase(),
      logEntry.message || '',
      JSON.stringify(logEntry)
    );
    return logId;
  } catch (err) {
    console.error('[SQLite] Lỗi lưu log dự phòng:', err.message);
    return null;
  }
}

export function layLogDuPhongChuaDongBo(limit = 100) {
  try {
    return db.prepare(`
      SELECT * FROM log_du_phong WHERE da_dong_bo = 0 ORDER BY thoi_gian_tao ASC LIMIT ?
    `).all(limit);
  } catch (err) {
    console.error('[SQLite] Lỗi đọc log dự phòng:', err.message);
    return [];
  }
}

export function danhDauLogDuPhongDaDongBo(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return 0;
  try {
    const stmt = db.prepare('UPDATE log_du_phong SET da_dong_bo = 1 WHERE id = ?');
    const tx = db.transaction((idList) => {
      for (const id of idList) stmt.run(id);
    });
    tx(ids);
    return ids.length;
  } catch (err) {
    console.error('[SQLite] Lỗi đánh dấu log dự phòng:', err.message);
    return 0;
  }
}

// Tự động khởi tạo ngay khi import module
initDatabase();

export default db;

