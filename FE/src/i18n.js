export const LEVEL_MAP = {
  vi: {
    INFO: 'Thông tin',
    WARN: 'Cảnh báo',
    ERROR: 'Lỗi',
    FATAL: 'Nghiêm trọng'
  },
  en: {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    FATAL: 'FATAL'
  }
};

export const translations = {
  vi: {
    brand: "Hệ Thống Phân Tích Log",
    navOverview: "Tổng Quan Hệ Thống",
    navAnomalies: "Phát Hiện Bất Thường",
    navSearch: "Tìm Kiếm Log",
    navTemplates: "Khai Phá Template",

    headerTitleOverview: "Hệ Thống Giám Sát Log & Bất Thường Realtime",
    headerTitleAnomalies: "Phân Tích Bất Thường",
    headerTitleSearch: "Truy Vấn & Phân Tích Log Chi Tiết",
    headerTitleTemplates: "Trích Xuất Mẫu Template Log",
    liveIngestion: "Đang Nhận Log Realtime",

    kpiTotalLogs: "Tổng Số Log (24h)",
    kpiAnomalies: "Phát Hiện Bất Thường",
    kpiTemplates: "Số Template Miner",
    kpiLatency: "Độ Trễ Phân Tích",
    kpiLogsTrend: "so với giờ trước",
    kpiFatalAlerts: "cảnh báo mức FATAL mới",
    kpiDrainActive: "Thuật toán Drain đang chạy",
    kpiRealtimeStream: "Xử lý dòng thời gian thực",

    chartIngestionTitle: "Tốc Độ Thu Thập & Bất Thường Theo Thời Gian",
    chartSeverityTitle: "Phân Phối Mức Độ Nghiêm Trọng",
    chartLogsIngested: "Tổng Log Ingest",
    chartAnomaliesDetected: "Bất Thường Phát Hiện",

    tableTitle: "Danh Sách Log Streams & Anomalies Realtime",
    searchPlaceholder: "Nhập từ khóa tìm kiếm (VD: block, ERROR, connection...)",
    filterAllLevels: "Tất cả Mức Độ",

    colTime: "Thời Gian",
    colService: "Dịch Vụ",
    colLevel: "Mức Độ",
    colMessage: "Thông Điệp Log",
    colScore: "Độ Bất Thường",
    colRule: "Quy Tắc Kích Hoạt",
    colLifecycle: "Trạng Thái & Thao Tác",

    themeLight: "Giao Diện Sáng",
    themeDark: "Giao Diện Tối",
    langVN: "Tiếng Việt",
    langEN: "English",

    // Anomaly Tab UI
    anomalyTier1Title: "Tầng 1: Rule-Based Anomaly Detector",
    anomalyTier1Desc: "Phát hiện từ khóa lỗi nghiêm trọng (Fatal Keywords) & vượt ngưỡng tần suất ERROR/FATAL trong khung thời gian (Time Window).",
    anomalyTier2Title: "Tầng 2: Statistical Detector (Z-Score & Moving Average)",
    anomalyTier2Desc: "Phân tích biến động tần suất đột biến của log bằng phương pháp thống kê Z-score và trung bình động.",
    anomalyTier3Title: "Tầng 3: Template Mining (Drain) + ML Classifier",
    anomalyTier3Desc: "Trích xuất Event Count Vector từ cây Drain parse tree và phân loại chuỗi bất thường bằng Isolation Forest / Logistic Regression.",

    // Search Tab UI
    searchFilterTitle: "Bộ Lọc Truy Vấn Nâng Cao",
    searchQueryLabel: "Từ khóa tìm kiếm",
    searchFromLabel: "Thời gian bắt đầu",
    searchToLabel: "Thời gian kết thúc",
    btnSearch: "Truy Vấn Ngay",
    quickTimeTitle: "Chọn nhanh khoảng thời gian:",
    quick1h: "1 Giờ Qua",
    quick24h: "24 Giờ Qua",
    quick7d: "7 Ngày Qua",

    // Templates Tab UI
    templateTreeTitle: "Mẫu Log Tự Động (Drain Mining)",
    templateTreeDesc: "Thuật toán Drain tự động gom nhóm các dòng log tương tự thành Mẫu (Template) cố định và thay thế biến động bằng ký tự đại diện (*).",

    navSettings: "Cấu Hình & Cảnh Báo",
    headerTitleSettings: "Quản Lý Cấu Hình Quy Tắc & Cảnh Báo Đa Kênh",
    btnExportCsv: "Xuất Báo Cáo CSV",
    modalLogDetailTitle: "Chi Tiết Dòng Log",
    configTitle: "Cấu Hình Hệ Thống & Cảnh Báo",
    configThresholdLabel: "Ngưỡng Anomaly Score Kích Hoạt Cảnh Báo (0.0 - 1.0)",
    configDiscordSection: "Kênh Cảnh Báo Discord Webhook (Tức thời)",
    configDiscordEnable: "Bật cảnh báo qua Discord Webhook",
    configDiscordUrlLabel: "Discord Webhook URL",
    configEmailSection: "Kênh Cảnh Báo Email SMTP (Báo cáo sự cố)",
    configEmailEnable: "Bật cảnh báo qua Email (SMTP)",
    configReceiverEmailLabel: "Email nhận thông báo (Receiver Email)",
    configSmtpHostLabel: "SMTP Host (VD: smtp.gmail.com)",
    configSmtpPortLabel: "SMTP Port (587 hoặc 465)",
    configSmtpUserLabel: "Tài khoản Gmail gửi đi",
    configSmtpPassLabel: "Mật khẩu ứng dụng Gmail (App Password)",
    configSaveBtn: "Lưu Cấu Hình",

    // Log messages translated
    msgAuthFail: "Xác thực mật khẩu thất bại cho người dùng admin từ IP 192.168.1.105",
    msgDbTimeout: "Kết nối Cơ sở dữ liệu thất bại: Hết thời gian chờ kết nối tới PostgreSQL Master tại 10.0.4.12:5432",
    msgOrderOk: "Đơn hàng #ORD-98421 đã xử lý thành công cho khách hàng customer_id=8831",
    msgCpuHigh: "Phát hiện mức sử dụng CPU quá cao trên node-worker-03 (88.4%)",
    msgOom: "Ngoại lệ tràn bộ nhớ (Out of Memory) trong quá trình thực thi truy vấn ElasticSearch",
    msgSessionCreated: "Tạo phiên làm việc thành công mã session token_id=tk_9812497",

    // AI Assistant UI
    aiAssistantTitle: "Trợ lý cá nhân",
    aiWelcome: "Xin chào! Tôi là Trợ lý cá nhân LogPulse.",
    aiWelcomeDesc: "Hãy hỏi tôi bất cứ điều gì về log, anomaly hoặc cách khắc phục sự cố hệ thống.",
    aiInputPlaceholder: "Nhập câu hỏi về log, anomaly...",
    aiAnalyzing: "Đang phân tích...",
    aiExplainBtn: "Phân tích cùng AI",
    aiExplainResult: "Kết quả phân tích AI",
    aiClearHistory: "Xóa lịch sử",
    clearTimeBtn: "Đặt lại",

    // Auth & Pipeline Health UI
    btnPipelineHealth: "Sức Khỏe Pipeline",
    btnLogin: "Đăng Nhập",
    btnLogout: "Đăng Xuất",
    roleAdmin: "Quản Trị (Admin)",
    roleViewer: "Giám Sát (Viewer)",
    viewerNotice: "Tài khoản Viewer chỉ có quyền xem dữ liệu, không thể lưu cấu hình hệ thống.",

    // Incident Lifecycle & Maintenance UI
    incidentStatusNew: "MỚI",
    incidentStatusAck: "ĐÃ TIẾP NHẬN",
    incidentStatusResolved: "ĐÃ XỬ LÝ",
    btnAck: "Tiếp nhận",
    btnResolve: "Xử lý xong",
    btnAddNote: "Ghi chú",
    filterStatusAll: "Tất cả trạng thái",
    maintenanceBanner: "HỆ THỐNG ĐANG TRONG CHẾ ĐỘ BẢO TRÌ (Tạm ngừng gửi cảnh báo Discord & Email)",
    maintenanceTitle: "Chế Độ Bảo Trì & Tắt Cảnh Báo (Silence Alerts)",
    maintenanceEnable: "Kích hoạt chế độ bảo trì",
    maintenanceDurationLabel: "Thời hạn bảo trì (Phút)",
    alertKeywordsTitle: "Từ Khóa Kích Hoạt Cảnh Báo (Alert Keywords)",

    // Scheduled Reports & Retention UI
    digestTitle: "Báo Cáo Tự Động Định Kỳ (Daily Digest)",
    digestDesc: "Tự động tổng hợp và gửi bản báo cáo ca trực 24h qua Discord & Email mỗi ngày lúc 08:00 sáng.",
    digestEnable: "Bật tự động gửi báo cáo Daily Digest",
    btnTriggerDigest: "Gửi Báo Cáo 24h Ngay",
    retentionTitle: "Chính Sách Lưu Giữ Log (Log Retention Policy)",
    retentionDesc: "Tự động dọn dẹp các log cũ trong OpenSearch để tối ưu dung lượng lưu trữ.",
    retentionDaysLabel: "Thời gian lưu trữ tối đa (Số ngày)",
    retentionAutoCleanup: "Tự động dọn dẹp log quá hạn lúc 00:00 hàng ngày",
    btnRetentionCleanup: "Dọn Dẹp Log Cũ Ngay"
  },
  en: {
    brand: "LogPulse AI",
    navOverview: "System Overview",
    navAnomalies: "Anomaly Detection (3-Tier)",
    navSearch: "Log Search (OpenSearch)",
    navTemplates: "Template Mining (Drain)",

    headerTitleOverview: "Realtime Log Monitoring & Anomaly Detection System",
    headerTitleAnomalies: "Anomaly Analytics (Rule, Statistical & Drain ML)",
    headerTitleSearch: "Log Search & Deep Analytics",
    headerTitleTemplates: "Template Pattern Extraction (Drain Mining)",
    liveIngestion: "Live Ingestion Active",

    kpiTotalLogs: "Total Logs (24h)",
    kpiAnomalies: "Anomalies Detected",
    kpiTemplates: "Template Patterns",
    kpiLatency: "Pipeline Latency",
    kpiLogsTrend: "vs previous hour",
    kpiFatalAlerts: "new FATAL alerts",
    kpiDrainActive: "Drain Mining Active",
    kpiRealtimeStream: "Realtime Streaming",

    chartIngestionTitle: "Ingestion Throughput & Anomalies Over Time",
    chartSeverityTitle: "Log Severity Distribution",
    chartLogsIngested: "Total Ingested Logs",
    chartAnomaliesDetected: "Anomalies Detected",

    tableTitle: "Realtime Log Streams & Anomaly Events",
    searchPlaceholder: "Search logs by keyword (e.g. block, ERROR, connection...)",
    filterAllLevels: "All Severity Levels",

    colTime: "Timestamp",
    colService: "Service",
    colLevel: "Level",
    colMessage: "Log Message",
    colScore: "Anomaly Score",
    colRule: "Triggered Rule",
    colLifecycle: "Status & Actions",

    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    langVN: "Tiếng Việt",
    langEN: "English",

    // Anomaly Tab UI
    anomalyTier1Title: "Tier 1: Rule-Based Anomaly Detector",
    anomalyTier1Desc: "Detects fatal keywords and frequency thresholds within time windows.",
    anomalyTier2Title: "Tier 2: Statistical Detector (Z-Score & Moving Average)",
    anomalyTier2Desc: "Analyzes log frequency surges using statistical Z-score standard deviation.",
    anomalyTier3Title: "Tier 3: Template Mining (Drain) + ML Classifier",
    anomalyTier3Desc: "Extracts Event Count Vectors from Drain trees for Isolation Forest classification.",

    // Search Tab UI
    searchFilterTitle: "Advanced Query Filters",
    searchQueryLabel: "Search Keyword",
    searchFromLabel: "Start Time",
    searchToLabel: "End Time",
    btnSearch: "Execute Search",
    quickTimeTitle: "Quick Time Ranges:",
    quick1h: "Past 1 Hour",
    quick24h: "Past 24 Hours",
    quick7d: "Past 7 Days",

    // Templates Tab UI
    templateTreeTitle: "Drain Log Template Mining",
    templateTreeDesc: "Drain algorithm automatically clusters log messages into structured templates with wildcard tokens (*).",

    navSettings: "Settings & Alerts",
    headerTitleSettings: "System Configuration & Multi-Channel Alert Rules",
    btnExportCsv: "Export CSV Report",
    modalLogDetailTitle: "Log Inspection Detail",
    configTitle: "System Settings & Alerts",
    configThresholdLabel: "Anomaly Score Trigger Threshold (0.0 - 1.0)",
    configDiscordSection: "Discord Webhook Alert Channel (Realtime)",
    configDiscordEnable: "Enable Discord Webhook Alerts",
    configDiscordUrlLabel: "Discord Webhook URL",
    configEmailSection: "Email Alert Channel (Incident Reports)",
    configEmailEnable: "Enable Email (SMTP) Alerts",
    configReceiverEmailLabel: "Recipient Email Address",
    configSmtpHostLabel: "SMTP Host (e.g. smtp.gmail.com)",
    configSmtpPortLabel: "SMTP Port (587 or 465)",
    configSmtpUserLabel: "Sender Gmail Account",
    configSmtpPassLabel: "Gmail App Password",
    configSaveBtn: "Save Configuration",

    // Log messages translated
    msgAuthFail: "Failed password verification for user admin from IP 192.168.1.105",
    msgDbTimeout: "Database connection failed: Timeout connecting to PostgreSQL master at 10.0.4.12:5432",
    msgOrderOk: "Order #ORD-98421 successfully processed for customer_id=8831",
    msgCpuHigh: "High CPU utilization detected on node-worker-03 (88.4%)",
    msgOom: "Out of memory exception during ElasticSearch query execution window",
    msgSessionCreated: "User session created token_id=tk_9812497",

    // AI Assistant UI
    aiAssistantTitle: "Personal Assistant",
    aiWelcome: "Hello! I am your LogPulse Assistant.",
    aiWelcomeDesc: "Ask me anything about logs, anomalies, or system troubleshooting.",
    aiInputPlaceholder: "Ask about logs, anomalies...",
    aiAnalyzing: "Analyzing...",
    aiExplainBtn: "Analyze with AI",
    aiExplainResult: "AI Analysis Result",
    aiClearHistory: "Clear history",
    clearTimeBtn: "Reset",

    // Auth & Pipeline Health UI
    btnPipelineHealth: "Pipeline Health",
    btnLogin: "Sign In",
    btnLogout: "Sign Out",
    roleAdmin: "Admin",
    roleViewer: "Viewer",
    viewerNotice: "Viewer account is read-only and cannot modify system configurations.",

    // Incident Lifecycle & Maintenance UI
    incidentStatusNew: "NEW",
    incidentStatusAck: "ACKNOWLEDGED",
    incidentStatusResolved: "RESOLVED",
    btnAck: "Acknowledge",
    btnResolve: "Resolve",
    btnAddNote: "Notes",
    filterStatusAll: "All Statuses",
    maintenanceBanner: "SYSTEM IN MAINTENANCE MODE (Discord & Email alerts silenced)",
    maintenanceTitle: "Maintenance Mode (Silence Alerts)",
    maintenanceEnable: "Enable Maintenance Mode",
    maintenanceDurationLabel: "Maintenance Duration (Minutes)",
    alertKeywordsTitle: "Alert Trigger Keywords",

    // Scheduled Reports & Retention UI
    digestTitle: "Scheduled Daily Digest Reports",
    digestDesc: "Automatically compiles and delivers a 24-hour summary report via Discord & Email daily at 08:00 AM.",
    digestEnable: "Enable Daily Digest Reports",
    btnTriggerDigest: "Send 24h Digest Now",
    retentionTitle: "Log Retention & Storage Cleanup Policy",
    retentionDesc: "Automatically purges older logs in OpenSearch to optimize disk usage.",
    retentionDaysLabel: "Maximum retention period (Days)",
    retentionAutoCleanup: "Auto cleanup expired logs at midnight (00:00)",
    btnRetentionCleanup: "Purge Expired Logs Now"
  }
};
