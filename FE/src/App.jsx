import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import * as XLSX from 'xlsx';
import {
  Activity, AlertTriangle, Database, Layers, Search,
  BarChart2, ShieldAlert, CheckCircle, Clock, Zap,
  Filter, Sun, Moon, Globe, Cpu, Menu, X,
  ChevronRight, TrendingUp, TrendingDown, RefreshCw, Calendar,
  Settings, Download, Send, FileText, Eye, Shield, LogIn, LogOut,
  BellOff, Plus, Trash2, Check, KeyRound, ListFilter,
  CheckCircle2, XCircle, AlertCircle, RotateCcw, HelpCircle, Play, FileSpreadsheet,
  BarChart3, CalendarClock, Server
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar, ComposedChart, Line, ReferenceLine
} from 'recharts';
import { translations, LEVEL_MAP } from './i18n.js';
import AiAssistant, { AiExplainButton } from './components/AiAssistant.jsx';
import LoginModal from './components/LoginModal.jsx';
import AdminSettingsModal from './components/AdminSettingsModal.jsx';
import PasswordChangeModal from './components/PasswordChangeModal.jsx';
import PipelineHealthWidget from './components/PipelineHealthWidget.jsx';
import IncidentNoteModal from './components/IncidentNoteModal.jsx';
import CustomDateTimePicker from './components/CustomDateTimePicker.jsx';
import TabHelpModal from './components/TabHelpModal.jsx';
import CronJobsModal from './components/CronJobsModal.jsx';

// ── Constants ─────────────────────────────────────────────────────────────────
const API_BASE = '/api/v1';
const SOCKET_URL = 'http://localhost:5000';
const LEVEL_COLORS = {
  INFO: '#3b82f6', WARN: '#f59e0b', ERROR: '#ef4444', FATAL: '#dc2626'
};

// ── Vietnamese DateTime Helpers ───────────────────────────────────────────────
function formatVnDateTime(timestamp) {
  if (!timestamp) return '—';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return String(timestamp);
  const dateStr = d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeStr = d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  return `${dateStr} ${timeStr}`;
}

function toLocalDatetimeInputString(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}


// ── Toast System ──────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">
            {t.type === 'success' ? (
              <CheckCircle2 size={16} style={{ color: '#10b981' }} />
            ) : t.type === 'error' ? (
              <XCircle size={16} style={{ color: '#ef4444' }} />
            ) : (
              <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
            )}
          </span>
          <span className="toast-message">{t.message}</span>
          <button className="toast-close" onClick={() => onRemove(t.id)} aria-label="Đóng thông báo">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, addToast, removeToast };
}

// ── Skeleton Loader ───────────────────────────────────────────────────────────
function Skeleton({ width = '100%', height = '1.2rem', style = {} }) {
  return <div className="skeleton" style={{ width, height, ...style }} />;
}

function KpiSkeleton() {
  return (
    <div className="kpi-grid">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="card kpi-card">
          <Skeleton height="0.9rem" width="60%" />
          <Skeleton height="2rem" width="50%" style={{ margin: '0.5rem 0' }} />
          <Skeleton height="0.8rem" width="70%" />
        </div>
      ))}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('vi');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [visibleRealtimeCount, setVisibleRealtimeCount] = useState(10);
  const { toasts, addToast, removeToast } = useToast();

  // ── Connection State ──
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socketRef = useRef(null);

  // ── Overview Data ──
  const [kpiStats, setKpiStats] = useState(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [levelDistribution, setLevelDistribution] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Log Table (Realtime via Socket.IO) ──
  const [realtimeLogs, setRealtimeLogs] = useState([]);
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');

  // ── Search Tab ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchLevel, setSearchLevel] = useState('ALL');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // ── Anomalies Tab ──
  const [anomalies, setAnomalies] = useState(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);

  // ── Anomaly Analytics Sub-Tab ──
  const [anomalySubTab, setAnomalySubTab] = useState('list');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('1h');
  const [analyticsServiceFilter, setAnalyticsServiceFilter] = useState('');
  const [analyticsLevelFilter, setAnalyticsLevelFilter] = useState('');

  // ── Templates Tab ──
  const [templates, setTemplates] = useState(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // ── Selected Log for Modal Inspection ──
  const [selectedLog, setSelectedLog] = useState(null);

  // ── Authentication & User State ──
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // Dọn dẹp dữ liệu lưu cũ ở localStorage để đảm bảo khi khởi động dự án luôn vào trang Login trước
      localStorage.removeItem('logpulse_auth_token');
      localStorage.removeItem('logpulse_auth_user');
      const token = sessionStorage.getItem('logpulse_auth_token');
      const saved = sessionStorage.getItem('logpulse_auth_user');
      if (token && saved) return JSON.parse(saved);
      return null;
    } catch {
      return null;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isSidebarAdminDropdownOpen, setIsSidebarAdminDropdownOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  const [isCronJobsModalOpen, setIsCronJobsModalOpen] = useState(false);
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  const adminDropdownRef = useRef(null);
  const sidebarAdminDropdownRef = useRef(null);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isGeneratingLogs, setIsGeneratingLogs] = useState(false);
  const [visibleAnomalyCount, setVisibleAnomalyCount] = useState(10);

  const [pipelineHealth, setPipelineHealth] = useState(null);
  const [pipelineHealthLoading, setPipelineHealthLoading] = useState(false);

  const fetchPipelineHealth = useCallback(async (showToast = false) => {
    setPipelineHealthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pipeline/health`);
      if (res.ok) {
        const json = await res.json();
        setPipelineHealth(json);
        if (showToast) {
          addToast(lang === 'vi' ? 'Đã cập nhật trạng thái pipeline thành công' : 'Pipeline status refreshed successfully', 'success');
        }
      } else {
        throw new Error('Không thể tải trạng thái pipeline');
      }
    } catch (err) {
      if (showToast) {
        addToast(err.message || 'Lỗi khi cập nhật trạng thái pipeline', 'error');
      }
    } finally {
      setPipelineHealthLoading(false);
    }
  }, [addToast, lang]);

  // ── Incident Lifecycle & Maintenance State ──
  const [anomalyStatusFilter, setAnomalyStatusFilter] = useState('ALL');
  const [noteModalAnomaly, setNoteModalAnomaly] = useState(null);
  const [maintenanceState, setMaintenanceState] = useState({ enabled: false, until: null, reason: '' });
  const [newKeywordInput, setNewKeywordInput] = useState('');

  const fetchMaintenance = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/alerts/maintenance`);
      if (res.ok) {
        const json = await res.json();
        setMaintenanceState(json);
      }
    } catch {
      // Backend offline
    }
  }, []);

  // Đóng dropdown admin khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(e.target)) {
        setIsAdminDropdownOpen(false);
      }
      if (sidebarAdminDropdownRef.current && !sidebarAdminDropdownRef.current.contains(e.target)) {
        setIsSidebarAdminDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleMaintenance = async (enabled, minutes = 30) => {
    if (currentUser?.role !== 'admin') {
      addToast('Chỉ Admin mới có quyền bật/tắt chế độ bảo trì', 'error');
      return;
    }
    const token = localStorage.getItem('logpulse_auth_token');
    try {
      const res = await fetch(`${API_BASE}/alerts/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ enabled, minutes, reason: 'Bảo trì hệ thống' })
      });
      const data = await res.json();
      if (res.ok) {
        setMaintenanceState(data.maintenance);
        addToast(enabled ? `Đã kích hoạt chế độ bảo trì (${minutes} phút)` : 'Đã tắt chế độ bảo trì', 'success');
      } else {
        throw new Error(data.error || 'Lỗi thao tác bảo trì');
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleUpdateAnomalyStatus = async (anomalyId, newStatus) => {
    const token = localStorage.getItem('logpulse_auth_token');
    try {
      const res = await fetch(`${API_BASE}/anomalies/${anomalyId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        // Cập nhật state anomalies cục bộ để UI nhảy ngay lập tức
        setAnomalies(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            anomalies: prev.anomalies.map(a => {
              if ((a.id || a.hash_id) === anomalyId) {
                return {
                  ...a,
                  incident_status: newStatus,
                  acknowledged_by: data.incident.acknowledgedBy,
                  resolved_by: data.incident.resolvedBy
                };
              }
              return a;
            })
          };
        });
        addToast(newStatus === 'RESOLVED' ? 'Đã đánh dấu xử lý xong sự cố' : 'Đã tiếp nhận sự cố', 'success');
      } else {
        throw new Error(data.error || 'Không thể cập nhật trạng thái');
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAddIncidentNote = async (anomalyId, noteText) => {
    const token = localStorage.getItem('logpulse_auth_token');
    try {
      const res = await fetch(`${API_BASE}/anomalies/${anomalyId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ note: noteText })
      });
      const data = await res.json();
      if (res.ok) {
        setAnomalies(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            anomalies: prev.anomalies.map(a => {
              if ((a.id || a.hash_id) === anomalyId) {
                const currentNotes = a.incident_notes || [];
                return { ...a, incident_notes: [...currentNotes, data.note] };
              }
              return a;
            })
          };
        });
        if (noteModalAnomaly && (noteModalAnomaly.id || noteModalAnomaly.hash_id) === anomalyId) {
          setNoteModalAnomaly(prev => ({
            ...prev,
            incident_notes: [...(prev.incident_notes || []), data.note]
          }));
        }
        addToast('Đã thêm ghi chú xử lý sự cố', 'success');
      } else {
        throw new Error(data.error || 'Không thể lưu ghi chú');
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('logpulse_auth_token');
    sessionStorage.removeItem('logpulse_auth_user');
    localStorage.removeItem('logpulse_auth_token');
    localStorage.removeItem('logpulse_auth_user');
    setCurrentUser(null);
    addToast('Đã đăng xuất tài khoản', 'info');
  };

  // ── System Configuration State (Multi-Channel Alerts, Digest & Retention) ──
  const [configState, setConfigState] = useState({
    anomalyThreshold: 0.5,
    discordEnabled: true,
    discordWebhookUrl: '',
    emailEnabled: false,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    receiverEmail: '',
    alertKeywords: ['FATAL', 'Out of Memory', 'Connection refused'],
    dailyDigestEnabled: true,
    retentionDays: 30,
    autoCleanupEnabled: true
  });
  const [isTriggeringDigest, setIsTriggeringDigest] = useState(false);
  const [isCleaningRetention, setIsCleaningRetention] = useState(false);

  const handleTriggerDailyDigest = async () => {
    setIsTriggeringDigest(true);
    try {
      const res = await fetch(`${API_BASE}/reports/digest/trigger`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Đã gửi báo cáo Daily Digest 24h thành công!', 'success');
      } else {
        throw new Error(data.error || 'Lỗi gửi báo cáo');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsTriggeringDigest(false);
    }
  };

  const handleRunRetentionCleanup = async () => {
    if (currentUser?.role !== 'admin') {
      addToast('Chỉ Admin mới có quyền dọn dẹp log lưu trữ', 'error');
      return;
    }
    const days = configState.retentionDays || 30;
    if (!window.confirm(`Bạn có chắc chắn muốn dọn dẹp tất cả các log cũ hơn ${days} ngày trên OpenSearch không?`)) {
      return;
    }

    setIsCleaningRetention(true);
    const token = localStorage.getItem('logpulse_auth_token');
    try {
      const res = await fetch(`${API_BASE}/storage/retention/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ days })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`Dọn dẹp thành công! Đã xóa ${data.deletedCount} log cũ hơn ${days} ngày.`, 'success');
      } else {
        throw new Error(data.error || 'Lỗi khi dọn dẹp log');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsCleaningRetention(false);
    }
  };

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/config`);
      if (res.ok) {
        const data = await res.json();
        setConfigState(data);
      }
    } catch {
      // Backend offline
    }
  }, []);

  const saveConfig = async () => {
    if (currentUser?.role === 'viewer') {
      addToast(t.viewerNotice || 'Tài khoản Viewer chỉ có quyền xem, không thể lưu cấu hình.', 'error');
      return;
    }
    const token = localStorage.getItem('logpulse_auth_token');
    try {
      const res = await fetch(`${API_BASE}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(configState)
      });
      if (res.ok) {
        addToast('Lưu cấu hình hệ thống thành công!', 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Lỗi server khi lưu cấu hình');
      }
    } catch (err) {
      addToast(err.message || 'Không thể lưu cấu hình — Server không phản hồi', 'error');
    }
  };

  const handleExportExcel = (type = 'anomalies') => {
    try {
      let data = [];
      let fileName = '';

      if (type === 'logs') {
        const logsToExport = (searchResults?.logs && searchResults.logs.length > 0)
          ? searchResults.logs
          : realtimeLogs;

        if (!logsToExport || logsToExport.length === 0) {
          addToast(lang === 'vi' ? 'Không có dữ liệu log để xuất Excel' : 'No logs to export to Excel', 'warn');
          return;
        }

        data = logsToExport.map(l => ({
          'Thời Gian': formatVnDateTime(l.timestamp),
          'Dịch Vụ': l.service_name || l.service || '—',
          'Mức Độ': l.level || 'INFO',
          'Nội Dung Log': l.message || '',
          'Điểm Bất Thường': l.anomaly_score ? `${(l.anomaly_score * 100).toFixed(0)}%` : '0%'
        }));
        fileName = `Bao_Cao_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`;
      } else {
        // Lọc theo trạng thái đang hiển thị (nếu không phải ALL thì chỉ xuất đúng filter)
        const allAnomalies = anomalies?.anomalies || [];
        const anomaliesToExport = anomalyStatusFilter === 'ALL'
          ? allAnomalies
          : allAnomalies.filter(a => (a.incident_status || 'NEW') === anomalyStatusFilter);
        if (anomaliesToExport.length === 0) {
          addToast(lang === 'vi' ? 'Không có sự cố bất thường để xuất Excel' : 'No anomalies to export to Excel', 'warn');
          return;
        }

        data = anomaliesToExport.map(a => ({
          'Thời Gian': formatVnDateTime(a.timestamp),
          'Dịch Vụ': a.service_name || a.service || '—',
          'Mức Độ': a.level || 'ERROR',
          'Thông Điệp': a.message || '',
          'Cơ Chế Phát Hiện': a.method || 'Rule/Drain',
          'Điểm Bất Thường': a.anomaly_score ? `${(a.anomaly_score * 100).toFixed(0)}%` : '100%',
          'Trạng Thái': a.incident_status === 'RESOLVED' ? 'Đã xử lý' : a.incident_status === 'ACKNOWLEDGED' ? 'Đã tiếp nhận' : 'Mới'
        }));
        fileName = `Bao_Cao_Anomalies_${new Date().toISOString().slice(0, 10)}.xlsx`;
      }

      const ws = XLSX.utils.json_to_sheet(data);

      // Tự động căn chỉnh độ rộng cột
      const colWidths = Object.keys(data[0] || {}).map(key => {
        const maxLen = Math.max(
          key.length,
          ...data.map(row => String(row[key] || '').length)
        );
        return { wch: Math.min(Math.max(maxLen + 3, 14), 70) };
      });
      ws['!cols'] = colWidths;

      // Bật tính năng Auto-Filter trên tất cả các cột
      if (data.length > 0) {
        const range = XLSX.utils.decode_range(ws['!ref']);
        ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Báo Cáo Log');
      XLSX.writeFile(wb, fileName);

      addToast(lang === 'vi' ? `Đã xuất thành công ${fileName}` : `Exported ${fileName} successfully`, 'success');
    } catch (err) {
      console.error('[Export Excel Error]:', err);
      addToast(lang === 'vi' ? 'Lỗi khi xuất file Excel' : 'Failed to export Excel', 'error');
    }
  };

  const handleExportCsv = (type = 'anomalies') => {
    handleExportExcel(type);
  };

  const handleGenerateSampleLogs = async () => {
    setIsGeneratingLogs(true);
    addToast(lang === 'vi' ? 'Đang phát sinh 35 log mẫu vào pipeline...' : 'Pumping 35 sample logs to pipeline...', 'info');
    try {
      const res = await fetch(`${API_BASE}/simulator/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 35 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi phát log');

      addToast(lang === 'vi' ? `Đã nạp thành công ${data.count} log mẫu vào hệ thống!` : `Pushed ${data.count} logs successfully!`, 'success');

      setTimeout(() => {
        fetchStats();
        fetchTemplates();
        fetchAnomalies();
      }, 1200);
    } catch (err) {
      console.error('[Generate Sample Logs Error]:', err);
      addToast(err.message || 'Không thể phát sinh log', 'error');
    } finally {
      setIsGeneratingLogs(false);
    }
  };

  const handleRefreshData = async (type) => {
    if (type === 'anomalies') {
      addToast(lang === 'vi' ? 'Đang cập nhật danh sách bất thường...' : 'Refreshing anomalies...', 'info');
      await fetchAnomalies();
      addToast(lang === 'vi' ? 'Đã làm mới danh sách bất thường' : 'Anomalies refreshed', 'success');
    } else if (type === 'templates') {
      addToast(lang === 'vi' ? 'Đang tải lại danh sách mẫu Drain...' : 'Refreshing Drain templates...', 'info');
      await fetchTemplates();
      addToast(lang === 'vi' ? 'Đã cập nhật danh sách mẫu Drain' : 'Drain templates refreshed', 'success');
    } else if (type === 'stats') {
      addToast(lang === 'vi' ? 'Đang cập nhật chỉ số hệ thống...' : 'Refreshing system stats...', 'info');
      await Promise.all([fetchKpiStats(), fetchStats()]);
      addToast(lang === 'vi' ? 'Đã cập nhật chỉ số mới nhất' : 'Stats refreshed', 'success');
    }
  };

  const t = translations[lang];
  const isVi = lang === 'vi';

  // ── Theme ──
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ── Socket.IO Connection ──────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsSocketConnected(true);
      addToast('Kết nối realtime thành công', 'success');
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
      addToast('Mất kết nối realtime', 'error');
    });

    socket.on('connect_error', () => {
      setIsSocketConnected(false);
    });

    // Nhận buffer log khi mới kết nối
    socket.on('log_buffer', (logs) => {
      if (Array.isArray(logs) && logs.length > 0) {
        setRealtimeLogs(logs);
      } else {
        // Tự động nạp log gần nhất từ OpenSearch khi buffer rỗng
        fetch(`${API_BASE}/logs/search?size=50`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.logs?.length > 0) {
              setRealtimeLogs(data.logs);
            }
          })
          .catch(() => {});
      }
    });

    // Nhận log mới realtime
    socket.on('new_log', (log) => {
      setRealtimeLogs(prev => [log, ...prev].slice(0, 200));
    });

    return () => socket.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Luôn nạp trước 50 log gần nhất từ OpenSearch ngay khi vừa vào trang
  useEffect(() => {
    fetch(`${API_BASE}/logs/search?size=50`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.logs?.length > 0) {
          setRealtimeLogs(prev => prev.length === 0 ? data.logs : prev);
        }
      })
      .catch(() => {});
  }, []);

  // ── Fetch KPI Stats ──────────────────────────────────────────────────────
  const fetchKpiStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/stats/kpi`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setKpiStats(data);
    } catch {
      // Backend offline — giữ null state, hiển thị skeleton
    } finally {
      setKpiLoading(false);
    }
  }, []);

  // ── Fetch Stats (chart data) ─────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const from = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      const res = await fetch(`${API_BASE}/logs/stats?from=${from}&to=${to}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Time series for AreaChart
      setTimeSeriesData(data.over_time || []);

      // Level distribution for PieChart
      const levelMap = data.by_level || [];
      setLevelDistribution(levelMap.map(l => ({
        name: l.level,
        value: l.count,
        color: LEVEL_COLORS[l.level] || '#6b7280'
      })));
    } catch {
      // Backend offline — giữ empty arrays
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Initial load + periodic refresh KPI ─────────────────────────────────
  useEffect(() => {
    fetchKpiStats();
    fetchStats();
    fetchMaintenance();
    const interval = setInterval(() => {
      fetchKpiStats();
      fetchStats();
      fetchMaintenance();
    }, 15000); // Refresh mỗi 15s
    return () => clearInterval(interval);
  }, [fetchKpiStats, fetchStats, fetchMaintenance]);

  // ── Fetch Anomalies (khi chuyển tab) ────────────────────────────────────
  const fetchAnomalies = useCallback(async () => {
    setAnomalyLoading(true);
    try {
      const from = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      const res = await fetch(`${API_BASE}/anomalies?from=${from}&to=${to}&threshold=0.5&size=50`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnomalies(data);
    } catch (err) {
      addToast('Không thể tải dữ liệu anomaly', 'error');
      setAnomalies({ total: 0, anomalies: [] });
    } finally {
      setAnomalyLoading(false);
    }
  }, [addToast]);

  // ── Fetch Analytics (cho sub-tab charts) ─────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const rangeMap = { '1h': 3600000, '6h': 21600000, '24h': 86400000, '7d': 604800000 };
      const ms = rangeMap[analyticsTimeRange] || 3600000;
      const from = new Date(Date.now() - ms).toISOString();
      const to = new Date().toISOString();
      let url = `${API_BASE}/anomalies/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      if (analyticsServiceFilter) url += `&service=${encodeURIComponent(analyticsServiceFilter)}`;
      if (analyticsLevelFilter) url += `&level=${encodeURIComponent(analyticsLevelFilter)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.warn('[Analytics fetch error]:', err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsTimeRange, analyticsServiceFilter, analyticsLevelFilter]);

  useEffect(() => {
    if (activeTab === 'anomalies' && anomalySubTab === 'charts') {
      fetchAnalytics();
    }
  }, [activeTab, anomalySubTab, fetchAnalytics]);

  // ── Fetch Templates (khi chuyển tab) ────────────────────────────────────
  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/templates?size=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      addToast('Không thể tải Drain templates', 'error');
      setTemplates({ total: 0, templates: [] });
    } finally {
      setTemplatesLoading(false);
    }
  }, [addToast]);

  // ── Search Tab: Execute Search (Support Infinite Scroll / Load More) ──────
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreSearch, setHasMoreSearch] = useState(false);

  const handleSearch = useCallback(async (isLoadMore = false) => {
    setSearchLoading(true);
    const nextPage = isLoadMore ? searchPage + 1 : 1;
    if (!isLoadMore) {
      setSearchResults(null);
      setSearchPage(1);
    }
    try {
      const params = new URLSearchParams({ size: 10, page: nextPage });
      if (searchQuery) params.set('q', searchQuery);
      if (searchLevel !== 'ALL') params.set('level', searchLevel);
      if (searchFrom) params.set('from', new Date(searchFrom).toISOString());
      if (searchTo) params.set('to', new Date(searchTo).toISOString());

      const res = await fetch(`${API_BASE}/logs/search?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (isLoadMore && searchResults) {
        setSearchResults(prev => ({
          ...data,
          logs: [...prev.logs, ...data.logs]
        }));
      } else {
        setSearchResults(data);
      }
      setSearchPage(nextPage);
      setHasMoreSearch(data.logs.length === 10 && (nextPage * 10) < data.total);
      if (!isLoadMore) {
        addToast(`Tìm thấy ${data.total.toLocaleString()} kết quả`, 'success');
      }
    } catch (err) {
      addToast('Tìm kiếm thất bại — Backend chưa sẵn sàng', 'error');
      if (!isLoadMore) setSearchResults({ total: 0, logs: [] });
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, searchLevel, searchFrom, searchTo, searchPage, searchResults, addToast]);

  useEffect(() => {
    if (activeTab === 'anomalies' && anomalies === null) fetchAnomalies();
    if (activeTab === 'templates' && templates === null) fetchTemplates();
    if (activeTab === 'search' && searchResults === null) handleSearch(false);
    if (activeTab === 'pipeline') fetchPipelineHealth();
    if (activeTab === 'settings') fetchConfig();
  }, [activeTab, anomalies, templates, searchResults, fetchAnomalies, fetchTemplates, handleSearch, fetchPipelineHealth, fetchConfig]);

  // ── Filtered Logs (Table) ────────────────────────────────────────────────
  const filteredLogs = realtimeLogs.filter(log => {
    const msg = (log.message || '').toLowerCase();
    const svc = (log.service || log.service_name || '').toLowerCase();
    const q = tableSearchQuery.toLowerCase();
    const matchSearch = !q || msg.includes(q) || svc.includes(q);
    const matchLevel = levelFilter === 'ALL' || log.level === levelFilter;
    return matchSearch && matchLevel;
  });

  const navItems = [
    { id: 'overview', icon: Activity, label: t.navOverview },
    { id: 'anomalies', icon: AlertTriangle, label: t.navAnomalies },
    { id: 'search', icon: Search, label: t.navSearch },
    { id: 'templates', icon: Layers, label: t.navTemplates },
    { id: 'pipeline', icon: Cpu, label: isVi ? 'Sức Khỏe Pipeline' : 'Pipeline Health' },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  // ── Auth Gate: Bắt buộc đăng nhập trước khi vào Dashboard ──
  if (!currentUser) {
    return (
      <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <LoginModal
          isOpen={true}
          onClose={() => {}}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            addToast(`Đăng nhập thành công! Xin chào ${user.displayName}`, 'success');
          }}
          lang={lang}
        />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* Navigation Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="brand">
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            title={isSidebarCollapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
            aria-label="Thu gọn thanh menu"
          >
            <Menu size={18} />
          </button>
          {!isSidebarCollapsed && (
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: '0.96rem', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                {t.brand}
              </span>
            </div>
          )}
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={18} />
          </button>
        </div>

        <ul className="nav-menu" role="navigation" aria-label="Menu chính">
          {navItems.map(({ id, icon: Icon, label }) => (
            <li
              key={id}
              className={`nav-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => handleNavClick(id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleNavClick(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              data-tooltip={label}
              title={isSidebarCollapsed ? label : undefined}
            >
              <Icon size={18} />
              {!isSidebarCollapsed && <span>{label}</span>}
              {!isSidebarCollapsed && activeTab === id && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </li>
          ))}
        </ul>

        {/* Sidebar Footer — Admin Button & Dropdown */}
        {currentUser && (
          <div className="sidebar-footer" style={{ position: 'relative' }} ref={sidebarAdminDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSidebarAdminDropdownOpen(prev => !prev)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: isSidebarCollapsed ? '0.6rem 0' : '0.6rem 0.75rem',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                background: isSidebarAdminDropdownOpen ? 'var(--bg-card)' : 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.84rem',
                fontWeight: 500,
                transition: 'background-color 0.18s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
              onMouseLeave={e => {
                if (!isSidebarAdminDropdownOpen) e.currentTarget.style.background = 'transparent';
              }}
              title={isSidebarCollapsed ? (currentUser.displayName || currentUser.username) : undefined}
              data-tooltip={currentUser.displayName || currentUser.username}
            >
              <Shield size={16} color={currentUser.role === 'admin' ? 'var(--accent-primary)' : '#38bdf8'} />
              {!isSidebarCollapsed && (
                <>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                    {currentUser.role === 'admin' ? (t.roleAdmin || 'Admin') : (t.roleViewer || 'Viewer')}
                  </span>
                  <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0, transform: isSidebarAdminDropdownOpen ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }} />
                </>
              )}
            </button>

            {/* Sidebar Admin Dropdown Menu */}
            {isSidebarAdminDropdownOpen && (
              <div style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: isSidebarCollapsed ? '72px' : 0,
                width: isSidebarCollapsed ? '220px' : '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.25)',
                padding: '0.5rem',
                zIndex: 1000,
                backdropFilter: 'blur(12px)',
                animation: 'modalFadeIn 0.15s ease'
              }}>
                {/* User Info Header */}
                <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color-subtle)', marginBottom: '0.35rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>{currentUser.displayName}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    @{currentUser.username} · <span style={{ textTransform: 'uppercase', color: currentUser.role === 'admin' ? '#818cf8' : '#38bdf8', fontWeight: 600 }}>{currentUser.role}</span>
                  </div>
                </div>

                {/* Đổi mật khẩu */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarAdminDropdownOpen(false);
                    setIsPasswordChangeOpen(true);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    background: 'none',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <KeyRound size={14} color="var(--accent-primary)" />
                  Đổi Mật Khẩu
                </button>

                {/* Sức Khỏe Pipeline */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarAdminDropdownOpen(false);
                    setIsHealthModalOpen(true);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    background: 'none',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Activity size={14} color="#06b6d4" />
                  {t.btnPipelineHealth || 'Sức Khỏe Pipeline'}
                </button>

                {/* Cấu hình & Báo cáo (Cho Admin) */}
                {currentUser.role === 'admin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSidebarAdminDropdownOpen(false);
                        setIsCronJobsModalOpen(true);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem 0.75rem',
                        background: 'none',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <CalendarClock size={14} color="#f59e0b" />
                      Quản Lý Cron Job
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSidebarAdminDropdownOpen(false);
                        setIsAdminSettingsOpen(true);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem 0.75rem',
                        background: 'none',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Settings size={14} color="var(--accent-primary)" />
                      Cấu Hình & Báo Cáo
                    </button>
                  </>
                )}

                {/* Đăng xuất */}
                <div style={{ borderTop: '1px solid var(--border-color-subtle)', marginTop: '0.35rem', paddingTop: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarAdminDropdownOpen(false);
                      handleLogout();
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      background: 'none',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ef4444',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      fontWeight: 600,
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <LogOut size={14} color="#ef4444" />
                    {t.btnLogout || 'Đăng Xuất'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Mở menu"
              aria-expanded={sidebarOpen}
            >
              <Menu size={22} />
            </button>
            <h1 className="page-title">
              {activeTab === 'overview' && t.headerTitleOverview}
              {activeTab === 'anomalies' && t.headerTitleAnomalies}
              {activeTab === 'search' && t.headerTitleSearch}
              {activeTab === 'templates' && t.headerTitleTemplates}
              {activeTab === 'pipeline' && (isVi ? 'Sức Khỏe Pipeline & Hạ Tầng Xử Lý' : 'Pipeline Health & Metrics')}
            </h1>
            <button
              type="button"
              className="tab-help-icon-btn"
              onClick={() => setIsHelpModalOpen(true)}
              title={lang === 'vi' ? 'Xem hướng dẫn & nghiệp vụ mục này' : 'View documentation for this section'}
              aria-label="Hướng dẫn mục này"
            >
              <HelpCircle size={15} />
            </button>
          </div>

          <div className="header-actions">
            <div className="live-badge" style={{
              background: isSocketConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              borderColor: isSocketConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
              color: isSocketConnected ? '#10b981' : '#f59e0b'
            }}>
              <span className="pulse-dot" style={{ backgroundColor: isSocketConnected ? '#10b981' : '#f59e0b' }} />
              {isSocketConnected ? (lang === 'vi' ? 'Trực tuyến' : 'Online') : (lang === 'vi' ? 'Ngoại tuyến' : 'Offline')}
            </div>

            <div className="controls-group">
              {/* Theme & Lang toggles */}
              <button className="toggle-btn" onClick={() => setTheme(p => p === 'dark' ? 'light' : 'dark')} title="Chuyển chế độ giao diện" aria-label="Chuyển theme">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                <span className="btn-text">{theme === 'dark' ? t.themeLight : t.themeDark}</span>
              </button>
              <button className="toggle-btn" onClick={() => setLang(p => p === 'vi' ? 'en' : 'vi')} title="Chuyển ngôn ngữ" aria-label="Chuyển ngôn ngữ">
                <Globe size={16} />
                <span className="btn-text">{lang === 'vi' ? 'EN' : 'VN'}</span>
              </button>

              {/* User Profile & Admin Dropdown */}
              {currentUser && (
                <div style={{ position: 'relative' }} ref={adminDropdownRef}>
                  <button
                    className="toggle-btn header-admin-btn"
                    onClick={() => setIsAdminDropdownOpen(prev => !prev)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}
                    title={`Đang đăng nhập: ${currentUser.displayName} (${currentUser.role})`}
                  >
                    <Shield size={14} color={currentUser.role === 'admin' ? 'var(--accent-primary)' : '#38bdf8'} />
                    <span>{currentUser.role === 'admin' ? (t.roleAdmin || 'Admin') : (t.roleViewer || 'Viewer')}</span>
                    <ChevronRight size={12} style={{ transform: isAdminDropdownOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s', color: 'var(--text-muted)' }} />
                  </button>

                  {isAdminDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      minWidth: '220px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                      padding: '0.5rem',
                      zIndex: 1000,
                      backdropFilter: 'blur(12px)',
                      animation: 'modalFadeIn 0.15s ease'
                    }}>
                      {/* User Info Header */}
                      <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid var(--border-color-subtle)', marginBottom: '0.35rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>{currentUser.displayName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          @{currentUser.username} · <span style={{ textTransform: 'uppercase', color: currentUser.role === 'admin' ? '#818cf8' : '#38bdf8', fontWeight: 600 }}>{currentUser.role}</span>
                        </div>
                      </div>

                      {/* Đổi mật khẩu */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminDropdownOpen(false);
                          setIsPasswordChangeOpen(true);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.55rem 0.8rem',
                          background: 'none',
                          border: 'none',
                          borderRadius: '10px',
                          color: 'var(--text-primary)',
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <KeyRound size={15} color="var(--accent-primary)" />
                        Đổi Mật Khẩu
                      </button>

                      {/* Sức Khỏe Pipeline */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminDropdownOpen(false);
                          setIsHealthModalOpen(true);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.55rem 0.8rem',
                          background: 'none',
                          border: 'none',
                          borderRadius: '10px',
                          color: 'var(--text-primary)',
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <Activity size={15} color="#06b6d4" />
                        {t.btnPipelineHealth || 'Sức Khỏe Pipeline'}
                      </button>

                      {/* Cấu hình & Báo cáo (Cho Admin) */}
                      {currentUser.role === 'admin' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAdminDropdownOpen(false);
                              setIsCronJobsModalOpen(true);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.55rem 0.8rem',
                              background: 'none',
                              border: 'none',
                              borderRadius: '10px',
                              color: 'var(--text-primary)',
                              fontSize: '0.84rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <CalendarClock size={15} color="#f59e0b" />
                            Quản Lý Cron Job
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsAdminDropdownOpen(false);
                              setIsAdminSettingsOpen(true);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.55rem 0.8rem',
                              background: 'none',
                              border: 'none',
                              borderRadius: '10px',
                              color: 'var(--text-primary)',
                              fontSize: '0.84rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <Settings size={15} color="var(--accent-primary)" />
                            Cấu Hình & Báo Cáo
                          </button>
                        </>
                      )}

                      {/* Đăng xuất */}
                      <div style={{ borderTop: '1px solid var(--border-color-subtle)', marginTop: '0.35rem', paddingTop: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAdminDropdownOpen(false);
                            handleLogout();
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.55rem 0.8rem',
                            background: 'none',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#f87171',
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <LogOut size={15} />
                          Đăng Xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Maintenance Mode Banner */}
        {maintenanceState?.enabled && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(245,158,11,0.18), rgba(245,158,11,0.08))',
            borderBottom: '1px solid rgba(245,158,11,0.4)',
            padding: '0.65rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fbbf24',
            fontSize: '0.84rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <BellOff size={16} />
              <span>{t.maintenanceBanner}</span>
              {maintenanceState.until && (
                <span style={{ fontSize: '0.78rem', color: '#fef08a' }}>
                  (Đến: {formatVnDateTime(maintenanceState.until)})
                </span>
              )}
            </div>
            {currentUser?.role === 'admin' && (
              <button
                className="toggle-btn"
                style={{ padding: '0.2rem 0.65rem', fontSize: '0.75rem', borderColor: '#f59e0b', color: '#fbbf24' }}
                onClick={() => handleToggleMaintenance(false)}
              >
                Tắt bảo trì ngay
              </button>
            )}
          </div>
        )}

        {/* Dashboard Content */}
        <div className="dashboard-container">

          {/* ── TAB 1: OVERVIEW ────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <>
              {/* KPI Cards */}
              {kpiLoading ? <KpiSkeleton /> : (
                <div className="kpi-grid">
                  <div
                    className="card kpi-card kpi-card-clickable"
                    onClick={() => setActiveTab('search')}
                    title="Bấm để chuyển tới mục Tìm kiếm & Lọc log"
                    role="button"
                    tabIndex={0}
                  >
                    <div className="kpi-header">
                      <span>{t.kpiTotalLogs}</span>
                      <Database size={18} color="var(--accent-primary)" />
                    </div>
                    <div className="kpi-value">
                      {kpiStats ? kpiStats.total_logs_24h.toLocaleString() : '—'}
                    </div>
                    <div className="kpi-trend positive">
                      <TrendingUp size={14} /> {t.kpiLogsTrend}
                    </div>
                  </div>

                  <div
                    className="card kpi-card kpi-card-clickable"
                    onClick={() => setActiveTab('anomalies')}
                    title="Bấm để chuyển tới mục Phát hiện Bất thường"
                    role="button"
                    tabIndex={0}
                  >
                    <div className="kpi-header">
                      <span>{t.kpiAnomalies}</span>
                      <AlertTriangle size={18} color="var(--severity-error)" />
                    </div>
                    <div className="kpi-value" style={{ color: 'var(--severity-error)' }}>
                      {kpiStats ? kpiStats.anomaly_count_1h.toLocaleString() : '—'}
                    </div>
                    <div className="kpi-trend negative">
                      <Clock size={14} />
                      {kpiStats ? `${kpiStats.fatal_count_1h} ${t.kpiFatalAlerts}` : t.kpiFatalAlerts}
                    </div>
                  </div>

                  <div
                    className="card kpi-card kpi-card-clickable"
                    onClick={() => setActiveTab('templates')}
                    title="Bấm để chuyển tới mục Khai phá Mẫu Log Drain"
                    role="button"
                    tabIndex={0}
                  >
                    <div className="kpi-header">
                      <span>{t.kpiTemplates}</span>
                      <Layers size={18} color="var(--accent-secondary)" />
                    </div>
                    <div className="kpi-value">
                      {kpiStats ? kpiStats.template_count.toLocaleString() : '—'}
                    </div>
                    <div className="kpi-trend positive">
                      <CheckCircle size={14} /> {t.kpiDrainActive}
                    </div>
                  </div>

                  <div
                    className="card kpi-card kpi-card-clickable"
                    onClick={() => {
                      const el = document.getElementById('realtime-logs-card');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    title="Bấm để cuộn xuống bảng Log Streams Realtime"
                    role="button"
                    tabIndex={0}
                  >
                    <div className="kpi-header">
                      <span>Logs/phút (Realtime)</span>
                      <Activity size={18} color="#10b981" />
                    </div>
                    <div className="kpi-value" style={{ color: '#10b981' }}>
                      {realtimeLogs.length > 0 ? realtimeLogs.length : '—'}
                    </div>
                    <div className="kpi-trend positive">
                      <Zap size={14} /> {t.kpiRealtimeStream}
                    </div>
                  </div>
                </div>
              )}

              {/* Pipeline Health Quick Summary */}
              {kpiStats && (
                <div className="card" style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.95rem' }}>
                      <Activity size={18} color="#10b981" />
                      {isVi ? 'Sức Khỏe Pipeline Xử Lý' : 'Pipeline Health'}
                    </span>
                    <button
                      className="toggle-btn"
                      onClick={() => setIsHealthModalOpen(true)}
                      style={{ fontSize: '0.76rem', padding: '0.2rem 0.6rem' }}
                    >
                      {isVi ? 'Chi tiết' : 'Details'}
                    </button>
                  </div>
                  <div className="pipeline-health-summary-grid">
                    {[
                      { label: isVi ? 'Collector' : 'Collector', status: 'OK', color: '#10b981', desc: isVi ? 'Cổng 4000' : 'Port 4000' },
                      { label: isVi ? 'Parser Worker' : 'Parser', status: 'OK', color: '#10b981', desc: isVi ? 'Hàng đợi BullMQ' : 'BullMQ Queue' },
                      { label: isVi ? 'OpenSearch' : 'OpenSearch', status: kpiStats.total_logs_24h > 0 ? 'OK' : 'WARN', color: kpiStats.total_logs_24h > 0 ? '#10b981' : '#f59e0b', desc: isVi ? `${kpiStats.total_logs_24h.toLocaleString()} log` : `${kpiStats.total_logs_24h.toLocaleString()} logs` },
                    ].map(({ label, status, color, desc }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{label}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Charts */}
              <div className="charts-grid">
                <div className="card">
                  <div className="chart-card-title">
                    <BarChart2 size={18} color="var(--accent-primary)" /> {t.chartIngestionTitle}
                  </div>
                  {statsLoading ? (
                    <Skeleton height="260px" />
                  ) : timeSeriesData && timeSeriesData.length > 0 ? (
                    <div style={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer>
                        <AreaChart data={timeSeriesData}>
                          <defs>
                            <linearGradient id="colorLogs" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                          <XAxis dataKey="time" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                          <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} labelStyle={{ color: 'var(--text-primary)' }} />
                          <Area type="monotone" dataKey="logs" stroke="#6366f1" fillOpacity={1} fill="url(#colorLogs)" name={t.chartLogsIngested} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                      <Activity size={32} color="var(--text-muted)" style={{ opacity: 0.7 }} />
                      <p style={{ margin: '0.4rem 0 0.2rem', fontSize: '0.92rem' }}>Chưa có log trong 1 giờ qua</p>
                      <span style={{ fontSize: '0.78rem' }}>Hệ thống đang tự động tiếp nhận luồng dữ liệu log...</span>
                    </div>
                  )}
                </div>

                <div className="card">
                  <div className="chart-card-title">
                    <Filter size={18} color="var(--accent-secondary)" /> {t.chartSeverityTitle}
                  </div>
                  {statsLoading ? (
                    <Skeleton height="260px" />
                  ) : levelDistribution.length > 0 ? (
                    <div style={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={levelDistribution}
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {levelDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} 
                            itemStyle={{ color: 'var(--text-primary)' }} 
                            labelStyle={{ color: 'var(--text-primary)' }} 
                            formatter={(value, name) => [value, LEVEL_MAP[lang]?.[name] || name]}
                          />
                          <Legend formatter={value => LEVEL_MAP[lang]?.[value] || value} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                      <Filter size={32} color="var(--text-muted)" style={{ opacity: 0.7 }} />
                      <p style={{ margin: '0.4rem 0 0.2rem', fontSize: '0.92rem' }}>Chưa có phân bố mức độ log</p>
                      <span style={{ fontSize: '0.78rem' }}>Đang lắng nghe phân loại mức độ từ pipeline...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Realtime Log Table */}
              <div className="card" id="realtime-logs-card">
                <div className="chart-card-title" style={{ justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} color="var(--accent-primary)" /> {t.tableTitle}
                    {realtimeLogs.length > 0 && (
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                        {realtimeLogs.length}
                      </span>
                    )}
                  </span>
                  <button
                    className="toggle-btn"
                    onClick={() => handleRefreshData('stats')}
                    title="Làm mới dữ liệu"
                    aria-label="Làm mới"
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>

                <div className="toolbar">
                  <div className="search-input-wrapper">
                    <Search className="search-icon" size={16} />
                    <input
                      id="table-search"
                      type="text"
                      className="search-input"
                      placeholder={t.searchPlaceholder}
                      value={tableSearchQuery}
                      onChange={e => setTableSearchQuery(e.target.value)}
                      aria-label="Tìm kiếm log"
                    />
                    {tableSearchQuery && (
                      <button
                        className="search-clear"
                        onClick={() => setTableSearchQuery('')}
                        aria-label="Xóa tìm kiếm"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <select
                    id="level-filter"
                    className="select-filter"
                    value={levelFilter}
                    onChange={e => setLevelFilter(e.target.value)}
                    aria-label="Lọc theo mức độ"
                  >
                    <option value="ALL">{t.filterAllLevels}</option>
                    <option value="INFO">{LEVEL_MAP[lang]?.INFO || 'INFO'}</option>
                    <option value="WARN">{LEVEL_MAP[lang]?.WARN || 'WARN'}</option>
                    <option value="ERROR">{LEVEL_MAP[lang]?.ERROR || 'ERROR'}</option>
                    <option value="FATAL">{LEVEL_MAP[lang]?.FATAL || 'FATAL'}</option>
                  </select>
                </div>

                <div
                  className="table-container"
                  style={{ maxHeight: '460px', overflowY: 'auto' }}
                  onScroll={(e) => {
                    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                    if (scrollTop + clientHeight >= scrollHeight - 35) {
                      setVisibleRealtimeCount(prev => Math.min(prev + 10, filteredLogs.length));
                    }
                  }}
                >
                  {filteredLogs.length === 0 ? (
                    <div className="empty-state">
                      <Activity size={32} color="var(--text-muted)" />
                      <p>{isSocketConnected ? 'Đang chờ log mới...' : 'Backend chưa kết nối'}</p>
                      <span>Chạy <code>npm start</code> trong thư mục BE/ để bắt đầu nhận log</span>
                    </div>
                  ) : (
                    <>
                      <table className="log-table" aria-label="Bảng log realtime">
                        <thead>
                          <tr>
                            <th>{t.colTime}</th>
                            <th>{t.colService}</th>
                            <th>{t.colLevel}</th>
                            <th>{t.colMessage}</th>
                            <th>{t.colScore}</th>
                            <th>{t.colRule}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLogs.slice(0, visibleRealtimeCount).map((log, idx) => {
                          const score = log.anomaly_score ?? log.anomalyScore ?? 0;
                          const rule = log.rule_triggered ?? log.ruleTriggered ?? null;
                          const msg = log.message || log.content || '—';
                          const svc = log.service || log.service_name || '—';
                          const ts = log.timestamp || '—';
                          const level = log.level || 'INFO';
                          return (
                            <tr key={log.id || `${ts}-${idx}`} className="clickable-row" onClick={() => setSelectedLog(log)}>
                              <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                {formatVnDateTime(ts)}
                              </td>
                              <td>
                                <span style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>{svc}</span>
                              </td>
                              <td>
                                <span className={`badge badge-${level.toLowerCase()}`}>
                                  {LEVEL_MAP[lang]?.[level.toUpperCase()] || level}
                                </span>
                              </td>
                              <td className="log-message">{msg}</td>
                              <td>
                                <span style={{
                                  fontWeight: 700,
                                  color: score > 0.7 ? 'var(--severity-error)' : score > 0.3 ? 'var(--severity-warn)' : 'var(--text-secondary)'
                                }}>
                                  {(score * 100).toFixed(0)}%
                                </span>
                              </td>
                              <td>
                                {rule ? (
                                  <span style={{ fontSize: '0.78rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                    {rule}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {visibleRealtimeCount < filteredLogs.length && (
                      <div style={{ textAlign: 'center', padding: '0.6rem', color: 'var(--text-muted)', fontSize: '0.78rem', borderTop: '1px solid var(--border-color-subtle)' }}>
                        Đang hiển thị {Math.min(visibleRealtimeCount, filteredLogs.length)} / {filteredLogs.length} log (Cuộn xuống để tải thêm)
                      </div>
                    )}
                  </>
                )}
                </div>
              </div>
            </>
          )}

          {/* ── TAB 2: ANOMALIES ───────────────────────────────────────────── */}
          {activeTab === 'anomalies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Sub-Tab Navigation Pills */}
              <div className="anomaly-sub-tabs">
                <button className={`anomaly-sub-tab ${anomalySubTab === 'list' ? 'active' : ''}`} onClick={() => setAnomalySubTab('list')}>
                  <ListFilter size={14} /> Danh Sách Sự Cố
                </button>
                <button className={`anomaly-sub-tab ${anomalySubTab === 'charts' ? 'active' : ''}`} onClick={() => setAnomalySubTab('charts')}>
                  <BarChart2 size={14} /> Biểu Đồ Phân Tích
                </button>
              </div>

              {/* ── Sub-Tab Content: LIST (giữ nguyên nội dung cũ) ── */}
              {anomalySubTab === 'list' && (
              <div className="card">
                <div className="chart-card-title" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} color="var(--severity-error)" />
                    Danh Sách Anomaly Events (1h gần nhất)
                    {anomalies && (
                      <span className="badge badge-error" style={{ fontSize: '0.7rem' }}>{anomalies.total}</span>
                    )}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="toggle-btn btn-export" style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }} onClick={() => handleExportExcel('anomalies')}>
                      <FileSpreadsheet size={13} color="#10b981" /> {isVi ? 'Xuất Excel (.xlsx)' : 'Export Excel'}
                    </button>
                    <button
                      className="toggle-btn"
                      onClick={() => handleRefreshData('anomalies')}
                      disabled={anomalyLoading}
                      aria-label="Làm mới anomaly"
                      title="Tải lại danh sách sự cố bất thường"
                    >
                      <RefreshCw size={15} className={anomalyLoading ? 'spin' : ''} />
                    </button>
                  </div>
                </div>

                {/* Status Filter Buttons */}
                <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'ALL', label: t.filterStatusAll, icon: ListFilter, color: 'var(--text-secondary)' },
                    { id: 'NEW', label: t.incidentStatusNew, icon: AlertCircle, color: '#ef4444' },
                    { id: 'ACKNOWLEDGED', label: t.incidentStatusAck, icon: Clock, color: '#f59e0b' },
                    { id: 'RESOLVED', label: t.incidentStatusResolved, icon: CheckCircle2, color: '#10b981' }
                  ].map(btn => {
                    const Icon = btn.icon;
                    const isActive = anomalyStatusFilter === btn.id;
                    const solidStyles = {
                      ALL: { activeBg: '#312e81', activeBorder: '#4338ca', activeText: '#c7d2fe' },
                      NEW: { activeBg: '#7f1d1d', activeBorder: '#991b1b', activeText: '#fca5a5' },
                      ACKNOWLEDGED: { activeBg: '#78350f', activeBorder: '#92400e', activeText: '#fde68a' },
                      RESOLVED: { activeBg: '#064e3b', activeBorder: '#065f46', activeText: '#a7f3d0' }
                    }[btn.id] || { activeBg: '#312e81', activeBorder: '#4338ca', activeText: '#c7d2fe' };

                    return (
                      <button
                        key={btn.id}
                        className="toggle-btn"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.28rem 0.75rem',
                          fontSize: '0.78rem',
                          fontWeight: isActive ? 700 : 500,
                          borderRadius: '999px',
                          borderColor: isActive ? solidStyles.activeBorder : 'var(--border-color)',
                          background: isActive ? solidStyles.activeBg : 'transparent',
                          color: isActive ? solidStyles.activeText : 'var(--text-secondary)',
                          boxShadow: 'none',
                          transition: 'background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease'
                        }}
                        onClick={() => {
                          setAnomalyStatusFilter(btn.id);
                          setVisibleAnomalyCount(10);
                        }}
                      >
                        <Icon size={13} style={{ color: isActive ? 'currentColor' : btn.color, flexShrink: 0 }} />
                        <span>{btn.label}</span>
                      </button>
                    );
                  })}
                </div>

                {anomalyLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                    {[1, 2, 3].map(i => <Skeleton key={i} height="3.5rem" />)}
                  </div>
                ) : anomalies && anomalies.anomalies.length > 0 ? (
                  (() => {
                    const filteredAnomalies = anomalies.anomalies.filter(
                      a => anomalyStatusFilter === 'ALL' || (a.incident_status || 'NEW') === anomalyStatusFilter
                    );
                    return (
                      <div
                        className="table-container"
                        style={{ maxHeight: '520px', overflowY: 'auto' }}
                        onScroll={(e) => {
                          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                          if (scrollTop + clientHeight >= scrollHeight - 35) {
                            setVisibleAnomalyCount(prev => Math.min(prev + 10, filteredAnomalies.length));
                          }
                        }}
                      >
                        <table className="log-table">
                          <thead>
                            <tr>
                              <th>{t.colTime}</th>
                              <th>{t.colService}</th>
                              <th>{t.colLevel}</th>
                              <th>{t.colMessage}</th>
                              <th>{t.colScore}</th>
                              <th style={{ minWidth: '320px', whiteSpace: 'nowrap' }}>{t.colLifecycle || 'Trạng Thái & Thao Tác'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAnomalies.slice(0, visibleAnomalyCount).map((a, idx) => {
                              const score = a.anomaly_score ?? 0;
                              const status = a.incident_status || 'NEW';
                              const aid = a.id || a.hash_id || idx;

                              return (
                                <tr key={aid} className="clickable-row" onClick={() => setSelectedLog(a)}>
                                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                    {formatVnDateTime(a.timestamp)}
                                  </td>
                                  <td><span style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>{a.service || a.service_name || '—'}</span></td>
                                  <td><span className={`badge badge-${(a.level || 'info').toLowerCase()}`}>{LEVEL_MAP[lang]?.[(a.level || 'INFO').toUpperCase()] || a.level || 'INFO'}</span></td>
                                  <td className="log-message">{a.message || a.content || '—'}</td>
                                  <td>
                                    <span style={{ fontWeight: 700, color: 'var(--severity-error)' }}>
                                      {(score * 100).toFixed(0)}%
                                    </span>
                                  </td>
                                  <td onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                                    <div className="lifecycle-cell-wrapper">
                                      {/* Status Badge */}
                                      {status === 'RESOLVED' ? (
                                        <span className="lifecycle-status-badge" style={{ color: '#10b981', background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }}>
                                          <CheckCircle2 size={11} style={{ flexShrink: 0 }} /> {t.incidentStatusResolved}
                                        </span>
                                      ) : status === 'ACKNOWLEDGED' ? (
                                        <span className="lifecycle-status-badge" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' }}>
                                          <Clock size={11} style={{ flexShrink: 0 }} /> {t.incidentStatusAck}
                                        </span>
                                      ) : (
                                        <span className="lifecycle-status-badge" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' }}>
                                          <AlertCircle size={11} style={{ flexShrink: 0 }} /> {t.incidentStatusNew}
                                        </span>
                                      )}

                                      {/* Action Button */}
                                      {status !== 'RESOLVED' && (
                                        status === 'ACKNOWLEDGED' ? (
                                          <button
                                            className="lifecycle-action-btn"
                                            style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.4)' }}
                                            onClick={() => handleUpdateAnomalyStatus(a.id || a.hash_id, 'RESOLVED')}
                                            title="Đánh dấu đã giải quyết sự cố"
                                          >
                                            <Check size={11} /> {t.btnResolve}
                                          </button>
                                        ) : (
                                          <button
                                            className="lifecycle-action-btn"
                                            style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.4)' }}
                                            onClick={() => handleUpdateAnomalyStatus(a.id || a.hash_id, 'ACKNOWLEDGED')}
                                            title="Tiếp nhận xử lý sự cố"
                                          >
                                            <Eye size={11} /> {t.btnAck}
                                          </button>
                                        )
                                      )}

                                      {/* Note Button */}
                                      <button
                                        className="lifecycle-note-btn"
                                        onClick={() => setNoteModalAnomaly(a)}
                                        title="Xem và thêm ghi chú xử lý"
                                      >
                                        <FileText size={11} /> {t.btnAddNote} {a.incident_notes?.length > 0 && `(${a.incident_notes.length})`}
                                      </button>

                                      {/* Subtitle: Who resolved / acknowledged */}
                                      {(a.resolved_by || a.acknowledged_by) && (
                                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '2px' }}>
                                          ({a.resolved_by ? `${a.resolved_by}` : `${a.acknowledged_by}`})
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {filteredAnomalies.length > 10 && (
                          <div style={{ textAlign: 'center', padding: '0.65rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Đang hiển thị {Math.min(visibleAnomalyCount, filteredAnomalies.length)} / {filteredAnomalies.length} sự cố (Cuộn xuống để xem thêm)
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="empty-state">
                    <CheckCircle size={32} color="#10b981" />
                    <p style={{ color: '#10b981' }}>Không phát hiện anomaly</p>
                    <span>Hệ thống đang hoạt động bình thường trong 1h qua</span>
                  </div>
                )}
              </div>
              )}

              {/* ── Sub-Tab Content: CHARTS (Biểu đồ phân tích) ── */}
              {anomalySubTab === 'charts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* HÀNG 1: Bộ lọc */}
                <div className="card" style={{ padding: '1rem 1.25rem' }}>
                  <div className="analytics-filters">
                    <div className="analytics-time-pills">
                      {['1h', '6h', '24h', '7d'].map(r => (
                        <button
                          key={r}
                          className={`analytics-time-pill ${analyticsTimeRange === r ? 'active' : ''}`}
                          onClick={() => setAnalyticsTimeRange(r)}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <select
                      value={analyticsServiceFilter}
                      onChange={e => setAnalyticsServiceFilter(e.target.value)}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                    >
                      <option value="">Tất cả dịch vụ</option>
                      {analyticsData?.top_services?.map(s => (
                        <option key={s.service} value={s.service}>{s.service}</option>
                      ))}
                    </select>
                    <select
                      value={analyticsLevelFilter}
                      onChange={e => setAnalyticsLevelFilter(e.target.value)}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                    >
                      <option value="">Tất cả level</option>
                      {['INFO', 'WARN', 'ERROR', 'FATAL'].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    {analyticsServiceFilter && (
                      <span className="cross-filter-badge" onClick={() => setAnalyticsServiceFilter('')}>
                        <Filter size={11} /> {analyticsServiceFilter} <X size={11} />
                      </span>
                    )}
                    <button
                      className="toggle-btn"
                      onClick={fetchAnalytics}
                      disabled={analyticsLoading}
                      title="Làm mới dữ liệu phân tích"
                      style={{ marginLeft: 'auto' }}
                    >
                      <RefreshCw size={15} className={analyticsLoading ? 'spin' : ''} />
                    </button>
                  </div>
                </div>

                {/* 4 KPI Cards */}
                <div className="kpi-grid">
                  {(() => {
                    const kpi = analyticsData?.kpi;
                    const totalLogs = kpi?.total_logs ?? 0;
                    const errorCount = kpi?.error_count ?? kpi?.error_fatal_count ?? 0;
                    const anomalyCount = kpi?.anomaly_count ?? 0;
                    const throughput = kpi?.throughput != null ? kpi.throughput.toFixed(1) : '0.0';

                    const errorRate = totalLogs > 0 ? ((errorCount / totalLogs) * 100).toFixed(1) : '0.0';
                    const anomalyRate = totalLogs > 0 ? ((anomalyCount / totalLogs) * 100).toFixed(1) : '0.0';

                    return (
                      <>
                        <div className="card kpi-card">
                          <div className="kpi-header">
                            <span>Tổng Số Log</span>
                            <Database size={18} color="var(--accent-primary)" />
                          </div>
                          <div className="kpi-value" style={{ color: 'var(--accent-primary)' }}>
                            {analyticsLoading ? '...' : totalLogs.toLocaleString()}
                          </div>
                          <div className="kpi-trend positive">
                            <Clock size={13} /> Khung {analyticsTimeRange} gần nhất
                          </div>
                        </div>

                        <div className="card kpi-card">
                          <div className="kpi-header">
                            <span>ERROR / FATAL</span>
                            <AlertTriangle size={18} color="var(--severity-error)" />
                          </div>
                          <div className="kpi-value" style={{ color: 'var(--severity-error)' }}>
                            {analyticsLoading ? '...' : errorCount.toLocaleString()}
                          </div>
                          <div className="kpi-trend" style={{ color: errorCount > 0 ? 'var(--severity-error)' : 'var(--text-muted)' }}>
                            <TrendingDown size={13} /> {errorRate}% tổng số log
                          </div>
                        </div>

                        <div className="card kpi-card">
                          <div className="kpi-header">
                            <span>Phát Hiện Bất Thường</span>
                            <ShieldAlert size={18} color="var(--severity-warn)" />
                          </div>
                          <div className="kpi-value" style={{ color: 'var(--severity-warn)' }}>
                            {analyticsLoading ? '...' : anomalyCount.toLocaleString()}
                          </div>
                          <div className="kpi-trend" style={{ color: anomalyCount > 0 ? 'var(--severity-warn)' : '#10b981' }}>
                            <AlertCircle size={13} /> {anomalyCount > 0 ? `Chiếm ${anomalyRate}% dòng log` : 'Không có bất thường'}
                          </div>
                        </div>

                        <div className="card kpi-card">
                          <div className="kpi-header">
                            <span>Thông Lượng Pipeline</span>
                            <Zap size={18} color="#10b981" />
                          </div>
                          <div className="kpi-value" style={{ color: '#10b981' }}>
                            {analyticsLoading ? '...' : throughput} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>log/s</span>
                          </div>
                          <div className="kpi-trend positive">
                            <Activity size={13} /> Tốc độ xử lý trung bình
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* HÀNG 2: Timeline log chồng + Anomaly markers */}
                <div className="card">
                  <div className="chart-card-title">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={18} color="var(--accent-primary)" />
                      Lượng Log Theo Thời Gian & Điểm Phát Hiện Bất Thường
                    </span>
                  </div>
                  {analyticsLoading ? (
                    <Skeleton height="300px" />
                  ) : analyticsData?.timeline && analyticsData.timeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={analyticsData.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '10px' }}
                          itemStyle={{ color: 'var(--text-primary)' }}
                          labelStyle={{ color: 'var(--text-primary)' }}
                          labelFormatter={(label, items) => {
                            const rawTs = items?.[0]?.payload?.timestamp;
                            return rawTs ? formatVnDateTime(rawTs) : `Thời gian: ${label}`;
                          }}
                          formatter={(value, name) => [
                            value,
                            name === 'anomaly_count' || name === 'Anomaly' ? (isVi ? 'Bất thường' : 'Anomaly') : (LEVEL_MAP[lang]?.[name] || name)
                          ]}
                        />
                        <Legend
                          formatter={value => value === 'Anomaly' ? (isVi ? 'Bất thường' : 'Anomaly') : (LEVEL_MAP[lang]?.[value] || value)}
                          wrapperStyle={{ fontSize: '0.75rem' }}
                        />
                        <Area type="monotone" dataKey="INFO" stackId="1" stroke={LEVEL_COLORS.INFO} fill={LEVEL_COLORS.INFO} fillOpacity={0.3} name={LEVEL_MAP[lang]?.INFO || 'INFO'} />
                        <Area type="monotone" dataKey="WARN" stackId="1" stroke={LEVEL_COLORS.WARN} fill={LEVEL_COLORS.WARN} fillOpacity={0.4} name={LEVEL_MAP[lang]?.WARN || 'WARN'} />
                        <Area type="monotone" dataKey="ERROR" stackId="1" stroke={LEVEL_COLORS.ERROR} fill={LEVEL_COLORS.ERROR} fillOpacity={0.5} name={LEVEL_MAP[lang]?.ERROR || 'ERROR'} />
                        <Area type="monotone" dataKey="FATAL" stackId="1" stroke={LEVEL_COLORS.FATAL} fill={LEVEL_COLORS.FATAL} fillOpacity={0.6} name={LEVEL_MAP[lang]?.FATAL || 'FATAL'} />
                        <Line type="stepAfter" dataKey="anomaly_count" stroke="#f59e0b" strokeWidth={2} dot={({ cx, cy, payload, index }) => payload.anomaly_count > 0 ? <circle key={`anomaly-dot-${index}-${payload.timestamp || cx}`} cx={cx} cy={cy} r={5} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} /> : null} name={isVi ? 'Bất thường' : 'Anomaly'} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <BarChart3 size={28} color="var(--text-muted)" />
                      <p style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu timeline</p>
                    </div>
                  )}
                </div>

                {/* HÀNG 3: 3 biểu đồ ngang hàng */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>

                  {/* 3a: Donut chart phân bố mức độ */}
                  <div className="card">
                    <div className="chart-card-title">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldAlert size={16} color="var(--severity-error)" />
                        Phân Bố Theo Mức Độ
                      </span>
                    </div>
                    {analyticsLoading ? (
                      <Skeleton height={250} />
                    ) : analyticsData?.level_distribution && analyticsData.level_distribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={analyticsData.level_distribution}
                            cx="50%" cy="45%"
                            innerRadius={45} outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                            nameKey="name"
                          >
                            {analyticsData.level_distribution.map((entry, index) => (
                              <Cell key={index} fill={LEVEL_COLORS[entry.name] || '#8884d8'} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '10px' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                            formatter={(value, name) => [value, LEVEL_MAP[lang]?.[name] || name]}
                          />
                          <Legend
                            formatter={(value, entry) => {
                              const total = analyticsData.level_distribution.reduce((acc, curr) => acc + (curr.value || 0), 0) || 1;
                              const val = entry?.payload?.value || 0;
                              const pct = ((val / total) * 100).toFixed(0);
                              return `${LEVEL_MAP[lang]?.[value] || value}: ${val} (${pct}%)`;
                            }}
                            wrapperStyle={{ fontSize: '0.74rem' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="empty-state" style={{ padding: '2rem' }}>
                        <ShieldAlert size={24} color="var(--text-muted)" />
                        <p style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu phân bố</p>
                      </div>
                    )}
                  </div>

                  {/* 3b: Top dịch vụ lỗi (Horizontal Bar) */}
                  <div className="card">
                    <div className="chart-card-title">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Database size={16} color="var(--accent-secondary)" />
                        Dịch Vụ Nào Lỗi Nhiều Nhất?
                      </span>
                    </div>
                    {analyticsLoading ? (
                      <Skeleton height="250px" />
                    ) : analyticsData?.top_services && analyticsData.top_services.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart layout="vertical" data={analyticsData.top_services.slice(0, 8)} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                          <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                          <YAxis dataKey="service" type="category" width={100} tick={{ fill: 'var(--text-primary)', fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '10px' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                            labelStyle={{ color: 'var(--text-primary)' }}
                          />
                          <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(data) => setAnalyticsServiceFilter(data.service)} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="empty-state" style={{ padding: '2rem' }}>
                        <Database size={24} color="var(--text-muted)" />
                        <p style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu dịch vụ</p>
                      </div>
                    )}
                  </div>

                  {/* 3c: Diễn biến Anomaly Score theo thời gian */}
                  <div className="card" style={{ overflow: 'hidden' }}>
                    <div className="chart-card-title">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={16} color="#f59e0b" />
                        Diễn Biến Điểm Bất Thường
                      </span>
                    </div>
                    {analyticsLoading ? (
                      <Skeleton height="250px" />
                    ) : analyticsData?.score_timeline && analyticsData.score_timeline.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <ComposedChart data={analyticsData.score_timeline} margin={{ top: 12, right: 30, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                          <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} minTickGap={35} interval="preserveStartEnd" />
                          <YAxis domain={[0, 1]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={35} />
                          <Tooltip
                            contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '10px' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                            labelStyle={{ color: 'var(--text-primary)' }}
                            labelFormatter={(label, items) => {
                              const rawTs = items?.[0]?.payload?.timestamp;
                              return rawTs ? formatVnDateTime(rawTs) : `Thời gian: ${label}`;
                            }}
                            formatter={v => [(v * 100).toFixed(1) + '%', isVi ? 'Điểm số' : 'Score']}
                          />
                          <ReferenceLine y={0.7} stroke="#ef4444" strokeDasharray="5 3" label={{ value: isVi ? 'Ngưỡng 70%' : 'Threshold 70%', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
                          <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} name={isVi ? 'Điểm Bất Thường' : 'Anomaly Score'} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="empty-state" style={{ padding: '2rem' }}>
                        <TrendingUp size={24} color="var(--text-muted)" />
                        <p style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu anomaly score</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* HÀNG 4: 2 khối ngang hàng */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>

                  {/* 4a: Heatmap Giờ × Ngày */}
                  <div className="card">
                    <div className="chart-card-title">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} color="var(--accent-primary)" />
                        Mật Độ Lỗi Theo Khung Giờ
                      </span>
                    </div>
                    {analyticsLoading ? (
                      <Skeleton height="250px" />
                    ) : analyticsData?.heatmap && analyticsData.heatmap.length > 0 ? (
                      (() => {
                        const dates = [...new Set(analyticsData.heatmap.map(h => h.date))].sort().reverse();
                        const hours = Array.from({ length: 24 }, (_, i) => i);
                        const heatmapMap = {};
                        let maxCount = 1;
                        analyticsData.heatmap.forEach(h => {
                          const key = `${h.date}-${h.hour}`;
                          heatmapMap[key] = h.count;
                          if (h.count > maxCount) maxCount = h.count;
                        });
                        return (
                          <div className="heatmap-scroll-container">
                            <div style={{ minWidth: '680px' }}>
                              {/* Hours header row */}
                              <div style={{ display: 'flex', gap: '3px', marginBottom: '4px', alignItems: 'center' }}>
                                <div style={{ width: 68, fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>
                                  {isVi ? 'Ngày \\ Giờ' : 'Date \\ Hour'}
                                </div>
                                <div style={{ display: 'flex', gap: '3px' }}>
                                  {hours.map(h => (
                                    <div key={h} style={{ width: 26, textAlign: 'center', fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
                                      {String(h).padStart(2, '0')}h
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Date rows */}
                              {dates.map(date => (
                                <div key={date} style={{ display: 'flex', gap: '3px', alignItems: 'center', marginBottom: '3px' }}>
                                  <div style={{ width: 68, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
                                    {date}
                                  </div>
                                  <div style={{ display: 'flex', gap: '3px' }}>
                                    {hours.map(h => {
                                      const count = heatmapMap[`${date}-${h}`] || 0;
                                      const intensity = count / maxCount;
                                      let bg = 'var(--bg-input)';
                                      let textColor = 'transparent';
                                      let textShadow = 'none';

                                      if (count > 0) {
                                        if (intensity < 0.25) {
                                          bg = theme === 'dark' ? 'rgba(245,158,11,0.3)' : '#fef3c7';
                                          textColor = theme === 'dark' ? '#fde047' : '#92400e';
                                        } else if (intensity < 0.5) {
                                          bg = theme === 'dark' ? 'rgba(245,158,11,0.65)' : '#fcd34d';
                                          textColor = theme === 'dark' ? '#ffffff' : '#78350f';
                                          textShadow = '0 1px 2px rgba(0,0,0,0.4)';
                                        } else if (intensity < 0.75) {
                                          bg = theme === 'dark' ? 'rgba(239,68,68,0.7)' : '#f87171';
                                          textColor = '#ffffff';
                                          textShadow = '0 1px 2px rgba(0,0,0,0.5)';
                                        } else {
                                          bg = theme === 'dark' ? '#dc2626' : '#ef4444';
                                          textColor = '#ffffff';
                                          textShadow = '0 1px 2px rgba(0,0,0,0.6)';
                                        }
                                      }

                                      return (
                                        <div
                                          key={h}
                                          className="heatmap-cell"
                                          style={{
                                            background: bg,
                                            color: textColor,
                                            textShadow: textShadow,
                                            border: count > 0 ? '1px solid rgba(0,0,0,0.1)' : '1px solid var(--border-color-subtle)'
                                          }}
                                          title={`${date} ${String(h).padStart(2,'0')}:00 — ${count} lỗi`}
                                        >
                                          {count > 0 ? count : ''}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}

                              {/* Compact Legend Footer */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                                <span>{isVi ? 'Ít lỗi' : 'Low'}</span>
                                <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--bg-input)', border: '1px solid var(--border-color-subtle)' }} />
                                <div style={{ width: 14, height: 14, borderRadius: 3, background: theme === 'dark' ? 'rgba(245,158,11,0.3)' : '#fef3c7' }} />
                                <div style={{ width: 14, height: 14, borderRadius: 3, background: theme === 'dark' ? 'rgba(245,158,11,0.65)' : '#fcd34d' }} />
                                <div style={{ width: 14, height: 14, borderRadius: 3, background: theme === 'dark' ? 'rgba(239,68,68,0.7)' : '#f87171' }} />
                                <div style={{ width: 14, height: 14, borderRadius: 3, background: theme === 'dark' ? '#dc2626' : '#ef4444' }} />
                                <span>{isVi ? 'Nhiều lỗi' : 'High'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="empty-state" style={{ padding: '2rem' }}>
                        <Calendar size={24} color="var(--text-muted)" />
                        <p style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu heatmap</p>
                      </div>
                    )}
                  </div>

                  {/* 4b: Top Drain Templates */}
                  <div className="card">
                    <div className="chart-card-title">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Layers size={16} color="#10b981" />
                        Top Mẫu Log (Drain Mining)
                      </span>
                    </div>
                    {analyticsLoading ? (
                      <Skeleton height="250px" />
                    ) : analyticsData?.top_templates && analyticsData.top_templates.length > 0 ? (
                      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        <table className="log-table" style={{ fontSize: '0.78rem' }}>
                          <thead>
                            <tr>
                              <th style={{ width: '50%' }}>Mẫu Template</th>
                              <th style={{ textAlign: 'center' }}>Số lượng</th>
                              <th style={{ textAlign: 'center' }}>Level</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analyticsData.top_templates.slice(0, 10).map((tpl, i) => (
                              <tr key={i}>
                                <td className="log-message" style={{ maxWidth: '300px' }} title={tpl.template}>{tpl.template}</td>
                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{tpl.count?.toLocaleString()}</td>
                                <td style={{ textAlign: 'center' }}>
                                  {tpl.level && <span className={`badge badge-${(tpl.level || 'info').toLowerCase()}`}>{tpl.level}</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="empty-state" style={{ padding: '2rem' }}>
                        <Layers size={24} color="var(--text-muted)" />
                        <p style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu template</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
              )}

            </div>
          )}

          {/* ── TAB 3: SEARCH ──────────────────────────────────────────────── */}
          {activeTab === 'search' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card search-filter-card" style={{ padding: '1rem 1.25rem' }}>
                <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                  <Search size={18} color="var(--accent-primary)" /> {t.searchFilterTitle}
                </h3>
                <div className="search-form-grid" style={{ gap: '0.75rem' }}>
                  <div className="form-group">
                    <label htmlFor="search-query" className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>{t.searchQueryLabel}</label>
                    <input
                      id="search-query"
                      type="text"
                      className="search-input"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                      placeholder="error, timeout, connection refused..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch(false)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="search-level" className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Mức độ</label>
                    <select
                      id="search-level"
                      className="select-filter"
                      style={{ width: '100%', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                      value={searchLevel}
                      onChange={e => setSearchLevel(e.target.value)}
                    >
                      <option value="ALL">{t.filterAllLevels}</option>
                      <option value="INFO">{LEVEL_MAP[lang]?.INFO || 'INFO'}</option>
                      <option value="WARN">{LEVEL_MAP[lang]?.WARN || 'WARN'}</option>
                      <option value="ERROR">{LEVEL_MAP[lang]?.ERROR || 'ERROR'}</option>
                      <option value="FATAL">{LEVEL_MAP[lang]?.FATAL || 'FATAL'}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>{t.searchFromLabel}</label>
                    <CustomDateTimePicker
                      value={searchFrom}
                      onChange={setSearchFrom}
                      placeholder={isVi ? 'Từ ngày giờ...' : 'From date...'}
                      lang={lang}
                      align="left"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>{t.searchToLabel}</label>
                    <CustomDateTimePicker
                      value={searchTo}
                      onChange={setSearchTo}
                      placeholder={isVi ? 'Đến ngày giờ...' : 'To date...'}
                      lang={lang}
                      align="right"
                    />
                  </div>
                </div>
                {/* Quick Time Range Buttons + Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} style={{ color: 'var(--accent-primary)' }} />
                    {t.quickTimeTitle}
                  </span>
                  <button
                    type="button"
                    className="toggle-btn"
                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem', borderRadius: '8px' }}
                    onClick={() => {
                      const to = new Date();
                      const from = new Date(Date.now() - 60 * 60 * 1000);
                      setSearchFrom(toLocalDatetimeInputString(from));
                      setSearchTo(toLocalDatetimeInputString(to));
                    }}
                  >
                    {t.quick1h}
                  </button>
                  <button
                    type="button"
                    className="toggle-btn"
                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem', borderRadius: '8px' }}
                    onClick={() => {
                      const to = new Date();
                      const from = new Date(Date.now() - 24 * 60 * 60 * 1000);
                      setSearchFrom(toLocalDatetimeInputString(from));
                      setSearchTo(toLocalDatetimeInputString(to));
                    }}
                  >
                    {t.quick24h}
                  </button>
                  <button
                    type="button"
                    className="toggle-btn"
                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem', borderRadius: '8px' }}
                    onClick={() => {
                      const to = new Date();
                      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                      setSearchFrom(toLocalDatetimeInputString(from));
                      setSearchTo(toLocalDatetimeInputString(to));
                    }}
                  >
                    {t.quick7d}
                  </button>
                  {(searchFrom || searchTo) && (
                    <button
                      type="button"
                      className="toggle-btn"
                      style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem', borderRadius: '8px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.06)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => {
                        setSearchFrom('');
                        setSearchTo('');
                      }}
                    >
                      <RotateCcw size={12} />
                      {t.clearTimeBtn || (isVi ? 'Đặt lại' : 'Reset')}
                    </button>
                  )}
                  {/* Search + Reset buttons ở bên phải */}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.45rem', alignItems: 'center', flexShrink: 0 }}>
                    <button
                      id="btn-search"
                      className="btn-primary"
                      style={{ padding: '0.38rem 1rem', fontSize: '0.84rem' }}
                      onClick={() => handleSearch(false)}
                      disabled={searchLoading}
                      aria-busy={searchLoading}
                    >
                      {searchLoading ? (
                        <><RefreshCw size={14} className="spin" /> Đang tìm kiếm...</>
                      ) : (
                        <><Search size={14} /> {t.btnSearch}</>
                      )}
                    </button>
                    <button
                      className="toggle-btn"
                      style={{ padding: '0.38rem 0.9rem', fontSize: '0.84rem' }}
                      onClick={() => {
                        setSearchQuery('');
                        setSearchLevel('ALL');
                        setSearchFrom('');
                        setSearchTo('');
                        handleSearch(false);
                      }}
                    >
                      Đặt lại bộ lọc
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {searchResults !== null && (
                <div className="card search-results-card" style={{ padding: '1rem 1.25rem' }}>
                  <div className="chart-card-title" style={{ justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Search size={16} color="var(--accent-primary)" />
                      Kết quả: {searchResults.total.toLocaleString()} log
                    </span>
                    <button className="toggle-btn btn-export" style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }} onClick={() => handleExportExcel('logs')}>
                      <FileSpreadsheet size={13} color="#10b981" /> {isVi ? 'Xuất Excel (.xlsx)' : 'Export Excel'}
                    </button>
                  </div>
                  {searchResults.logs.length > 0 ? (
                    <>
                      <div
                        className="table-container search-table-scroll-container"
                        onScroll={(e) => {
                          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                          if (scrollTop + clientHeight >= scrollHeight - 35) {
                            if (!searchLoading && hasMoreSearch) {
                              handleSearch(true);
                            }
                          }
                        }}
                      >
                        <table className="log-table">
                          <thead>
                            <tr>
                              <th>{t.colTime}</th>
                              <th>{t.colService}</th>
                              <th>{t.colLevel}</th>
                              <th>{t.colMessage}</th>
                              <th>{t.colScore}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchResults.logs.map((log, idx) => {
                              const score = log.anomaly_score ?? 0;
                              return (
                                <tr key={log.id || idx} className="clickable-row" onClick={() => setSelectedLog(log)}>
                                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                    {formatVnDateTime(log.timestamp)}
                                  </td>
                                  <td><span style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>{log.service || log.service_name || '—'}</span></td>
                                  <td><span className={`badge badge-${(log.level || 'info').toLowerCase()}`}>{LEVEL_MAP[lang]?.[(log.level || 'INFO').toUpperCase()] || log.level || 'INFO'}</span></td>
                                  <td className="log-message">{log.message || log.content || '—'}</td>
                                  <td>
                                    <span style={{ fontWeight: 700, color: score > 0.7 ? 'var(--severity-error)' : score > 0.3 ? 'var(--severity-warn)' : 'var(--text-secondary)' }}>
                                      {(score * 100).toFixed(0)}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {searchLoading && (
                          <div style={{ textAlign: 'center', padding: '0.65rem', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', borderTop: '1px solid var(--border-color-subtle)' }}>
                            <RefreshCw size={13} className="spin" /> Đang tải thêm dữ liệu...
                          </div>
                        )}
                        {hasMoreSearch && !searchLoading && (
                          <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem', borderTop: '1px solid var(--border-color-subtle)' }}>
                            Cuộn xuống để tải thêm kết quả...
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">
                      <Search size={32} color="var(--text-muted)" />
                      <p>Không tìm thấy kết quả</p>
                      <span>Thử điều chỉnh từ khóa hoặc mở rộng khoảng thời gian</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 5: PIPELINE HEALTH & TOPOLOGY ─────────────────────────── */}
          {activeTab === 'pipeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Header Card with Overall Status & Action */}
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: pipelineHealth?.status === 'HEALTHY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: pipelineHealth?.status === 'HEALTHY' ? '#10b981' : '#f59e0b',
                    border: `1px solid ${pipelineHealth?.status === 'HEALTHY' ? '#10b981' : '#f59e0b'}`
                  }}>
                    <Cpu size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {isVi ? 'Hạ Tầng Pipeline Xử Lý Dữ Liệu Lớn' : 'Big Data Pipeline Infrastructure'}
                      </h3>
                      <span className={`badge ${pipelineHealth?.status === 'HEALTHY' ? 'badge-info' : 'badge-warn'}`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        {pipelineHealth?.status || 'HEALTHY'}
                      </span>
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {isVi 
                        ? 'Giám sát chuỗi tiếp nhận log, hàng đợi đệm Redis, bộ bóc tách Drain và cụm lưu trữ OpenSearch'
                        : 'Real-time telemetry for log ingestion, Redis buffer queue, Drain parser, and OpenSearch'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem', gap: '0.4rem' }}
                    onClick={handleGenerateSampleLogs}
                    disabled={isGeneratingLogs}
                  >
                    <Zap size={14} /> {isVi ? 'Bơm 35 Log Mẫu' : 'Inject 35 Logs'}
                  </button>
                  <button
                    type="button"
                    className="toggle-btn"
                    style={{ padding: '0.45rem 0.75rem' }}
                    onClick={() => fetchPipelineHealth(true)}
                    disabled={pipelineHealthLoading}
                    title={isVi ? 'Làm mới trạng thái' : 'Refresh'}
                  >
                    <RefreshCw size={14} className={pipelineHealthLoading ? 'spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Pipeline Topology 5 Nodes */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div className="chart-card-title" style={{ marginBottom: '1.25rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} color="var(--accent-primary)" />
                    {isVi ? 'Sơ Đồ Luồng Xử Lý Dữ Liệu (Pipeline Architecture Topology)' : 'Pipeline Ingestion Topology'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                  {/* Node 1 */}
                  <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
                      <Server size={18} />
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>1. Log Sources</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>Microservices / Syslog</div>
                    <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                      <CheckCircle2 size={12} /> Active
                    </div>
                  </div>

                  {/* Node 2 */}
                  <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
                      <Zap size={18} />
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>2. Collector</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>Fluent Bit Ingest</div>
                    <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                      <CheckCircle2 size={12} /> {pipelineHealth?.throughput?.currentLogsPerSec || 0} log/s
                    </div>
                  </div>

                  {/* Node 3 */}
                  <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
                      <Layers size={18} />
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>3. Redis Queue</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>BullMQ Buffer</div>
                    <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                      <CheckCircle2 size={12} /> {pipelineHealth?.queue?.active || 0} active
                    </div>
                  </div>

                  {/* Node 4 */}
                  <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
                      <Cpu size={18} />
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>4. Drain Parser</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>Template & Anomaly</div>
                    <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                      <CheckCircle2 size={12} /> ~{pipelineHealth?.latency?.avgLatencyMs || 0}ms
                    </div>
                  </div>

                  {/* Node 5 */}
                  <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
                      <Database size={18} />
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>5. Storage</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>OpenSearch Cluster</div>
                    <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                      <CheckCircle2 size={12} /> Ready
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics Grid 2 Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
                {/* Column 1: Redis & Queue telemetry */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div className="chart-card-title" style={{ marginBottom: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Layers size={17} color="#818cf8" />
                      {isVi ? 'Trạng Thái Hàng Đợi Buffer (BullMQ & Redis)' : 'BullMQ Queue & Buffer Metrics'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Log đang chờ xử lý (Waiting):</span>
                      <span style={{ fontWeight: 700, color: (pipelineHealth?.queue?.waiting || 0) > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
                        {pipelineHealth?.queue?.waiting ?? 0}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Log đang bóc tách (Active):</span>
                      <span style={{ fontWeight: 700, color: '#0284c7' }}>
                        {pipelineHealth?.queue?.active ?? 0}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Tổng log đã hoàn tất (Completed):</span>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>
                        {pipelineHealth?.queue?.completed?.toLocaleString() ?? 0}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Số lượng log lỗi (Failed):</span>
                      <span style={{ fontWeight: 700, color: (pipelineHealth?.queue?.failed || 0) > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                        {pipelineHealth?.queue?.failed ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Ingest Throughput & Latency */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div className="chart-card-title" style={{ marginBottom: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Zap size={17} color="#06b6d4" />
                      {isVi ? 'Thông Lượng & Độ Trễ Tiếp Nhận (Ingestion Telemetry)' : 'Throughput & Pipeline Latency'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Thông lượng tức thời:</span>
                      <span style={{ fontWeight: 700, color: '#06b6d4' }}>
                        {pipelineHealth?.throughput?.currentLogsPerSec ?? 0} log/s
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Đỉnh thông lượng đã ghi nhận:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {pipelineHealth?.throughput?.peakLogsPerSec ?? 0} log/s
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Độ trễ trung bình bóc tách Drain:</span>
                      <span style={{ fontWeight: 700, color: '#a855f7' }}>
                        ~{pipelineHealth?.latency?.avgLatencyMs ?? 0} ms
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Cụm Redis In-Memory:</span>
                      <span style={{ fontWeight: 600, color: '#10b981' }}>
                        {pipelineHealth?.redis?.host || '127.0.0.1'}:{pipelineHealth?.redis?.port || 6379} (Connected)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'templates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card">
                <div className="chart-card-title" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} color="var(--accent-secondary)" /> {t.templateTreeTitle}
                    {templates && (
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{templates.total} templates</span>
                    )}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="toggle-btn"
                      onClick={() => handleRefreshData('templates')}
                      disabled={templatesLoading}
                      aria-label="Làm mới templates"
                    >
                      <RefreshCw size={15} className={templatesLoading ? 'spin' : ''} />
                    </button>
                  </div>
                </div>

                {templatesLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} height="3rem" />)}
                  </div>
                ) : templates && templates.templates.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {templates.templates.map((tmpl, idx) => (
                      <div key={tmpl.id || idx} className="template-row">
                        <div className="template-id">T{String(idx + 1).padStart(3, '0')}</div>
                        <div className="template-content">
                          <span className="template-pattern">{tmpl.template}</span>
                          <div className="template-meta">
                            <span className={`badge badge-${(tmpl.level || 'info').toLowerCase()}`} style={{ fontSize: '0.7rem' }}>{LEVEL_MAP[lang]?.[(tmpl.level || 'INFO').toUpperCase()] || tmpl.level}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{tmpl.service}</span>
                            <span style={{ color: 'var(--accent-primary)', fontSize: '0.78rem' }}>×{tmpl.count?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Layers size={36} color="var(--accent-secondary)" style={{ opacity: 0.8 }} />
                    <p style={{ margin: '0.4rem 0 0.2rem', fontSize: '1rem', fontWeight: 600 }}>Chưa có Drain templates nào trong OpenSearch</p>
                    <span style={{ maxWidth: '440px', lineHeight: 1.5 }}>
                      Parser Worker đang tự động bóc tách các mẫu log từ pipeline theo thời gian thực.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── MODAL INSPECTION LOG DETAIL ────────────────────────────────────── */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)} aria-modal="true" role="dialog">
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <Eye size={18} color="var(--accent-primary)" />
                {t.modalLogDetailTitle}
              </span>
              <button
                className="toast-close"
                onClick={() => setSelectedLog(null)}
                aria-label="Đóng chi tiết log"
                style={{ position: 'static', background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '0.25rem', borderRadius: '6px', transition: 'color 0.2s, background 0.2s' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <pre className="modal-json-box">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
              <AiExplainButton logEntry={selectedLog} lang={lang} />
            </div>
          </div>
        </div>
      )}
      {/* ── AI ASSISTANT FLOATING CHATBOT ──────────────────────────────────── */}
      <AiAssistant
        lang={lang}
        t={t}
        theme={theme}
        currentUser={currentUser}
        kpiStats={kpiStats}
      />

      {/* ── AUTH & LOGIN MODAL ──────────────────────────────────────────────── */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          addToast(lang === 'vi' ? `Chào mừng ${u.displayName} (${u.role.toUpperCase()})` : `Welcome ${u.displayName}`, 'success');
        }}
        lang={lang}
      />

      {/* ── PIPELINE HEALTH MONITORING WIDGET ───────────────────────────────── */}
      <PipelineHealthWidget
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        lang={lang}
        addToast={addToast}
      />

      {/* ── INCIDENT NOTE MODAL ─────────────────────────────────────────────── */}
      <IncidentNoteModal
        isOpen={Boolean(noteModalAnomaly)}
        onClose={() => setNoteModalAnomaly(null)}
        anomaly={noteModalAnomaly}
        onAddNote={handleAddIncidentNote}
        lang={lang}
      />

      {/* ── ADMIN SETTINGS & REPORT MODAL ────────────────────────────────────── */}
      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        onClose={() => setIsAdminSettingsOpen(false)}
        lang={lang}
        configState={configState}
        setConfigState={setConfigState}
        saveConfig={saveConfig}
        maintenanceState={maintenanceState}
        handleToggleMaintenance={handleToggleMaintenance}
        newKeywordInput={newKeywordInput}
        setNewKeywordInput={setNewKeywordInput}
        handleTriggerDailyDigest={handleTriggerDailyDigest}
        isTriggeringDigest={isTriggeringDigest}
        handleRunRetentionCleanup={handleRunRetentionCleanup}
        isCleaningRetention={isCleaningRetention}
        currentUser={currentUser}
        formatVnDateTime={formatVnDateTime}
        handleExportCsv={handleExportCsv}
      />

      {/* ── CRON JOBS MANAGER MODAL ─────────────────────────────────────────── */}
      <CronJobsModal
        isOpen={isCronJobsModalOpen}
        onClose={() => setIsCronJobsModalOpen(false)}
        configState={configState}
        setConfigState={setConfigState}
        saveConfig={saveConfig}
        handleTriggerDailyDigest={handleTriggerDailyDigest}
        handleRunRetentionCleanup={handleRunRetentionCleanup}
        isCleaningRetention={isCleaningRetention}
        lang={lang}
        currentUser={currentUser}
      />

      {/* ── PASSWORD CHANGE MODAL ────────────────────────────────────────────── */}
      <PasswordChangeModal
        isOpen={isPasswordChangeOpen}
        onClose={() => setIsPasswordChangeOpen(false)}
        currentUser={currentUser}
        addToast={addToast}
      />

      {/* ── TAB HELP / DOCUMENTATION MODAL ───────────────────────────────────── */}
      <TabHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        activeTab={activeTab}
        lang={lang}
      />
    </div>
  );
}
