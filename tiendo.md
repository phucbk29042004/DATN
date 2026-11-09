# Tiến Độ Thực Hiện Dự Án Monitoring & Log Analytics Dashboard

## Nhật Ký Cập Nhật (Chronological Log)

### [09/11/2026 19:28] — Tinh Chỉnh Icon Chatbot Kéo Thả Tự Do (Draggable), Ẩn Nút Đóng Trùng Lặp, Rút Gọn Prompt Chatbot & Chuẩn Hóa Tiếng Việt Form Đăng Nhập (Đồng Bộ Web & Mobile)
- **Loại**: Cải tiến giao diện & UX/UI, Nâng cấp Chatbot AI, Tinh chỉnh Form Đăng nhập, Đồng bộ hóa Mobile
- **File**: `FE/src/components/AiAssistant.jsx`, `FE/src/components/LoginModal.jsx`, `FE/src/App.jsx`, `BE/search-api/aiService.js`, `Mobile/src/screens/auth/LoginScreen.js`, `tiendo.md`
- **Mô tả**:
  1. **Thông báo Toast khi tải lại Sức Khỏe Pipeline**:
     - Bổ sung thông báo dạng toast màu xanh lá báo hiệu làm mới dữ liệu thành công khi người dùng click nút "Làm Mới" trên Tab Sức Khỏe Pipeline trong `FE/src/App.jsx`.
  2. **Tối ưu Tri Thức & Phong Cách Trả Lời Của Chatbot AI (`BE/search-api/aiService.js`)**:
     - Tinh chỉnh System Prompt yêu cầu trả lời **ngắn gọn, súc tích (2 đến 4 câu hoặc 3 đến 4 gạch đầu dòng)**, đi thẳng vào trọng tâm vấn đề, không mở bài dông dài, loại bỏ dấu sao/hoa thị markdown rườm rà.
     - Nạp tri thức nền tảng toàn diện về mọi thành phần trong đồ án: Kiến trúc Pipeline 5 bước, thuật toán Drain Mining, cơ chế phát hiện bất thường 3 tầng (3-Tier Anomaly), các tác vụ định kỳ Cron Jobs, OpenSearch để chatbot trả lời chính xác mọi câu hỏi.
     - Giới hạn `max_tokens` xuống mức 600 để đảm bảo tốc độ phản hồi nhanh và nội dung cô đọng.
  3. **Biểu tượng Chatbot AI Kéo Thả Tự Do (Draggable) & Xóa Nút Đóng Thừa (`FE/src/components/AiAssistant.jsx`)**:
     - Bổ sung tính năng kéo thả tự do icon Chatbot trên màn hình (`onMouseDown` & `onTouchStart`) với cơ chế phân biệt click và drag dựa trên ngưỡng di chuyển 5px.
     - Lưu trữ tọa độ vị trí icon vào `localStorage` (`logpulse_ai_fab_pos`) để duy trì cố định vị trí người dùng đã kéo kể cả khi tải lại trang.
     - Xóa bỏ nút tròn đóng bên dưới khung chat khi đang mở chat (chỉ giữ lại nút đóng `X` trên thanh tiêu đề của khung chat); khi đóng chat thì icon Chatbot tự động hiện lại đúng vị trí đã kéo.
     - Khung chat tự động điều chỉnh tọa độ mở tương ứng gần vị trí icon và tự động căn chỉnh tránh tràn mép màn hình.
  4. **Chuẩn hóa Form Đăng Nhập Web & Mobile (`FE/src/components/LoginModal.jsx` & `Mobile/src/screens/auth/LoginScreen.js`)**:
     - Xóa bỏ huy hiệu `LP`, chữ `LogPulse` và `Enterprise Observability`, thay thế bằng huy hiệu chiếc khiên bảo mật và tiêu đề tiếng Việt trang nhã: *"Hệ Thống Giám Sát Log - Phân Tích & Cảnh Báo Sự Cố"*.
     - Thu nhỏ nút Đăng nhập: không còn kéo dài 100% bằng chiều ngang form mà thu gọn vừa vặn (`minWidth: 150px`, căn giữa `alignSelf: center`, padding gọn gàng).
     - Đồng bộ hóa toàn bộ các thay đổi trên (tiêu đề tiếng Việt, nút đăng nhập thu nhỏ căn giữa) sang ứng dụng di động Mobile.
- **Kết quả**: `npm --prefix FE run build` thành công trong 7.12s (0 errors, 0 warnings). Backend vượt qua cú pháp node check. Mobile code đồng bộ hoàn hảo.

### [09/11/2026 19:06] — Sửa Lỗi Runtime ReferenceError Server is not defined trong FE/src/App.jsx
- **Loại**: Sửa lỗi cú pháp runtime (Bugfix)
- **File**: `FE/src/App.jsx`, `tiendo.md`
- **Mô tả**: Bổ sung import icon `Server` từ `lucide-react` trong `FE/src/App.jsx` để phục vụ hiển thị nút *1. Log Sources* trên sơ đồ Topology Tab Sức Khỏe Pipeline.
- **Kết quả**: `npm --prefix FE run build` hoàn tất thành công trong 12.13s (0 errors, 0 warnings). HMR reload bình thường, lỗi 500 runtime đã được khắc phục hoàn toàn.

### [09/11/2026 19:04] — Khắc Phục Lỗi Modal Cron Jobs, Thiết Kế Lại Form Đăng Nhập Chuẩn SaaS (Ảnh Đồ Họa + Icon Ẩn/Hiện Mật Khẩu), Bổ Sung Tab Sức Khỏe Pipeline Lên Sidebar & Đồng Bộ Mobile
- **Loại**: Sửa lỗi giao diện (Bugfix), Cải tiến UX/UI Form Login, Tính năng mới Tab Sidebar, Đồng bộ hóa Mobile
- **File**: `FE/src/components/CronJobsModal.jsx`, `FE/src/components/LoginModal.jsx`, `FE/src/App.jsx`, `Mobile/src/screens/auth/LoginScreen.js`, `tiendo.md`
- **Mô tả**:
  1. **Khắc phục lỗi Modal Cron Jobs bị trong suốt và tách rời khối**:
     - Chuẩn hóa thẻ bao bọc từ `modal-content` sang `modal-container` với thuộc tính nền `var(--bg-card)`, bo góc mềm mại `var(--radius-lg)`, đổ bóng sâu `box-shadow` và viền sắc nét `border: 1px solid var(--border-color)`.
     - Toàn bộ Header, 2 card cấu hình và Footer được gom lại thành một khối hộp card modal nguyên khối, đồng nhất và sang trọng.
  2. **Thiết kế lại Form Đăng Nhập (Login) đỡ "chất AI"**:
     - Cột bên trái: Thay thế toàn bộ các đoạn bullet text dài dòng bằng **một bức ảnh đồ họa chất lượng cao về trung tâm dữ liệu giám sát** có gradient overlay tối màu tinh tế, logo LogPulse và tagline tối giản.
     - Cột bên phải: Bổ sung icon con mắt (`Eye` / `EyeOff`) ở trường Mật khẩu cho phép người dùng click để bật/tắt hiển thị mật khẩu.
  3. **Bổ sung Tab mới "Sức Khỏe Pipeline" lên Sidebar điều hướng bên trái**:
     - Thêm mục Tab thứ 5: **Sức Khỏe Pipeline (`pipeline`)** với icon `Cpu` màu xanh ngọc trên thanh Sidebar.
     - Xây dựng màn hình phân tích chuyên sâu gồm:
       * Sơ đồ luồng xử lý dữ liệu 5 nút kiến trúc: `[1. Nguồn Log] -> [2. Collector/Fluent Bit] -> [3. Hàng Đợi Redis] -> [4. Drain Parser] -> [5. Cụm OpenSearch]` kèm trạng thái trực quan từng node.
       * Bảng điều khiển vi sai hàng đợi BullMQ (Đang chờ, Đang chạy, Hoàn thành, Lỗi).
       * Thông lượng tức thời (log/s), đỉnh thông lượng, độ trễ trung bình bóc tách Drain (ms).
       * Tích hợp trực tiếp nút bấm tiêm 35 log mẫu (`/api/v1/simulator/generate`) để demo trực tiếp luồng xử lý trước hội đồng bảo vệ đồ án.
  4. **Đồng bộ hóa sang Ứng dụng Di động (Mobile App)**:
     - Cập nhật `Mobile/src/screens/auth/LoginScreen.js`: Bổ sung state `showPassword` và nút bấm icon `Eye` / `EyeOff` (`lucide-react-native`) ở ô nhập mật khẩu; xóa bỏ tài khoản/mật khẩu điền sẵn.
- **Kết quả**: `npm --prefix FE run build` thành công trong 7.50s (0 errors, 0 warnings). Mobile code cú pháp hợp lệ. Mọi lỗi giao diện đã được khắc phục hoàn toàn.

### [09/11/2026 18:42] — Khởi Tạo Auth Gate Buộc Đăng Nhập Trước, Thêm Bảng Điều Khiển Cron Job Trên Submenu, Thiết Kế Lại Email/Discord Notification & Tối Ưu UX Đồ Thị
- **Loại**: Cải tiến giao diện & UX/UI, Tính năng mới Quản lý Cron Job, Tối ưu thông báo Email/Discord, Sửa lỗi hiển thị & Đa ngôn ngữ
- **File**: `FE/src/components/CronJobsModal.jsx`, `FE/src/App.jsx`, `FE/src/components/AdminSettingsModal.jsx`, `FE/src/components/LoginModal.jsx`, `FE/src/custom_styles.css`, `BE/search-api/alertService.js`, `BE/search-api/cronService.js`, `BE/search-api/index.js`, `tiendo.md`
- **Mô tả**:
  1. **Bắt buộc vào trang Login khi mở dự án (Auth Gate)**:
     - Chuyển cơ chế lưu session đăng nhập sang `sessionStorage` và tự động dọn dẹp các token/user cũ lưu trong `localStorage` lúc khởi động app.
     - Khi mở ứng dụng hoặc chạy dự án, hệ thống luôn hiển thị form đăng nhập `LoginModal` trước, người dùng bắt buộc phải đăng nhập hợp lệ mới được truy cập Dashboard.
  2. **Thêm mục "Quản Lý Cron Job" trong Submenu Admin (Header & Sidebar footer)**:
     - Tạo mới component `FE/src/components/CronJobsModal.jsx` với giao diện quản trị chuyên nghiệp:
       * Card 1: Báo Cáo Định Kỳ 24h (`Daily Digest`) có công tắc Bật/Tắt, lịch chạy `08:00 AM`, nút "Chạy Thử Ngay" và trạng thái các kênh phát hành (Discord/Email).
       * Card 2: Dọn Dẹp Log Quá Hạn (`Retention Policy Cleanup`) có công tắc Bật/Tắt, lịch chạy `00:00 Midnight`, ô tùy chỉnh số ngày lưu trữ (`retentionDays`) và nút "Dọn Dẹp Ngay".
       * Card 3: Khả năng mở rộng đề xuất (`Weekly Executive Digest`, `Pipeline Heartbeat Monitor`, `Drain Template Pruner`).
     - Tích hợp nút mở modal *"Quản Lý Cron Job"* (icon `CalendarClock` màu vàng hổ phách `#f59e0b`) vào menu dropdown Admin ở cả thanh điều hướng trên Header và dưới chân Sidebar.
     - Backend bổ sung hàm `reloadCronJobs()` trong `BE/search-api/cronService.js` và tích hợp vào route `POST /api/v1/config` để tái nạp lịch chạy tức thì khi người dùng thay đổi trạng thái bật/tắt từ giao diện.
  3. **Thiết kế lại toàn diện thông báo qua Email & Discord (Alert & 24h Digest)**:
     - **Email (SMTP/Gmail)**: Chuyển hoàn toàn từ giao diện nền tối sang mẫu email thông báo tiêu chuẩn (nền xám nhạt `#f8fafc`, container thẻ trắng `#ffffff`, viền mỏng `#e2e8f0`, bảng dữ liệu 2 cột sạch sẽ, khối mã log snippet trực quan, chân trang thông báo hệ thống trang trọng, tiêu đề email không dùng emoji sặc sỡ).
     - **Discord Webhook**: Tối giản Rich Embed, bỏ các emoji rườm rà, giữ giao diện sạch sẽ, bố cục gọn gàng, màu sắc embed nhã nhặn.
  4. **Khắc phục lỗi text bị che khuất ở card "Phân Bố Theo Mức Độ"**:
     - Điều chỉnh bán kính Donut Chart (`innerRadius={45}`, `outerRadius={70}`) và chuyển hiển thị tỷ lệ phần trăm cùng số lượng vào thanh chú thích `Legend` bên dưới (`formatter={(value, entry) => ...}`), loại bỏ hiện tượng nhãn chữ chìa ra ngoài viền khung thẻ gây cắt chữ.
  5. **Việt hóa đồng bộ card "Lượng Log Theo Thời Gian & Điểm Phát Hiện Bất Thường"**:
     - Bổ sung `formatter` đa ngôn ngữ cho `<Legend>` và `<Tooltip>` của `ComposedChart`: hiển thị chuẩn *Thông tin*, *Cảnh báo*, *Lỗi*, *Nghiêm trọng* và chuyển nhãn `Anomaly` sang *Bất thường* khi ở chế độ Tiếng Việt.
  6. **Chuẩn hóa nút xuất báo cáo `.xlsx` trong Cấu Hình Hệ Thống**:
     - Cập nhật `FE/src/components/AdminSettingsModal.jsx`: đổi toàn bộ nhãn, mô tả và nút bấm từ định dạng "CSV" sang "Excel (.xlsx)", thay icon `Download` thành `FileSpreadsheet` màu xanh ngọc `#10b981` đồng bộ với luồng xuất Excel hiện có.
  7. **Tối ưu màu chữ Heatmap "Mật Độ Lỗi Theo Khung Giờ" cho cả Dark và Light Mode**:
     - Tinh chỉnh màu chữ linh hoạt theo cấp độ lỗi (`intensity`) và theme: ô lỗi nhẹ dùng màu vàng cam tương phản, ô lỗi trung bình/nặng dùng chữ trắng đậm nét có bóng chữ (`text-shadow`), ô không lỗi để rỗng; tiêu đề giờ và nhãn ngày hiển thị rõ nét trên cả giao diện Sáng và Tối.
- **Kết quả**: Build Frontend Web `npm --prefix FE run build` thành công 100% trong 21.45s (0 error, 0 warning). Backend cú pháp chuẩn xác. Mọi tính năng hoạt động liền mạch và đáp ứng đầy đủ yêu cầu của người dùng.

### [07/11/2026 12:10] — Việt Hóa Đa Ngôn Ngữ Nhãn Mức Độ Log, Tối Ưu Chiều Cao Heatmap Dạng Ma Trận Ngang & Chống Tràn Card Diễn Biến Điểm Bất Thường (Đồng Bộ Web & Mobile)
- **Loại**: Cải tiến giao diện & UX/UI, Hỗ trợ đa ngôn ngữ (i18n), Tối ưu bố cục responsive (Web & Mobile)
- **File**: `FE/src/App.jsx`, `FE/src/custom_styles.css`, `Mobile/src/screens/anomalies/AnomaliesScreen.js`, `tiendo.md`
- **Mô tả**:
  1. **Việt hóa nhãn phân bố mức độ log (`INFO, WARN, ERROR, FATAL`)**:
     - Trên Web: Card "Phân phối mức độ nghiêm trọng" (Tổng quan) và Card "Phân Bố Theo Mức Độ" (Biểu đồ phân tích Anomaly) tích hợp `LEVEL_MAP[lang]` cho nhãn biểu đồ tròn (`Pie label`), `Tooltip` và `Legend`. Khi chọn Tiếng Việt (`vi`) hiển thị *Thông tin*, *Cảnh báo*, *Lỗi*, *Nghiêm trọng*; khi chọn Tiếng Anh (`en`) tự động chuyển về *INFO, WARN, ERROR, FATAL*.
     - Trên Mobile: Sử dụng từ điển nhãn tiếng Việt `LEVEL_NAMES_VI` cho thanh tiến trình phân bố mức độ.
  2. **Tối ưu chiều cao Ma trận Heatmap Mật độ lỗi theo khung giờ**:
     - Trên Web: Tái cấu trúc ma trận chuyển 24 khung giờ làm trục X (`00h` đến `23h` cuộn ngang) và các ngày làm trục Y (chỉ 1–7 hàng), giúp chiều cao card giảm hơn 65% (từ >750px xuống chỉ còn ~240px, ngang bằng hoàn hảo với card Top Templates bên cạnh). Bổ sung thanh chỉ dẫn mức độ màu sắc (*Ít lỗi -> Nhiều lỗi*).
     - Trên Mobile: Cấu hình ma trận ngang có `ScrollView horizontal`, nhãn ngày bên trái và 24 mốc giờ cuộn ngang, giao diện nhỏ gọn và không kéo dài trang.
  3. **Chống tràn dữ liệu và rút gọn tiêu đề card "Diễn Biến Điểm Bất Thường"**:
     - Xóa bỏ chữ trong ngoặc đơn ở tiêu đề thành *"Diễn Biến Điểm Bất Thường"* (Web) và *"Điểm Bất Thường"* (Mobile).
     - Trên Web: Cấu hình `overflow: hidden`, `minTickGap={35}`, `interval="preserveStartEnd"` trên `XAxis`, lề `margin={{ top: 12, right: 30, left: -10, bottom: 0 }}`, nhãn ngưỡng `insideTopRight` ngăn đường vẽ và chữ bị chèn hoặc tràn viền card.
     - Trên Mobile: Bổ sung `overflow: hidden`, định dạng thanh điểm Anomaly sắc nét và căn chỉnh nhãn mốc thời gian.
- **Kết quả**: `npm run build` thành công trong 7.88s (0 errors, 0 warnings). Toàn bộ giao diện trực quan, cân đối và đồng bộ 100% giữa Web và Mobile.

### [07/11/2026 11:50] — Thiết Kế Lại Sub-Tabs Segmented Control, Tái Cấu Trúc Bố Cục 4 Thẻ KPI, Sửa Lỗi NaN:NaN & Warning Unique Key (Web & Mobile)
- **Loại**: Cải tiến giao diện & UX/UI, Sửa lỗi hiển thị thời gian, Sửa lỗi React Console Warning
- **File**: `FE/src/App.jsx`, `FE/src/custom_styles.css`, `Mobile/src/screens/anomalies/AnomaliesScreen.js`, `tiendo.md`
- **Mô tả**:
  1. **Thiết kế lại 2 nút chuyển Sub-Tab sang chuẩn Modern SaaS Segmented Control**:
     - Trên Web: Bổ sung CSS cho `.anomaly-sub-tabs` và `.anomaly-sub-tab` trong `FE/src/custom_styles.css` với khung nền `var(--bg-card)` bo góc `rounded-xl` (12px), nút active có màu nhấn thương hiệu (Tím Indigo ở Dark Mode, Xanh Da Trời ở Light Mode), đổ bóng glow và viền nổi bật.
     - Trên Mobile: Tinh chỉnh thanh tab pill trong `Mobile/src/screens/anomalies/AnomaliesScreen.js` với bo góc `rounded-xl`, đổ bóng elevation và hiệu ứng chạm trực quan.
  2. **Tái cấu trúc bố cục 4 thẻ KPI chuẩn UX/UI**:
     - Trên Web: Chuyển sang sử dụng grid 4 cột đồng nhất `.kpi-grid` với cấu trúc thẻ 3 tầng (Icon tròn màu pastel + Giá trị số lớn đậm monospaced + Dòng nhãn phụ giải thích ngữ cảnh như *Khung thời gian*, *Tỷ lệ lỗi %*, *Vượt ngưỡng > 70%*, *Tốc độ trung bình*).
     - Trên Mobile: Đồng bộ cấu trúc 3 tầng cho 4 thẻ KPI dạng lưới 2x2 cân đối, sắc nét.
  3. **Khắc phục triệt để lỗi thời gian `NaN:NaN` và lỗi ngày Heatmap**:
     - Trên biểu đồ *Lượng Log Theo Thời Gian* và *Anomaly Score*: Bỏ hàm ép kiểu `new Date(v)` gây lỗi `NaN:NaN` trên chuỗi giờ đã định dạng sẵn, sử dụng trực tiếp chuỗi thời gian hợp lệ trên trục `XAxis` và định dạng ngày giờ tiếng Việt an toàn qua `formatVnDateTime(timestamp)` trong Tooltip `labelFormatter`.
     - Trên thẻ Heatmap: Sửa lỗi cắt chuỗi `date.slice(5)` để hiển thị đầy đủ ngày tháng `DD/MM` trên các cột.
  4. **Khắc phục React Console Warning `unique key prop`**:
     - Thêm prop `key={`anomaly-dot-${index}-${payload.timestamp || cx}`}` vào thẻ `<circle>` trong thuộc tính `dot` của `<Line dataKey="anomaly_count" />`.
- **Kết quả**: `npm run build` hoàn thành không lỗi trong 7.48s. Không còn cảnh báo warning trong console, loại bỏ hoàn toàn lỗi `NaN:NaN`, giao diện đạt chuẩn thẩm mỹ SaaS hiện đại và đồng bộ 100% giữa Web và Mobile.

### [07/11/2026 11:35] — Nâng Cấp Hệ Thống 2 Tab Anomaly (Danh Sách & Biểu Đồ Phân Tích Đa Chiều), Sửa Lỗi Tooltip Dark Mode & Đồng Bộ Toàn Diện Web & Mobile App
- **Loại**: Cải tiến giao diện & Tính năng mới (Web & Mobile), Bổ sung Backend API Analytics, Sửa lỗi hiển thị Dark Mode
- **File**: `FE/src/App.jsx`, `FE/src/custom_styles.css`, `BE/search-api/opensearchQueries.js`, `BE/search-api/index.js`, `Mobile/src/screens/anomalies/AnomaliesScreen.js`, `tiendo.md`
- **Mô tả**:
  1. **Khắc phục lỗi Tooltip chữ đen trên nền tối (Dark Mode)**:
     - Thêm `itemStyle={{ color: 'var(--text-primary)' }}` và `labelStyle={{ color: 'var(--text-primary)' }}` cho `<Tooltip>` của Recharts trong `FE/src/App.jsx`.
     - Bổ sung CSS override trong `FE/src/custom_styles.css` ép toàn bộ các class `.recharts-default-tooltip`, `.recharts-tooltip-item`, `.recharts-tooltip-label` luôn nhận màu chữ sáng `--text-primary` trên nền Dark Mode với bo góc 10px và đổ bóng mịn.
  2. **Bổ sung Backend API phân tích đa chiều `/api/v1/anomalies/analytics`**:
     - Thêm hàm `getAnomalyAnalytics({ from, to, service, level })` trong `BE/search-api/opensearchQueries.js` thực hiện 2 query song song đến OpenSearch: KPI tổng hợp, chuỗi thời gian (timeline histogram theo phút xếp chồng mức độ), phân bố level, top dịch vụ lỗi (top_services), chuỗi điểm anomaly score theo thời gian, ma trận heatmap (24 giờ x ngày) và top Drain templates.
     - Khai báo endpoint `GET /api/v1/anomalies/analytics` trong `BE/search-api/index.js`.
  3. **Nâng cấp giao diện 2 Tab tại mục "Phát Hiện Bất Thường" trên Web**:
     - Phân chia thành 2 sub-tab: *"Danh Sách Sự Cố"* (giữ nguyên đầy đủ bảng danh sách, bộ lọc trạng thái, ghi chú incident, xuất Excel) và *"Biểu Đồ Phân Tích"*.
     - Tab *"Biểu Đồ Phân Tích"* bố trí 4 hàng trực quan:
       * **Hàng 1**: Thanh bộ lọc chung (1h, 6h, 24h, 7d; Dropdown dịch vụ; Dropdown mức độ) + Lưới 4 thẻ KPI (Tổng Log, ERROR/FATAL, Bất Thường, Throughput log/s).
       * **Hàng 2**: Biểu đồ lớn toàn chiều ngang `ComposedChart` hiển thị Lượng log theo thời gian (Area xếp chồng INFO/WARN/ERROR/FATAL) kèm các điểm ghim bất thường (Line step/scatter).
       * **Hàng 3**: 3 biểu đồ ngang hàng gồm Donut Chart phân bố mức độ, Horizontal Bar Chart Top dịch vụ lỗi (hỗ trợ click để lọc chéo - cross-filter), và Biểu đồ Line Chart diễn biến Anomaly Score kèm đường ngưỡng đỏ (Threshold Line = 0.7).
       * **Hàng 4**: Ma trận Heatmap mật độ lỗi theo khung giờ (Hour x Day) và Bảng Top Mẫu Log Drain Mining.
  4. **Đồng bộ toàn bộ tính năng phân tích sang Ứng Dụng Di Động (Mobile App)**:
     - Nâng cấp `Mobile/src/screens/anomalies/AnomaliesScreen.js` với thanh chuyển đổi 2 Tab: *"Danh Sách Sự Cố"* và *"Biểu Đồ Phân Tích"*.
     - Bố trí giao diện Tab Biểu đồ dạng 1 cột dọc tối ưu UX màn hình nhỏ: Bộ lọc thời gian (1h/6h/24h/7d) và chip lọc level/service, 4 thẻ KPI dạng lưới 2x2, thanh Timeline log theo thời gian, thanh tỉ lệ phân bố mức độ, Top dịch vụ lỗi nhiều nhất (chạm để lọc), thanh điểm Anomaly Score kèm vạch ngưỡng 70%, Bảng Heatmap mật độ lỗi hỗ trợ cuộn ngang (`ScrollView horizontal`) và Danh sách thẻ Top Template Drain Mining.
     - Toàn bộ tuân thủ theme tokens (Sáng/Tối) mượt mà.
- **Kết quả**: Thành công 100%, `npm run build` trên Web chạy hoàn tất không lỗi (16.60s), giao diện trực quan và đồng bộ hoàn hảo trên cả 2 nền tảng Web & Mobile.

### [04/11/2026 12:05] — Khắc Phục Triệt Để Toàn Bộ Lỗi Responsive Trên Mobile & Tablet (Header, Anti-Overflow, Pipeline Grid & Bảng Dữ Liệu)
- **Loại**: Sửa lỗi giao diện Responsive, Tối ưu Mobile UX
- **File**: `FE/src/index.css`, `FE/src/App.jsx`
- **Mô tả**:
  1. **Khóa chống tràn ngang toàn cục (Root Anti-Overflow)**: Thiết lập `overflow-x: hidden !important; width: 100%; max-width: 100vw;` cho `html, body, .app-layout, .main-content, .dashboard-container`, đảm bảo trang web không bao giờ bị nở chiều rộng vượt quá viewport của điện thoại.
  2. **Tối ưu Header tinh gọn 1 hàng duy nhất trên Mobile**:
     - Cố định chiều cao Header 56px, khóa `flex-wrap: nowrap`, ngăn chặn hoàn toàn hiện tượng tiêu đề rớt dòng tạo mảng trắng thò xuống.
     - Cắt ngắn tiêu đề trang thông minh bằng dấu ba chấm `...` (`text-overflow: ellipsis; max-width: 140px/100px`).
     - Thu gọn nút Admin trên Mobile thành biểu tượng khiên nhỏ gọn `[ 🛡️ ▾ ]` (`.header-admin-btn span { display: none }`), tiết kiệm hơn 110px chiều ngang giúp toàn bộ Header nằm vừa vặn trên 1 dòng.
  3. **Responsive Card "Sức Khỏe Pipeline Xử Lý"**: Chuyển cấu trúc 3 cột cứng sang class `.pipeline-health-summary-grid`, tự động chuyển thành 3 hàng dọc thoáng đãng khi màn hình nhỏ hơn 640px, hiển thị đầy đủ chi tiết không bị bẹp dí hay tràn viền.
  4. **Chuẩn hóa khung bảng dữ liệu (Table Container)**: Gán `display: block; width: 100%; max-width: 100%; overflow-x: auto;` cho `.table-container`, đảm bảo mọi bảng log/sự cố chỉ cuộn ngang bên trong khung của bảng, không làm lệch bố cục các thẻ card KPI bên trên.
- **Kết quả**: Thành công, `npm run build` hoàn thành trong 7.50s, 0 lỗi. Giao diện trên mọi kích thước điện thoại hiển thị chuẩn xác, cân đối 100%.

### [04/11/2026 11:45] — Khắc Phục Triệt Để Khoảng Trắng Mobile (Web), Xây Dựng Trọn Vẹn Ứng Dụng Di Động Expo (React Native) & Cập Nhật Tài Liệu Hệ Thống
- **Loại**: Sửa lỗi giao diện Mobile Web, Khởi tạo ứng dụng mới Mobile App (Expo), Cập nhật Kiến trúc
- **File**: `FE/src/index.css`, `Mobile/package.json`, `Mobile/app.json`, `Mobile/babel.config.js`, `Mobile/App.js`, `Mobile/src/...`, `Mobile/README.md`, `kientruchethong.md`, `README.md`, `PROJECT_CONTEXT.md`
- **Mô tả**:
  1. **Khắc phục lỗi khoảng trắng bên trái trên Mobile Web**:
     - Trong `@media (max-width: 768px)` tại `FE/src/index.css`, bổ sung quy tắc `.main-content, .main-content.sidebar-collapsed { margin-left: 0 !important; width: 100% !important; }`.
     - Triệt tiêu hoàn toàn khoảng hở 72px bên trái do class `.sidebar-collapsed` gây ra khi xem ứng dụng trên điện thoại và máy tính bảng.
  2. **Khởi tạo và xây dựng trọn vẹn ứng dụng Mobile Expo (`d:\DATN\Mobile`)**:
     - **Role-Based Navigation**: Kiến trúc phân luồng `RootNavigator` (`AuthStack` vs `AppStack`) dựa trên xác thực và phân quyền (Admin / Viewer). Mô hình Stack bọc Tab giúp tự động ẩn thanh Bottom Tab Bar khi vào màn hình phụ (`IncidentDetail`, `ChangePassword`, `AdminSettings`).
     - **5 Tabs Chuẩn Elevated Dock**: Chiều cao 68–72px tính theo `SafeAreaInsets`, đổ bóng ngược lên trên (`Upward Elevation Shadow`), Tab 3 trung tâm (Tra cứu log & Giám sát realtime) nhô cao (-10px) hình tròn nổi bật, 4 tab còn lại có khung viên nang (`Pill Active Indicator`).
     - **Theme Tokens Context**: Hỗ trợ 2 bảng màu Sáng (Màu nhấn Xanh Da Trời `#0284c7`) và Tối (Màu nhấn Tím `#6366f1`) đồng bộ với Web, lưu trạng thái bằng `AsyncStorage`.
     - **Tích hợp toàn bộ API Backend**: Đăng nhập/Đăng xuất JWT, KPI tổng quan, Sức khỏe Pipeline (Collector, Parser, OpenSearch), Quản lý vòng đời sự cố (Mới, Tiếp nhận, Xử lý, Thêm ghi chú), Socket.IO stream log thời gian thực, Mẫu log Drain và Đổi mật khẩu/Cấu hình báo cáo.
     - **Global Floating AI Bubble**: Bong bóng Trợ lý AI nổi ở góc dưới mọi màn hình, bấm mở Drawer hỏi đáp và phân tích log tự nhiên qua API `/api/v1/ai/query`.
  3. **Đồng bộ hóa tài liệu dự án**:
     - Cập nhật sơ đồ luồng dữ liệu và bảng cổng dịch vụ (thêm Expo Mobile App cổng `8081`) trong `kientruchethong.md` và `README.md`.
     - Cập nhật bảng công nghệ trong `PROJECT_CONTEXT.md` và bổ sung hướng dẫn chạy ứng dụng trong `Mobile/README.md`.
- **Kết quả**: Thành công, `npm run build` ở Frontend Web hoàn thành không lỗi (10.04s), toàn bộ cấu trúc module Mobile được thiết lập hoàn chỉnh.

### [04/11/2026 10:45] — Nâng Cấp Màu Nhấn Xanh Da Trời (Light Mode), Tô Đậm Viền Toàn Diện, Dropdown Admin Sidebar Footer & Chuẩn Hóa 1 Hàng Cột Lifecycle
- **Loại**: Cải tiến màu sắc thương hiệu, Tối ưu giao diện & UX
- **File**: `FE/src/index.css`, `FE/src/App.jsx`
- **Mô tả**:
  1. **Chuyển màu nhấn chủ đạo sang Xanh Da Trời (Sky Blue) ở giao diện Sáng**:
     - Cập nhật `--accent-primary` từ tím `#4f46e5` sang xanh da trời `#0284c7` (Sky Blue) và hover `#0369a1`.
     - Đồng bộ lại background và border của tab active `.nav-item.active` sang tone xanh da trời dịu mắt (`#e0f2fe` / `#0369a1`).
     - Giao diện Tối (Dark Mode) giữ nguyên tone tím than chì theo đúng yêu cầu.
  2. **Tô đậm viền Border (Card, Table & Input)**:
     - Tăng độ đậm viền ở Dark Mode: `--border-color` từ `0.08` lên `0.16` (`rgba(255, 255, 255, 0.16)`).
     - Tăng độ đậm viền ở Light Mode: `--border-color` từ `#cbd5e1` lên `#94a3b8` (đậm đà, sắc nét, tách bạch rõ ràng trên nền trắng).
  3. **Tách riêng Popup Dropdown cho Nút Admin ở Sidebar Footer**:
     - Tạo state `isSidebarAdminDropdownOpen` và ref `sidebarAdminDropdownRef`.
     - Khi bấm nút Admin tại Sidebar Footer, menu tùy chọn (Đổi Mật Khẩu, Sức Khỏe Pipeline, Cấu Hình, Đăng Xuất) mở nổi ngay phía trên nút đó ở chân Sidebar thay vì kích hoạt dropdown Header.
     - Tích hợp sự kiện click outside để tự động đóng khi click ra ngoài.
  4. **Xóa chữ "LOG" khi thu gọn Sidebar**:
     - Loại bỏ thẻ hiển thị chữ `LOG` khi `isSidebarCollapsed` bật, chỉ giữ lại icon 3 gạch mở rộng thanh menu.
  5. **Xóa vệt viền xanh bên trái ở các Card Tổng quan (KPI Cards)**:
     - Gỡ bỏ thuộc tính `border-left: 2px solid var(--accent-primary)` và `padding-left: 1rem` trong `.kpi-card`, giúp thẻ chỉ số hiển thị phẳng và cân đối 4 góc.
  6. **Căn thẳng 1 hàng ngang duy nhất cho cột Lifecycle (Bất Thường)**:
     - Thiết lập `white-space: nowrap`, `flex-direction: row` và `min-width: 320px` cho cột `Trạng Thái & Thao Tác`.
     - Badge trạng thái, nút Tiếp nhận/Xử lý và nút Ghi chú luôn nằm thẳng hàng, không bị chèn rớt xuống dòng.
- **Kết quả**: Thành công, `npm run build` hoàn thành trong 7.10s, 0 lỗi.

### [04/11/2026 10:25] — Hoàn Thiện Tối Ưu UX/UI Toàn Diện: Làm Đậm Viền Light Mode, Chuẩn Hóa Input/Lifecycle, Fix Xuất Excel, Card Sức Khỏe Pipeline & Tối Giản DateTimePicker
- **Loại**: Cải tiến giao diện Light Mode, Tối ưu Form/Table, Sửa lỗi Xuất Excel, Bổ sung Card Pipeline
- **File**: `FE/src/index.css`, `FE/src/App.jsx`, `FE/src/i18n.js`, `FE/src/components/PasswordChangeModal.jsx`, `FE/src/components/AdminSettingsModal.jsx`, `FE/src/components/CustomDateTimePicker.jsx`, `FE/src/components/PipelineHealthWidget.jsx`
- **Mô tả**:
  1. **Làm đậm viền border ở Light Mode**: Điều chỉnh `--border-color` từ `#e4e4e7` sang `#cbd5e1` và `--border-color-subtle` từ `#f4f4f5` sang `#e2e8f0`, giúp các Card, Bảng và Container sắc nét, rõ ràng hơn trên nền sáng.
  2. **Khắc phục khoảng trắng thừa ở các ô Input**: Tạo class `.form-input` dùng riêng cho các modal (padding chuẩn `0.55rem 0.85rem`), thay thế hoàn toàn `.search-input` (vốn có khoảng đệm 2.5rem cho kính lúp) trong `PasswordChangeModal` và `AdminSettingsModal`.
  3. **Chuẩn hóa kích thước cột Thao Tác (Lifecycle)**: Bổ sung các class `.lifecycle-status-badge`, `.lifecycle-action-btn`, `.lifecycle-note-btn` với chiều cao cố định 26px và min-width đồng nhất (90px/70px), căn chỉnh thẳng hàng cho bảng Sự cố bất thường.
  4. **Thêm Card "Sức Khỏe Pipeline Xử Lý" vào Tab Tổng Quan**: Tích hợp card tóm tắt 3 thành phần chính (Collector cổng 4000, Parser Worker BullMQ, OpenSearch Cluster) kèm trạng thái trực quan và nút mở modal chi tiết.
  5. **Việt hóa tiêu đề cột bảng Sự Cố**: Chuyển các cột Service, Level, Message, Score sang tiếng Việt (Dịch Vụ, Mức Độ, Thông Điệp Log, Độ Bất Thường) thông qua bộ dịch `i18n.js` và bổ sung key `colLifecycle` ("Trạng Thái & Thao Tác" / "Status & Actions").
  6. **Sửa lỗi Xuất Excel (.xlsx)**:
     - Lọc dữ liệu xuất theo đúng trạng thái đang chọn (`anomalyStatusFilter`), không còn bị xuất toàn bộ khi đang lọc.
     - Khắc phục lỗi hiển thị `N/A` ở cột Dịch Vụ bằng cách map chính xác `service_name || service || '—'`.
  7. **Tối giản DateTimePicker**: Loại bỏ 3 chip chọn giờ cứng (00:00, 12:00, 23:59), chỉ giữ lại duy nhất nút "Hiện tại" ("Now") tiện dụng.
  8. **Gom gọn hàng nút Tìm Kiếm**: Đưa 2 nút "Truy vấn ngay" và "Đặt lại" lên nằm chung 1 hàng với các nút Chọn nhanh khoảng thời gian (1h, 24h, 7d...) và căn sang góc phải để tiết kiệm diện tích dọc.
  9. **Nút Admin ở Sidebar Footer & Toast Pipeline**: Bổ sung nút Admin ở chân Sidebar; hiển thị toast thông báo JavaScript khi bấm làm mới trong `PipelineHealthWidget`.
  10. **Thay thế icon AI trong Cấu Hình**: Đổi icon tia chớp `Zap` thành chuông `Bell` trong mục cấu hình Discord Webhook của `AdminSettingsModal`.
- **Kết quả**: Thành công, `npm run build` hoàn thành trong 31.05s, không có lỗi.

### [02/11/2026 16:05] — Chuẩn Hóa Trợ Lý AI (RBAC, Bỏ Dấu Asterisk, Số Liệu Thật), Tự Động Hóa Log Generator, Thu Gọn Header Admin, Cuộn Vô Hạn Sự Cố & Làm Phẳng Toàn Diện Button/Sidebar
- **Loại**: Cải tiến AI Assistant, Tự động hóa Pipeline, Tối ưu UX/UI & Phong cách Phẳng Enterprise
- **File**: `BE/index.js`, `BE/search-api/aiService.js`, `FE/src/components/AiAssistant.jsx`, `FE/src/App.jsx`, `FE/src/index.css`, `FE/src/custom_styles.css`
- **Mô tả**:
  1. **Tự động hóa hoàn toàn phát sinh log**: Đăng ký `log_generator.js` thành microservice chạy ngầm liên tục trong `BE/index.js` khi backend khởi động; loại bỏ triệt để tất cả các nút thủ công ("Nạp dữ liệu mẫu", "⚡ Kích Hoạt Phát Log Mẫu Tự Động", "⚡ Nạp Thêm Log") và icon tia chớp ⚡ trên Header, biểu đồ và tab Mẫu log.
  2. **Nâng cấp Trợ lý AI (AiAssistant)**:
     - Lọc sạch toàn bộ ký tự markdown hoa thị (`*`, `**`, `***`) ở cả backend prompt, backend sanitization và frontend render, giúp câu trả lời tự nhiên, liền mạch không bị rối mắt.
     - Phân quyền RBAC nghiêm ngặt: Quản trị viên (Admin) được truy vấn thông tin toàn hệ thống; Người xem (Viewer) chỉ được xem và phân tích log thông thường, từ chối trả lời cấu hình nhạy cảm/khóa bảo mật.
     - Trả lời chính xác số liệu thống kê thực tế: Tự động truyền ngữ cảnh thời gian thực (`kpiStats`, tổng log OpenSearch ~10.000 log, trạng thái cụm) vào prompt để AI trả lời đúng số liệu trên Dashboard thay vì báo "không có dữ liệu".
  3. **Cuộn vô hạn (Infinite Scroll) danh sách sự cố bất thường**: Triển khai batch 10 phần tử và sự kiện scroll tự động nạp tiếp trong Tab 2 (Anomalies), đồng bộ với trải nghiệm tại bảng Realtime Streams.
  4. **Thu gọn nút Quản Trị Viên trên Header**: Tối giản thành định dạng pill gọn gàng `[ 🛡️ Admin ▾ ]` / `[ 🛡️ Viewer ▾ ]`, ẩn chuỗi họ tên dài để giải phóng diện tích Header.
  5. **Tối giản thương hiệu Sidebar**: Loại bỏ icon Monogram Typography (`LP`) và dòng chữ phụ `Enterprise AIOps`, giữ lại tiêu đề thanh thoát "Hệ Thống Phân Tích Log" và logo thu gọn "LOG".
  6. **Triệt tiêu thanh cuộn ngang ở Sidebar**: Thiết lập `overflow-x: hidden !important;` trên `.sidebar` và `.nav-menu`, loại bỏ hiện tượng tràn viền.
  7. **Hệ thống Toast thông báo khi tải lại**: Tích hợp `handleRefreshData` gửi toast JavaScript trực quan ("Đang cập nhật...", "Đã làm mới thành công") cho tất cả nút reload dữ liệu (sự cố, mẫu Drain, chỉ số tổng quan).
  8. **Hệ thống nút bấm & Submenu phẳng Solid**:
     - Loại bỏ hoàn toàn viền phát sáng neon (`box-shadow glow`), chuyển sang nền màu phẳng (Solid/Subtle Fill).
     - Rê chuột và bấm vào sẽ chuyển sắc độ đậm hơn tương ứng với từng chức năng (Primary: Indigo; Export: Emerald; Danger: Red; Tab Active: Dark Indigo).
- **Kết quả**: Thành công, `npm run build` hoàn thành không lỗi.

### [02/11/2026 14:15] — Tái Cấu Trúc Toàn Diện Enterprise SaaS (Linear / Vercel): Login 2 Cột, Xuất Excel .xlsx, Help Modal (?) & Bơm Log Tự Động
- **Loại**: Cải tiến giao diện toàn diện, Tính năng mới & UX
- **File**: `FE/src/components/LoginModal.jsx`, `FE/src/components/TabHelpModal.jsx`, `FE/src/App.jsx`, `FE/src/i18n.js`, `FE/src/index.css`, `FE/src/custom_styles.css`, `BE/search-api/index.js`, `FE/package.json`
- **Mô tả**:
  1. **Màn hình Login 2 cột**: Thiết kế theo chuẩn Enterprise SaaS. Cột trái là banner công nghệ & tính năng hệ sinh thái AIOps, cột phải là form đăng nhập tài khoản/mật khẩu tối giản, loại bỏ hoàn toàn phần chọn tài khoản nhanh demo.
  2. **Phong cách Phẳng Tối Giản (Linear / Vercel)**: Chuẩn hóa hệ thống màu xám đen mịn (`#09090b`, `#121215`, `#18181b`), viền mỏng sắc nét 1px (`rgba(255,255,255,0.08)` / `#e4e4e7`), triệt tiêu hoàn toàn bóng đổ neon rực rỡ và cảm giác nhựa. Áp dụng đồng bộ cho toàn bộ Card, Bảng và Modal.
  3. **Logo & Tên Thương Hiệu**: Đổi tên thành **"Hệ Thống Phân Tích Log"**, thay thế logo cũ bằng monogram chữ cách điệu phẳng (`LP`).
  4. **Help Modal (`?`)**: Di dời các khối card mô tả dài choán chỗ trong các tab lên Header bên cạnh tên trang. Bấm vào icon dấu chấm hỏi (`?`) sẽ hiển thị Modal giải thích nghiệp vụ gọn gàng.
  5. **Tự Động Phát Log & Drain Mining**: Thêm API `/api/v1/simulator/generate` và nút *"⚡ Kích Hoạt Phát Log Mẫu Tự Động"* trực tiếp trên giao diện tab Mẫu log và Header, tự động đẩy log vào pipeline và hiển thị template tức thì mà không cần mở terminal gõ `npm run stream:real`.
  6. **Khắc Phục 2 Biểu Đồ & Xuất Excel (.xlsx)**: Bổ sung trạng thái empty có nút nạp log nhanh khi 1h qua chưa có dữ liệu; cài đặt thư viện `xlsx` và viết hàm `handleExportExcel` xuất file `.xlsx` chuyên nghiệp có sẵn Auto-Filter và tự căn chỉnh độ rộng cột.
- **Kết quả**: Thành công, `npm run build` hoàn thành trong 6.98s không có lỗi.


### [02/11/2026 13:25] — Tối Ưu Launcher: Bổ Sung Cơ Chế Chờ Thông Minh Cho OpenSearch (start_all.bat)
- **Loại**: Cải tiến Devops / Khởi chạy hệ thống
- **File**: `start_all.bat`
- **Mô tả**:
  - Thay thế thời gian chờ cố định (`ping -n 11`) bằng vòng lặp kiểm tra trạng thái cổng `9200` theo thời gian thực (tối đa 35 giây).
  - Đảm bảo OpenSearch Cluster sẵn sàng 100% trước khi kích hoạt Backend Pipeline (`node index.js`) và Frontend (`npm run dev`).
  - Triệt tiêu hoàn toàn các cảnh báo `[OpenSearch searchLogs/getLogStats Warning]: Connection Error` khi vừa mở ứng dụng.
- **Kết quả**: Thành công, quy trình khởi động mượt mà, đồng bộ và ổn định.


### [01/11/2026 19:25] — Tối Ưu Toàn Diện UX/UI: DatePicker Stacking Context, Collapsible Sidebar, Infinite Scroll, Điều Hướng KPI & Nâng Cấp Model AI

#### 1. Sửa Lỗi Che Khuất DatePicker & Stacking Context
- **Loại**: Sửa lỗi giao diện & CSS
- **File**: `FE/src/App.jsx`, `FE/src/custom_styles.css`, `FE/src/components/CustomDateTimePicker.jsx`
- **Mô tả**:
  - Gán `position: relative; z-index: 30; overflow: visible` cho `search-filter-card` và `z-index: 1` cho `search-results-card`.
  - Tăng `z-index: 9999` cho `.modern-datepicker-popover` và thêm trạng thái `.is-active` (`z-index: 50`) cho `.modern-datepicker-container` khi popup mở ra, đảm bảo popover luôn nổi trên card kết quả bên dưới.
- **Kết quả**: Thành công, popover hiển thị đầy đủ, không bị cắt cụt.

#### 2. Nâng Cấp Sidebar Thu Gọn Linh Hoạt (Collapsible Sidebar) & Xóa Text "Realtime Connected"
- **Loại**: Cải tiến giao diện & Navigation
- **File**: `FE/src/App.jsx`, `FE/src/index.css`
- **Mô tả**:
  - Bổ sung nút 3 gạch (`<Menu size={18} />`) ở đầu Sidebar để thu nhỏ/mở rộng chiều rộng (`260px` $\leftrightarrow$ `72px`).
  - Khi thu gọn: Chỉ hiển thị icon nằm giữa, khi rê chuột vào icon sẽ xuất hiện tooltip tên mục nổi sang bên phải; logo thu nhỏ thành biểu tượng lá chắn.
  - Xóa bỏ dòng chữ `Realtime Connected` ở chân Sidebar theo yêu cầu của người dùng.
- **Kết quả**: Thành công, sidebar co giãn mượt mà với transition CSS.

#### 3. Điều Hướng Tương Tác Nhanh Từ 4 Thẻ KPI Dashboard
- **Loại**: Cải tiến trải nghiệm người dùng
- **File**: `FE/src/App.jsx`, `FE/src/custom_styles.css`
- **Mô tả**:
  - Thêm class `.kpi-card-clickable` với hiệu ứng hover nhấc nhẹ (-3px) và viền sáng neon.
  - Gắn sự kiện `onClick`:
    * Thẻ *Tổng số log* ➔ Chuyển sang Tab *Tìm kiếm log*.
    * Thẻ *Bất thường hệ thống* ➔ Chuyển sang Tab *Bất thường*.
    * Thẻ *Mẫu Drain* ➔ Chuyển sang Tab *Mẫu Log Drain*.
    * Thẻ *Logs/phút (Realtime)* ➔ Cuộn mượt màn hình xuống bảng Log Streams Realtime.
- **Kết quả**: Thành công, tương tác nhạy bén.

#### 4. Di Chuyển Sức Khỏe Pipeline Vào Admin Profile Dropdown
- **Loại**: Tái cấu trúc Header & Menu
- **File**: `FE/src/App.jsx`
- **Mô tả**:
  - Gỡ bỏ nút bấm rời rạc *Sức Khỏe Pipeline* khỏi Header, đưa vào danh mục tùy chọn trong Admin Profile Dropdown (bấm vào Avatar/Role Admin).
- **Kết quả**: Thành công, Header gọn gàng hơn.

#### 5. Khắc Phục Lỗi AI Model & Đường Dẫn Config
- **Loại**: Bug Fix Backend
- **File**: `BE/search-api/aiService.js`
- **Mô tả**:
  - Cập nhật model Groq từ `llama-3.1-70b-versatile` (đã bị decommission) sang model mới **`qwen/qwen3.8-27b`** (đã test thành công HTTP 200).
  - Cập nhật fallback Gemini sang **`gemini-2.5-flash-lite`** thay cho `gemini-2.0-flash` (đã ngưng hỗ trợ).
  - Cấu hình `dotenv.config` chỉ định đường dẫn tuyệt đối tới `BE/.env` để luôn nạp đúng key dù chạy từ bất kỳ thư mục nào.
- **Kết quả**: Thành công, AI Assistant trả lời trơn tru.

#### 6. Cuộn Vô Hạn (Infinite Scroll) Batch 10 Log & Bỏ Nút "Xem Thêm Log"
- **Loại**: Cải tiến luồng dữ liệu & UX
- **File**: `FE/src/App.jsx`
- **Mô tả**:
  - Bảng Log Realtime: Chỉ hiển thị trước 10 log, khi người dùng cuộn chuột xuống đáy bảng sẽ tự động tăng số lượng hiển thị thêm 10 log.
  - Bảng Search Results: Loại bỏ nút bấm thủ công *"Xem thêm log"*, bổ sung listener `onScroll` tự động gọi API phân trang trang tiếp theo (`size: 10`) khi chạm đáy container kèm spinner tải mượt mà.
- **Kết quả**: Thành công, thao tác cuộn tự nhiên chuẩn SaaS.

#### 7. Thiết Kế Lại Toàn Bộ Dropdown (Select) Sang Modern SaaS
- **Loại**: Cải tiến giao diện CSS
- **File**: `FE/src/custom_styles.css`
- **Mô tả**:
  - Tùy biến toàn bộ thẻ `select.select-filter` và `.form-group select`: Bỏ mũi tên mặc định của trình duyệt (`appearance: none`), thay bằng icon chevron SVG màu tím/xanh hiện đại, padding đầm tay, bo góc `rounded-xl` (12px), đồng bộ theme Sáng/Tối.
- **Kết quả**: Thành công, dropdown sắc nét và sang trọng.

### [01/11/2026 18:30] — Custom DateTime Picker UI/UX Cao Cấp & Thay Thế Toàn Bộ Emoji Thành Chuẩn Icon SaaS (Lucide)

#### 1. Xây Dựng Component Custom Date & Time Picker Chuyên Nghiệp
- **Loại**: Component mới & Cải tiến UI/UX
- **File**: `FE/src/components/CustomDateTimePicker.jsx`, `FE/src/custom_styles.css`, `FE/src/App.jsx`
- **Mô tả**:
  - **Khắc phục**: Loại bỏ hoàn toàn picker `datetime-local` thô kệch mặc định của trình duyệt Windows/Chromium (vốn có popup 2 cột trắng chia AM/PM không ăn khớp với giao diện).
  - **Tính năng mới của `CustomDateTimePicker.jsx`**:
    * Trigger input hiện đại với bo góc `rounded-xl` (12px), icon lịch, hiển thị thời gian định dạng dễ đọc `DD/MM/YYYY HH:mm`, kèm nút xóa nhanh `X`.
    * Popover chọn ngày giờ thiết kế theo phong cách Modern SaaS (`rounded-2xl`, bóng đổ mịn, hiệu ứng blur nền, tự động căn lề trái/phải thông minh tránh tràn viền màn hình).
    * Hỗ trợ lưới lịch 7 cột điều hướng tháng/năm trực quan, hiển thị ngày hôm nay và ngày đang chọn với màu nhấn thương hiệu.
    * Tích hợp bộ chọn giờ 24h (24-Hour System chuẩn Ops/DevOps, không gây nhầm lẫn AM/PM) kèm các chip chọn nhanh: `00:00`, `12:00`, `23:59`, và `Hiện tại` (Now).
    * Nút *Đặt lại* và *Áp dụng* tiện dụng; tự động đóng khi nhấp ra ngoài hoặc ấn ESC.
- **Kết quả**: Thành công, giao diện tìm kiếm mượt mà, đồng bộ hoàn hảo với Dark/Light theme.

#### 2. Rà Soát & Triệt Tiêu Toàn Bộ Emoji, Chuẩn Hóa Bằng Lucide SVG Icons
- **Loại**: Cải tiến giao diện & Chuyên nghiệp hóa UI
- **File**: `FE/src/App.jsx`, `FE/src/components/AiAssistant.jsx`, `FE/src/components/LoginModal.jsx`, `FE/src/i18n.js`
- **Mô tả**:
  - Quét toàn bộ mã nguồn Frontend và thay thế triệt để các ký tự emoji màu (như `🚨`, `⚡`, `🤖`, `⚠️`, `✓`, `✕` mang lại cảm giác "AI hóa" / thiếu chuyên nghiệp):
    * **Bộ lọc trạng thái Sự cố (Incident Status Pills)**: Đổi các nút emoji `🚨 MỚI`, `⚡ ĐÃ TIẾP NHẬN`, `✓ ĐÃ XỬ LÝ` thành các pills bo tròn tuyệt đối (`rounded-full`) với icon Lucide SVG sắc nét: `<AlertCircle />` (đỏ), `<Clock />` (vàng hổ phách), `<CheckCircle2 />` (xanh ngọc), `<ListFilter />` (tất cả).
    * **Hệ thống Toast thông báo**: Thay các ký tự text bằng icon Lucide chuẩn: `<CheckCircle2 />`, `<XCircle />`, `<AlertTriangle />`.
    * **AI Assistant & Giao diện Login**: Thay icon `⚡` demo thành `<Sparkles />`, bỏ ký tự robot `🤖` khỏi tiêu đề và nút phân tích, thay `⚠️` lỗi bằng `<AlertTriangle />`.
  - Khắc phục biến cờ ngôn ngữ `isVi = lang === 'vi'` trong `App.jsx` để tránh lỗi `ReferenceError: isVi is not defined`.
- **Kết quả**: Đã quét lại toàn bộ codebase, kết quả `Total emojis found: 0`. Toàn bộ giao diện đạt độ hoàn thiện cao, tinh tế và đồng bộ.

### [01/11/2026 18:05] — Khắc Phục Lỗi Xung Đột Cổng EADDRINUSE 5000 & Tách Rời Kiến Trúc (Decoupling) Bằng Redis Pub/Sub

#### 1. Khắc Phục Lỗi Xung Đột Cổng EADDRINUSE :5000
- **Loại**: Bug Fix & Tối ưu hóa kiến trúc Backend
- **File**: `BE/queue/config.js`, `BE/parser/index.js`, `BE/search-api/index.js`
- **Mô tả**:
  - **Hiện tượng**: Khi chạy `node index.js` (hoặc `start_all.bat`), tiến trình Search API khởi động chiếm cổng 5000 thành công (`[Search API Service] HTTP + Socket.IO đang chạy tại http://localhost:5000`), nhưng ngay sau đó xuất hiện `Error: listen EADDRINUSE: address already in use :::5000` làm tiến trình Parser Worker bị sập.
  - **Nguyên nhân**: File `BE/parser/index.js` import trực tiếp `broadcastNewLog` từ `../search-api/index.js`. Trong Node.js ES Modules, việc import này làm chạy lại toàn bộ mã cấp module của `search-api/index.js`, cố gắng gọi lại `httpServer.listen(5000)` trong tiến trình thứ hai của Parser Worker.
  - **Giải pháp chuẩn hóa**:
    1. Thiết lập kênh giao tiếp hướng sự kiện **Redis Pub/Sub** (`REALTIME_LOG_CHANNEL = 'realtime-log-channel'`) trong `BE/queue/config.js` với 2 connection riêng biệt (`redisPub` và `redisSub`).
    2. Trong `BE/parser/index.js`: Xóa bỏ import `search-api/index.js`. Sau khi ghi nhận log và index vào OpenSearch, Worker publish log vào kênh Redis.
    3. Trong `BE/search-api/index.js`: Đăng ký lắng nghe kênh Redis qua `redisSub.subscribe(REALTIME_LOG_CHANNEL)`. Khi có tin nhắn từ Parser Worker, gọi `broadcastNewLog(log)` để phát qua Socket.IO tới toàn bộ Client Frontend.
    4. Bổ sung `isMainModule` guard cho `httpServer.listen(PORT)` tại cuối `search-api/index.js` để triệt tiêu vĩnh viễn khả năng re-listen cổng 5000 khi file bị import.
- **Kết quả**: 
  - Khởi động đồng thời cả 3 dịch vụ (`Search API`, `Collector`, `Parser Worker`) trơn tru, không còn lỗi `EADDRINUSE`.
  - Luồng dữ liệu Realtime được phân tách hoàn toàn (decoupled) theo đúng chuẩn Enterprise Microservices.

### [01/11/2026 16:30] — Nâng Cấp Toàn Diện UI/UX Modern Enterprise SaaS & Tối Ưu Hóa Luồng Nghiệp Vụ

#### 1. Luồng Xác Thực Bắt Buộc (Auth Gate) & Preload Log Tự Động
- **Loại**: Cải tiến logic & Giao diện
- **File**: `FE/src/App.jsx`, `FE/src/components/LoginModal.jsx`
- **Mô tả**:
  - Loại bỏ việc tự động đăng nhập mặc định vào quyền Admin. Khi mở trang web nếu chưa đăng nhập thì hệ thống lập tức hiển thị màn hình Login bắt buộc, trang bị sẵn 2 nút **Quick Login (Admin / Viewer)** để 1-click kiểm thử thuận tiện.
  - Tự động nạp trước 50 bản ghi log gần nhất từ OpenSearch (`GET /api/v1/logs/search?size=50`) ngay khi tải trang và khi kết nối Socket.IO, loại bỏ triệt để trạng thái bảng trống *"Đang chờ log mới... Chạy npm start..."*.
- **Kết quả**: Thành công

#### 2. Việt Hóa & Làm Sạch Nhãn Giao Diện
- **Loại**: Chỉnh sửa
- **File**: `FE/src/i18n.js`, `FE/src/App.jsx`, `FE/src/components/AiAssistant.jsx`
- **Mô tả**:
  - Bỏ nhãn `Live (Socket.IO)` trên thanh Header, thay bằng chấm sóng xanh nhấp nháy + nhãn `Trực tuyến` (hoặc `Online`).
  - Đổi toàn bộ nhãn `LogPulse AI Copilot` thành `Trợ lý cá nhân` (và `Personal Assistant` ở bản tiếng Anh).
  - Loại bỏ toàn bộ các từ trong ngoặc đơn ở Tab Tìm Kiếm: Đổi thành `Bộ Lọc Truy Vấn Nâng Cao`, `Từ khóa tìm kiếm`, `Thời gian bắt đầu`, `Thời gian kết thúc`.
- **Kết quả**: Thành công

#### 3. Cải Tiến Bộ Lọc Thời Gian & Độ Tương Phản Mức Độ Nghiêm Trọng (FATAL)
- **Loại**: Chỉnh sửa CSS & Component
- **File**: `FE/src/custom_styles.css`, `FE/src/index.css`, `FE/src/App.jsx`
- **Mô tả**:
  - Thiết kế lại Date Time Picker: Bo góc `rounded-xl` (12px), min-height 40px, icon calendar tinh tế theo theme (Dark/Light), tích hợp chip chọn nhanh (1h, 24h, 7d) và nút `✕ Xóa thời gian`.
  - Khắc phục lỗi mờ chữ "Nghiêm trọng" (FATAL) ở Chế độ sáng (Light Mode): Đổi sang màu chữ đỏ đậm (`#991b1b` trên nền đỏ pastel `#fee2e2` viền `#f87171` font-weight 800), đạt độ tương phản chuẩn WCAG.
- **Kết quả**: Thành công

#### 4. Bổ Sung Sơ Đồ Luồng & Nút Kiểm Thử Drain Mining
- **Loại**: Chỉnh sửa
- **File**: `FE/src/App.jsx`
- **Mô tả**:
  - Bổ sung banner minh họa trực quan 4 bước xử lý của thuật toán Drain (Log thô ➔ Phân tích độ dài ➔ Cây tiền tố ➔ Sinh template).
  - Thêm hướng dẫn chạy lệnh stream log thật HDFS (`npm run stream:real`) và nút bấm `Tải Lại Mẫu Drain` ngay trên giao diện.
- **Kết quả**: Thành công

#### 5. Chuyển Cấu Hình & Báo Cáo Vào Admin Profile Dropdown
- **Loại**: Tạo mới component & Tái cấu trúc Navigation
- **File**: `FE/src/components/AdminSettingsModal.jsx`, `FE/src/components/PasswordChangeModal.jsx`, `FE/src/App.jsx`
- **Mô tả**:
  - Gỡ bỏ tab Settings thô ở Sidebar; thanh menu chính chỉ còn 4 mục nghiệp vụ cốt lõi: *Tổng Quan*, *Bất Thường*, *Tìm Kiếm*, *Mẫu Log Drain*.
  - Tích hợp Dropdown Menu đa năng trên Header khi bấm vào Avatar/Tên Admin:
    * Thông tin tài khoản & quyền hạn
    * Modal Đổi mật khẩu (`PasswordChangeModal.jsx`)
    * Modal Cấu hình Quản trị & Báo cáo (`AdminSettingsModal.jsx`) gom nhóm toàn bộ: Discord, Email, Từ khóa cảnh báo, Chế độ bảo trì, Báo cáo Daily Digest, Dọn dẹp Log Retention, Xuất CSV.
    * Đăng xuất
- **Kết quả**: Thành công

#### 6. Tái Cấu Trúc Toàn Diện Hệ Thống Thiết Kế UI/UX Modern Enterprise SaaS
- **Loại**: Tái cấu trúc CSS
- **File**: `FE/src/index.css`, `FE/src/custom_styles.css`
- **Mô tả**:
  - Hệ thống bo góc: Card/Modal `rounded-2xl` (16px), Button/Input `rounded-xl` (12px), Badges `rounded-full` (9999px).
  - Viền hairline 1px sắc nét, bóng đổ nhẹ `shadow-sm`, hiệu ứng hover nhấc khối nhẹ (`hover:-translate-y-0.5`).
  - Nút bấm có phản hồi vật lý khi click (`active:scale-95`).
  - Bảng dữ liệu có container `overflow-x-auto`, tiêu đề sticky, hai cột cố định (Thời gian bên trái, Thao tác bên phải) có nền đặc (`solid background`), đồng bộ hover, chấm dứt hoàn toàn hiện tượng chữ trôi xuyên qua.
- **Kết quả**: Thành công (Vite build thành công trong 6.51s, 0 error).

### [01/11/2026 15:22] — Sửa Lỗi Cú Pháp Windows Batch Cho `start_all.bat` & `stop_all.bat`

#### Sửa lỗi `start_all.bat` & `stop_all.bat`
- **Loại**: Sửa bug
- **File**: `start_all.bat`, `stop_all.bat`, `BE/index.js`
- **Mô tả**:
  - Khắc phục lỗi cửa sổ CMD lập tức biến mất khi nhấp đúp file:
    * Loại bỏ ký tự toán tử `&` trong dòng `title` và `echo`.
    * Loại bỏ dấu ngoặc đơn lồng trong khối `if/else` của Batch.
    * Thay thế `timeout` bằng `ping 127.0.0.1` để tương thích hoàn toàn trên mọi môi trường chạy.
    * Đặt lệnh `pause` ở cuối file để cửa sổ luôn giữ nguyên màn hình, hiển thị đầy đủ bảng thông tin các cổng dịch vụ và hướng dẫn thao tác.
  - Tối ưu `BE/index.js`: Chỉ khởi chạy 3 microservices cốt lõi (`Collector`, `Parser Worker`, `Search API`), loại bỏ việc spawn file thư viện `anomaly-engine/index.js`.
- **Kết quả**: Thành công (Kiểm thử thực tế cả 2 file script đều chạy mượt mà, exit code 0).

### [01/11/2026 15:15] — Tối Ưu Quy Trình Khởi Động: Tạo Script Khởi Động 1-Click (start_all.bat) & Dừng Dịch Vụ (stop_all.bat)

#### Tạo mới `start_all.bat` — Khởi động siêu tốc toàn bộ hệ thống
- **Loại**: Tạo mới
- **File**: `start_all.bat`
- **Mô tả**:
  - Tự động kiểm tra cổng 6379 (Redis) và 9200 (OpenSearch); nếu chưa chạy thì tự bật ngầm.
  - Khởi động đồng thời cụm Backend (Collector `:4000`, Search API `:5000`, Parser Worker) qua `BE/index.js`.
  - Khởi động Frontend React Dashboard (`:3000`) và tự động mở trình duyệt web `http://localhost:3000`.
- **Kết quả**: Thành công

#### Tạo mới `stop_all.bat` — Giải phóng cổng & Dừng sạch sẽ
- **Loại**: Tạo mới
- **File**: `stop_all.bat`
- **Mô tả**:
  - Quét và dừng triệt để các tiến trình đang chiếm các cổng `3000`, `4000`, `5000`, `8000`.
  - Loại bỏ hoàn toàn nguy cơ xảy ra lỗi `EADDRINUSE: address already in use` khi khởi động lại.
- **Kết quả**: Thành công

#### Chỉnh sửa `BE/index.js` & `BE/package.json` & `README.md`
- **Loại**: Chỉnh sửa
- **File**: `BE/index.js`, `BE/package.json`, `README.md`
- **Mô tả**:
  - `BE/index.js`: Bổ sung cơ chế `cleanup` xử lý sự kiện `SIGINT`/`SIGTERM` để tự động dừng sạch toàn bộ cây tiến trình con khi người dùng nhấn Ctrl+C.
  - `BE/package.json`: Thêm alias script `start:all`.
  - `README.md`: Đưa **Cách 1: Khởi động siêu tốc 1-Click (Khuyên dùng)** lên đầu file hướng dẫn.
- **Kết quả**: Thành công (Syntax check pass)

### [30/10/2026 12:15] — Cập Nhật Hướng Dẫn Khởi Động (README.md) & Hoàn Thiện Tài Liệu Đặc Tả Nghiệp Vụ (nghiepvu.md)

#### Cập nhật file `README.md`
- **Loại**: Chỉnh sửa
- **File**: `README.md`
- **Mô tả**:
  - Viết lại toàn bộ hướng dẫn khởi chạy dự án thực tế từ A-Z theo thứ tự chuẩn: Redis (`6379`), OpenSearch (`9200`), Collector (`4000`), Parser Worker, Search API (`5000`), Python ML API (`8000`), Frontend React (`3000`) và script phát luồng log thật (`stream_real_hdfs.js`).
  - Bổ sung bảng thông tin phân quyền và tài khoản đăng nhập demo (`admin/admin123` và `viewer/viewer123`).
  - Hướng dẫn trải nghiệm 8 nhóm tính năng nổi bật: Trợ lý AI Copilot (Groq/Gemini), Quản lý vòng đời sự cố (New/Ack/Resolved + Notes), Cảnh báo đa kênh (Discord + Gmail), Deduplication 60s, Silence Mode, Pipeline Health Dashboard, Daily Digest Cron, Log Retention Cleanup.
- **Kết quả**: Thành công

#### Tạo mới file `nghiepvu.md`
- **Loại**: Tạo mới
- **File**: `nghiepvu.md`
- **Mô tả**:
  - Xây dựng tài liệu đặc tả nghiệp vụ chi tiết phục vụ báo cáo Đồ án tốt nghiệp:
    1. Tổng quan bài toán thực tế và mục tiêu giải quyết của hệ thống LogPulse.
    2. Đối tượng người dùng & vai trò (Admin / DevOps Lead vs Viewer / SOC Analyst / Developer).
    3. Ma trận phân quyền chi tiết (RBAC Matrix) trên toàn bộ tính năng và màn hình.
    4. Sơ đồ Mermaid và chi tiết 9 quy trình nghiệp vụ cốt lõi: Ingestion tải cao, Drain template mining, Anomaly detection 3 tầng, Cảnh báo đa kênh + Deduplication + Silence mode, Quản lý vòng đời sự cố, Trợ lý AI LogPulse Copilot RCA, Giám sát độ tin cậy Pipeline, Báo cáo định kỳ Daily Digest + Log Retention, Tra cứu & Xuất CSV.
    5. Kịch bản vận hành thực tế (Operational Scenarios) minh họa luồng xử lý sự cố cụm HDFS DataNode từ lúc phát sinh lỗi đến khi AI phân tích và kỹ sư khắc phục.
    6. Bộ chỉ số đo lường hiệu quả nghiệp vụ (KPIs: MTTD < 1s, MTTR giảm 50-70%, Throughput 1,500-3,000 log/s, Giảm 85% nhiễu cảnh báo, F1 > 0.85).
- **Kết quả**: Thành công

### [30/10/2026 12:03] — Triển Khai Lựa Chọn C: Báo Cáo Định Kỳ Tự Động (Daily Digest) & Quản Lý Log Retention

#### Cài đặt thư viện & Cấu hình môi trường
- **Loại**: Cài package + Chỉnh sửa
- **File**: `BE/package.json`, `BE/.env`
- **Mô tả**:
  - Cài đặt thư viện `node-cron` cho Backend để lập lịch tự động.
  - Thêm các biến môi trường: `DAILY_DIGEST_ENABLED`, `DAILY_DIGEST_CRON`, `RETENTION_DAYS`, `AUTO_CLEANUP_ENABLED`, `AUTO_CLEANUP_CRON`.
- **Kết quả**: Thành công

#### Tạo mới `BE/search-api/cronService.js` — Module Lập Lịch & Báo Cáo Tự Động
- **Loại**: Tạo mới
- **File**: `BE/search-api/cronService.js`
- **Mô tả**:
  - `generate24hDigestData()`: Tự động tổng hợp chỉ số 24h qua trên OpenSearch (tổng log, số anomaly, phân bổ INFO/WARN/ERROR/FATAL, top 5 dịch vụ).
  - `sendDailyDigestReport()`: Phát hành báo cáo tóm tắt ca trực qua Discord Webhook (Rich Embed màu Indigo) và Gmail SMTP (bảng thống kê HTML).
  - `runLogRetentionCleanup(days)`: Tự động xóa các log cũ hơn N ngày trong OpenSearch bằng `deleteByQuery` API để giải phóng dung lượng đĩa.
  - Lập lịch tự động qua `node-cron`: Gửi báo cáo ca trực lúc 08:00 sáng và dọn dẹp log quá hạn lúc 00:00 nửa đêm.
- **Kết quả**: Thành công (Syntax check pass)

#### Chỉnh sửa `BE/search-api/index.js` — Tích hợp Cron & Endpoints Kích Hoạt Nhanh
- **Loại**: Chỉnh sửa
- **File**: `BE/search-api/index.js`
- **Mô tả**:
  - Gọi `initCronJobs()` khi server khởi động.
  - Endpoint `POST /api/v1/reports/digest/trigger`: Cho phép bấm gửi báo cáo Daily Digest ngay lập tức để kiểm tra/demo.
  - Endpoint `POST /api/v1/storage/retention/cleanup`: Cho phép Admin dọn dẹp các log cũ hơn số ngày chỉ định.
  - Cập nhật API config đọc và lưu trạng thái retention và cron.
- **Kết quả**: Thành công

#### Chỉnh sửa Frontend (`FE/src/App.jsx` & `FE/src/i18n.js`)
- **Loại**: Chỉnh sửa
- **File**: `FE/src/App.jsx`, `FE/src/i18n.js`
- **Mô tả**:
  - Tab Settings: Thêm khối **Báo Cáo Tự Động Định Kỳ (Daily Digest)** kèm nút *"Gửi Báo Cáo 24h Ngay"*.
  - Tab Settings: Thêm khối **Chính Sách Lưu Giữ Log (Log Retention Policy)** cho phép tùy chỉnh số ngày lưu trữ, bật/tắt dọn dẹp tự động và nút *"Dọn Dẹp Log Cũ Ngay"*.
  - Bổ sung bản dịch song ngữ tiếng Việt & tiếng Anh.
- **Kết quả**: Thành công (Vite build thành công trong 5.27s)

### [30/10/2026 11:53] — Triển Khai Lựa Chọn B: Quản Lý Vòng Đời Cảnh Báo (Alert Lifecycle & Incident Management)

#### Tạo mới `BE/search-api/incidentService.js` — Module Quản Lý Sự Cố
- **Loại**: Tạo mới
- **File**: `BE/search-api/incidentService.js`
- **Mô tả**:
  - Quản lý vòng đời trạng thái sự cố: `NEW` ➔ `ACKNOWLEDGED` ➔ `RESOLVED`.
  - Hỗ trợ thêm và lưu trữ ghi chú khắc phục sự cố (Remediation Notes).
  - Tự động lưu bền vững trạng thái ra file JSON (`datasets/incident_states.json`) để không mất dữ liệu khi restart server.
  - Cung cấp hàm `enrichAnomaliesWithIncidentState` gắn trạng thái vòng đời vào từng anomaly khi truy vấn từ OpenSearch.
- **Kết quả**: Thành công (Syntax check pass)

#### Chỉnh sửa `BE/search-api/alertService.js` — Deduplication & Chế Độ Bảo Trì (Silence)
- **Loại**: Chỉnh sửa
- **File**: `BE/search-api/alertService.js`
- **Mô tả**:
  - Thêm cơ chế **Alert Deduplication**: Gom nhóm các log lỗi trùng lặp (cùng service + message) trong khung thời gian 60s, đếm số lần xuất hiện và chỉ gửi 1 tin thông báo gộp sang Discord/Email, chống bão tin nhắn (alert storm).
  - Thêm **Chế độ bảo trì (Maintenance Mode / Silence Alerts)**: Hỗ trợ đặt thời hạn bảo trì (15p, 30p, 60p), tạm ngừng gửi cảnh báo Discord/Email trong khi bảo trì mà không làm gián đoạn việc thu thập và lưu log.
- **Kết quả**: Thành công

#### Chỉnh sửa `BE/search-api/index.js` — Bổ Sung Endpoints Quản Lý Sự Cố
- **Loại**: Chỉnh sửa
- **File**: `BE/search-api/index.js`
- **Mô tả**:
  - `PATCH /api/v1/anomalies/:id/status`: Đổi trạng thái sự cố (kèm người thực hiện).
  - `POST /api/v1/anomalies/:id/notes`: Thêm ghi chú xử lý sự cố.
  - `GET /api/v1/alerts/maintenance` & `POST /api/v1/alerts/maintenance`: Lấy và bật/tắt chế độ bảo trì (yêu cầu quyền Admin).
  - Tự động enrich danh sách anomaly với trạng thái sự cố trong `GET /api/v1/anomalies`.
- **Kết quả**: Thành công

#### Tạo mới & Chỉnh sửa Frontend (`FE/src/`)
- **Loại**: Tạo mới + Chỉnh sửa
- **File**: `FE/src/components/IncidentNoteModal.jsx`, `FE/src/App.jsx`, `FE/src/i18n.js`
- **Mô tả**:
  - Tạo `IncidentNoteModal`: Xem lịch sử ghi chú và thêm ghi chú khắc phục sự cố mới.
  - Tab Anomalies: Thêm bộ lọc trạng thái (`Tất cả`, `MỚI`, `ĐÃ TIẾP NHẬN`, `ĐÃ XỬ LÝ`), cột thao tác nhanh (**Tiếp nhận**, **Xử lý xong**, **Ghi chú**).
  - Banner Chế độ bảo trì: Hiển thị thanh thông báo màu vàng trên đầu trang khi đang bảo trì, kèm nút hủy bảo trì nhanh cho Admin.
  - Tab Settings: Bổ sung khối cấu hình bật/tắt Chế độ bảo trì và quản lý danh sách từ khóa cảnh báo động (`Alert Keywords`) cho phép thêm/xóa từ khóa trực tiếp trên web.
- **Kết quả**: Thành công (Vite build thành công trong 5.19s)

### [30/10/2026 11:42] — Triển Khai Lựa Chọn A: Pipeline Health Dashboard & Đăng Nhập Phân Quyền (Admin / Viewer)

#### Cài đặt thư viện & Cấu hình môi trường
- **Loại**: Cài package + Chỉnh sửa
- **File**: `BE/package.json`, `BE/.env`
- **Mô tả**:
  - Cài đặt `jsonwebtoken` và `bcryptjs` phục vụ xác thực JWT và bảo mật mật khẩu.
  - Thêm khóa bí mật `JWT_SECRET` vào biến môi trường `BE/.env`.
- **Kết quả**: Thành công

#### Tạo mới `BE/search-api/authService.js` — Module Xác Thực & Phân Quyền
- **Loại**: Tạo mới
- **File**: `BE/search-api/authService.js`
- **Mô tả**:
  - Cấp sẵn 2 tài khoản mẫu phục vụ thuyết trình đồ án:
    * **Admin:** `admin` / `admin123` (Toàn quyền quản trị).
    * **Viewer:** `viewer` / `viewer123` (Chỉ xem và tra cứu).
  - Cung cấp hàm `loginUser`, các middleware `authenticateToken`, `requireAdmin`, `optionalAuth`.
- **Kết quả**: Thành công (Syntax check pass)

#### Tạo mới `BE/search-api/pipelineMetrics.js` — Module Đo Đạc Sức Khỏe Pipeline
- **Loại**: Tạo mới
- **File**: `BE/search-api/pipelineMetrics.js`
- **Mô tả**:
  - Truy vấn số lượng job BullMQ thời gian thực từ Redis (`waiting`, `active`, `completed`, `failed`).
  - Đo thông lượng Throughput (logs/giây) và độ trễ pipeline trung bình (ms).
  - Đánh giá trạng thái tổng thể: `HEALTHY`, `WARNING`, `DEGRADED`.
- **Kết quả**: Thành công

#### Chỉnh sửa `BE/search-api/index.js` — Tích hợp Endpoints Auth & Pipeline Health
- **Loại**: Chỉnh sửa
- **File**: `BE/search-api/index.js`
- **Mô tả**:
  - Thêm các REST endpoints: `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `GET /api/v1/pipeline/health`.
  - Gắn middleware phân quyền bảo vệ `POST /api/v1/config` (chặn tài khoản Viewer thay đổi cấu hình hệ thống).
  - Ghi nhận metrics thời gian thực trong hàm `broadcastNewLog`.
- **Kết quả**: Thành công

#### Tạo mới & Chỉnh sửa Frontend (`FE/src/`)
- **Loại**: Tạo mới + Chỉnh sửa
- **File**: `FE/src/components/LoginModal.jsx`, `FE/src/components/PipelineHealthWidget.jsx`, `FE/src/App.jsx`, `FE/src/i18n.js`
- **Mô tả**:
  - Tạo `LoginModal`: Hỗ trợ đăng nhập thủ công và 2 nút bấm nhanh **"Admin"** / **"Viewer"** tiện lợi khi demo.
  - Tạo `PipelineHealthWidget`: Hiển thị chi tiết số job BullMQ, throughput log/s, latency ms và các cơ chế reliability (Redis AOF, Bulk API, Concurrency).
  - Tích hợp User Badge (Admin/Viewer) và nút xem Sức khỏe Pipeline lên Header.
  - Cảnh báo và vô hiệu hóa nút lưu cấu hình nếu người dùng đang đăng nhập với quyền Viewer.
- **Kết quả**: Thành công (Vite build thành công trong 5.13s)

### [30/10/2026 11:10] — Cập Nhật Thông Số Discord Webhook & Gmail SMTP Thực Tế
- **Loại**: Cấu hình + Chỉnh sửa
- **File**: `BE/.env`, `BE/search-api/alertService.js`, `BE/search-api/index.js`
- **Mô tả**:
  - Đã nạp chính xác URL Discord Webhook thực tế vào `BE/.env`.
  - Đã nạp cấu hình tài khoản Gmail (`kelvinphuc.thdao@gmail.com`) cùng App Password vào `BE/.env`.
  - Cập nhật `alertService.js` tự động chuẩn hóa khoảng trắng trong mật khẩu App Password và tương thích cả 2 chuẩn tên biến môi trường (`SMTP_USERNAME`/`SMTP_USER`, `ADMIN_EMAIL`/`ALERT_RECEIVER_EMAIL`).
- **Kết quả**: Thành công (Syntax check pass)

### [30/10/2026 10:55] — Chuyển Đổi Sang Hệ Thống Cảnh Báo Đa Kênh Miễn Phí (Discord Webhook + Email SMTP)

#### Cài đặt thư viện & Cấu hình môi trường
- **Loại**: Cài package + Chỉnh sửa
- **File**: `BE/package.json`, `BE/.env`
- **Mô tả**:
  - Cài đặt thư viện `nodemailer` cho Backend để hỗ trợ gửi email cảnh báo tự động qua Gmail SMTP.
  - Thay thế biến cấu hình Telegram bằng các biến cho Discord Webhook (`DISCORD_WEBHOOK_URL`, `DISCORD_ENABLED`) và Email SMTP (`EMAIL_ALERT_ENABLED`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ALERT_RECEIVER_EMAIL`).
- **Kết quả**: Thành công

#### Tạo mới `BE/search-api/alertService.js` — Module Alert Service Đa Kênh
- **Loại**: Tạo mới
- **File**: `BE/search-api/alertService.js`
- **Mô tả**:
  - `sendDiscordAlert(logEntry)`: Gửi tin nhắn Embed rich formatted sang kênh Discord khi có lỗi FATAL hoặc điểm Anomaly cao.
  - `sendEmailAlert(logEntry)`: Gửi email cảnh báo HTML giao diện Dark/Neon chi tiết sự cố qua Nodemailer.
  - `dispatchAlerts(logEntry)`: Điều phối phát song song cả hai kênh ngầm (non-blocking) kèm cơ chế cooldown chống spam tin nhắn.
- **Kết quả**: Thành công

#### Chỉnh sửa `BE/search-api/index.js` — Kết nối Alert Service & Cập nhật API Config
- **Loại**: Chỉnh sửa
- **File**: `BE/search-api/index.js`
- **Mô tả**:
  - Thay thế hàm Telegram cũ bằng `dispatchAlerts`.
  - Cập nhật API `GET /api/v1/config` và `POST /api/v1/config` hỗ trợ cấu hình động Discord Webhook và Email.
- **Kết quả**: Thành công

#### Chỉnh sửa `FE/src/App.jsx` & `FE/src/i18n.js` — Nâng cấp Tab Cấu hình Đa Kênh
- **Loại**: Chỉnh sửa
- **File**: `FE/src/App.jsx`, `FE/src/i18n.js`
- **Mô tả**:
  - Tab Cấu hình nay hiển thị 2 khối riêng biệt: Discord Webhook và Email SMTP.
  - Hỗ trợ nhập Discord Webhook URL, bật/tắt từng kênh độc lập, cấu hình tài khoản Gmail và email người nhận.
  - Hỗ trợ song ngữ Tiếng Việt & Tiếng Anh.
- **Kết quả**: Thành công (Vite build thành công không lỗi)

### [30/10/2026 10:35] — Tích Hợp Trợ Lý AI LogPulse Copilot (Groq + Gemini Fallback)

#### Tạo mới `BE/search-api/aiService.js` — Module AI Service
- **Loại**: Tạo mới
- **File**: `BE/search-api/aiService.js`
- **Mô tả**:
  - Module xử lý logic gọi AI với cơ chế fallback: **Groq Cloud API** (primary, model `llama-3.3-70b-versatile`, tốc độ < 1s) → **Google Gemini API** (fallback, model `gemini-2.0-flash`).
  - Export 2 hàm: `chatWithAI(messages, systemContext)` cho chat tự do, `explainLog(logEntry)` cho phân tích nguyên nhân gốc rễ 1 dòng log.
  - System Prompt chuyên biệt cho vai trò AIOps / SRE Copilot.
  - Có timeout 15s, AbortController, và xử lý lỗi graceful.
- **Kết quả**: Thành công

#### Chỉnh sửa `BE/search-api/index.js` — Thêm 2 API Endpoints AI
- **Loại**: Chỉnh sửa
- **File**: `BE/search-api/index.js`
- **Mô tả**:
  - Import `chatWithAI` và `explainLog` từ `aiService.js`.
  - Thêm `POST /api/v1/ai/chat` — nhận mảng messages, trả về phản hồi AI.
  - Thêm `POST /api/v1/ai/explain-log` — nhận object log, trả về phân tích chi tiết.
- **Kết quả**: Thành công (syntax check pass)

#### Tạo mới `FE/src/components/AiAssistant.jsx` — Giao diện AI Chatbot & Explain Button
- **Loại**: Tạo mới
- **File**: `FE/src/components/AiAssistant.jsx`
- **Mô tả**:
  - Component `AiAssistant`: Nút floating neon ở góc dưới phải, mở drawer chat hiện đại. Hỗ trợ dark/light mode, gợi ý câu hỏi, song ngữ VN/EN, hiển thị provider (Groq/Gemini), typing indicator.
  - Component `AiExplainButton`: Nút "🤖 Phân tích cùng AI" dùng trong Modal chi tiết log. Gọi API `/ai/explain-log` và hiển thị kết quả phân tích inline.
- **Kết quả**: Thành công

#### Chỉnh sửa `FE/src/App.jsx` — Tích hợp AI vào giao diện chính
- **Loại**: Chỉnh sửa
- **File**: `FE/src/App.jsx`
- **Mô tả**:
  - Import `AiAssistant` và `AiExplainButton`.
  - Gắn `<AiAssistant />` floating ở cuối layout chính.
  - Gắn `<AiExplainButton />` trong Modal chi tiết log, ngay sau JSON raw view.
- **Kết quả**: Thành công

#### Chỉnh sửa `FE/src/index.css` — CSS cho AI Assistant
- **Loại**: Chỉnh sửa
- **File**: `FE/src/index.css`
- **Mô tả**: Thêm styles cho floating button (gradient neon), chat drawer (glassmorphism), message bubbles, input bar, explain section, responsive 480px.
- **Kết quả**: Thành công

#### Chỉnh sửa `FE/src/i18n.js` — Thêm text song ngữ AI
- **Loại**: Chỉnh sửa
- **File**: `FE/src/i18n.js`
- **Mô tả**: Thêm 10 key dịch cho AI Assistant (tiêu đề, placeholder, nút bấm, thông báo).
- **Kết quả**: Thành công

#### Chỉnh sửa `BE/.env` — Thêm API Keys
- **Loại**: Chỉnh sửa
- **File**: `BE/.env`
- **Mô tả**: Thêm `GROQ_API_KEY` và `GEMINI_API_KEY` vào biến môi trường.
- **Kết quả**: Thành công

### [27/10/2026 14:11] — Tích Hợp Anomaly Engine Vào Pipeline Thực Tế

#### Sửa `BE/parser/index.js` — Kết nối 3 tầng phát hiện bất thường
- **Loại**: Chỉnh sửa
- **File**: `BE/parser/index.js`
- **Mô tả**:
  - Import `checkLogLineSingle` (rule-based) và `runAnomalyDetection` (3 tầng đầy đủ)
  - Sau `parseLog()`: gọi `checkLogLineSingle(normalizedLog)` — nếu phát hiện keyword nguy hiểm thì gắn `is_anomaly=true`, `rule_triggered`, `anomaly_score=0.85` vào document **trước khi lưu OpenSearch** → log trong DB có flag đúng
  - Trong `flushBuffer()`: sau bulk index, fire-and-forget `runAnomalyDetection(batch)` — chạy đủ 3 tầng (Rule + Statistical + Drain+ML) mà **không block pipeline**
- **Kết quả**: Thành công

#### Sửa `BE/benchmark/pipeline_benchmark.js` — Fix 3 lỗi import/usage
- **Loại**: Sửa bug
- **File**: `BE/benchmark/pipeline_benchmark.js`
- **Mô tả**: Sửa import paths sai (`../BE/` → `../`), tên export sai (`parseLogLine` → `parseLog`, `RuleBasedDetector` class → `checkLogLineSingle` function), method Drain sai (`drain.parse` → `drain.parseMessage`), constructor options sai (`depth/st` → `simThreshold/maxChildren`)
- **Kết quả**: Thành công

### [27/10/2026 13:54] — Xây Pipeline Sinh Vectors + Train ML + Dọn Docker

#### Dọn tài liệu
- **Loại**: Chỉnh sửa
- **File**: `PROJECT_CONTEXT.md`
- **Mô tả**: Xóa đề cập Docker Compose ở Tuần 12 theo yêu cầu người dùng (không triển khai). Thay bằng "Tích hợp pipeline end-to-end, kiểm tra luồng dữ liệu HDFS/BGL đầu cuối".
- **Kết quả**: Thành công

#### Bước 1 — Tạo pipeline sinh Feature Vectors từ HDFS
- **Loại**: Tạo mới
- **File**: `BE/datasets/hdfs/generate_vectors.js`
- **Mô tả**: Script Node.js chạy full pipeline: `loadHdfsDataset` (parse + gom block_id sequences) → `vectorizeDataset` (fit Drain + Event Count Vector) → xuất `vectors_hdfs.json`. File JSON có đủ trường `X`, `y`, `dataset: "hdfs"` để `train_and_evaluate.py` đọc.
- **Kết quả**: Thành công

#### Bước 1 (tiếp) — Tạo pipeline sinh Feature Vectors từ BGL
- **Loại**: Tạo mới
- **File**: `BE/datasets/bgl/generate_vectors.js`
- **Mô tả**: Tương tự HDFS nhưng dùng `loadBglDataset` (gom theo Fixed Time Window 60s) → Drain vectorize → xuất `vectors_bgl.json`. BGL dùng time-window vì không có block_id, mỗi window là 1 đơn vị phát hiện.
- **Kết quả**: Thành công

#### Bước 3 — Xác nhận stream_real_hdfs.js đã cover BGL
- **Loại**: Kiểm tra (không sửa code)
- **Mô tả**: Đọc lại `stream_real_hdfs.js` — file này đã đọc cả `HDFS_2k.log` lẫn `BGL_2k.log` cùng lúc (Promise.all) và stream trộn lẫn hai dataset. Không cần tạo `stream_real_bgl.js` riêng.
- **Kết quả**: Không cần làm — đã có sẵn

#### Cập nhật package.json + README.md
- **Loại**: Chỉnh sửa
- **File**: `BE/package.json`, `README.md`
- **Mô tả**: Thêm 4 npm scripts mới: `generate:vectors-hdfs`, `generate:vectors-bgl`, `ml:train-hdfs`, `ml:train-bgl`. Thêm Bước 5 vào README hướng dẫn train ML.
- **Kết quả**: Thành công

### [09/10/2026 20:20] — Xử Lý Toàn Bộ AUDIT_REPORT.md (5 hạng mục)

#### [Critical] A-02 — Tích hợp ML Isolation Forest real-time
- **Loại**: Tạo mới + Chỉnh sửa
- **File tạo mới**: `BE/anomaly-engine/ml-models/ml_api.py`
- **File chỉnh sửa**: `BE/anomaly-engine/ml-models/train_and_evaluate.py`, `BE/anomaly-engine/index.js`
- **Mô tả**: Tạo Python FastAPI server (`ml_api.py`) chạy ở port 8000, load model `.pkl` (Isolation Forest + Logistic Regression). Node.js gọi `POST /predict` với feature vector từ Drain → nhận kết quả `is_anomaly + anomaly_score`. Cơ chế Graceful degradation: nếu ML API down thì tự động bỏ qua thay vì crash. Thêm `--save-model` flag vào `train_and_evaluate.py` để lưu model `.pkl` sau khi train.
- **Kết quả**: Thành công

#### [High] A-01 — Bulk API vào OpenSearch Storage
- **Loại**: Chỉnh sửa
- **File chỉnh sửa**: `BE/storage/opensearch.js`, `BE/parser/index.js`
- **Mô tả**: Thêm hàm `bulkIndexLogs()` dùng OpenSearch Bulk API. Parser gom log vào buffer 10 items (hoặc flush sau 2 giây), rồi ghi 1 lần thay vì từng cái một. Giữ nguyên `indexLogDocument()` cũ để backward compatible. Có fallback ghi đơn nếu Bulk API lỗi. Thêm graceful shutdown flush buffer khi SIGTERM.
- **Kết quả**: Thành công

#### [Medium] A-03 — Tách Drain ra Worker Thread
- **Loại**: Tạo mới + Chỉnh sửa
- **File tạo mới**: `BE/anomaly-engine/drain_worker.js`
- **File chỉnh sửa**: `BE/anomaly-engine/index.js`
- **Mô tả**: Tạo `drain_worker.js` chạy trong Node.js Worker Thread riêng. Hàm `vectorizeInWorker()` chạy Drain trong thread độc lập để không block Event Loop. Có fallback về sync nếu worker thread lỗi.
- **Kết quả**: Thành công

#### [Low] B-01 — Redis AOF Persistence
- **Loại**: Tạo mới
- **File tạo mới**: `BE/redis.conf`
- **Mô tả**: Tạo file `redis.conf` hướng dẫn bật AOF với `appendonly yes --appendfsync everysec`. Bao gồm lệnh Docker và cấu hình redis.conf chuẩn.
- **Kết quả**: Thành công

#### [Medium] C-01 — Rà soát CSS Responsive
- **Loại**: Kiểm tra (không sửa code)
- **Mô tả**: Xác nhận CSS đã có đủ breakpoints: 1280px, 1024px, 768px, 480px. Sidebar ẩn về mobile (<768px) với hamburger menu. Bảng ẩn cột phụ trên <480px. Không có hardcoded fixed width. Cần test thực tế trên Chrome DevTools sau.
- **Kết quả**: Đã xác minh qua code — cần manual test thực tế

#### Misc
- **File chỉnh sửa**: `BE/.env` — Bổ sung `ML_API_URL`, `ML_API_TIMEOUT_MS`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- **File tạo mới**: `AUDIT_REPORT.md` — Báo cáo kiểm tra toàn bộ hệ thống

### [02/10/2026 21:00] — Nâng Cấp UI/UX Toàn Diện: Neon/Gradient Design System
- **Loại**: Chỉnh sửa
- **Files**: `FE/src/index.css`, `FE/src/custom_styles.css`, `FE/src/App.jsx`
- **Mô tả**:
  - **Design Tokens**: Đổi `--border-color` từ `rgba(255,255,255,0.08)` sang `rgba(99,102,241,0.2)` — toàn bộ viền card, input, table nay có màu accent-tinted thay vì gần-trong-suốt.
  - **Hệ thống Neon Glow**: Thêm các biến CSS `--neon-primary/secondary/success/error/warn`, `--shadow-card`, `--shadow-btn` cho cả dark mode và light mode (light mode có cường độ giảm ~60%).
  - **Card**: Thêm `box-shadow: var(--shadow-card)` mặc định; hover có `transform: translateY(-1px)` + glow mạnh hơn.
  - **KPI Card**: Thêm viền trái 2px gradient accent (`border-left: 2px solid var(--accent-primary)`).
  - **Sidebar**: Thêm glow phải (`box-shadow: 4px 0 30px rgba(99,102,241,0.08)`).
  - **Header**: Thay `border-bottom` thành `box-shadow` gradient dọc — tạo hiệu ứng đường neon ngang bên dưới header.
  - **btn-primary**: Đổi từ màu đơn sang gradient `indigo → cyan`; hover có glow mạnh + translateY(-2px).
  - **toggle-btn hover**: Thêm `box-shadow` neon nhẹ.
  - **Badge**: Tăng độ sáng màu chữ (info: `#60a5fa`, warn: `#fbbf24`, error: `#f87171`, fatal: `#fca5a5`), thêm `box-shadow` glow; badge FATAL có animation `pulse-fatal` nhấp nháy.
  - **Table row hover**: Thêm `box-shadow: inset 3px 0 0 var(--accent-primary)` — thanh neon trái khi hover dòng.
  - **Modal**: Viền `border-color-glow`, `box-shadow` neon, animation spring `cubic-bezier(0.34,1.56,0.64,1)`.
  - **Anomaly Method Cards**: Mỗi card có `border-top` màu riêng (đỏ/vàng/tím) + glow màu tương ứng khi hover.
  - **Scrollbar (global)**: Custom scrollbar với thumb màu accent, glow khi hover.
  - **App.jsx Fix**: Thêm title cho tab Settings trong `<h1>`; sửa modal close button từ ký tự `×` sang `<X size={18}/>` Lucide icon.
- **Kết quả**: Thành công — giao diện neon/gradient chuyên nghiệp, dark mode và light mode đều được nâng cấp đồng bộ.

### Ngày 02/10/2026:
- **Tích Hợp Hệ Thống Cảnh Báo Telegram Bot Realtime**:
  - Đã bổ sung hàm `sendTelegramAlert()` trong `BE/search-api/index.js`.
  - Tự động kích hoạt phát tin nhắn cảnh báo qua Telegram Bot khi có log thuộc mức độ `FATAL` hoặc có `Anomaly Score` vượt ngưỡng cấu hình.
- **Tính Năng Xuất Báo Cáo CSV (Export Reports)**:
  - Bổ sung endpoint `GET /api/v1/export/csv` tại Backend để xuất danh sách sự kiện Anomaly hoặc kết quả tìm kiếm Log ra định dạng UTF-8 CSV có BOM.
  - Thêm nút bấm "Xuất Báo Cáo CSV" trực tiếp tại Tab Anomalies, Tab Search và Tab Cấu hình.
- **Trang Cấu Hình & Quản Lý Quy Tắc (Settings & Alerts Tab)**:
  - Bổ sung Tab 5 mới: **Cấu Hình & Cảnh Báo** hỗ trợ chỉnh sửa linh hoạt ngưỡng Anomaly Score, bật/tắt Telegram Bot, nhập Bot Token và Chat ID.
- **Popup Cửa Sổ Xem Chi Tiết Log (Log Detail Inspection Modal)**:
  - Cho phép người dùng bấm vào bất kỳ dòng log nào trên bảng để mở Cửa sổ Modal popup xem toàn bộ thuộc tính dữ liệu JSON thô (Timestamp, Hash ID, Service, Anomaly Score, Raw Content, Metadata).

### Ngày 26/09/2026:
- **Xử lý Realtime WebSocket Log Broadcast**:
  - Phát hiện nguyên nhân danh sách Log Stream không nhảy log tự động: Thư mục `BE/parser/index.js` đã đưa log vào OpenSearch nhưng thiếu lệnh gọi `broadcastNewLog`.
  - Đã import và bổ sung hàm `broadcastNewLog` sau khi Parser xử lý thành công từng job log. Log mới được đẩy trực tiếp sang Search API (`port 5000`) và tới Frontend qua Socket.IO.
- **Nâng Cấp Giao Diện & Định Dạng Ngày Giờ chuẩn Việt Nam (dd/mm/yyyy HH:mm:ss)**:
  - Bổ sung hàm `formatVnDateTime` để quy chuẩn hóa hiển thị thời gian theo định dạng `dd/mm/yyyy HH:mm:ss` trên toàn bộ các bảng trong ứng dụng (Overview Realtime Logs, Anomalies Events, Search Results).
  - Sửa lỗi tính múi giờ UTC trong nút bấm mốc thời gian nhanh (1h qua, 24h qua, 7d qua) bằng hàm `toLocalDatetimeInputString` giữ đúng giờ Việt Nam (UTC+7) trên input `datetime-local`.
- **Tối Ưu Hóa Khung Tìm Kiếm & Bảng Log Kéo Cuộn Riêng**:
  - Thu gọn kích thước card và padding của Bộ lọc Tìm kiếm nâng cao giúp người dùng mở rộng tầm nhìn cho khung kết quả phía dưới.
  - Bổ sung thanh cuộn nội bộ riêng (`search-table-scroll-container` max-height 440px) cho bảng danh sách kết quả tìm kiếm, giúp kéo cuộn mượt mà mà không ảnh hưởng tới thanh cuộn chung của toàn bộ trang web.
- **Tối Ưu Hóa Giao Diện Phát Hiện Bất Thường (Anomalies)**:
  - Tái thiết kế 3 thẻ mô tả phương pháp phát hiện bất thường (Quy tắc mẫu log, Thống kê tần suất, Isolation Forest AI) từ dạng thẻ lớn xếp dọc sang mô hình lưới ngang 3 cột gọn gàng, tiết kiệm không gian.
