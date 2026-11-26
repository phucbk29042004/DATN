# BÁO CÁO KIỂM TOÁN DỰ ÁN TỐT NGHIỆP — LOGPULSE AI

> **Phạm vi kiểm toán:** `d:\DATN` (`BE/`, `FE/`, `Mobile/`, kịch bản vận hành & dữ liệu) đối chiếu với `d:\DATN\DATN_BanHoanChinh.docx` (390 đoạn văn, 14 bảng).  
> **Chế độ thực hiện:** CHỈ ĐỌC (Read-Only). Không sửa mã nguồn, không mutate DB, không cài thêm package.  
> **Quy ước xác minh:** `[Đọc code]` = phân tích tĩnh mã nguồn; `[Đã chạy]` = kết quả lệnh kiểm tra đọc-chỉ thực tế.

---

## 1. Tóm Tắt Điều Hành (Executive Summary)

1. **Tổng quan hiện trạng:** Dự án xây dựng được khung hệ thống giám sát log đa nền tảng (Node.js microservices, SQLite WAL 8 bảng, React 18 Web, React Native Expo Mobile, FastAPI ML), đạt độ phủ tính năng bề mặt cao nhưng **chưa đồng bộ sâu giữa tài liệu Word, Backend, Web và Mobile**.
2. **Mức hoàn thiện theo yêu cầu:** Trong 16 yêu cầu chức năng (`FR-01`..`FR-16`) và 5 phi chức năng (`NFR-01`..`NFR-05`), chỉ có **2/21** đạt mức hoạt động đầy đủ (`✅`), **17/21** hoạt động một phần (`🟡`) và **2/21** chưa đạt/sai lệch nghiêm trọng (`❌` ở `NFR-02` và `NFR-04`).
3. **Lỗ hổng bảo mật & RBAC nghiêm trọng nhất:** Route cập nhật trạng thái sự cố dùng `optionalAuth` và mặc định gắn quyền `admin` khi thiếu token; nhiều API quản trị cho phép **request ẩn danh vượt qua kiểm tra quyền**; `GET /api/v1/config` phơi bày `smtpPass` và `discordWebhookUrl` không cần đăng nhập; phía Web `LoginModal.jsx` lưu token ở `sessionStorage` nhưng `App.jsx` đọc từ `localStorage` nên luôn gửi `token = null`.
4. **Đứt gãy Tầng 3 ML & Số liệu Benchmark:** Không tồn tại file model `.pkl` trong `BE/anomaly-engine/ml-models/`, `ml_api.py` không được khởi chạy trong `BE/index.js` hay `start_all.bat`, Parser chỉ `console.log` kết quả phân tích 3 tầng chứ không lưu/cảnh báo; `full_evaluation.js` **hardcode** kết quả `0.67` và ma trận nhầm lẫn, còn `Isolation Forest` đạt `F1 = 0.0000` (trái ngược mục tiêu `0,85–0,95`).
5. **Lỗi chức năng trên Web & Mobile:** Web Heatmap Modal (`App.jsx:3286`) so sánh sai định dạng ngày (`YYYY-MM-DD` vs `dd/MM`) nên luôn báo rỗng; **SRE Messenger trên Mobile hỏng hoàn toàn** do sai tên trường payload (gây HTTP 400), sai khóa hiển thị và sai tên sự kiện Socket.IO.
6. **Xác minh thực thi:** `[Đã chạy]` kiểm tra cú pháp Node (`node --check` trên BE) và JSX/JS (`esbuild.transformSync` trên `FE/src`, `Mobile/src`) đạt **0 lỗi cú pháp**; **chưa xác minh runtime full-stack** (Redis, OpenSearch, FastAPI, server live) do chế độ chỉ đọc và Vite build trong sandbox gặp `EPERM`.
7. **Mức sẵn sàng bảo vệ:** **`ĐẠT CÓ ĐIỀU KIỆN`** — bắt buộc phải vá các lỗ hổng RBAC Backend/FE, sửa SRE Chat Mobile + Heatmap Modal, loại bỏ hardcode benchmark và hoàn thiện kiểm thử runtime trước ngày bảo vệ.

---

## 2. Bảng Yêu Cầu Trích Xuất Từ Tài Liệu Word (`DATN_BanHoanChinh.docx`)

### 2.1. Yêu cầu chức năng (FR) & Phi chức năng (NFR)

| Mã | Vai trò / Nhóm | Mô tả yêu cầu trích xuất từ tài liệu | Vị trí trong Word |
|---|---|---|---|
| **FR-01** | Admin, Viewer | Xác thực đăng nhập JWT + `bcryptjs` trên Web/Mobile, phân quyền RBAC khóa thao tác quản trị ở cả API và Client; có nút chuyển vai trò nhanh trên dev. | Mục 2.1.1; Bảng 2.1 [T3R2]; Bảng 3.1 UC01 [T6R8–T6R10] |
| **FR-02** | Hệ thống | Collector (:4000) nhận log đơn (`POST /api/v1/logs/single`) và batch (`/api/v1/logs/batch`), validate `timestamp, service, level, message`, đẩy BullMQ trả `202 Accepted`; Collector offline tự Fallback ghi SQLite + phát Socket.IO. | Mục 2.1.1 [P216]; Bảng 2.3 [T5R4]; Bảng 3.2 UC02 [T7R8–T7R10] |
| **FR-03** | Hệ thống, Admin, Viewer | Parser Worker dùng thuật toán Drain ẩn tham số biến thiên (`<*>`, `<IP>`, `<HEX>`, `<UUID>`), tách `template` + `parameters`; hỗ trợ Infinite Scroll 10 bản ghi/lần từ dữ liệu thật. | Mục 2.1.1 [P217]; Mục 3.2.5 [P310–P313]; Mục 3.3.1 [P341] |
| **FR-04** | Hệ thống | Phát hiện bất thường 3 tầng: (1) Rule-based từ khóa mặc định + động từ Admin (Base $\ge 0,7$); (2) Thống kê Z-Score cửa sổ 60s ($Z > 3$); (3) FastAPI `:8000` (`POST /predict`) chạy Isolation Forest & Logistic Regression; Score `[0–1]` (ngưỡng mặc định `0,75`); ML lỗi vẫn hoàn tất bằng Tầng 1–2. | Mục 2.1.1 [P218]; Mục 3.2.6 [P317–P320]; Bảng 3.2 [T7R10] |
| **FR-05** | Hệ thống, Admin, Viewer | Lưu trữ OpenSearch (`:9200`) và phát sóng sự kiện `new_log` qua Socket.IO (`:5000`) lên Web (`:3000`) và Mobile (`:8081`). | Mục 2.2.1 [P238]; Bảng 2.1 [T3R3]; Bảng 3.2 [T7R8] |
| **FR-06** | Admin, Viewer | Tra cứu, lọc đa tiêu chí qua `CustomSelect Dark Mode`, xem JSON/Drain, Pause/Resume stream, Ma trận Heatmap 24h (CSS Grid 24 cột, click xem lỗi), xuất tệp `CSV`. | Mục 2.1.1 [P224]; Bảng 2.1 [T3R4–T3R5]; Mục 3.3.1 [P341]; Bảng 3.6 [T11R11] |
| **FR-07** | Hệ thống, Admin | Cảnh báo Rich Embed Discord Webhook & Gmail SMTP; Deduplication 60s theo `hash(service + message)`; chế độ Silence Mode (15/30/60p, chỉ Admin bật/tắt). | Mục 2.1.1 [P219]; Bảng 2.1 [T3R13]; Bảng 3.5 UC05 [T10R8] |
| **FR-08** | Admin, Viewer | Vòng đời sự cố `NEW` → `ACKNOWLEDGED` (chỉ Admin, gán `P1/P2/P3`, lưu MTTA) → `RESOLVED` (chỉ Admin, bắt buộc `Root Cause` + `Action Taken`); Admin & Viewer ghi `INVESTIGATION` notes; đồng bộ Web/Mobile. | Mục 2.1.1 [P220]; Bảng 2.1 [T3R9–T3R12]; Bảng 3.3 UC03 [T8R8–T8R10] |
| **FR-09** | Admin, Viewer | Trợ lý AI Copilot: RCA 3 phần, chat Typewriter, Multimodal Vision (ảnh chụp lỗi), Groq (`llama-3.3-70b-versatile`) chính fallback Gemini (`gemini-2.0-flash`). | Mục 2.1.1 [P221]; Mục 2.3.4 [P273]; Bảng 3.4 UC04 [T9R8–T9R10] |
| **FR-10** | Admin, Viewer | Giám sát sức khỏe Pipeline cập nhật mỗi 5s: trạng thái BullMQ, throughput (`log/s`), latency (`ms`), trạng thái `HEALTHY`/`WARNING`/`DEGRADED`. | Mục 2.1.1 [P222]; Bảng 2.1 [T3R7]; Bảng 3.6 [T11R10] |
| **FR-11** | Admin, Cron | `node-cron`: Daily Digest 08:00 (Discord + Gmail) và Retention Cleanup 00:00 (1–365 ngày) lưu `lich_su_cron`; Admin có nút chạy thủ công (Viewer bị khóa). | Mục 2.1.1 [P223]; Bảng 2.1 [T3R15]; Bảng 3.5 UC05 [T10R8–T10R10] |
| **FR-12** | Admin | Cấu hình động từ khóa cảnh báo (Tags), ngưỡng Anomaly Score, cooldown, retention (Viewer bị khóa); ghi Audit Trail thao tác quản trị. | Bảng 2.1 [T3R14]; Mục 2.2.3 [P253, P255]; Bảng 3.5 [T10R7–T10R8] |
| **FR-13** | Admin, Viewer | SRE Messenger chat 2 chiều realtime Socket.IO lưu SQLite (`tin_nhan_noi_bo`), gắn thẻ log và bấm mở chi tiết log. | Mục 2.1.1 [P225]; Bảng 2.1 [T3R8]; Bảng 3.6 [T11R9] |
| **FR-14** | Admin, Viewer | Mobile App (Expo): điều hướng 5 Tabs Elevated Dock theo vai trò, log realtime Socket.IO, đồng bộ vòng đời sự cố + Biên bản SRE, Floating AI nổi. | Mục 2.1.1 [P225]; Mục 2.3.2 [P267]; Mục 3.3.1 [P342] |
| **FR-15** | Admin, Viewer | Tiện ích Web: đa ngôn ngữ VI/EN, Light/Dark Mode, chú thích hướng dẫn các Tab (7 Tab chức năng). | Mục 2.1.2 [P233]; Mục 3.3.1 [P341]; Bảng 3.6 [T11R11] |
| **FR-16** | Hệ thống | Pipeline ML & Benchmark: `hdfsLoader.js`, `bglLoader.js` sinh vector JSON, `train_and_evaluate.py` xuất `*.pkl`, `stream:real`, `benchmark:full` dùng `perf_hooks`. | Mục 2.3.4 [P275]; Mục 3.2.5 [P313]; Mục 3.3.2 b) [P369] |
| **NFR-01** | Hiệu năng | Collector < 5ms; Throughput > 1.500–3.000 log/s; E2E Latency < 200ms; MTTD < 1s; MTTR giảm 50–70%. | Mục 2.1.2 [P230]; Bảng 2.2 [T4R2–T4R5] |
| **NFR-02** | Chất lượng ML | Giảm > 85% cảnh báo trùng lặp; Detection F1-Score đạt `0,85 – 0,95` trên HDFS & BGL. | Bảng 2.2 [T4R6–T4R7] |
| **NFR-03** | Độ tin cậy | Redis BullMQ + AOF chống mất/tràn; Fallback SQLite; AI HA fallback Groq → Gemini; SQLite WAL mode. | Mục 2.1.2 [P231]; Mục 2.2.3 b) [P249] |
| **NFR-04** | Bảo mật & RBAC | JWT stateless; `bcryptjs`; khóa RBAC ở **cả Backend & Client** (HTTP 401/403); giữ secret trong `.env` (loại trừ `.gitignore`); Audit Trail. | Mục 2.1.2 [P232]; Bảng 3.1 [T6R10] |
| **NFR-05** | Đa nền tảng | Web React 18 + Expo Mobile; VI/EN + Light/Dark; 1-click `start_all.bat` / `stop_all.bat`. | Mục 2.1.2 [P233]; Mục 2.3.2 [P266–P267] |

### 2.2. Phạm vi & Yêu cầu dữ liệu (Tóm tắt đối chiếu)
- **IN SCOPE:** Hệ thống end-to-end gồm Collector (`:4000`), Redis BullMQ (`:6379`), Parser Drain, OpenSearch (`:9200`), SQLite 8 bảng (`BE/data/sre_enterprise.sqlite`, WAL), FastAPI ML (`:8000`), Search API & Socket.IO (`:5000`), Web (`:3000`), Mobile (`:8081`), Discord/Gmail, Groq/Gemini trên môi trường cục bộ.
- **OUT OF SCOPE:** Triển khai cụm phân tán production (Kubernetes/Kafka), Fluent Bit/OpenTelemetry, Online Continual Learning, Auto-Remediation.
- **Ràng buộc dữ liệu Word yêu cầu:** 8 nhóm bảng SQLite WAL; Document OpenSearch có `timestamp, service, level, message, template, parameters, anomaly_score, is_anomaly`; HDFS (`anomaly_label.csv`) & BGL (`*.pkl`).

---

## 3. Bảng Đối Chiếu Yêu Cầu ↔ Code

> Ký hiệu: ✅ Hoạt động đầy đủ | 🟡 Hoạt động một phần | 🎭 Chỉ có giao diện | ❌ Không hoạt động | ⬜ Chưa có | ❓ Chưa xác định

| Mã | Trạng thái | Bằng chứng (`file:hàm:dòng`) | Mức xác minh | Còn thiếu / Sai lệch thực tế | Ưu tiên |
|---|---|---|---|---|---|
| **FR-01** | 🟡 | `BE/search-api/authService.js:loginUser` (1–59), `authenticateToken,requireAdmin,optionalAuth` (96–142); `FE/src/components/LoginModal.jsx:handleLogin` (34–78); `FE/src/App.jsx` (277,300,362,458,498); `Mobile/src/screens/auth/LoginScreen.js` (50–182) | `[Đọc code]` | (1) Token mismatch trên Web: `LoginModal.jsx:62` lưu `sessionStorage` nhưng `App.jsx` đọc `localStorage.getItem('logpulse_auth_token')` (luôn `null`); (2) Backend dùng `optionalAuth` ở các route quản trị khiến anonymous bypass; (3) Web thiếu 2 nút Quick Login demo như mô tả Word (`T3R2`, `T6R8`) và `start_all.bat:63` (Mobile có tại `LoginScreen.js:160–182`). | **Cao** |
| **FR-02** | 🟡 | `BE/collector/index.js:18–48`; `BE/search-api/index.js:738–756`; `BE/database/sqlite.js` (không có bảng log fallback) | `[Đọc code]` | (1) Route đơn lẻ thực tế là `POST /api/v1/logs` (`collector/index.js:18`), không phải `/api/v1/logs/single`; (2) Collector chỉ check object không rỗng (`collector/index.js:22`), thiếu validate 4 trường `timestamp, service, level, message` như UC02; (3) Khi Collector offline, `search-api/index.js:738–756` chỉ đẩy RAM (`recentLogBuffer`) + Socket.IO, **không ghi SQLite fallback** như Word [P216]. | **Cao** |
| **FR-03** | 🟡 | `BE/anomaly-engine/template-mining/drain.js` (1–173); `BE/parser/normalizer.js` (1–185); `BE/parser/index.js:parseLog` (76); `BE/search-api/opensearchQueries.js:getDrainTemplates` (519); `FE/src/App.jsx` (templates Infinite Scroll) | `[Đọc code]` | Parser lưu `drain_template` & `drain_template_id`, nhưng khi OpenSearch offline thì `fallbackDrainTemplates` (`opensearchQueries.js:186`) đọc file tĩnh `real_logs_dataset.json`. Chưa xác minh runtime hành vi khi có dữ liệu OpenSearch lớn. | **Thấp** |
| **FR-04** | 🟡 | `BE/parser/index.js:flushBuffer,logParserWorker` (44–50, 88–94); `BE/anomaly-engine/index.js:analyzeLogs` (120–176); `rule-based/detector.js` (10–26); `statistical/detector.js` (1–190); `ml-models/ml_api.py` (1–193); `BE/database/sqlite.js:168` | `[Đọc code]` | (1) Tầng 1 per-log dùng mảng tĩnh `CRITICAL_KEYWORDS` (`rule-based/detector.js`), **không đồng bộ `alertConfig.alertKeywords`**; (2) `flushBuffer` gọi `runAnomalyDetection(batch)` bất đồng bộ nhưng **chỉ `console.log`** (44–50), không ghi ngược điểm Z-Score/ML vào OpenSearch hay tạo Incident/Alert; (3) Tầng 2 (`detectStatistical`) cần $\ge 6$ bucket 60s nên luôn skip ở batch flush 2s; (4) Tầng 3 thiếu file `.pkl`, `ml_api.py` không tự bật, vector batch 10 log (`anomaly-engine/index.js:141`) lệch kích thước feature khi train; (5) Ngưỡng mặc định SQLite là `0.5` (`sqlite.js:168`), Word ghi `0,75`. | **Cao** |
| **FR-05** | 🟡 | `BE/storage/opensearch.js:bulkIndexLogs` (1–89); `BE/parser/index.js:35–40`; `BE/search-api/index.js:startCloudLogStreamer,broadcastNewLog` (50–73, 119–131); `Mobile/.../QuickActionScreen.js` (104) | `[Đọc code]` | Luồng `new_log` hoạt động về code, nhưng `startCloudLogStreamer()` (`search-api/index.js:50–73`) tự phát lặp log mẫu JSON mỗi 3.5s khi có Socket client kết nối làm nhiễu phân biệt log thật với log giả lập. Chưa chạy xác minh OpenSearch cluster `:9200`. | **TB** |
| **FR-06** | 🟡 | `FE/src/App.jsx` (`handleSearch`, `handleExportCsv:594`, Heatmap modal:3283–3289); `FE/src/components/CustomSelect.jsx`; `BE/search-api/index.js:/api/v1/export/csv` (521–554); `BE/search-api/opensearchQueries.js:282–287,671` | `[Đọc code]` | (1) **Lỗi nghiêm trọng Web Heatmap Modal:** `App.jsx:3286` lấy `YYYY-MM-DD` so với `cell.date` dạng `dd/MM` (`opensearchQueries.js:283,671`) → **luôn không khớp, luôn rỗng**; (2) **Lỗi Mobile Heatmap Modal:** `AnomaliesScreen.js:836` so `dd/MM/yyyy` với `dd/MM`; (3) Fallback OpenSearch offline hardcode 4 ô `17/11`–`20/11`; (4) Word yêu cầu xuất `CSV`, nhưng Web `handleExportCsv` (`App.jsx:594`) gọi sang `handleExportExcel` (`.xlsx`), còn API `GET /api/v1/export/csv` trên BE trở thành API mồ côi không UI nào gọi. | **Cao** |
| **FR-07** | ✅ | `BE/search-api/alertService.js:loadConfigFromSqlite,saveConfigToSqlite,setMaintenanceMode,dispatchAlerts` (1–317); `BE/search-api/index.js:356–368` | `[Đọc code]` | Cơ chế Discord Embed, Gmail SMTP, Deduplication 60s và Maintenance Mode đã nối đủ chuỗi lưu SQLite & xử lý lỗi (riêng phần phân quyền của `POST /alerts/maintenance` có lỗ hổng ở `FR-01`/`NFR-04`; chưa test gửi SMTP/Discord thật khi runtime). | **TB** |
| **FR-08** | 🟡 | `BE/search-api/incidentService.js:updateIncidentStatus,addIncidentNote` (66–160); `BE/search-api/index.js:327–353`; `FE/src/components/IncidentNoteModal.jsx`; `Mobile/src/components/AnomalyCard.js:108–126`; `Mobile/src/screens/anomalies/AnomaliesScreen.js:144–169`; `IncidentDetailScreen.js:126–182` | `[Đọc code]` | (1) `PATCH /api/v1/anomalies/:id/status` (`search-api/index.js:327–331`) **không chặn Viewer** và fallback user ẩn danh thành `admin`; (2) `updateIncidentStatus` không ép bắt buộc `root_cause` & `action_taken` khi `status === 'RESOLVED'`; (3) Trên Mobile `AnomalyCard.js:108–126` & `AnomaliesScreen.js:144–169`, Viewer vẫn thấy nút `"Tiếp nhận"`/`"Xử lý xong"` và bấm `"Xử lý xong"` gọi `RESOLVED` trực tiếp **bỏ qua biên bản Root Cause/Action Taken**; (4) `incidentService.js` không chặn nhảy cóc `NEW` → `RESOLVED`. | **Cao** |
| **FR-09** | 🟡 | `BE/search-api/aiService.js:1–236`; `BE/search-api/index.js:561–587,639–651`; `FE/src/components/AiAssistant.jsx:1–663`; `Mobile/src/components/FloatingAiAssistant.js:1–410` | `[Đọc code]` | (1) Model trong `aiService.js:17–18` là `qwen/qwen3.8-27b` & `gemini-2.5-flash-lite`, **sai khác** với tài liệu Word (`llama-3.3-70b-versatile` & `gemini-2.0-flash`); (2) Backend dùng chung 2 endpoints AI cho cả chat & vision nhưng không giới hạn/kiểm tra auth hay rate limit; (3) `explainLog` prompt chứa `**` ngược quy chuẩn không dùng dấu sao của dự án. Chưa test gọi API Groq/Gemini thực tế. | **Thấp** |
| **FR-10** | 🟡 | `BE/search-api/pipelineMetrics.js:getPipelineHealth` (1–143); `BE/search-api/index.js:221–229`; `FE/src/components/PipelineHealthWidget.jsx:1–167`; `Mobile/src/components/PipelineHealthCard.js:1–130`; `Mobile/.../DashboardScreen.js:405–449` | `[Đọc code]` | (1) `pipelineMetrics.js:78` trả cứng `120ms` khi `latencySamples.length === 0`; (2) Modal chi tiết Pipeline trên Mobile (`DashboardScreen.js:419–438`) **hardcode hoàn toàn chữ "Hoạt động bình thường"** cho cả Collector, Parser, OpenSearch thay vì đọc từ `healthData`. | **TB** |
| **FR-11** | 🟡 | `BE/search-api/cronService.js:sendDailyDigestReport,runLogRetentionCleanup,initCronJobs` (1–360); `BE/search-api/index.js:479–518`; `FE/src/components/CronJobsModal.jsx:153–248` | `[Đọc code]` | (1) `POST /api/v1/reports/digest/trigger` (`index.js:493`) **không có middleware xác thực**; (2) `POST /api/v1/storage/retention/cleanup` (`index.js:510`) dùng `optionalAuth` bỏ lọt request ẩn danh; (3) `CronJobsModal.jsx:153–163, 239–248` không truyền `disabled={!isAdmin}` cho 2 nút `"Chạy Thử Ngay"` & `"Dọn Dẹp Ngay"` (Viewer bấm được trên UI); (4) `GET /api/v1/cron/history` (`index.js:479`) chưa có màn hình/bảng UI hiển thị. | **Cao** |
| **FR-12** | 🟡 | `BE/search-api/index.js:387–477`; `BE/database/sqlite.js` (`cau_hinh_he_thong`, `nhat_ky_he_thong`); `FE/src/components/AdminSettingsModal.jsx:1–466`; `Mobile/src/screens/profile/ProfileScreen.js:355–483` | `[Đọc code]` | (1) `GET /api/v1/config` (`index.js:387`) **không có auth**, trả toàn bộ `{ ...alertConfig, ...cronConfig }` gồm `smtpPass` plaintext; (2) `POST /api/v1/config` (`index.js:394`) bỏ lọt anonymous request; (3) `AdminSettingsModal.jsx` trên Web có Tag từ khóa nhưng Mobile `ProfileScreen.js` / `AdminSettingsScreen.js` thiếu chỉnh sửa `alertKeywords`, `anomalyThreshold`, `dailyDigestEnabled`; (4) `GET /api/v1/audit/logs` (`index.js:469`) không có màn hình Audit Trail UI trên Web/Mobile. | **Cao** |
| **FR-13** | 🟡 | `BE/search-api/index.js:165–180,593–632`; `BE/database/sqlite.js:300–350`; `FE/src/components/SreMessengerModal.jsx:1–442`; `Mobile/src/components/SreMessengerModal.js:1–491`; `Mobile/.../DashboardScreen.js:61–64` | `[Đọc code]` | (1) **Mobile SRE Chat hỏng toàn bộ:** gửi sai body (`message, tagged_log` vs `content, logAttachment` → HTTP 400), đọc sai field trả về (`nguoi_gui, noi_dung` vs `sender_name, message`), nghe sai socket (`new_chat_message` vs `sre_chat_message`), `DashboardScreen.js:62` so `msg.sender` thay vì `msg.nguoi_gui`; (2) **Web `SreMessengerModal.jsx`:** dòng 4 dùng `VITE_SEARCH_API_URL` thay vì `config.js` (hỏng trên Vercel), dòng 95 đọc `localStorage.getItem('token')` (sai key); (3) Socket.IO `sre_chat_send` không kiểm tra JWT; (4) `layDanhSachTinNhanNoiBo` (`sqlite.js:338`) `ORDER BY thoi_gian ASC LIMIT ?` lấy 50 tin cũ nhất thay vì mới nhất. | **Cao** |
| **FR-14** | 🟡 | `Mobile/src/navigation/*`, `Mobile/src/components/*`, `Mobile/src/screens/*` | `[Đọc code]` | Mobile App đủ 5 tabs + Elevated Dock + Floating AI + Dark/Light, nhưng mất đồng bộ ở SRE Chat (`FR-13`), Modal Pipeline tĩnh (`FR-10`), AnomalyCard cho Viewer xử lý sự cố bỏ qua biên bản (`FR-08`), Heatmap date mismatch (`FR-06`), và 2 màn hình thừa `AdminSettingsScreen.js` & `ChangePasswordScreen.js` đăng ký trong `AppStackNavigator` nhưng `ProfileScreen` lại mở Modal tại chỗ. | **Cao** |
| **FR-15** | 🟡 | `FE/src/i18n.js:1–291`; `FE/src/App.jsx:960–967,1294–1300`; `FE/src/components/TabHelpModal.jsx:4–160` | `[Đọc code]` | (1) Web thực tế chỉ có **6 tabs** (`overview, anomalies, search, templates, pipeline, sre-chat`), không phải **7 tabs** như Word nêu; (2) `App.jsx:1294–1300` thiếu nhãn tiêu đề header khi `activeTab === 'sre-chat'` (trống `<h1 className="page-title">`); (3) `TabHelpModal.jsx:122–159` vẫn còn tab ma `trace` (Distributed Tracing) & `admin`, nhưng **thiếu `sre-chat`** (nên bấm `?` ở tab Chat lại hiện hướng dẫn Overview); (4) Nhiều chuỗi trong `App.jsx` vẫn hardcode tiếng Việt bất kể `lang === 'en'`. | **TB** |
| **FR-16** | 🟡 | `BE/datasets/hdfs/hdfsLoader.js`, `bgl/bglLoader.js`, `stream_real_hdfs.js`; `BE/anomaly-engine/ml-models/train_and_evaluate.py`; `BE/benchmark/full_evaluation.js:240–322`; `evaluation_summary.json` | `[Đọc code]` | `full_evaluation.js` **hardcode** `'Accuracy': 0.67` và các chuỗi `'0/0/1/2'`, `'1/0/0/2'`, `'0/0/1/4'`, `'1/0/0/4'` khớp với dữ liệu siêu nhỏ (`11` chuỗi HDFS, `23` cửa sổ BGL). File `.pkl` không tồn tại trên đĩa nên pipeline train → serve chưa khép kín. | **Cao** |
| **NFR-01** | ❓ | `BE/benchmark/evaluation_summary.json:4–25`; `BE/collector/index.js`; `BE/search-api/pipelineMetrics.js` | `[Đọc code]` | `evaluation_summary.json` ghi benchmark throughput nội bộ parser/drain/rule (>150k/s trên mock), nhưng chưa kiểm chứng đo tải end-to-end thật qua Collector `:4000` → Redis → OpenSearch `:9200` (< 200ms) ở runtime. | **TB** |
| **NFR-02** | ❌ | `BE/anomaly-engine/ml-models/results_hdfs.json` (1–35), `results_bgl.json` (1–35); `BE/benchmark/evaluation_summary.json:46–96` | `[Đọc code]` | Word yêu cầu `F1-Score 0,85 – 0,95`, nhưng kết quả thật ghi nhận **Isolation Forest đạt F1 = 0.0000** trên cả HDFS & BGL (`TP=0, FN=1`), Statistical Z-Score đạt `0.4000` (HDFS) và `0.5714` (BGL), còn Logistic Regression chỉ test trên **3 mẫu HDFS & 5 mẫu BGL** (không có giá trị thống kê tin cậy). | **Cao** |
| **NFR-03** | 🟡 | `BE/queue/config.js`; `BE/redis.conf`; `BE/database/sqlite.js` (`WAL`); `BE/search-api/aiService.js` | `[Đọc code]` | Redis BullMQ + SQLite WAL + AI Groq→Gemini có sẵn, **nhưng** Redis AOF trong `redis.conf` chỉ là hướng dẫn thủ công chưa ép khi start ở `start_all.bat`, và **không có Ingestion Fallback vào SQLite** như Word khẳng định. | **TB** |
| **NFR-04** | ❌ | `BE/search-api/index.js:79–103,165–180,327–337,360–368,387–398,493–513`; `BE/search-api/authService.js:12`; `FE/src/App.jsx:277–498`; `BE/.env` (excluded in `.gitignore:7–11`) | `[Đọc code]` | Lỗ hổng nghiêm trọng: (1) Bypass RBAC Backend với request không token ở 4 endpoint quản trị; (2) CORS `callback(null, true)` cho mọi origin kèm `credentials: true`; (3) Lộ `smtpPass` qua `GET /api/v1/config`; (4) Socket.IO không xác thực JWT; (5) Không có rate limiter / helmet; (6) Fallback `JWT_SECRET` hardcode; (7) Web gửi `Authorization: Bearer null`. | **Cao** |
| **NFR-05** | ✅ | `FE/package.json`; `Mobile/package.json`; `start_all.bat:1–74`; `stop_all.bat:1–20`; `BE/FE/Mobile` syntax check | `[Đọc code]` + `[Đã chạy]` | Cấu trúc Web React 18, Mobile Expo, VI/EN, Dark/Light, `start_all.bat`/`stop_all.bat` sẵn có. `[Đã chạy]` `node --check` BE & `esbuild` FE/Mobile **0 lỗi cú pháp** (riêng `start_all.bat:63` nhắc nút Quick Login không còn trên Web và không bật `ml_api.py`). | **Thấp** |

---

## 4. Danh Sách Element "Trưng", Code Giả, Style Mặc Định & Lỗi UI/UX

### 4.1. Web Dashboard (`FE/src/`)

| Màn hình / Thành phần | Loại | Vị trí chính xác (`file:dòng`) | Mô tả chi tiết vấn đề |
|---|---|---|---|
| **Login Portal** | **b / d** | `FE/src/components/LoginModal.jsx:1–271`; `start_all.bat:63` | Tài liệu Word (`T3R2`, `T6R8`) và `start_all.bat:63` mô tả có nút Quick Login cho dev nhưng giao diện Web đã bị bỏ; ngoài ra `LoginModal.jsx:62` lưu JWT vào `sessionStorage` trong khi toàn bộ `App.jsx` tìm ở `localStorage`. |
| **Header & Sidebar** | **d / e** | `FE/src/App.jsx:1294–1300` | `<h1 className="page-title">` thiếu nhánh `activeTab === 'sre-chat'`, khiến thanh tiêu đề bị **trống trắng** khi chuyển sang tab Kênh Trao Đổi SRE. |
| **Tab Help Modal** | **a / d** | `FE/src/components/TabHelpModal.jsx:122–166` | `TAB_INFO` chứa 2 mục thừa/ma không có trong tab thực tế (`admin`, `trace` — Distributed Tracing) và thiếu `sre-chat` (nên mở hướng dẫn khi ở SRE Chat luôn rơi về `TAB_INFO.overview`). |
| **Tổng quan & Heatmap** | **b / d** | `FE/src/App.jsx:2577–2582, 3283–3289`; `BE/.../opensearchQueries.js:12,137–140,282–287` | (1) `App.jsx:3286` dùng `d.toISOString().slice(0, 10)` (`YYYY-MM-DD`) so với `selectedHeatmapCell.date` (`dd/MM`) → Modal Heatmap **luôn không tìm thấy log**; (2) `App.jsx:2577–2582` hiển thị chữ tĩnh `"Tập trung ca trực khung 14:00 - 18:00"` bất kể dữ liệu thật; (3) OpenSearch offline trả số KPI fallback tĩnh (`4302`, `18`, `27`, `6`, `12.4ms`) và 4 ô heatmap cố định `17/11–20/11`. |
| **Tra cứu & Xuất CSV** | **b / d** | `FE/src/App.jsx:594, 2774–2796`; `FE/src/components/AdminSettingsModal.jsx:427–442` | `handleExportCsv` thực chất gọi `handleExportExcel` để tải file `.xlsx`, còn API `GET /api/v1/export/csv` không được Web gọi. |
| **SRE Messenger Tab** | **b / d** | `FE/src/components/SreMessengerModal.jsx:4, 95`; `BE/database/sqlite.js:338` | `API_BASE` dùng `import.meta.env.VITE_SEARCH_API_URL` (trệch khỏi `VITE_API_BASE_URL` trong `FE/src/config.js` & `.env.example` nên hỏng khi deploy Vercel); dòng 95 đọc `localStorage.getItem('token')` không tồn tại; query SQLite `ASC LIMIT 50` hiển thị 50 tin cũ nhất khi vượt 50 tin. |
| **Admin Settings & Cron Modals** | **c / d** | `FE/src/components/AdminSettingsModal.jsx:84–90, 123–129, 329–335, 400–406`; `FE/src/components/CronJobsModal.jsx:153–163, 239–248` | (1) **Element style mặc định trình duyệt:** 4 thẻ `<input type="checkbox">` trong `AdminSettingsModal.jsx` không dùng custom switch CSS mà dùng checkbox gốc trình duyệt (`width: 18px; height: 18px`), khác biệt với toggle custom của `CronJobsModal.jsx`; (2) 2 nút `"Chạy Thử Ngay"` & `"Dọn Dẹp Ngay"` trong `CronJobsModal.jsx` không có `disabled={!isAdmin}` để chặn Viewer trên UI. |
| **AI Assistant** | **b / c** | `FE/src/components/AiAssistant.jsx:267, 529` | Fallback chuỗi cứng `'10,000'` khi thống kê chưa kịp tải; `<input type="file">` ẩn (`display: none`) kích hoạt qua button là hợp lệ. |

### 4.2. Mobile App (`Mobile/src/`)

| Màn hình / Thành phần | Loại | Vị trí chính xác (`file:dòng`) | Mô tả chi tiết vấn đề |
|---|---|---|---|
| **Dashboard Screen** | **b / d** | `Mobile/src/screens/home/DashboardScreen.js:61–64, 419–438` | (1) Modal chi tiết Pipeline (`419–438`) **hardcode hoàn toàn** trạng thái `"Hoạt động bình thường"` (bỏ qua `healthData`); (2) Badge unread SRE Chat nghe event đúng (`sre_chat_message`) nhưng kiểm tra `msg.sender` thay vì `msg.nguoi_gui`. |
| **Anomalies & Card & Heatmap** | **b / d** | `Mobile/src/components/AnomalyCard.js:108–126`; `Mobile/src/screens/anomalies/AnomaliesScreen.js:144–169, 350, 836` | (1) `AnomalyCard` cho mọi user (kể cả Viewer) bấm `"Tiếp nhận"` và `"Xử lý xong"`, gọi thẳng `RESOLVED` không qua modal Root Cause; (2) Heatmap detail modal (`836`) định dạng ngày `dd/MM/yyyy` so với `dd/MM` từ Backend → **luôn không khớp**; (3) Nút refresh tại line 350 truyền nhầm đối tượng sự kiện Touch vào `fetchAnalytics(isUserAction)`. |
| **SRE Messenger Modal (Mobile)** | **❌ Hỏng** | `Mobile/src/components/SreMessengerModal.js:54, 82, 116–133, 150–213` | Lệch hoàn toàn contract với BE: gửi `message/tagged_log` (BE đòi `content/logAttachment` → HTTP 400), render `sender_name/message/created_at` (BE trả `ten_hien_thi/noi_dung/thoi_gian`), nghe socket `new_chat_message` (BE phát `sre_chat_message`). |
| **Profile & Navigation Dead Screens** | **b** | `Mobile/src/navigation/AppStackNavigator.js:23–25`; `ProfileScreen.js:225, 239`; `AdminSettingsScreen.js`; `ChangePasswordScreen.js` | `AdminSettingsScreen.js` (299 dòng) và `ChangePasswordScreen.js` (191 dòng) được khai báo trong Navigator nhưng **không bao giờ được điều hướng tới** vì `ProfileScreen.js` mở Modal nội bộ thay thế. |

---

## 5. Đánh Giá Chất Lượng Kỹ Thuật (Mức Đồ Án)

1. **Xác thực, Phân quyền & Bảo mật (Mức rủi ro: NGHIÊM TRỌNG):**
   - **RBAC Backend hổng tại 5 điểm:** `PATCH /api/v1/anomalies/:id/status` (`BE/search-api/index.js:327–331`) tự động phong quyền `admin` cho request thiếu JWT; `POST /alerts/maintenance` (`:360`), `POST /config` (`:394`), `POST /storage/retention/cleanup` (`:510`) dùng `if (req.user && req.user.role !== 'admin')` nên bỏ qua kiểm tra khi `req.user` rỗng; `POST /reports/digest/trigger` (`:493`) không có auth.
   - **Lộ thông tin nhạy cảm & CORS:** `GET /api/v1/config` (`index.js:387`) công khai không auth, trả thẳng `smtpPass` và `discordWebhookUrl`. `corsOptions` (`index.js:97`) luôn `return callback(null, true)` dù `credentials: true`. Socket.IO (`index.js:165`) tin tưởng hoàn toàn `sender`/`role` từ client.
   - **Quản lý bí mật & mật khẩu:** `.env` được loại trừ đúng trong `.gitignore:7–11`, mật khẩu user băm bằng `bcryptjs` (`authService.js:86`), nhưng `JWT_SECRET` có fallback chuỗi cứng `'logpulse_default_secret_key_change_in_prod'` (`authService.js:12`) và toàn bộ Backend chưa có rate limiter (`express-rate-limit`).
2. **Validation & Toàn vẹn dữ liệu:**
   - Collector (`BE/collector/index.js:22`) chỉ kiểm tra payload không rỗng, không validate 4 trường chuẩn hay `level` thuộc tập enum.
   - `incidentService.js` (`updateIncidentStatus:66–127`) chưa ép chuyển tuần tự `NEW → ACK → RESOLVED` và chưa kiểm tra bắt buộc `root_cause` / `action_taken` khi `RESOLVED`.
   - `express.json({ limit: '50mb' })` (`search-api/index.js:103`) quá lớn khi thiếu rate limit, dễ bị lạm dụng DoS bộ nhớ.
3. **Hiệu năng & Thuật toán:**
   - `search-api/index.js:50–73` chạy `startCloudLogStreamer()` phát log JSON mẫu liên tục khi có kết nối Socket, gây nhiễu đo đạc thật.
   - `BE/anomaly-engine/index.js:141–151` chạy Drain vectorize trên từng batch ~10 log khiến kích thước vector thay đổi động, **không tương thích với mô hình sklearn cố định số chiều** khi gọi `ml_api.py`.
   - `BE/search-api/opensearchQueries.js:65–127` đọc và parse `real_logs_dataset.json` đồng bộ/toàn bộ mỗi khi fallback search; trên Web `App.jsx` dài **3.457 dòng** gộp hết state, logic fetch, helper xuất Excel và UI 6 tab vào 1 component duy nhất, gây khó bảo trì và có nguy cơ re-render diện rộng.
4. **Tổ chức code, Tài liệu & Kiểm thử:**
   - **Kiểm thử tự động:** Hoàn toàn **không có unit test / integration test** (`Test-Path BE\test, FE\test, Mobile\test` đều `False`; `FE/package.json` chỉ có `dev, build, preview` — không có script `lint` hay `test`; `BE/package.json` không có script `test`).
   - **Kết quả kiểm tra tĩnh đã chạy `[Đã chạy]`:**
     - `node --check` trên toàn bộ file `.js` trong `BE/` (ngoại trừ `node_modules`): **0 lỗi cú pháp** (`BE_NODE_CHECK_DONE`).
     - `esbuild.transformSync` parse toàn bộ `.js`/`.jsx` trong `FE/src` và `Mobile/src`: **0 lỗi cú pháp** (`JSX_PARSE_ERRORS: 0`).
     - `FE` `npx vite build --outDir $env:TEMP\...`: **Thất bại trong sandbox** với `EPERM: operation not permitted` khi Vite ghi `vite.config.js.timestamp-*.mjs`.
     - `python.exe`: Không truy cập được trong môi trường sandbox nên chưa parse/chạy được `ml_api.py` & `train_and_evaluate.py`; chưa xác minh runtime khi chạy thật Redis/OpenSearch/Mobile Expo.
   - **Tài liệu:** Có `README.md`, `.env.example` (thiếu `ML_API_URL` ở FE/Mobile `.env.example` không tồn tại trên Mobile), `tiendo.md`, `kientruchethong.md`, nhưng `desgin.md` ở gốc lại chứa hướng dẫn thiết kế trang web Apple không liên quan dự án.

---

## 6. Đề Xuất Mở Rộng & Sửa Lỗi Trong Phạm Vi Đồ Án

### Nhóm A — Bắt buộc bổ sung / sửa trước khi bảo vệ (Khớp Word)

| Tên hạng mục | Mô tả ngắn | Lý do phù hợp (Bám Word) | Độ khó | Thời gian | Giá trị bảo vệ | Phụ thuộc |
|---|---|---|---|---|---|---|
| **A1. Vá toàn bộ lỗ hổng RBAC Backend & Token Web** | Thay `optionalAuth` thành `authenticateToken` / `requireAdmin` ở 5 endpoint quản trị + Incident PATCH; ẩn `smtpPass` ở `GET /config`; xác thực JWT Socket.IO; đồng bộ Web `App.jsx` đọc token từ `sessionStorage` + thêm `validate` Collector. | Đáp ứng bắt buộc **FR-01, FR-02, FR-08, FR-12, NFR-04, UC01–UC03** (khóa RBAC ở cả API & Client). | Dễ | 0.5 ngày | **Cao** | `authService.js`, `search-api/index.js`, `collector/index.js`, `App.jsx` |
| **A2. Đồng bộ SRE Chat Mobile & sửa Web `SreMessengerModal`** | Đổi payload/field Mobile sang `content, logAttachment, nguoi_gui, noi_dung`, đổi socket sang `sre_chat_message`; Web dùng `config.js` & `sessionStorage`; sửa SQLite lấy 50 tin **mới nhất** (`DESC` rồi `.reverse()`). | Khôi phục chức năng cốt lõi **FR-13 & FR-14**. | Dễ | 0.5 ngày | **Cao** | `sqlite.js`, `SreMessengerModal.jsx/.js`, `DashboardScreen.js` |
| **A3. Sửa lỗi Heatmap Modal (Web + Mobile) & Mobile Viewer Card** | Chuẩn hóa khóa ngày Heatmap `dd/MM` thống nhất với Backend; ẩn nút `Tiếp nhận/Xử lý xong` với Viewer trên `AnomalyCard.js` và mở modal Root Cause bắt buộc khi Resolve. | Khớp **FR-06, FR-08, UC03**. | Dễ | 0.5 ngày | **Cao** | `App.jsx`, `AnomaliesScreen.js`, `AnomalyCard.js` |
| **A4. Khép kín Ingestion Fallback SQLite & 3 tầng Anomaly + ML thật** | Thêm bảng `log_du_phong` SQLite ghi khi Collector/OpenSearch lỗi; lưu ngưỡng Drain vocabulary cố định lúc train HDFS/BGL (`*.pkl`), chạy lại `train_and_evaluate.py` trên tập dữ liệu đủ lớn (~500–2000 chuỗi thay vì 11 chuỗi), bỏ số hardcode ở `full_evaluation.js`, nối kết quả 3 tầng từ `parser/index.js` vào `broadcastNewLog` + `incidents`. | Đáp ứng trung thực **FR-02, FR-04, FR-16, NFR-02, NFR-03**. | Trung bình – Khó | 2–3 ngày | **Rất cao** | `sqlite.js`, `parser/index.js`, `anomaly-engine/`, `ml-models/` |

### Nhóm B — Nên bổ sung (Nhỏ, dễ làm, tăng điểm phản biện)

| Tên hạng mục | Mô tả ngắn | Lý do phù hợp (Bám Word) | Độ khó | Thời gian | Giá trị bảo vệ | Phụ thuộc |
|---|---|---|---|---|---|---|
| **B1. Màn hình Audit Trail & Lịch sử Cron trên Web** | Thêm modal/sub-tab hiển thị dữ liệu thật từ `/api/v1/audit/logs` và `/api/v1/cron/history` (chỉ Admin xem, kèm lọc theo action/trạng thái). | Hoàn chỉnh vòng đời **FR-11, FR-12, UC05** (API đã có sẵn nhưng chưa có UI). | Dễ | 0.5 ngày | **Cao** | `search-api/index.js`, `CronJobsModal.jsx`, `AdminSettingsModal.jsx` |
| **B2. Khớp Xuất CSV thật & Đồng nhất Tab/Help Web** | Nối nút xuất CSV tới `GET /api/v1/export/csv` (hoặc giữ song song `.csv` + `.xlsx`), cập nhật `App.jsx` thêm `page-title` cho `sre-chat`, sửa `TabHelpModal.jsx` bỏ `trace`/`admin` và thêm `sre-chat`, đồng nhất "6 Tab" trong Word. | Khớp **FR-06, FR-15** và loại bỏ lỗi trưng UI. | Dễ | 0.5 ngày | **TB** | `App.jsx`, `TabHelpModal.jsx` |
| **B3. Bộ Smoke Test & Integration Test tự động** | Viết script test API bằng Node built-in `node:test` kiểm thử Auth 401/403 RBAC, Collector 202/400, Incident `NEW→ACK→RESOLVED`, Export CSV & Health check. | Bù đắp hoàn toàn khoảng trống kiểm thử tự động trong **Mục 5**. | Dễ – TB | 1 ngày | **Cao** | `BE/package.json`, `search-api/`, `collector/` |

### Nhóm C — Có thể mở rộng (Sau bảo vệ / Nâng cao hợp lý)

| Tên hạng mục | Mô tả ngắn | Lý do phù hợp (Bám Word) | Độ khó | Thời gian | Giá trị bảo vệ | Phụ thuộc |
|---|---|---|---|---|---|---|
| **C1. Tách `FE/src/App.jsx` thành Custom Hooks & Page Components** | Tách 3.457 dòng trong `App.jsx` thành 6 module Tab + hooks (`useSocketLogs`, `useAuth`). | Cải thiện khả năng bảo trì, hiệu năng render React 18. | TB | 1.5 ngày | **TB** | `FE/src/App.jsx` |
| **C2. Rate Limiting & Helmet cho Search API / Collector** | Gắn `express-rate-limit` riêng cho `/auth/login`, `/ai/*`, `/collector` và giới hạn kích thước JSON hợp lý hơn (`2mb`–`10mb`). | Tăng điểm bảo mật **NFR-04**. | Dễ | 0.5 ngày | **TB** | `BE/search-api/index.js`, `collector/index.js` |

### Lộ trình gợi ý thực hiện theo tuần (2 tuần trước bảo vệ)
- **Tuần 1 (Ngày 1–3):** Hoàn thành toàn bộ **A1, A2, A3** (Vá RBAC BE+FE, fix SRE Chat Mobile, fix Heatmap Modal, sửa Viewer card & Cron/Help UI).
- **Tuần 1 (Ngày 4–7):** Thực hiện **A4** (Train lại ML trên tập lớn HDFS/BGL xuất `.pkl`, cố định vocab Drain, bỏ hardcode `full_evaluation.js`, nối 3 tầng vào Parser, bổ sung bảng SQLite fallback).
- **Tuần 2 (Ngày 8–10):** Thực hiện **B1, B2, B3** (UI Audit/Cron History, Export CSV thật, viết bộ test `node:test`, đồng bộ lại chữ/ảnh/số liệu trong `DATN_BanHoanChinh.docx`).
- **Tuần 2 (Ngày 11–14):** Chạy kiểm thử toàn trình theo Checklist Mục 7 + diễn tập Demo & Q&A bảo vệ.

---

## 7. Checklist Test Thủ Công Cần Kiểm Tra Trên UI/API

1. **Auth & RBAC (`FR-01`, `NFR-04`):**
   - [ ] Đăng nhập `admin` / `viewer` trên Web & Mobile → kiểm tra `sessionStorage`/`AsyncStorage` có JWT; gọi `GET /api/v1/auth/me` trả đúng role.
   - [ ] **Negative test (Quan trọng):** Gửi request **không kèm header `Authorization`** tới `PATCH /api/v1/anomalies/:id/status`, `POST /api/v1/config`, `POST /api/v1/alerts/maintenance`, `POST /api/v1/storage/retention/cleanup`, `POST /api/v1/reports/digest/trigger` → bắt buộc phải nhận **401** (hiện tại đang lọt 200!).
   - [ ] Đăng nhập bằng `viewer`, thử gọi các API quản trị trên với JWT của `viewer` → bắt buộc nhận **403**.
   - [ ] Kiểm tra `GET /api/v1/config` sau khi vá → không trả trường `smtpPass` dạng plaintext.
2. **Pipeline Ingestion, Drain & 3 Tầng (`FR-02`, `FR-03`, `FR-04`, `FR-05`):**
   - [ ] Bắn `POST /api/v1/logs` thiếu `message` hoặc `level` → kỳ vọng 400 (sau khi bổ sung validate); bắn đủ 4 trường → 202 Accepted.
   - [ ] Mở `ml_api.py` (`:8000`) → kiểm tra `/health` trả `"model_loaded": true` (sau khi train xuất `.pkl`). Tắt `ml_api.py` → kiểm tra Parser vẫn chạy Tầng 1–2 không crash.
   - [ ] Tắt Collector (`:4000`) và thử Simulator → kiểm tra log fallback có lưu bền vững hay mất khi restart BE.
3. **Tra cứu, Heatmap & Xuất File (`FR-06`):**
   - [ ] Trên Web Tab "Bất thường → Biểu đồ phân tích", bấm vào 1 ô Heatmap màu đỏ/vàng có lỗi > 0 → Modal mở ra **phải liệt kê được danh sách log lỗi** chứ không báo `"Không tìm thấy bản ghi chi tiết"`. Kiểm tra tương tự trên Mobile.
   - [ ] Thử nút xuất CSV (`GET /api/v1/export/csv`) và xuất Excel `.xlsx`, mở bằng Excel kiểm tra tiếng Việt UTF-8 (`\uFEFF`) không lỗi font.
4. **Incident Lifecycle & SRE Messenger (`FR-08`, `FR-13`, `FR-14`):**
   - [ ] Tài khoản `viewer` mở Mobile Tab "Sự cố" → không được phép chuyển trạng thái `ACKNOWLEDGED`/`RESOLVED`, chỉ thêm được `INVESTIGATION` note.
   - [ ] Tài khoản `admin` thử đóng `RESOLVED` khi chưa chọn `Root Cause`/`Action Taken` → phải bị chặn.
   - [ ] Nhắn tin + gắn thẻ log từ Web qua Mobile và ngược lại trong `SRE Messenger` → tin nhắn hiện tức thì 2 chiều không lỗi 400, bấm thẻ log mở đúng chi tiết log; gửi > 55 tin rồi reload vẫn hiện 50 tin **mới nhất**.
5. **AI Copilot & Cron Jobs (`FR-09`, `FR-11`):**
   - [ ] Bấm "AI Giải Thích" trên 1 log ERROR, thử hỏi chat bằng chữ và dán/tải 1 ảnh chụp lỗi → nhận đủ 3 phần phân tích, không crash 413 khi ảnh vừa phải.
   - [ ] Kiểm tra nút "Chạy Thử Ngay" (Daily Digest) & "Dọn Dẹp Ngay" trong `CronJobsModal`: Viewer không được phép bấm, Admin bấm ghi vào `lich_su_cron`.

---

## 8. Đánh Giá Tổng Thể & Kế Hoạch Sửa Gấp

### 8.1. Chấm điểm tham chiếu (thang /10)
| Tiêu chí | Điểm | Lý do chấm dựa trên bằng chứng |
|---|---|---|
| **1. Khớp yêu cầu tài liệu Word** | **6.0 / 10** | Phủ rộng đủ các phân hệ Web/Mobile/BE/SQLite/AI/Cron, nhưng sai khác ở số tab Web (6 vs 7), nút Quick Login Web, Fallback SQLite, model `.pkl`/F1 ML và một số nút không đồng bộ. |
| **2. Chức năng chạy thật** | **6.5 / 10** | Luồng cốt lõi Log Search, Admin Config, Cron, AI Copilot hoạt động; nhưng Mobile SRE Chat hỏng API contract, Web/Mobile Heatmap Modal lỗi định dạng ngày, Tầng 3 ML thiếu `.pkl` & Parser chỉ log ra console. |
| **3. Chất lượng kỹ thuật & Bảo mật** | **4.5 / 10** | Có WAL mode, bcryptjs, Worker Thread; **nhưng** rò rỉ `smtpPass`, `optionalAuth` cho phép anonymous sửa sự cố/config/cleanup/maintenance, Web gửi `token = null`, CORS mở mọi origin, `App.jsx` 3.457 dòng, 0 automated tests, benchmark hardcode. |
| **4. Giao diện & UX (Web + Mobile)** | **7.5 / 10** | Thiết kế Dark/Light đồng bộ tốt giữa Web và Expo Mobile, biểu đồ Recharts/SVG sắc nét, nhiều trạng thái loading/empty; trừ lỗi trắng tiêu đề tab `sre-chat`, Help Modal sai tab, checkbox gốc và card Mobile lộ nút của Admin. |

> **Xếp loại tổng thể:** **`ĐẠT CÓ ĐIỀU KIỆN`** (Không nên mang nguyên bản hiện tại đi bảo vệ nếu hội đồng kiểm tra bảo mật API, kiểm tra Mobile Chat, bấm Heatmap hoặc hỏi sâu về F1 = 0.0000).

### 8.2. Top 10 Việc Cần Sửa Gấp Nhất
1. **[Cao]** Sửa `BE/search-api/index.js` (dòng 327, 360, 394, 493, 510): thay `optionalAuth` bằng `authenticateToken` + `requireAdmin` (và check role ở `PATCH /anomalies/:id/status`), ẩn `smtpPass` khỏi `GET /api/v1/config`.
2. **[Cao]** Sửa `FE/src/App.jsx` (dòng 277, 300, 362, 458, 498) & `SreMessengerModal.jsx` (dòng 4, 95): thống nhất đọc JWT từ `sessionStorage.getItem('logpulse_auth_token')` và dùng `API_BASE` từ `config.js`.
3. **[Cao]** Sửa `Mobile/src/components/SreMessengerModal.js` & `DashboardScreen.js:61–62`: khớp đúng body `{ content, logAttachment }`, field `{ nguoi_gui, ten_hien_thi, vai_tro, noi_dung, dinh_kem_log, thoi_gian }`, và socket event `sre_chat_message`; sửa `sqlite.js:338` thành `ORDER BY thoi_gian DESC LIMIT ?` + `.reverse()`.
4. **[Cao]** Sửa `FE/src/App.jsx:3286` & `Mobile/.../AnomaliesScreen.js:836`: chuẩn hóa cùng 1 format ngày `dd/MM` (hoặc truyền ISO `YYYY-MM-DD` từ BE) để bấm ô Heatmap mở được log chi tiết.
5. **[Cao]** Sửa `Mobile/src/components/AnomalyCard.js:108–126` & `AnomaliesScreen.js:144–169`: truyền `isAdmin`, ẩn nút chuyển trạng thái của Viewer và bắt buộc mở modal Root Cause + Action Taken trước khi gửi `RESOLVED` (đồng thời ép validate bắt buộc trong `incidentService.js`).
6. **[Cao]** Nối hoàn chỉnh Tầng 3 ML & Benchmark thật: train trên tối thiểu vài trăm/nghìn chuỗi HDFS & BGL lưu `.pkl` + vocab Drain cố định, gỡ bỏ hoàn toàn các dòng hardcode `0.67` / `0/0/1/2` trong `full_evaluation.js`, nối kết quả 3 tầng từ `parser/index.js` vào `broadcastNewLog` + cảnh báo.
7. **[TB]** Sửa `BE/search-api/index.js:79–98` (`corsOptions` từ chối origin lạ khi không match) và xác thực JWT trong Socket.IO middleware.
8. **[TB]** Sửa `FE/src/App.jsx:1294–1300` (thêm title cho tab `sre-chat`) và `FE/src/components/TabHelpModal.jsx` (khớp 6 tab thật, bỏ `trace`/`admin`), sửa nút `CronJobsModal.jsx:153,239` thêm `disabled={!isAdmin}`.
9. **[TB]** Thay dữ liệu tĩnh trong `Mobile/src/screens/home/DashboardScreen.js:419–438` (Pipeline Modal) bằng trạng thái thật từ `healthData` và tắt/chuyển `startCloudLogStreamer()` (`search-api/index.js:50–73`) sang cờ biến môi trường rõ ràng.
10. **[Thấp]** Bổ sung bảng `log_du_phong` SQLite cho Collector Fallback + UI xem `audit/logs` & `cron/history` + viết test tự động bằng `node:test`.

### 8.3. Câu Hỏi Phản Biện Dự Đoán & Gợi Ý Trả Lời
1. **"Vì sao mục tiêu F1-Score ghi `0,85–0,95` nhưng kết quả Isolation Forest chỉ đạt `0,0000` trên 3–5 mẫu test?"**
   - *Gợi ý:* Không né tránh hay chống chế. Giải thích thẳng: do tập thực nghiệm rút gọn mẫu ban đầu chỉ có 11 chuỗi HDFS và 23 cửa sổ BGL (tập test quá nhỏ chỉ 1 mẫu bất thường) nên Isolation Forest chưa đủ phân phối học không giám sát, khiến F1 = 0. Trước bảo vệ cần chạy train & evaluate lại trên quy mô lớn hơn (ví dụ 2.000+ mẫu HDFS/BGL) và cập nhật số liệu thực đo vào báo cáo.
2. **"Khi Viewer hoặc người lạ gọi trực tiếp API `PATCH /anomalies/:id/status` hay `POST /config` bằng Postman/curl, hệ thống chặn thế nào?"**
   - *Gợi ý:* Chỉ ra cơ chế `requireAdmin` + `authenticateToken` kiểm tra chữ ký JWT và `req.user.role === 'admin'` trước khi thực thi handler (sau khi đã vá lỗi `optionalAuth` ở Top 1), tuyệt đối không chỉ ẩn nút trên giao diện.
3. **"Tầng 3 ML ở Python giao tiếp với Node.js khi số lượng template Drain tăng lên liên tục thì xử lý lệch chiều vector thế nào?"**
   - *Gợi ý:* Thừa nhận hiện tại `drain.js` tạo cluster mới theo batch 10 log làm chiều vector thay đổi. Giải pháp đúng là nạp cố định từ điển template chuẩn (`vocabulary`) đã đóng băng lúc huấn luyện khi suy luận ML, các template mới chưa từng gặp gộp về slot `UNKNOWN_TEMPLATE` và kích hoạt cảnh báo mới (Zero-day template).

---

## 9. Phụ Lục

### 9.1. Bản đồ Màn hình ↔ API ↔ Controller/Service ↔ DB & Điểm mồ côi

| Màn hình / Tab (Web & Mobile) | Endpoint API được gọi | Service xử lý (`BE/`) | Lưu trữ (`SQLite` / `OpenSearch` / `Redis`) |
|---|---|---|---|
| Web `LoginModal` / Mobile `LoginScreen` | `POST /api/v1/auth/login` | `authService.loginUser` | SQLite `nguoi_dung`, `nhat_ky_he_thong` |
| Đổi mật khẩu (Web Modal / Mobile Profile) | `POST /api/v1/auth/change-password` | `authService.changePassword` | SQLite `nguoi_dung`, `nhat_ky_he_thong` |
| Tổng quan (`overview` / `DashboardScreen`) | `GET /api/v1/stats/kpi`, `/logs/stats`, `/pipeline/health`, `/logs/search`, `POST /simulator/generate`, Socket `new_log` | `opensearchQueries`, `pipelineMetrics`, `collector/index` | OpenSearch `logs-*`, BullMQ Redis |
| Bất thường & Analytics (`anomalies` / `AnomaliesScreen`) | `GET /api/v1/anomalies`, `/anomalies/analytics`, `PATCH /anomalies/:id/status`, `POST /anomalies/:id/notes` | `opensearchQueries`, `incidentService`, `alertService` | OpenSearch `logs-*`, SQLite `su_co`, `ghi_chu_su_co` |
| Tìm kiếm (`search` / `QuickActionScreen`) | `GET /api/v1/logs/search`, `POST /api/v1/ai/explain-log` | `opensearchQueries.searchLogs`, `aiService.explainLog` | OpenSearch `logs-*` |
| Mẫu Drain (`templates` / `DrainTemplatesScreen`) | `GET /api/v1/templates` | `opensearchQueries.getDrainTemplates` | OpenSearch `logs-*` (`drain_template*`) |
| Pipeline Health (`pipeline` / Modal) | `GET /api/v1/pipeline/health` | `pipelineMetrics.getPipelineHealth` | Redis BullMQ |
| SRE Messenger (`sre-chat` / `SreMessengerModal`) | `GET/POST /api/v1/chat/messages`, Socket `sre_chat_send` / `sre_chat_message` *(Mobile gọi sai)* | `sqlite.luuTinNhanNoiBo`, `layDanhSachTinNhanNoiBo` | SQLite `tin_nhan_noi_bo` |
| Cấu hình & Cron (`AdminSettingsModal`, `CronJobsModal`, `ProfileScreen`) | `GET/POST /api/v1/config`, `GET/POST /api/v1/alerts/maintenance`, `POST /reports/digest/trigger`, `POST /storage/retention/cleanup` | `alertService`, `cronService`, `opensearch.deleteByQuery` | SQLite `cau_hinh_he_thong`, `lich_bao_tri`, `lich_su_cron`, OpenSearch `logs-*` |
| AI Assistant (`AiAssistant.jsx`, `FloatingAiAssistant.js`) | `POST /api/v1/ai/chat`, `POST /api/v1/ai/explain-log` | `aiService.chatWithAI`, `explainLog` | External Groq / Gemini REST API |

- **API tồn tại nhưng không có UI nào gọi:** `GET /api/v1/export/csv` (`search-api/index.js:521`), `GET /api/v1/audit/logs` (`:469`), `GET /api/v1/cron/history` (`:479`), `GET /api/v1/auth/me` (`:205`), `POST /api/v1/ai/query` (`:579`, alias của `/ai/chat`).
- **UI gọi sai API/Contract:**
  - `Mobile/src/components/SreMessengerModal.js` gọi `POST /chat/messages` sai body `{ message, tagged_log }` (BE đọc `{ content, logAttachment }`), nghe sai event `new_chat_message`.
  - `FE/src/components/SreMessengerModal.jsx:4` đọc `VITE_SEARCH_API_URL` (không có trong `FE/.env.example`), dòng 95 đọc `localStorage.getItem('token')`.
  - `FE/src/App.jsx` (5 chỗ) đọc `localStorage.getItem('logpulse_auth_token')` nhưng token lưu ở `sessionStorage`.
- **Bảng DB SQLite hiện có (8/8 bảng đều có code truy vấn):** `nguoi_dung`, `su_co`, `ghi_chu_su_co`, `cau_hinh_he_thong`, `lich_bao_tri`, `nhat_ky_he_thong`, `lich_su_cron`, `tin_nhan_noi_bo` (còn thiếu bảng log dự phòng như Word mô tả).
- **File / Code chết hoặc trùng lặp:** `Mobile/src/screens/profile/AdminSettingsScreen.js`, `Mobile/src/screens/profile/ChangePasswordScreen.js` (không được navigate tới từ `ProfileScreen`); `BE/benchmark/pipeline_benchmark.js` (chạy benchmark cũ riêng với `full_evaluation.js`); `BE/anomaly-engine/ml-models/train_and_evaluate.py` & `ml_api.py` chưa có file `.pkl` đầu ra để chạy thật trong `start_all.bat`.

### 9.2. Danh sách mục chưa rõ / chưa xác minh runtime
- `AMB-01`..`AMB-06` đã ghi nhận từ Bước 1 (Word ghi 7 tab nhưng Web có 6 tab; Word chỉ ghi xuất CSV nhưng Web xuất `.xlsx`; mục tiêu F1 `0,85–0,95` vs bảng số liệu `0,0000`).
- **Chưa xác minh runtime full-stack:** Chưa khởi chạy trực tiếp Redis (`:6379`), OpenSearch (`:9200`), Search API (`:5000`), Collector (`:4000`), FastAPI (`:8000`), Vite (`FE` bị `EPERM` ghi config timestamp trong sandbox), Python (`python.exe` bị chặn truy cập trong sandbox) và Expo Mobile (`:8081`).

### 9.3. Danh sách file đã đọc và file bỏ qua

- **File đã đọc hoàn chỉnh / theo vùng mục tiêu (`[Đọc code]`):**
  - Tài liệu & cấu hình gốc: `DATN_BanHoanChinh.docx` (trích xuất toàn văn 390 đoạn, 14 bảng), `README.md`, `nghiepvu.md`, `kientruchethong.md`, `PROJECT_CONTEXT.md`, `desgin.md`, `.gitignore`, `start_all.bat`, `stop_all.bat`.
  - `BE/`: `package.json`, `.env.example`, `redis.conf`, `index.js`, `log_generator.js`, `collector/index.js`, `parser/index.js`, `parser/normalizer.js`, `queue/config.js`, `storage/opensearch.js`, `database/sqlite.js`, `search-api/index.js`, `authService.js`, `incidentService.js`, `alertService.js`, `aiService.js`, `cronService.js`, `pipelineMetrics.js`, `opensearchQueries.js`, `anomaly-engine/index.js`, `drain_worker.js`, `rule-based/detector.js`, `statistical/detector.js`, `template-mining/drain.js`, `template-mining/vectorizer.js`, `ml-models/ml_api.py`, `ml-models/train_and_evaluate.py`, `ml-models/results_hdfs.json`, `ml-models/results_bgl.json`, `benchmark/full_evaluation.js`, `pipeline_benchmark.js`, `evaluation_summary.json`, `REPORT_BENCHMARK_EVALUATION.md`, `datasets/stream_real_hdfs.js`, `export_real_dataset.js`, `hdfs/hdfsLoader.js`, `hdfs/generate_vectors.js`, `hdfs/anomaly_label.csv`, `bgl/bglLoader.js`, `bgl/generate_vectors.js`.
  - `FE/`: `package.json`, `.env.example`, `vercel.json`, `index.html`, `vite.config.js`, `src/config.js`, `src/main.jsx`, `src/i18n.js`, `src/App.jsx` (toàn file), `src/index.css` (toàn file), `src/custom_styles.css` (toàn file), toàn bộ 11 file trong `FE/src/components/` (`AdminSettingsModal.jsx`, `AiAssistant.jsx`, `CronJobsModal.jsx`, `CustomDateTimePicker.jsx`, `CustomSelect.jsx`, `IncidentNoteModal.jsx`, `LoginModal.jsx`, `PasswordChangeModal.jsx`, `PipelineHealthWidget.jsx`, `SreMessengerModal.jsx`, `TabHelpModal.jsx`).
  - `Mobile/`: `package.json`, `README.md`, `App.js`, `app.json`, `babel.config.js`, `src/api/client.js`, `src/api/config.js`, `src/context/AuthContext.js`, `src/context/ToastContext.js`, `src/theme/ThemeContext.js`, `src/theme/colors.js`, toàn bộ 4 file `src/navigation/`, toàn bộ 7 file `src/components/`, toàn bộ 9 file `src/screens/`.
- **File bỏ qua & lý do:**
  - `BE/.env`: **Bỏ qua có chủ đích** để tuyệt đối không đọc/lộ secret, API key, mật khẩu SMTP trong báo cáo.
  - `BE/data/sre_enterprise.sqlite`, `dump.rdb`: File nhị phân runtime database.
  - `node_modules/`, `.expo/`, `graphify-out/`, `package-lock.json`: Thư mục thư viện bên thứ ba, cache/artifact nội bộ và lockfile không chứa logic nghiệp vụ.
  - `BE/datasets/hdfs/*.log`, `BE/datasets/bgl/*.log`, `BE/datasets/*/vectors_*.json`, `BE/search-api/real_logs_dataset.json`: File dữ liệu thô / JSON dung lượng lớn (chỉ kiểm tra cấu trúc và cách loader đọc).
  - `tiendo.md`: Nhật ký tiến độ cũ (không thuộc yêu cầu đối chiếu Word).

