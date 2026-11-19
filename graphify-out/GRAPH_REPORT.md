# Graph Report - DATN  (2026-11-19)

## Corpus Check
- 89 files · ~88,988 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 2, .log 2, .css 2)

## Summary
- 550 nodes · 1133 edges · 20 communities (19 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `59cab29f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useTheme
- full_evaluation.js
- incidentService.js
- ml_api.py
- App.jsx
- Mobile/package.json
- FE/package.json
- BE/package.json
- search-api/index.js
- parser/index.js
- scripts
- expo
- opensearch.js
- Nhật Ký Cập Nhật (Chronological Log)
- alertService.js
- log_generator.js
- 📋 QUY TẮC BẮT BUỘC — AI AGENT PHẢI TUÂN THỦ
- aiService.js
- authService.js

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 35 edges
2. `Nhật Ký Cập Nhật (Chronological Log)` - 24 edges
3. `apiClient()` - 21 edges
4. `react-native` - 20 edges
5. `App()` - 18 edges
6. `useAuth()` - 17 edges
7. `lucide-react-native` - 16 edges
8. `scripts` - 16 edges
9. `react-native-safe-area-context` - 15 edges
10. `📋 QUY TẮC BẮT BUỘC — AI AGENT PHẢI TUÂN THỦ` - 13 edges

## Surprising Connections (you probably didn't know these)
- `[16/11/2026 18:45] — Nâng Cấp Toàn Diện UX/UI Mobile: Khắc Phục KPI, Biểu Đồ Đường SVG, Tìm Kiếm Trực Tiếp, Toast & Modal Cài Đặt` --references--> `SvgLineChart()`  [INFERRED]
  tiendo.md → Mobile/src/components/SvgLineChart.js
- `[09/11/2026 18:42] — Khởi Tạo Auth Gate Buộc Đăng Nhập Trước, Thêm Bảng Điều Khiển Cron Job Trên Submenu, Thiết Kế Lại Email/Discord Notification & Tối Ưu UX Đồ Thị` --references--> `LoginModal()`  [INFERRED]
  tiendo.md → FE/src/components/LoginModal.jsx
- `[09/11/2026 18:42] — Khởi Tạo Auth Gate Buộc Đăng Nhập Trước, Thêm Bảng Điều Khiển Cron Job Trên Submenu, Thiết Kế Lại Email/Discord Notification & Tối Ưu UX Đồ Thị` --references--> `reloadCronJobs()`  [INFERRED]
  tiendo.md → BE/search-api/cronService.js
- `runFullEvaluation()` --calls--> `loadBglDataset()`  [EXTRACTED]
  BE/benchmark/full_evaluation.js → BE/datasets/bgl/bglLoader.js
- `runFullEvaluation()` --calls--> `loadHdfsDataset()`  [EXTRACTED]
  BE/benchmark/full_evaluation.js → BE/datasets/hdfs/hdfsLoader.js

## Import Cycles
- None detected.

## Communities (20 total, 1 thin omitted)

### Community 0 - "useTheme"
Cohesion: 0.07
Nodes (71): App(), MainApp(), apiClient(), getAuthToken(), setAuthToken(), CURRENT_LAN_IP, DEFAULT_API_BASE, DEFAULT_COLLECTOR_BASE (+63 more)

### Community 1 - "full_evaluation.js"
Cohesion: 0.06
Nodes (43): callMlPredict(), __dirname, DRAIN_WORKER_PATH, __filename, ML_API_TIMEOUT_MS, runAnomalyDetection(), vectorizeInWorker(), ALERT_LEVELS (+35 more)

### Community 2 - "incidentService.js"
Cohesion: 0.06
Nodes (37): exportVectorsForML(), vectorizeDataset(), buildBglTimeWindows(), loadBglDataset(), parseBglLogFile(), __dirname, LOG_FILE, main() (+29 more)

### Community 3 - "ml_api.py"
Cohesion: 0.07
Nodes (12): health(), lifespan(), _load_models(), predict(), PredictRequest, PredictResponse, reload_model(), _build_report() (+4 more)

### Community 4 - "App.jsx"
Cohesion: 0.10
Nodes (26): App(), formatVnDateTime(), KpiSkeleton(), LEVEL_COLORS, Skeleton(), ToastContainer(), toLocalDatetimeInputString(), useToast() (+18 more)

### Community 5 - "Mobile/package.json"
Cohesion: 0.07
Nodes (37): dependencies, expo@^58.0.25, expo-status-bar@~58.0.5, lucide-react-native@^1.73.0, react@19.3.0, react-native@0.88.1, @react-native-async-storage/async-storage@2.2.0, react-native-safe-area-context@~5.11.1 (+29 more)

### Community 6 - "FE/package.json"
Cohesion: 0.09
Nodes (29): dependencies, lucide-react@^0.380.0, react@^18.3.1, react-dom@^18.3.1, recharts@^2.12.7, socket.io-client@^4.8.3, xlsx@^0.18.5, devDependencies (+21 more)

### Community 7 - "BE/package.json"
Cohesion: 0.10
Nodes (26): dependencies, bcryptjs@^3.0.3, bullmq@^5.1.0, cors@^2.8.5, dotenv@^16.4.5, express@^4.19.2, ioredis@^5.3.2, jsonwebtoken@^9.0.3 (+18 more)

### Community 8 - "search-api/index.js"
Cohesion: 0.14
Nodes (22): cronConfig, generate24hDigestData(), initCronJobs(), reloadCronJobs(), runLogRetentionCleanup(), sendDailyDigestReport(), sendDiscordDigest(), sendEmailDigest() (+14 more)

### Community 9 - "parser/index.js"
Cohesion: 0.14
Nodes (20): app, addToBuffer(), flushBuffer(), logBuffer, logParserWorker, LOG_QUEUE_NAME, rawLogsQueue, REALTIME_LOG_CHANNEL (+12 more)

### Community 10 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, benchmark, benchmark:full, generate:logs, generate:vectors-bgl, generate:vectors-hdfs, ml:train-bgl, ml:train-hdfs (+8 more)

### Community 11 - "expo"
Cohesion: 0.13
Nodes (14): backgroundColor, adaptiveIcon, expo, android, ios, name, orientation, slug (+6 more)

### Community 12 - "opensearch.js"
Cohesion: 0.70
Nodes (4): bulkIndexLogs(), getDailyIndexName(), indexLogDocument(), opensearchClient

### Community 13 - "Nhật Ký Cập Nhật (Chronological Log)"
Cohesion: 0.08
Nodes (24): [04/11/2026 12:05] — Khắc Phục Triệt Để Toàn Bộ Lỗi Responsive Trên Mobile & Tablet (Header, Anti-Overflow, Pipeline Grid & Bảng Dữ Liệu), [07/11/2026 11:35] — Nâng Cấp Hệ Thống 2 Tab Anomaly (Danh Sách & Biểu Đồ Phân Tích Đa Chiều), Sửa Lỗi Tooltip Dark Mode & Đồng Bộ Toàn Diện Web & Mobile App, [07/11/2026 11:50] — Thiết Kế Lại Sub-Tabs Segmented Control, Tái Cấu Trúc Bố Cục 4 Thẻ KPI, Sửa Lỗi NaN:NaN & Warning Unique Key (Web & Mobile), [07/11/2026 12:10] — Việt Hóa Đa Ngôn Ngữ Nhãn Mức Độ Log, Tối Ưu Chiều Cao Heatmap Dạng Ma Trận Ngang & Chống Tràn Card Diễn Biến Điểm Bất Thường (Đồng Bộ Web & Mobile), [09/11/2026 19:04] — Khắc Phục Lỗi Modal Cron Jobs, Thiết Kế Lại Form Đăng Nhập Chuẩn SaaS (Ảnh Đồ Họa + Icon Ẩn/Hiện Mật Khẩu), Bổ Sung Tab Sức Khỏe Pipeline Lên Sidebar & Đồng Bộ Mobile, [09/11/2026 19:06] — Sửa Lỗi Runtime ReferenceError Server is not defined trong FE/src/App.jsx, [09/11/2026 19:28] — Tinh Chỉnh Icon Chatbot Kéo Thả Tự Do (Draggable), Ẩn Nút Đóng Trùng Lặp, Rút Gọn Prompt Chatbot & Chuẩn Hóa Tiếng Việt Form Đăng Nhập (Đồng Bộ Web & Mobile), [09/11/2026 20:13] — Thiết Lập .gitignore, Khởi Tạo Git & Đẩy Thành Công Toàn Bộ Mã Nguồn Lên GitHub (+16 more)

### Community 14 - "alertService.js"
Cohesion: 0.24
Nodes (11): alertConfig, alertDeduplicationMap, checkDeduplication(), dispatchAlerts(), getMaintenanceMode(), maintenanceMode, sendDiscordAlert(), sendEmailAlert() (+3 more)

### Community 15 - "log_generator.js"
Cohesion: 0.33
Nodes (5): generateRandomBatch(), LEVELS, MESSAGES, sendLogsToCollector(), SERVICES

### Community 17 - "📋 QUY TẮC BẮT BUỘC — AI AGENT PHẢI TUÂN THỦ"
Cohesion: 0.14
Nodes (13): 📋 QUY TẮC BẮT BUỘC — AI AGENT PHẢI TUÂN THỦ, 🔴 RULE #0 — ĐỌC RULE TRƯỚC, LÀM SAU, ⚡ RULE #10 — TỪ KHÓA ĐẶC BIỆT, 🔁 RULE #11 — NHẮC NHỞ KHI AGENT QUÊN, 🌐 RULE #1 — NGÔN NGỮ & ĐỘ DÀI PHẢN HỒI (QUAN TRỌNG), 🛑 RULE #2 — PHÁT HIỆN YÊU CẦU MƠ HỒ, 🛑 RULE #3 — PLAN TRƯỚC, CODE SAU, 🛑 RULE #4 — CHỈ SỬA ĐÚNG PHẠM VI (+5 more)

### Community 18 - "aiService.js"
Cohesion: 0.43
Nodes (7): callAI(), callGemini(), callGroq(), chatWithAI(), cleanOutput(), __dirname, explainLog()

### Community 19 - "authService.js"
Cohesion: 0.33
Nodes (6): authenticateToken(), changePassword(), loginUser(), optionalAuth(), requireAdmin(), USERS

## Knowledge Gaps
- **1 isolated node(s):** `RFC-3164`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 194 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `[09/11/2026 18:42] — Khởi Tạo Auth Gate Buộc Đăng Nhập Trước, Thêm Bảng Điều Khiển Cron Job Trên Submenu, Thiết Kế Lại Email/Discord Notification & Tối Ưu UX Đồ Thị` connect `search-api/index.js` to `App.jsx`, `Nhật Ký Cập Nhật (Chronological Log)`?**
  _High betweenness centrality (0.388) - this node is a cross-community bridge._
- **What connects `RFC-3164` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.06964022722491059 - nodes in this community are weakly interconnected._
- **Why does `LoginModal()` connect `App.jsx` to `search-api/index.js`?**
  _High betweenness centrality (0.330) - this node is a cross-community bridge._
- **Should `full_evaluation.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06448087431693988 - nodes in this community are weakly interconnected._
- **Should `incidentService.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0641025641025641 - nodes in this community are weakly interconnected._
- **Should `ml_api.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07419712070874862 - nodes in this community are weakly interconnected._