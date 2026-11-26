/**
 * Incident Lifecycle Management Service (Enterprise SRE SQLite Edition)
 * Quản lý vòng đời sự cố (NEW -> ACKNOWLEDGED -> RESOLVED),
 * ghi chú điều tra (Investigation Notes) và lưu trữ bền vững trong SQLite.
 */
import db, { ghiNhatKyHeThong } from '../database/sqlite.js';

const getIncidentStmt = db.prepare('SELECT * FROM su_co WHERE id = ?');
const getNotesStmt = db.prepare('SELECT * FROM ghi_chu_su_co WHERE su_co_id = ? ORDER BY thoi_gian_tao ASC');

/**
 * Lấy trạng thái của 1 sự cố từ SQLite
 * @param {string} id 
 */
export function getIncidentState(id) {
  if (!id) return null;

  const incident = getIncidentStmt.get(id);
  const notes = getNotesStmt.all(id) || [];

  const formattedNotes = notes.map(n => ({
    id: n.id,
    author: n.tac_gia,
    role: n.vai_tro,
    type: n.loai_ghi_chu,
    text: n.noi_dung,
    createdAt: n.thoi_gian_tao
  }));

  if (!incident) {
    return {
      status: 'NEW',
      priority: 'P2',
      root_cause: null,
      action_taken: null,
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolvedBy: null,
      resolvedAt: null,
      notes: formattedNotes
    };
  }

  return {
    status: incident.trang_thai,
    priority: incident.muc_do_uu_tien || 'P2',
    root_cause: incident.nguyen_nhan_goc,
    action_taken: incident.bien_phap_xu_ly,
    acknowledgedBy: incident.nguoi_tiep_nhan,
    acknowledgedAt: incident.thoi_gian_tiep_nhan,
    resolvedBy: incident.nguoi_xu_ly,
    resolvedAt: incident.thoi_gian_xu_ly,
    updatedAt: incident.ngay_cap_nhat,
    notes: formattedNotes
  };
}

/**
 * Cập nhật trạng thái sự cố (ACKNOWLEDGED hoặc RESOLVED) kèm metadata
 * @param {string} id 
 * @param {'NEW' | 'ACKNOWLEDGED' | 'RESOLVED'} status 
 * @param {Object} user - { username, displayName }
 * @param {string} [noteText] 
 * @param {Object} [meta] - { priority, root_cause, action_taken }
 */
export function updateIncidentStatus(id, status, user = {}, noteText = '', meta = {}) {
  if (!id) throw new Error('Thiếu Incident ID');
  const validStatuses = ['NEW', 'ACKNOWLEDGED', 'RESOLVED'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Trạng thái không hợp lệ: ${status}`);
  }

  const existing = getIncidentStmt.get(id);
  if (existing && existing.trang_thai === 'RESOLVED' && status === 'NEW') {
    throw new Error('Không thể chuyển ngược sự cố đã RESOLVED về trạng thái NEW');
  }

  const now = new Date().toISOString();
  const userName = user.displayName || user.username || 'System Admin';

  const priority = meta.priority || (existing ? existing.muc_do_uu_tien : 'P2');
  const root_cause = meta.root_cause !== undefined ? meta.root_cause : (existing ? existing.nguyen_nhan_goc : null);
  const action_taken = meta.action_taken !== undefined ? meta.action_taken : (existing ? existing.bien_phap_xu_ly : null);

  if (status === 'RESOLVED') {
    if (!root_cause || !String(root_cause).trim() || !action_taken || !String(action_taken).trim()) {
      throw new Error('Khi đóng sự cố (RESOLVED) bắt buộc phải nhập Nguyên nhân gốc (root_cause) và Biện pháp khắc phục (action_taken)');
    }
  }
  let acknowledgedBy = existing ? existing.nguoi_tiep_nhan : null;
  let acknowledgedAt = existing ? existing.thoi_gian_tiep_nhan : null;
  let resolvedBy = existing ? existing.nguoi_xu_ly : null;
  let resolvedAt = existing ? existing.thoi_gian_xu_ly : null;

  if (status === 'ACKNOWLEDGED') {
    acknowledgedBy = userName;
    acknowledgedAt = now;
  } else if (status === 'RESOLVED') {
    resolvedBy = userName;
    resolvedAt = now;
    if (!acknowledgedBy) {
      acknowledgedBy = userName;
      acknowledgedAt = now;
    }
  }

  const upsert = db.prepare(`
    INSERT INTO su_co (
      id, trang_thai, muc_do_uu_tien, nguyen_nhan_goc, bien_phap_xu_ly,
      nguoi_tiep_nhan, thoi_gian_tiep_nhan, nguoi_xu_ly, thoi_gian_xu_ly, ngay_cap_nhat
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      trang_thai = excluded.trang_thai,
      muc_do_uu_tien = excluded.muc_do_uu_tien,
      nguyen_nhan_goc = excluded.nguyen_nhan_goc,
      bien_phap_xu_ly = excluded.bien_phap_xu_ly,
      nguoi_tiep_nhan = excluded.nguoi_tiep_nhan,
      thoi_gian_tiep_nhan = excluded.thoi_gian_tiep_nhan,
      nguoi_xu_ly = excluded.nguoi_xu_ly,
      thoi_gian_xu_ly = excluded.thoi_gian_xu_ly,
      ngay_cap_nhat = excluded.ngay_cap_nhat
  `);

  upsert.run(id, status, priority, root_cause, action_taken, acknowledgedBy, acknowledgedAt, resolvedBy, resolvedAt, now);

  if (noteText && noteText.trim()) {
    const noteId = `note_${Date.now()}`;
    const noteType = status === 'RESOLVED' ? 'RESOLUTION' : 'NOTE';
    db.prepare(`
      INSERT INTO ghi_chu_su_co (id, su_co_id, tac_gia, vai_tro, loai_ghi_chu, noi_dung, thoi_gian_tao)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(noteId, id, userName, user.role || 'admin', noteType, noteText.trim(), now);
  }

  ghiNhatKyHeThong(userName, 'UPDATE_INCIDENT_STATUS', 'Incident', { id, status, priority });
  return getIncidentState(id);
}

/**
 * Thêm ghi chú vào sự cố (Hỗ trợ cả Admin và Viewer)
 * @param {string} id 
 * @param {Object} user 
 * @param {string} noteText 
 * @param {string} [noteType] - 'NOTE' | 'INVESTIGATION' | 'RESOLUTION'
 */
export function addIncidentNote(id, user = {}, noteText = '', noteType = 'NOTE') {
  if (!id) throw new Error('Thiếu Incident ID');
  if (!noteText || !noteText.trim()) {
    throw new Error('Nội dung ghi chú không được để trống');
  }

  const existing = getIncidentStmt.get(id);
  const now = new Date().toISOString();
  const userName = user.displayName || user.username || 'System Operator';
  const noteId = `note_${Date.now()}`;

  if (!existing) {
    db.prepare(`
      INSERT INTO su_co (id, trang_thai, ngay_cap_nhat)
      VALUES (?, ?, ?)
    `).run(id, 'NEW', now);
  } else {
    db.prepare('UPDATE su_co SET ngay_cap_nhat = ? WHERE id = ?').run(now, id);
  }

  db.prepare(`
    INSERT INTO ghi_chu_su_co (id, su_co_id, tac_gia, vai_tro, loai_ghi_chu, noi_dung, thoi_gian_tao)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(noteId, id, userName, user.role || 'viewer', noteType, noteText.trim(), now);

  ghiNhatKyHeThong(userName, 'ADD_INCIDENT_NOTE', 'Incident', { id, noteId, noteType });

  return {
    id: noteId,
    author: userName,
    role: user.role || 'viewer',
    type: noteType,
    text: noteText.trim(),
    createdAt: now
  };
}

/**
 * Gắn thêm thông tin vòng đời vào danh sách Anomaly từ OpenSearch
 * @param {Array<Object>} anomalies 
 */
export function enrichAnomaliesWithIncidentState(anomalies) {
  if (!Array.isArray(anomalies)) return [];

  return anomalies.map(item => {
    const key = item.id || item.hash_id || item._id;
    const incidentState = getIncidentState(key);

    return {
      ...item,
      incident_status: incidentState.status,
      incident_priority: incidentState.priority || 'P2',
      root_cause: incidentState.root_cause || null,
      action_taken: incidentState.action_taken || null,
      acknowledged_by: incidentState.acknowledgedBy,
      acknowledged_at: incidentState.acknowledgedAt,
      resolved_by: incidentState.resolvedBy,
      resolved_at: incidentState.resolvedAt,
      incident_notes: incidentState.notes || []
    };
  });
}
