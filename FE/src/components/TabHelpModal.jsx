import React from 'react';
import { X, HelpCircle, Activity, AlertTriangle, Search, Cpu, Settings, ShieldCheck, CheckCircle2 } from 'lucide-react';

const TAB_INFO = {
  overview: {
    titleVi: 'Hướng Dẫn: Tổng Quan Hệ Thống (Overview)',
    titleEn: 'Guide: System Overview Dashboard',
    icon: Activity,
    badgeVi: 'GIÁM SÁT REALTIME',
    descVi: 'Trung tâm chỉ huy hiển thị tổng quan tình trạng của toàn bộ hệ sinh thái dịch vụ.',
    sectionsVi: [
      {
        heading: '4 Thẻ Chỉ Số KPI Trực Tiếp',
        content: 'Tổng số log lưu trữ, số lượng bất thường phát hiện, số mẫu Drain đã trích xuất và tốc độ log thu nạp theo thời gian thực. Bạn có thể bấm trực tiếp vào từng thẻ để chuyển nhanh đến màn hình tương ứng.'
      },
      {
        heading: 'Biểu Đồ Xu Hướng & Phân Phối',
        content: 'Quan sát tốc độ thu thập log theo từng mốc thời gian và tỷ lệ phân phối giữa các cấp độ INFO, WARN, ERROR, FATAL.'
      },
      {
        heading: 'Luồng Log Streams Realtime',
        content: 'Hiển thị dữ liệu log đẩy về từ Socket.IO theo thời gian thực với cơ chế cuộn mượt tự động (Infinite Scroll) batch 10 log.'
      }
    ]
  },
  anomalies: {
    titleVi: 'Hướng Dẫn: Giám Sát Bất Thường (3-Tier Anomaly Engine)',
    titleEn: 'Guide: 3-Tier Anomaly Detection Engine',
    icon: AlertTriangle,
    badgeVi: 'AIOPS ENGINE',
    descVi: 'Cơ chế phát hiện bất thường kết hợp 3 tầng thông minh giúp nhận diện sự cố chuẩn xác.',
    sectionsVi: [
      {
        heading: 'Tầng 1: Rule-Based (Từ Khóa Nguy Hiểm)',
        content: 'Bắt tức thì các lỗi nghiêm trọng định sẵn như OutOfMemory, Connection Refused, Deadlock, NullPointer.'
      },
      {
        heading: 'Tầng 2: Statistical (Thống Kê Z-Score)',
        content: 'Phát hiện sự đột biến bất thường về tần suất xuất hiện log so với ngưỡng trung bình lịch sử.'
      },
      {
        heading: 'Tầng 3: Machine Learning (Drain Template & Model)',
        content: 'Bóc tách cấu trúc cú pháp log và sử dụng mô hình học máy để phân loại các hành vi lạ chưa từng gặp.'
      },
      {
        heading: 'Vòng Đời Xử Lý Sự Cố (Incident Lifecycle)',
        content: 'Hỗ trợ đổi trạng thái (Mới ➔ Tiếp nhận ➔ Đã xử lý) kèm ghi chú phương án khắc phục (Remediation Notes).'
      }
    ]
  },
  search: {
    titleVi: 'Hướng Dẫn: Tìm Kiếm & Lọc Log Nâng Cao',
    titleEn: 'Guide: Advanced Log Search & Analytics',
    icon: Search,
    badgeVi: 'OPENSEARCH CLUSTER',
    descVi: 'Công cụ truy vấn dữ liệu log tốc độ cao hỗ trợ điều tra sự cố và phân tích chuyên sâu.',
    sectionsVi: [
      {
        heading: 'Bộ Lọc Đa Chiều',
        content: 'Tìm kiếm theo từ khóa thông minh, lọc theo cấp độ (INFO, WARN, ERROR, FATAL) và khoảng thời gian linh hoạt với bộ chọn ngày giờ hiện đại.'
      },
      {
        heading: 'Phân Tích Bằng AI (AI Root Cause Analysis)',
        content: 'Bấm nút "AI Giải Thích" tại bất kỳ dòng log lỗi nào để Trợ lý AI phân tích nguyên nhân gốc và đề xuất giải pháp xử lý.'
      },
      {
        heading: 'Xuất Báo Cáo Excel Chuẩn (.xlsx)',
        content: 'Tải toàn bộ kết quả lọc ra file Excel chuyên nghiệp có sẵn thanh bộ lọc dữ liệu (Auto-Filter) và in đậm tiêu đề.'
      }
    ]
  },
  templates: {
    titleVi: 'Hướng Dẫn: Khai Phá Mẫu Log Tự Động (Drain Mining)',
    titleEn: 'Guide: Drain Log Template Mining',
    icon: Cpu,
    badgeVi: 'DRAIN ALGORITHM',
    descVi: 'Thuật toán cây phân tích trực tuyến tự động nhóm hàng triệu dòng log thô thành các mẫu định dạng cấu trúc.',
    sectionsVi: [
      {
        heading: 'Cơ Chế Bóc Tách Biến Số',
        content: 'Thay thế các giá trị biến động (IP, User ID, Token, UUID) bằng ký hiệu đại diện <*> để gom nhóm các log cùng loại.'
      },
      {
        heading: 'Đánh Giá Bất Thường Cấu Trúc',
        content: 'Mỗi template được tính toán điểm bất thường (Anomaly Score) dựa trên mức độ hiếm gặp và từ khóa nhạy cảm.'
      },
      {
        heading: 'Kiểm Thử Nhanh Trên UI',
        content: 'Bạn chỉ cần bấm nút "⚡ Nạp Log Thử Nghiệm" ngay trên giao diện để hệ thống tự động sinh log và trích xuất template tức thì.'
      }
    ]
  }
};

export default function TabHelpModal({ isOpen, onClose, activeTab, lang = 'vi' }) {
  if (!isOpen) return null;

  const isVi = lang === 'vi';
  const info = TAB_INFO[activeTab] || TAB_INFO.overview;
  const IconComponent = info.icon;

  return (
    <div className="modal-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div className="modal-container" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <IconComponent size={17} />
            </div>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isVi ? info.titleVi : info.titleEn}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 600, letterSpacing: '0.04em' }}>
                {info.badgeVi}
              </span>
            </div>
          </div>
          <button className="toast-close" onClick={onClose} aria-label="Close" style={{ position: 'static' }}>
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {info.descVi}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {info.sectionsVi.map((sec, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.75rem 0.9rem',
                  background: 'var(--bg-input, rgba(255,255,255,0.03))',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px'
                }}
              >
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <CheckCircle2 size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  {sec.heading}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  {sec.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="toggle-btn"
            style={{ padding: '0.4rem 1.1rem', fontSize: '0.84rem', borderRadius: '8px' }}
            onClick={onClose}
          >
            {isVi ? 'Đã Hiểu' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}

