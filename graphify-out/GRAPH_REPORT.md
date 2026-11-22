# Graph Report - DATN  (2026-11-22)

## Corpus Check
- 96 files · ~102,782 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 2, .example 2, .log 2)

## Summary
- 731 nodes · 1377 edges · 36 communities (34 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b7bb0798`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useTheme
- scripts
- anomaly-engine/index.js
- ml_api.py
- App.jsx
- Mobile/package.json
- FE/package.json
- BE/package.json
- search-api/index.js
- desgin.md
- 4. CÁC QUY TRÌNH NGHIỆP VỤ CỐT LÕI (CORE BUSINESS WORKFLOWS)
- expo
- hdfs/generate_vectors.js
- Nhật Ký Cập Nhật (Chronological Log)
- queue/config.js
- opensearchQueries.js
- 📋 QUY TẮC BẮT BUỘC — AI AGENT PHẢI TUÂN THỦ
- PROJECT CONTEXT — Hệ thống phân tích log tập trung & phát hiện bất thường
- authService.js
- 📋 HƯỚNG DẪN KHỞI ĐỘNG DỰ ÁN
- 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy
- BÁO CÁO KẾT QUẢ ĐÁNH GIÁ ĐỊNH LƯỢNG VÀ HIỆU NĂNG HỆ THỐNG
- Kiến Trúc Hệ Thống Log Analytics & Anomaly Detection Dashboard
- vercel.json
- DrainParser
- hdfs/generate_vectors.js
- full_evaluation.js
- bgl/generate_vectors.js
- alertService.js
- sqlite.js
- cronService.js
- pipeline_benchmark.js
- parseLog
- statistical/detector.js
- parser/index.js

## God Nodes (most connected - your core abstractions)
1. `Nhật Ký Cập Nhật (Chronological Log)` - 36 edges
2. `useTheme()` - 35 edges
3. `apiClient()` - 21 edges
4. `App()` - 20 edges
5. `react-native` - 20 edges
6. `useAuth()` - 17 edges
7. `lucide-react-native` - 16 edges
8. `scripts` - 16 edges
9. `react-native-safe-area-context` - 15 edges
10. `lucide-react` - 14 edges

## Surprising Connections (you probably didn't know these)
- `[16/11/2026 18:45] — Nâng Cấp Toàn Diện UX/UI Mobile: Khắc Phục KPI, Biểu Đồ Đường SVG, Tìm Kiếm Trực Tiếp, Toast & Modal Cài Đặt` --references--> `SvgLineChart()`  [INFERRED]
  tiendo.md → Mobile/src/components/SvgLineChart.js
- `[09/11/2026 18:42] — Khởi Tạo Auth Gate Buộc Đăng Nhập Trước, Thêm Bảng Điều Khiển Cron Job Trên Submenu, Thiết Kế Lại Email/Discord Notification & Tối Ưu UX Đồ Thị` --references--> `reloadCronJobs()`  [INFERRED]
  tiendo.md → BE/search-api/cronService.js
- `[20/11/2026 19:58] — Kích Hoạt Luồng Stream Log Realtime Thông Minh & Bộ Đếm KPI Tự Tăng` --references--> `startCloudLogStreamer()`  [INFERRED]
  tiendo.md → BE/search-api/index.js
- `[09/11/2026 18:42] — Khởi Tạo Auth Gate Buộc Đăng Nhập Trước, Thêm Bảng Điều Khiển Cron Job Trên Submenu, Thiết Kế Lại Email/Discord Notification & Tối Ưu UX Đồ Thị` --references--> `LoginModal()`  [INFERRED]
  tiendo.md → FE/src/components/LoginModal.jsx
- `setMaintenanceMode()` --calls--> `ghiNhatKyHeThong()`  [EXTRACTED]
  BE/search-api/alertService.js → BE/database/sqlite.js

## Import Cycles
- None detected.

## Communities (36 total, 2 thin omitted)

### Community 0 - "useTheme"
Cohesion: 0.07
Nodes (72): App(), MainApp(), apiClient(), getAuthToken(), setAuthToken(), CURRENT_LAN_IP, DEFAULT_API_BASE, DEFAULT_COLLECTOR_BASE (+64 more)

### Community 1 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, benchmark, benchmark:full, generate:logs, generate:vectors-bgl, generate:vectors-hdfs, ml:train-bgl, ml:train-hdfs (+8 more)

### Community 2 - "anomaly-engine/index.js"
Cohesion: 0.22
Nodes (11): callMlPredict(), __dirname, DRAIN_WORKER_PATH, exportVectorsForML(), __filename, ML_API_TIMEOUT_MS, runAnomalyDetection(), vectorizeInWorker() (+3 more)

### Community 3 - "ml_api.py"
Cohesion: 0.07
Nodes (12): health(), lifespan(), _load_models(), predict(), PredictRequest, PredictResponse, reload_model(), _build_report() (+4 more)

### Community 4 - "App.jsx"
Cohesion: 0.08
Nodes (34): App(), formatVnDateTime(), KpiSkeleton(), LEVEL_COLORS, Skeleton(), ToastContainer(), toLocalDatetimeInputString(), useToast() (+26 more)

### Community 5 - "Mobile/package.json"
Cohesion: 0.07
Nodes (36): dependencies, expo@^58.0.25, expo-status-bar@~58.0.5, lucide-react-native@^1.73.0, react@19.3.0, react-native@0.88.1, @react-native-async-storage/async-storage@2.2.0, react-native-safe-area-context@~5.11.1 (+28 more)

### Community 6 - "FE/package.json"
Cohesion: 0.09
Nodes (29): dependencies, lucide-react@^0.380.0, react@^18.3.1, react-dom@^18.3.1, recharts@^2.12.7, socket.io-client@^4.8.3, xlsx@^0.18.5, devDependencies (+21 more)

### Community 7 - "BE/package.json"
Cohesion: 0.10
Nodes (28): dependencies, bcryptjs@^3.0.3, better-sqlite3@^13.2.0, bullmq@^5.1.0, cors@^2.8.5, express@^4.19.2, ioredis@^5.3.2, jsonwebtoken@^9.0.3 (+20 more)

### Community 8 - "search-api/index.js"
Cohesion: 0.13
Nodes (18): allowedOrigins, app, broadcastNewLog(), corsOptions, currentFile, __dirname, __filename, getRealLogsPool() (+10 more)

### Community 9 - "desgin.md"
Cohesion: 0.05
Nodes (37): Border Radius Scale, Brand & Accent, Brand Gradient, Breakpoints, Buttons, Cards & Containers, Collapsing Strategy, Colors (+29 more)

### Community 10 - "4. CÁC QUY TRÌNH NGHIỆP VỤ CỐT LÕI (CORE BUSINESS WORKFLOWS)"
Cohesion: 0.08
Nodes (23): 1.1. Bài toán thực tế, 1.2. Mục tiêu của hệ thống LogPulse, 1. TỔNG QUAN & BỐI CẢNH NGHIỆP VỤ, 2.1. Quản trị viên hệ thống (Admin / DevOps Lead), 2.2. Người giám sát & Kỹ sư vận hành (Viewer / SOC Analyst / L1 Support), 2. ĐỐI TƯỢNG NGƯỜI DÙNG & VAI TRÒ (ACTORS & PERSONAS), 3. MA TRẬN PHÂN QUYỀN TRUY CẬP (RBAC MATRIX), 4. CÁC QUY TRÌNH NGHIỆP VỤ CỐT LÕI (CORE BUSINESS WORKFLOWS) (+15 more)

### Community 11 - "expo"
Cohesion: 0.13
Nodes (14): backgroundColor, adaptiveIcon, expo, android, ios, name, orientation, slug (+6 more)

### Community 12 - "hdfs/generate_vectors.js"
Cohesion: 0.07
Nodes (29): bglPath, __dirname, hdfsPath, outputPath, parseBglLine(), parseHdfsLine(), run(), __dirname (+21 more)

### Community 13 - "Nhật Ký Cập Nhật (Chronological Log)"
Cohesion: 0.06
Nodes (35): [04/11/2026 12:05] — Khắc Phục Triệt Để Toàn Bộ Lỗi Responsive Trên Mobile & Tablet (Header, Anti-Overflow, Pipeline Grid & Bảng Dữ Liệu), [07/11/2026 11:35] — Nâng Cấp Hệ Thống 2 Tab Anomaly (Danh Sách & Biểu Đồ Phân Tích Đa Chiều), Sửa Lỗi Tooltip Dark Mode & Đồng Bộ Toàn Diện Web & Mobile App, [07/11/2026 11:50] — Thiết Kế Lại Sub-Tabs Segmented Control, Tái Cấu Trúc Bố Cục 4 Thẻ KPI, Sửa Lỗi NaN:NaN & Warning Unique Key (Web & Mobile), [07/11/2026 12:10] — Việt Hóa Đa Ngôn Ngữ Nhãn Mức Độ Log, Tối Ưu Chiều Cao Heatmap Dạng Ma Trận Ngang & Chống Tràn Card Diễn Biến Điểm Bất Thường (Đồng Bộ Web & Mobile), [09/11/2026 19:04] — Khắc Phục Lỗi Modal Cron Jobs, Thiết Kế Lại Form Đăng Nhập Chuẩn SaaS (Ảnh Đồ Họa + Icon Ẩn/Hiện Mật Khẩu), Bổ Sung Tab Sức Khỏe Pipeline Lên Sidebar & Đồng Bộ Mobile, [09/11/2026 19:06] — Sửa Lỗi Runtime ReferenceError Server is not defined trong FE/src/App.jsx, [09/11/2026 19:28] — Tinh Chỉnh Icon Chatbot Kéo Thả Tự Do (Draggable), Ẩn Nút Đóng Trùng Lặp, Rút Gọn Prompt Chatbot & Chuẩn Hóa Tiếng Việt Form Đăng Nhập (Đồng Bộ Web & Mobile), [09/11/2026 20:13] — Thiết Lập .gitignore, Khởi Tạo Git & Đẩy Thành Công Toàn Bộ Mã Nguồn Lên GitHub (+27 more)

### Community 14 - "queue/config.js"
Cohesion: 0.16
Nodes (13): app, rawLogsQueue, REDIS_HOST, REDIS_PORT, REDIS_URL, redisConnection, redisOptions, redisSub (+5 more)

### Community 15 - "opensearchQueries.js"
Cohesion: 0.19
Nodes (17): __dirname, extractDrainTemplate(), fallbackAnomalyAnalytics(), fallbackDrainTemplates(), fallbackKpiStats(), fallbackLogStats(), fallbackRecentAnomalies(), fallbackSearchLogs() (+9 more)

### Community 17 - "📋 QUY TẮC BẮT BUỘC — AI AGENT PHẢI TUÂN THỦ"
Cohesion: 0.14
Nodes (13): 📋 QUY TẮC BẮT BUỘC — AI AGENT PHẢI TUÂN THỦ, 🔴 RULE #0 — ĐỌC RULE TRƯỚC, LÀM SAU, ⚡ RULE #10 — TỪ KHÓA ĐẶC BIỆT, 🔁 RULE #11 — NHẮC NHỞ KHI AGENT QUÊN, 🌐 RULE #1 — NGÔN NGỮ & ĐỘ DÀI PHẢN HỒI (QUAN TRỌNG), 🛑 RULE #2 — PHÁT HIỆN YÊU CẦU MƠ HỒ, 🛑 RULE #3 — PLAN TRƯỚC, CODE SAU, 🛑 RULE #4 — CHỈ SỬA ĐÚNG PHẠM VI (+5 more)

### Community 18 - "PROJECT CONTEXT — Hệ thống phân tích log tập trung & phát hiện bất thường"
Cohesion: 0.13
Nodes (14): 10. Kế hoạch triển khai (Trạng thái hiện tại), 11. Nguyên tắc làm việc cho AI Agent, 1. Thông tin đề tài, 2.1. Mục tiêu tổng quát, 2.2. Mục tiêu cụ thể, 2. Mục tiêu, 3. Định nghĩa Anomaly và đơn vị phát hiện, 4. Dataset (+6 more)

### Community 19 - "authService.js"
Cohesion: 0.21
Nodes (13): db, ghiNhatKyHeThong(), authenticateToken(), changePassword(), loginUser(), optionalAuth(), requireAdmin(), addIncidentNote() (+5 more)

### Community 20 - "📋 HƯỚNG DẪN KHỞI ĐỘNG DỰ ÁN"
Cohesion: 0.14
Nodes (13): 🟢 BƯỚC 1: KHỞI ĐỘNG HẠ TẦNG CƠ SỞ (REDIS & OPENSEARCH), 🔵 BƯỚC 2: KHỞI ĐỘNG CÁC DỊCH VỤ BACKEND PIPELINE, 🟣 BƯỚC 3: KHỞI ĐỘNG ML API SERVICE *(TÙY CHỌN DỰ ĐOÁN HỌC MÁY)*, 🟡 BƯỚC 4: KHỞI ĐỘNG GIAO DIỆN FRONTEND (REACT DASHBOARD), ⚡ BƯỚC 5: KÍCH HOẠT PHÁT LUỒNG DỮ LIỆU LOG THẬT (HDFS / BGL), 🏗️ BẢNG TỔNG HỢP DỊCH VỤ & CỔNG KẾT NỐI (PORTS), 🚀 CÁCH 1: KHỞI ĐỘNG SIÊU TỐC 1-CLICK (KHUYÊN DÙNG), 🛠️ CÁCH 2: KHỞI ĐỘNG THỦ CÔNG TỪNG BƯỚC (DÀNH CHO LẬP TRÌNH VIÊN) (+5 more)

### Community 21 - "🚀 Hướng Dẫn Cài Đặt & Khởi Chạy"
Cohesion: 0.25
Nodes (7): 1. Cài đặt các thư viện phụ thuộc:, 2. Khởi chạy ứng dụng với Expo:, 3. Mở ứng dụng trên điện thoại:, 4. Kết nối API Backend:, 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy, 📱 Kiến Trúc Ứng Dụng (Mobile Architecture), LogPulse AI Mobile (Expo / React Native)

### Community 22 - "BÁO CÁO KẾT QUẢ ĐÁNH GIÁ ĐỊNH LƯỢNG VÀ HIỆU NĂNG HỆ THỐNG"
Cohesion: 0.29
Nodes (6): 1. KẾT QUẢ BENCHMARK HIỆU NĂNG PIPELINE (THROUGHPUT & LATENCY), 2. ĐÁNH GIÁ ĐỘ CHÍNH XÁC TRÊN TẬP DỮ LIỆU HDFS (HADOOP LOGS), 3. ĐÁNH GIÁ ĐỘ CHÍNH XÁC TRÊN TẬP DỮ LIỆU BGL (BLUE GENE/L), 4. PHÂN TÍCH & KẾT LUẬN THỰC NGHIỆM, BÁO CÁO KẾT QUẢ ĐÁNH GIÁ ĐỊNH LƯỢNG VÀ HIỆU NĂNG HỆ THỐNG, HỆ THỐNG PHÂN TÍCH LOG TẬP TRUNG VÀ PHÁT HIỆN BẤT THƯỜNG (LOGPULSE)

### Community 23 - "Kiến Trúc Hệ Thống Log Analytics & Anomaly Detection Dashboard"
Cohesion: 0.33
Nodes (5): 1. Luồng Dữ Liệu Realtime (Log Streaming Architecture), 2. Các Thành Phần Chính (Services & Ports), 3. ML Training Pipeline (Offline — chạy 1 lần), 4. Bộ Công Cụ Benchmark & Đánh Giá Định Lượng (Evaluation Suite), Kiến Trúc Hệ Thống Log Analytics & Anomaly Detection Dashboard

### Community 25 - "DrainParser"
Cohesion: 0.24
Nodes (6): DrainParser, LogCluster, mergeTemplates(), similarity(), tokenize(), fitDrain()

### Community 26 - "hdfs/generate_vectors.js"
Cohesion: 0.26
Nodes (9): __dirname, LABEL_FILE, LOG_FILE, main(), OUT_FILE, buildHdfsSequences(), loadHdfsDataset(), loadHdfsLabels() (+1 more)

### Community 27 - "full_evaluation.js"
Cohesion: 0.24
Nodes (10): BGL_LOG, calculateMetrics(), calculatePercentiles(), __dirname, generateMockLogs(), HDFS_LABEL, HDFS_LOG, RESULTS_BGL (+2 more)

### Community 28 - "bgl/generate_vectors.js"
Cohesion: 0.25
Nodes (7): buildBglTimeWindows(), loadBglDataset(), parseBglLogFile(), __dirname, LOG_FILE, main(), OUT_FILE

### Community 29 - "alertService.js"
Cohesion: 0.29
Nodes (10): alertConfig, alertDeduplicationMap, checkDeduplication(), dispatchAlerts(), getMaintenanceMode(), loadConfigFromSqlite(), saveConfigToSqlite(), sendDiscordAlert() (+2 more)

### Community 30 - "sqlite.js"
Cohesion: 0.24
Nodes (9): DATA_DIR, DB_PATH, __dirname, __filename, initDatabase(), layDanhSachTinNhanNoiBo(), luuTinNhanNoiBo(), migrateOldIncidentsFile() (+1 more)

### Community 31 - "cronService.js"
Cohesion: 0.38
Nodes (9): ghiLichSuCron(), cronConfig, generate24hDigestData(), initCronJobs(), reloadCronJobs(), runLogRetentionCleanup(), sendDailyDigestReport(), sendDiscordDigest() (+1 more)

### Community 32 - "pipeline_benchmark.js"
Cohesion: 0.33
Nodes (6): ALERT_LEVELS, checkLogLineSingle(), CRITICAL_KEYWORDS, calculatePercentiles(), generateMockLogs(), runBenchmark()

### Community 33 - "parseLog"
Cohesion: 0.50
Nodes (6): generateLogHashId(), parseJsonLog(), parseLog(), parseNginxLog(), parseSyslog(), RFC-3164

### Community 34 - "statistical/detector.js"
Cohesion: 0.62
Nodes (6): buildTimeSeries(), detectMovingAverage(), detectStatistical(), detectZScore(), mean(), stdDev()

### Community 36 - "parser/index.js"
Cohesion: 0.21
Nodes (13): dotenv@^16.4.5, addToBuffer(), flushBuffer(), logBuffer, logParserWorker, LOG_QUEUE_NAME, REALTIME_LOG_CHANNEL, redisPub (+5 more)

## Knowledge Gaps
- **1 isolated node(s):** `RFC-3164`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 315 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `[09/11/2026 18:42] — Khởi Tạo Auth Gate Buộc Đăng Nhập Trước, Thêm Bảng Điều Khiển Cron Job Trên Submenu, Thiết Kế Lại Email/Discord Notification & Tối Ưu UX Đồ Thị` connect `App.jsx` to `Nhật Ký Cập Nhật (Chronological Log)`, `cronService.js`?**
  _High betweenness centrality (0.258) - this node is a cross-community bridge._
- **What connects `RFC-3164` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.0686456400742115 - nodes in this community are weakly interconnected._
- **Why does `reloadCronJobs()` connect `cronService.js` to `search-api/index.js`, `App.jsx`?**
  _High betweenness centrality (0.246) - this node is a cross-community bridge._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `ml_api.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07419712070874862 - nodes in this community are weakly interconnected._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07686932215234102 - nodes in this community are weakly interconnected._