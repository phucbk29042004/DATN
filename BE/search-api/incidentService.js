/**
 * Incident Lifecycle Management Service
 * Quản lý vòng đời sự cố (NEW -> ACKNOWLEDGED -> RESOLVED),
 * ghi chú xử lý (Remediation Notes) và lưu trữ bền vững.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File lưu trữ trạng thái sự cố cục bộ
const INCIDENTS_FILE = path.resolve(__dirname, '../datasets/incident_states.json');

// In-memory Map: incidentId -> { status, acknowledgedBy, acknowledgedAt, resolvedBy, resolvedAt, notes: [] }
let incidentMap = new Map();

/**
 * Đọc dữ liệu sự cố từ file JSON khi khởi động
 */
function loadIncidentsFromFile() {
  try {
    if (fs.existsSync(INCIDENTS_FILE)) {
      const raw = fs.readFileSync(INCIDENTS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (typeof data === 'object' && data !== null) {
        incidentMap = new Map(Object.entries(data));
        console.log(`[Incident Service] Đã tải ${incidentMap.size} trạng thái sự cố từ file lưu trữ.`);
      }
    }
  } catch (err) {
    console.warn('[Incident Service] Không thể đọc file incident_states.json:', err.message);
  }
}

/**
 * Lưu trạng thái sự cố ra file JSON
 */
function saveIncidentsToFile() {
  try {
    const dir = path.dirname(INCIDENTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const obj = Object.fromEntries(incidentMap);
    fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Incident Service] Không thể lưu file incident_states.json:', err.message);
  }
}

// Khởi chạy load ban đầu
loadIncidentsFromFile();

/**
 * Lấy trạng thái của 1 sự cố
 * @param {string} id 
 */
export function getIncidentState(id) {
  if (!id) return null;
  return incidentMap.get(id) || {
    status: 'NEW',
    acknowledgedBy: null,
    acknowledgedAt: null,
    resolvedBy: null,
    resolvedAt: null,
    notes: []
  };
}

/**
 * Cập nhật trạng thái sự cố (ACKNOWLEDGED hoặc RESOLVED)
 * @param {string} id 
 * @param {'NEW' | 'ACKNOWLEDGED' | 'RESOLVED'} status 
 * @param {Object} user - { username, displayName }
 * @param {string} [noteText] 
 */
export function updateIncidentStatus(id, status, user = {}, noteText = '') {
  if (!id) throw new Error('Thiếu Incident ID');
  const validStatuses = ['NEW', 'ACKNOWLEDGED', 'RESOLVED'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Trạng thái không hợp lệ: ${status}`);
  }

  const current = getIncidentState(id);
  const now = new Date().toISOString();
  const userName = user.displayName || user.username || 'System Admin';

  const updated = {
    ...current,
    status,
    updatedAt: now
  };

  if (status === 'ACKNOWLEDGED') {
    updated.acknowledgedBy = userName;
    updated.acknowledgedAt = now;
  } else if (status === 'RESOLVED') {
    updated.resolvedBy = userName;
    updated.resolvedAt = now;
    if (!updated.acknowledgedBy) {
      updated.acknowledgedBy = userName;
      updated.acknowledgedAt = now;
    }
  }

  if (noteText && noteText.trim()) {
    updated.notes = [
      ...(updated.notes || []),
      {
        id: `note_${Date.now()}`,
        author: userName,
        text: noteText.trim(),
        createdAt: now
      }
    ];
  }

  incidentMap.set(id, updated);
  saveIncidentsToFile();

  return updated;
}

/**
 * Thêm ghi chú vào sự cố
 * @param {string} id 
 * @param {Object} user 
 * @param {string} noteText 
 */
export function addIncidentNote(id, user = {}, noteText = '') {
  if (!id) throw new Error('Thiếu Incident ID');
  if (!noteText || !noteText.trim()) {
    throw new Error('Nội dung ghi chú không được để trống');
  }

  const current = getIncidentState(id);
  const now = new Date().toISOString();
  const userName = user.displayName || user.username || 'System Operator';

  const newNote = {
    id: `note_${Date.now()}`,
    author: userName,
    text: noteText.trim(),
    createdAt: now
  };

  const updated = {
    ...current,
    notes: [...(current.notes || []), newNote],
    updatedAt: now
  };

  incidentMap.set(id, updated);
  saveIncidentsToFile();

  return newNote;
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
      acknowledged_by: incidentState.acknowledgedBy,
      acknowledged_at: incidentState.acknowledgedAt,
      resolved_by: incidentState.resolvedBy,
      resolved_at: incidentState.resolvedAt,
      incident_notes: incidentState.notes || []
    };
  });
}

