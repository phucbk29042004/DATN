# Graph Report - DATN  (2026-11-22)

## Corpus Check
- 97 files · ~100,529 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 2, .example 2, .log 2)

## Summary
- 721 nodes · 1398 edges · 30 communities (28 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4845a6c6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useTheme
- scripts
- full_evaluation.js
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
- log_generator.js
- alertService.js
- sqlite.js
- cronService.js
- parser/index.js

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 37 edges
2. `apiClient()` - 23 edges
3. `react-native` - 21 edges
4. `Nhật Ký Cập Nhật (Chronological Log)` - 21 edges
5. `App()` - 20 edges
6. `useAuth()` - 19 edges
7. `lucide-react-native` - 17 edges
8. `scripts` - 16 edges
9. `react-native-safe-area-context` - 16 edges
10. `useToast()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `[22/11/2026 12:28] — Đồng Bộ Kích Thước Nút Select & Sửa Lỗi Z-Index Dropdown Đè Lên Card` --references--> `CustomSelect()`  [INFERRED]
  tiendo.md → FE/src/components/CustomSelect.jsx
- `[20/11/2026 19:58] — Kích Hoạt Luồng Stream Log Realtime Thông Minh & Bộ Đếm KPI Tự Tăng` --references--> `startCloudLogStreamer()`  [INFERRED]
  tiendo.md → BE/search-api/index.js
- `flushBuffer()` --calls--> `runAnomalyDetection()`  [EXTRACTED]
  BE/parser/index.js → BE/anomaly-engine/index.js
- `exportVectorsForML()` --calls--> `vectorizeDataset()`  [EXTRACTED]
  BE/anomaly-engine/index.js → BE/anomaly-engine/template-mining/vectorizer.js
- `logParserWorker` --calls--> `checkLogLineSingle()`  [EXTRACTED]
  BE/parser/index.js → BE/anomaly-engine/rule-based/detector.js

## Import Cycles
- None detected.

## Communities (30 total, 2 thin omitted)

### Community 0 - "useTheme"
Cohesion: 0.07
Nodes (74): App(), MainApp(), apiClient(), getAuthToken(), setAuthToken(), CURRENT_LAN_IP, DEFAULT_API_BASE, DEFAULT_COLLECTOR_BASE (+66 more)

### Community 1 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, benchmark, benchmark:full, generate:logs, generate:vectors-bgl, generate:vectors-hdfs, ml:train-bgl, ml:train-hdfs (+8 more)

### Community 2 - "full_evaluation.js"
Cohesion: 0.06
Nodes (45): callMlPredict(), __dirname, DRAIN_WORKER_PATH, exportVectorsForML(), __filename, ML_API_TIMEOUT_MS, runAnomalyDetection(), vectorizeInWorker() (+37 more)

### Community 3 - "ml_api.py"
Cohesion: 0.07
Nodes (12): health(), lifespan(), _load_models(), predict(), PredictRequest, PredictResponse, reload_model(), _build_report() (+4 more)

### Community 4 - "App.jsx"
Cohesion: 0.08
Nodes (34): App(), formatVnDateTime(), KpiSkeleton(), LEVEL_COLORS, Skeleton(), ToastContainer(), toLocalDatetimeInputString(), useToast() (+26 more)

### Community 5 - "Mobile/package.json"
Cohesion: 0.07
Nodes (38): dependencies, expo@^58.0.25, expo-image-picker@^58.0.10, expo-status-bar@~58.0.5, lucide-react-native@^1.73.0, react@19.3.0, react-native@0.88.1, @react-native-async-storage/async-storage@2.2.0 (+30 more)

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
Nodes (24): 1.1. Bài toán thực tế, 1.2. Mục tiêu của hệ thống LogPulse, 1. TỔNG QUAN & BỐI CẢNH NGHIỆP VỤ, 2.1. Quản trị viên hệ thống (Admin / DevOps Lead), 2.2. Người giám sát & Kỹ sư vận hành (Viewer / SOC Analyst / L1 Support), 2. ĐỐI TƯỢNG NGƯỜI DÙNG & VAI TRÒ (ACTORS & PERSONAS), 3. MA TRẬN PHÂN QUYỀN TRUY CẬP (RBAC MATRIX), 4. CÁC QUY TRÌNH NGHIỆP VỤ CỐT LÕI (CORE BUSINESS WORKFLOWS) (+16 more)

### Community 11 - "expo"
Cohesion: 0.13
Nodes (14): backgroundColor, adaptiveIcon, expo, android, ios, name, orientation, slug (+6 more)

### Community 12 - "hdfs/generate_vectors.js"
Cohesion: 0.06
Nodes (40): buildBglTimeWindows(), loadBglDataset(), parseBglLogFile(), __dirname, LOG_FILE, main(), OUT_FILE, bglPath (+32 more)

### Community 13 - "Nhật Ký Cập Nhật (Chronological Log)"
Cohesion: 0.10
Nodes (20): [18/11/2026 12:28] — Xây Dựng Đồ Thị Tri Thức Codebase (Graphify) & Trích Xuất Dữ Liệu graph.json, [18/11/2026 12:42] — Khắc Phục Lỗi Hiển Thị Trắng Màn Hình & Hoàn Thiện Giao Diện Trực Quan Graphify (graph.html), [19/11/2026 17:20] — Chuẩn Hóa Bảng Màu Light Mode, Tái Thiết Kế Login Mobile & Dọn Dẹp Toàn Bộ Icon AI / Emoji Console Logs, [19/11/2026 18:08] — Thiết Kế Lại 3 Nút Trạng Thái, Khắc Phục Lỗi Nhấp Nháy Nút Truy Vấn & Bổ Sung Bottom Nav Mobile Trên Web, [19/11/2026 18:22] — Sửa Lỗi Hiển Thị Thanh Điều Hướng Đáy & Tinh Chỉnh Cỡ Chữ Sidebar Mobile Vừa Vặn, [19/11/2026 19:30] — Tích Hợp SQLite Database 7 Bảng Chuẩn Doanh Nghiệp & Cấu Hình Triển Khai Vercel (FE) + Render (BE), [19/11/2026 20:05] — Khắc Phục Lỗi WebSocket & Login 405 Vercel, Sẵn Sàng Deploy Backend Lên Render, [20/11/2026 19:10] — Cố Định URL Backend Render (datn-juwa) & Tinh Gọn Modal Login (+12 more)

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
Cohesion: 0.15
Nodes (12): BƯỚC 1: KHỞI ĐỘNG HẠ TẦNG CƠ SỞ (REDIS & OPENSEARCH), BƯỚC 2: KHỞI ĐỘNG CÁC DỊCH VỤ BACKEND PIPELINE, BƯỚC 3: KHỞI ĐỘNG ML API SERVICE *(TÙY CHỌN DỰ ĐOÁN HỌC MÁY)*, BƯỚC 4: KHỞI ĐỘNG GIAO DIỆN FRONTEND (REACT DASHBOARD), BƯỚC 5: KÍCH HOẠT PHÁT LUỒNG DỮ LIỆU LOG THẬT (HDFS / BGL), CÁCH 1: KHỞI ĐỘNG (KHUYÊN DÙNG), CÁCH 2: KHỞI ĐỘNG THỦ CÔNG TỪNG BƯỚC (DÀNH CHO LẬP TRÌNH VIÊN), 📋 HƯỚNG DẪN KHỞI ĐỘNG DỰ ÁN (+4 more)

### Community 21 - "🚀 Hướng Dẫn Cài Đặt & Khởi Chạy"
Cohesion: 0.25
Nodes (7): 1. Cài đặt các thư viện phụ thuộc:, 2. Khởi chạy ứng dụng với Expo:, 3. Mở ứng dụng trên điện thoại:, 4. Kết nối API Backend:, 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy, 📱 Kiến Trúc Ứng Dụng (Mobile Architecture), LogPulse AI Mobile (Expo / React Native)

### Community 22 - "BÁO CÁO KẾT QUẢ ĐÁNH GIÁ ĐỊNH LƯỢNG VÀ HIỆU NĂNG HỆ THỐNG"
Cohesion: 0.29
Nodes (6): 1. KẾT QUẢ BENCHMARK HIỆU NĂNG PIPELINE (THROUGHPUT & LATENCY), 2. ĐÁNH GIÁ ĐỘ CHÍNH XÁC TRÊN TẬP DỮ LIỆU HDFS (HADOOP LOGS), 3. ĐÁNH GIÁ ĐỘ CHÍNH XÁC TRÊN TẬP DỮ LIỆU BGL (BLUE GENE/L), 4. PHÂN TÍCH & KẾT LUẬN THỰC NGHIỆM, BÁO CÁO KẾT QUẢ ĐÁNH GIÁ ĐỊNH LƯỢNG VÀ HIỆU NĂNG HỆ THỐNG, HỆ THỐNG PHÂN TÍCH LOG TẬP TRUNG VÀ PHÁT HIỆN BẤT THƯỜNG (LOGPULSE)

### Community 23 - "Kiến Trúc Hệ Thống Log Analytics & Anomaly Detection Dashboard"
Cohesion: 0.33
Nodes (5): 1. Luồng Dữ Liệu Realtime (Log Streaming Architecture), 2. Các Thành Phần Chính (Services & Ports), 3. ML Training Pipeline (Offline — chạy 1 lần), 4. Bộ Công Cụ Benchmark & Đánh Giá Định Lượng (Evaluation Suite), Kiến Trúc Hệ Thống Log Analytics & Anomaly Detection Dashboard

### Community 25 - "log_generator.js"
Cohesion: 0.33
Nodes (5): generateRandomBatch(), LEVELS, MESSAGES, sendLogsToCollector(), SERVICES

### Community 29 - "alertService.js"
Cohesion: 0.29
Nodes (10): alertConfig, alertDeduplicationMap, checkDeduplication(), dispatchAlerts(), getMaintenanceMode(), loadConfigFromSqlite(), saveConfigToSqlite(), sendDiscordAlert() (+2 more)

### Community 30 - "sqlite.js"
Cohesion: 0.24
Nodes (9): DATA_DIR, DB_PATH, __dirname, __filename, initDatabase(), layDanhSachTinNhanNoiBo(), luuTinNhanNoiBo(), migrateOldIncidentsFile() (+1 more)

### Community 31 - "cronService.js"
Cohesion: 0.38
Nodes (9): ghiLichSuCron(), cronConfig, generate24hDigestData(), initCronJobs(), reloadCronJobs(), runLogRetentionCleanup(), sendDailyDigestReport(), sendDiscordDigest() (+1 more)

### Community 36 - "parser/index.js"
Cohesion: 0.21
Nodes (13): dotenv@^16.4.5, addToBuffer(), flushBuffer(), logBuffer, logParserWorker, LOG_QUEUE_NAME, REALTIME_LOG_CHANNEL, redisPub (+5 more)

## Knowledge Gaps
- **1 isolated node(s):** `RFC-3164`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 302 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Nhật Ký Cập Nhật (Chronological Log)` connect `Nhật Ký Cập Nhật (Chronological Log)` to `search-api/index.js`, `App.jsx`?**
  _High betweenness centrality (0.291) - this node is a cross-community bridge._
- **What connects `RFC-3164` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.0689130020940415 - nodes in this community are weakly interconnected._
- **Why does `[20/11/2026 19:58] — Kích Hoạt Luồng Stream Log Realtime Thông Minh & Bộ Đếm KPI Tự Tăng` connect `search-api/index.js` to `Nhật Ký Cập Nhật (Chronological Log)`?**
  _High betweenness centrality (0.273) - this node is a cross-community bridge._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `full_evaluation.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `ml_api.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07419712070874862 - nodes in this community are weakly interconnected._