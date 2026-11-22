import React from 'react';
import { X, HelpCircle, Activity, AlertTriangle, Search, Cpu, Settings, ShieldCheck, CheckCircle2, GitCommit, Layers, Wrench } from 'lucide-react';

const TAB_INFO = {
  overview: {
    titleVi: 'Hướng Dẫn: Tổng Quan Hệ Thống (Overview)',
    titleEn: 'Guide: System Overview Dashboard',
    icon: Activity,
    badgeVi: 'GIÁM SÁT REALTIME',
    descVi: 'Trung tâm chỉ huy hiển thị tổng quan tình trạng của toàn bộ hệ sinh thái dịch vụ vi mô và hạ tầng.',
    sectionsVi: [
      {
        heading: '4 Thẻ Chỉ Số KPI Trực Tiếp',
        content: 'Tổng số log lưu trữ, số lượng bất thường phát hiện, số mẫu Drain đã trích xuất và tốc độ log thu nạp theo thời gian thực. Bấm trực tiếp vào từng thẻ để chuyển nhanh đến màn hình tương ứng.'
      },
      {
        heading: 'Mật Độ Lỗi Theo Khung Giờ (24h Heatmap)',
        content: 'Trực quan hóa tần suất lỗi theo 24 giờ trong ngày. Căn lề pixel-perfect giữa các cột giờ. Bấm trực tiếp vào bất kỳ ô nào để mở Modal xem chi tiết các lỗi trong khung giờ đó.'
      },
      {
        heading: 'Phân Tích Giờ Cao Điểm & Tỉ Lệ Mức Độ Lỗi',
        content: 'Thống kê tự động giờ cao điểm hay phát sinh sự cố nhất và phân bố tỷ lệ Critical, Error, Warning để đội SRE chủ động phòng ngừa.'
      },
      {
        heading: 'Luồng Log Streams Realtime',
        content: 'Hiển thị dữ liệu log đẩy về từ Socket.IO theo thời gian thực với cơ chế cuộn mượt tự động batch 10 log kèm bộ lọc cấp độ tức thì.'
      }
    ]
  },
  anomalies: {
    titleVi: 'Hướng Dẫn: Giám Sát Bất Thường (AIOps Anomaly Engine)',
    titleEn: 'Guide: AIOps Anomaly Detection Engine',
    icon: AlertTriangle,
    badgeVi: 'AIOPS ENGINE',
    descVi: 'Cơ chế phát hiện bất thường kết hợp 3 tầng thông minh và 3 phân hệ trực quan hóa chuyên sâu.',
    sectionsVi: [
      {
        heading: 'Phát Hiện Bất Thường (Anomaly Events)',
        content: 'Kết hợp Rule-Based, Thống kê Z-Score và Mô hình Học máy Isolation Forest (ngưỡng anomaly_score >= 0.5) để nhận diện sự cố chuẩn xác. Dữ liệu đồng bộ tức thì với bộ đếm KPI và AI Chatbot.'
      },
      {
        heading: 'Vòng Đời Xử Lý Sự Cố (Incident Lifecycle)',
        content: 'Hỗ trợ cập nhật trạng thái sự cố (MỚI → TIẾP NHẬN → ĐÃ XỬ LÝ) kèm ghi chú nguyên nhân gốc và biện pháp khắc phục.'
      },
      {
        heading: 'Dự Báo Xu Hướng (Time Series Forecast)',
        content: 'Sử dụng mô hình chuỗi thời gian để dự báo lưu lượng log và cảnh báo sớm các đột biến lỗi trước khi xảy ra sự cố ngừng hệ thống.'
      },
      {
        heading: 'Phân Cụm Không Gian (PCA Clustering)',
        content: 'Giảm chiều dữ liệu vector hóa log xuống không gian 2D/3D giúp phát hiện các cụm log bất thường tách biệt khỏi hành vi bình thường.'
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
        heading: 'Bộ Lọc Đa Chiều Hiện Đại',
        content: 'Tìm kiếm theo từ khóa thông minh, lọc theo cấp độ (INFO, WARN, ERROR, FATAL) và khoảng thời gian linh hoạt với Custom Select Dark Mode.'
      },
      {
        heading: 'Phân Trang Cuộn Vô Hạn (Infinite Scroll)',
        content: 'Tự động tải thêm từng đợt 10 log khi người dùng cuộn chuột tới cuối danh sách, tối ưu bộ nhớ trình duyệt.'
      },
      {
        heading: 'Phân Tích Nguyên Nhân Bằng AI (RCA)',
        content: 'Bấm nút "AI Giải Thích" tại bất kỳ dòng log lỗi nào để Trợ lý AI phân tích nguyên nhân gốc và đề xuất giải pháp xử lý tức thì.'
      },
      {
        heading: 'Xuất Báo Cáo Excel & CSV Chuẩn',
        content: 'Tải toàn bộ kết quả lọc ra file Excel chuyên nghiệp (.xlsx) có sẵn thanh bộ lọc dữ liệu (Auto-Filter) và CSV định dạng UTF-8.'
      }
    ]
  },
  templates: {
    titleVi: 'Hướng Dẫn: Mẫu Log Tự Động (Drain Mining)',
    titleEn: 'Guide: Drain Log Template Mining',
    icon: Layers,
    badgeVi: 'DRAIN ALGORITHM',
    descVi: 'Thuật toán cây phân tích trực tuyến tự động nhóm hàng triệu dòng log thô thành các mẫu định dạng cấu trúc.',
    sectionsVi: [
      {
        heading: 'Dữ Liệu Thật 100% Từ Hệ Thống',
        content: 'Khai phá trực tiếp từ OpenSearch và tập dữ liệu log thực tế chuẩn HDFS/BGL với thuật toán Drain bóc tách tham số dynamic.'
      },
      {
        heading: 'Phân Tách Biến Số Tham Số Hóa',
        content: 'Thay thế các giá trị biến động (IP, ID khối, Mã Hex, Token) bằng ký hiệu đại diện <*> và <IP> để gom nhóm các log cùng loại.'
      },
      {
        heading: 'Kéo Cuộn Vô Hạn (Infinite Scroll 10 Records)',
        content: 'Tải trước 10 mẫu log đầu tiên, tự động nạp tiếp từng chunk 10 mẫu khi cuộn xuống dưới, giúp trải nghiệm duyệt mượt mà.'
      }
    ]
  },
  pipeline: {
    titleVi: 'Hướng Dẫn: Giám Sát Chuỗi Thu Nạp (Pipeline Health)',
    titleEn: 'Guide: Ingestion Pipeline Health',
    icon: Cpu,
    badgeVi: 'PIPELINE TELEMETRY',
    descVi: 'Theo dõi tình trạng hoạt động, thông lượng và độ trễ của toàn bộ chuỗi tiếp nhận log.',
    sectionsVi: [
      {
        heading: 'Chuỗi Khối Microservices',
        content: 'Giám sát trạng thái 4 mắt xích cốt lõi: Ingestion Collector, Redis Buffer Queue, Drain Parser Worker và OpenSearch Storage.'
      },
      {
        heading: 'Độ Trễ & Tốc Độ Xử Lý (Throughput & Latency)',
        content: 'Đo lường thời gian trễ từ khi log phát sinh tới khi lưu trữ (ms) và số lượng log tiếp nhận mỗi giây (EPS).'
      },
      {
        heading: 'Cảnh Báo Nghẽn Hàng Đợi (Queue Lag)',
        content: 'Cảnh báo tự động khi số lượng log tồn đọng trong Redis Queue vượt ngưỡng an toàn để SRE can thiệp scale worker.'
      }
    ]
  },
  admin: {
    titleVi: 'Hướng Dẫn: Quản Trị & Bảo Trì SRE (Maintenance)',
    titleEn: 'Guide: SRE Administration & Maintenance',
    icon: Wrench,
    badgeVi: 'ENTERPRISE SRE',
    descVi: 'Trung tâm cấu hình cảnh báo, quản lý chế độ bảo trì và các tác vụ tự động hóa nền.',
    sectionsVi: [
      {
        heading: 'Cấu Hình Cảnh Báo Đa Kênh',
        content: 'Tích hợp cảnh báo thời gian thực qua Discord Webhook và Email SMTP khi phát sinh log FATAL hoặc Anomaly vượt ngưỡng.'
      },
      {
        heading: 'Chế Độ Bảo Trì (Maintenance Mode Silence)',
        content: 'Bật chế độ bảo trì tạm thời (15p, 30p, 60p) để tạm ngưng gửi cảnh báo rác trong lúc đội kỹ thuật triển khai bản cập nhật.'
      },
      {
        heading: 'Tự Động Dọn Dẹp Log (Retention Cleanup)',
        content: 'Tác vụ Cron tự động lưu trữ và thanh trừng các bản ghi log quá hạn để tiết kiệm dung lượng ổ đĩa.'
      }
    ]
  },
  trace: {
    titleVi: 'Hướng Dẫn: Truy Vết Phân Tán (Distributed Tracing)',
    titleEn: 'Guide: Distributed Tracing & Span Tree',
    icon: GitCommit,
    badgeVi: 'DISTRIBUTED TRACING',
    descVi: 'Truy vết hành trình của request qua các dịch vụ vi mô để xác định điểm nghẽn hiệu năng.',
    sectionsVi: [
      {
        heading: 'Cây Span & Cuộc Gọi API',
        content: 'Biểu diễn trực quan cây phân nhánh các lệnh gọi API giữa Gateway, Auth, Order, Payment và Database.'
      },
      {
        heading: 'Thời Gian Thực Thi (Execution Duration)',
        content: 'Đo lường thời gian xử lý chi tiết của từng mắt xích và tô màu đỏ các span bị nghẽn (bottleneck).'
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

