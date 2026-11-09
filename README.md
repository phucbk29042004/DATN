# HỆ THỐNG PHÂN TÍCH LOG TẬP TRUNG VÀ PHÁT HIỆN BẤT THƯỜNG (LOG ANALYTICS & ANOMALY DETECTION)

Dự án Đồ án tốt nghiệp Công nghệ Thông tin: **"Nghiên cứu và xây dựng hệ thống phân tích log tập trung và phát hiện bất thường"**.

Hệ thống được thiết kế theo kiến trúc **Microservices & Event-Driven**, đáp ứng thông lượng cao, phân tích cấu trúc log thời gian thực bằng thuật toán **Drain**, phát hiện bất thường đa tầng (**Rule-based, Thống kê Z-Score, Học máy Isolation Forest & Logistic Regression**), tích hợp **Trợ lý AI LogPulse Copilot (Groq / Gemini)**, cảnh báo đa kênh (**Discord & Gmail SMTP**), quản lý vòng đời sự cố và giám sát sức khỏe pipeline toàn diện.

---

## 🏗️ BẢNG TỔNG HỢP DỊCH VỤ & CỔNG KẾT NỐI (PORTS)

| STT | Dịch Vụ | Công Nghệ | Port | Vai Trò & Chức Năng |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Redis Server** | Redis / In-memory | `6379` | Hàng đợi đệm log tải cao BullMQ & Pub/Sub |
| **2** | **OpenSearch Database** | OpenSearch Cluster | `9200` | Cơ sở dữ liệu phân tán lưu trữ chỉ mục & tìm kiếm toàn văn log |
| **3** | **Collector Service** | Express.js (Node.js) | `4000` | Tiếp nhận log từ các máy chủ/client qua HTTP API (`/single`, `/batch`) |
| **4** | **Parser Worker** | BullMQ Worker | N/A | Bóc tách cấu trúc log (Drain), tính toán điểm Anomaly Score, nạp OpenSearch |
| **5** | **Search API & WebSocket** | Express + Socket.IO | `5000` | Cung cấp REST API tìm kiếm, phát sóng log realtime, quản lý cấu hình & cảnh báo |
| **6** | **Frontend Dashboard (Web)** | React 18 + Vite | `3000` | Giao diện giám sát trực quan, biểu đồ thời gian thực, quản lý sự cố, trợ lý AI |
| **7** | **Mobile App (Expo)** | React Native (Expo) | `8081` | Ứng dụng di động giám sát 5 Tabs, phân quyền Admin/Viewer, Realtime Stream & AI Bubble |
| **8** | **ML API Service** *(Tùy chọn)* | FastAPI + scikit-learn | `8000` | Phục vụ dự đoán mô hình Machine Learning trực tiếp qua HTTP API |

---

## ⚙️ YÊU CẦU MÔI TRƯỜNG & CHUẨN BỊ

1. **Phần mềm bắt buộc**:
   - **Node.js**: Phiên bản 18.x hoặc 20.x trở lên.
   - **Python**: Phiên bản 3.9+ (nếu chạy mô hình học máy ML).
   - **Redis**: Đã cài đặt trên máy tính (hoặc chạy qua Docker).
   - **OpenSearch**: Phiên bản 2.x (khuyến nghị `2.19.6`).
2. **Cấu hình biến môi trường (`BE/.env`)**:
   - Sao chép file cấu hình mẫu `BE/.env.example` thành `BE/.env`:
     ```powershell
     copy BE\.env.example BE\.env
     ```
   - Cập nhật các thông số kết nối, tài khoản, khóa API cá nhân (Groq/Gemini) và kênh cảnh báo vào file `BE/.env` nội bộ trên máy của bạn (file này đã được đưa vào `.gitignore` để bảo mật tuyệt đối, không chia sẻ lên kho công khai).

---

## 📋 HƯỚNG DẪN KHỞI ĐỘNG DỰ ÁN

---

### 🚀 CÁCH 1: KHỞI ĐỘNG SIÊU TỐC 1-CLICK (KHUYÊN DÙNG)

Để không phải mở 4–5 cửa sổ terminal thủ công, hệ thống đã trang bị sẵn kịch bản tự động hóa thông minh:

1. **Khởi động toàn bộ hệ thống:**
   - Mở thư mục dự án `d:\DATN` và **nhấp đúp chuột vào file `start_all.bat`** (hoặc mở PowerShell tại `d:\DATN` và gõ `.\start_all.bat`).
   - File script sẽ tự động:
     - Kiểm tra và bật **Redis Server** (`:6379`) nếu chưa chạy.
     - Kiểm tra và bật cụm **OpenSearch Database** (`:9200`) nếu chưa chạy.
     - Khởi động toàn bộ **Backend Pipeline** (Collector `:4000`, Search API `:5000`, Parser Worker).
     - Khởi động **Frontend Dashboard** (`:3000`).
     - Tự động mở trình duyệt web tới **`http://localhost:3000`**.

2. **Dừng toàn bộ hệ thống & Giải phóng cổng khi xong việc:**
   - Khi muốn dừng tất cả các dịch vụ, chỉ cần **nhấp đúp chuột vào file `stop_all.bat`** (hoặc gõ `.\stop_all.bat`).
   - Script sẽ tự động tìm và tắt sạch mọi tiến trình chiếm các cổng `3000`, `4000`, `5000`, ngăn chặn triệt để lỗi chiếm cổng `EADDRINUSE`.

3. **Bật luồng phát log mẫu (Stream dữ liệu thật HDFS):**
   - Mở 1 terminal tại `d:\DATN\BE` và gõ:
     ```powershell
     npm run stream:real
     ```

---

### 🛠️ CÁCH 2: KHỞI ĐỘNG THỦ CÔNG TỪNG BƯỚC (DÀNH CHO LẬP TRÌNH VIÊN)

Nếu bạn muốn mở từng terminal riêng biệt để quan sát chi tiết log xuất ra của từng dịch vụ:

#### 🟢 BƯỚC 1: KHỞI ĐỘNG HẠ TẦNG CƠ SỞ (REDIS & OPENSEARCH)

1. **Khởi động Redis (Cổng 6379):**
   - Mở thư mục cài đặt Redis trên máy và chạy `redis-server.exe` (hoặc gõ lệnh `redis-server` trong PowerShell).
2. **Khởi động OpenSearch (Cổng 9200):**
    - Mở PowerShell tại thư mục OpenSearch (ví dụ `D:\opensearch-2.19.6\bin`) và chạy:
     ```powershell
     .\opensearch.bat
     ```
   - *Đợi khoảng 20 - 30 giây đến khi màn hình xuất hiện thông báo `Cluster health status changed from [RED] to [GREEN]`.*

---

### 🔵 BƯỚC 2: KHỞI ĐỘNG CÁC DỊCH VỤ BACKEND PIPELINE
*(Mở 3 cửa sổ PowerShell độc lập tại thư mục `d:\DATN\BE`)*

- **Terminal 1 — Collector Service (Tiếp nhận Log - Port 4000):**
  ```powershell
  cd d:\DATN\BE
  npm run start:collector
  # Hoặc: node collector/index.js
  ```
  *(Khi khởi động thành công sẽ báo: `Collector Service listening on port 4000`)*

- **Terminal 2 — Parser Worker (Bóc tách cấu trúc & nạp OpenSearch):**
  ```powershell
  cd d:\DATN\BE
  npm run start:parser
  # Hoặc: node parser/index.js
  ```
  *(Khi khởi động thành công sẽ báo: `Parser Worker started, waiting for jobs...`)*

- **Terminal 3 — Search API & Socket.IO (Port 5000):**
  ```powershell
  cd d:\DATN\BE
  npm run start:api
  # Hoặc: node search-api/index.js
  ```
  *(Khi khởi động thành công sẽ báo: `Search API & Socket.IO listening on port 5000` và kích hoạt tự động các cron job Daily Digest & Retention)*

---

### 🟣 BƯỚC 3: KHỞI ĐỘNG ML API SERVICE *(TÙY CHỌN DỰ ĐOÁN HỌC MÁY)*
*(Mở 1 Terminal tại thư mục `d:\DATN\BE`)*

Nếu muốn hệ thống phân loại bất thường bằng mô hình học máy chuyên sâu:
```powershell
cd d:\DATN\BE
python anomaly-engine/ml_api.py
```
*(Dịch vụ FastAPI sẽ lắng nghe tại cổng `http://localhost:8000`)*

> 💡 **Huấn luyện mô hình trước khi dùng (chỉ cần chạy 1 lần):**
> ```powershell
> cd d:\DATN\BE
> # Sinh vector đặc trưng từ dữ liệu HDFS và BGL
> npm run generate:vectors-hdfs
> npm run generate:vectors-bgl
> # Huấn luyện mô hình Isolation Forest & Logistic Regression
> npm run ml:train-hdfs
> npm run ml:train-bgl
> ```

---

### 🟡 BƯỚC 4: KHỞI ĐỘNG GIAO DIỆN FRONTEND (REACT DASHBOARD)
*(Mở 1 Terminal tại thư mục `d:\DATN\FE`)*

```powershell
cd d:\DATN\FE
npm run dev
```
👉 Truy cập trình duyệt Web tại địa chỉ: **`http://localhost:3000`**

---

### ⚡ BƯỚC 5: KÍCH HOẠT PHÁT LUỒNG DỮ LIỆU LOG THẬT (HDFS / BGL)
*(Mở 1 Terminal tại thư mục `d:\DATN\BE`)*

Để mô phỏng hệ thống thực tế đang vận hành và sinh log:
```powershell
cd d:\DATN\BE
npm run stream:real
# Hoặc: node datasets/stream_real_hdfs.js
```
Ngay sau khi lệnh chạy, log thật từ tập dữ liệu HDFS sẽ được truyền tuần tự về Collector (`:4000`) ➔ Đẩy vào Redis BullMQ ➔ Parser phân tích mẫu log và tính điểm bất thường ➔ Nạp vào OpenSearch (`:9200`) ➔ Search API (`:5000`) phát WebSocket đẩy trực tiếp lên giao diện Dashboard (`:3000`).

---

## 🔐 THÔNG TIN TÀI KHOẢN ĐĂNG NHẬP & PHÂN QUYỀN (RBAC)

Hệ thống hỗ trợ cơ chế xác thực JWT và phân quyền theo vai trò (Role-Based Access Control):

| Tài Khoản | Mật Khẩu Khởi Tạo | Vai Trò (Role) | Quyền Hạn Thực Tế |
| :--- | :--- | :---: | :--- |
| **`admin`** | *Khởi tạo nội bộ qua AuthService* | **Quản Trị Viên (Admin)** | **Toàn quyền:** Quản lý cấu hình rule, thêm/xóa từ khóa cảnh báo động, kích hoạt chế độ bảo trì (Silence), dọn dẹp log quá hạn (Retention), kích hoạt gửi Daily Digest tức thì, đổi trạng thái sự cố. |
| **`viewer`** | *Khởi tạo nội bộ qua AuthService* | **Người Giám Sát (Viewer)** | **Chỉ xem:** Tra cứu và tìm kiếm log, xem biểu đồ, theo dõi sức khỏe pipeline, hỏi đáp cùng trợ lý AI Copilot. Các nút lưu cấu hình quản trị sẽ tự động bị khóa và ẩn. |

> 💡 **Lưu ý bảo mật:** Thông tin mật khẩu được mã hóa và quản lý nội bộ. Trong môi trường phát triển (Development), hệ thống trang bị sẵn 2 nút chuyển vai trò nhanh trên giao diện để thuận tiện thao tác demo.

---

## 🌟 HƯỚNG DẪN TRẢI NGHIỆM CÁC TÍNH NĂNG NỔI BẬT

1. **Trợ lý AI LogPulse Copilot (RCA & Chatbot)**:
   - Nhấp vào biểu tượng bot neon nổi ở góc dưới bên phải màn hình để chat trực tiếp với AI về tình trạng hệ thống.
   - Nhấp vào bất kỳ dòng log nào trên bảng log ➔ Trong cửa sổ Modal xem chi tiết log, bấm nút **"🤖 Phân tích cùng AI"** để AI tự động phân tích nguyên nhân gốc rễ (Root Cause) và đưa ra các hành động khắc phục cụ thể.
2. **Quản lý Vòng Đời Sự Cố (Incident Lifecycle)**:
   - Chuyển sang tab **Bất Thường (Anomalies)**: Lọc các sự cố theo trạng thái `TẤT CẢ`, `MỚI (NEW)`, `ĐÃ TIẾP NHẬN (ACK)`, `ĐÃ XỬ LÝ (RESOLVED)`.
   - Bấm **"Tiếp nhận"** hoặc **"Xử lý xong"** để đổi trạng thái, bấm **"Ghi chú"** để nhập nhật ký khắc phục sự cố kèm chữ ký người thực hiện.
3. **Cảnh Báo Đa Kênh Tức Thì & Chống Bão Tin Nhắn (Deduplication)**:
   - Khi có log lỗi mức độ nghiêm trọng hoặc Anomaly Score cao, tin nhắn sẽ tự động bắn về **Discord Webhook** (dạng Rich Embed) và hòm thư **Gmail** của Admin.
   - Cơ chế Deduplication sẽ tự động gom các lỗi lặp lại trong 60 giây để tránh tình trạng spam bão thông báo.
4. **Giám Sát Sức Khỏe Pipeline (Pipeline Health Dashboard)**:
   - Trên thanh Header, nhấp vào thẻ **"Pipeline: HEALTHY"** để mở widget hiển thị trực quan số lượng job BullMQ (Chờ xử lý, Đang chạy, Thất bại), thông lượng thực tế (**Throughput: log/s**) và độ trễ (**Latency: ms**).
5. **Báo Cáo Định Kỳ Tự Động (Daily Digest) & Quản Lý Log Retention**:
   - Chuyển sang tab **Cài Đặt (Settings)**:
     - Bấm nút **"Gửi Báo Cáo 24h Ngay"** để kiểm tra tính năng tổng hợp dữ liệu ca trực và bắn báo cáo sang Discord & Gmail tức thì.
     - Bật/tắt dọn dẹp tự động và bấm nút **"Dọn Dẹp Log Cũ Ngay"** để xóa các log cũ hơn số ngày chỉ định trong OpenSearch.
6. **Chế Độ Bảo Trì (Silence Maintenance Mode)**:
   - Tại tab **Cài Đặt**, bật chế độ bảo trì để tạm ngưng bắn cảnh báo Discord/Email trong thời gian nâng cấp hạ tầng mà không làm gián đoạn việc thu thập log.
7. **Quản Lý Từ Khóa Cảnh Báo Động (Alert Keywords)**:
   - Thêm hoặc xóa trực tiếp các từ khóa cảnh báo trên giao diện web (dạng Tags) mà không cần phải can thiệp sửa code backend.
8. **Đa Ngôn Ngữ & Chế Độ Sáng/Tối**:
   - Dễ dàng chuyển đổi linh hoạt giữa giao diện **Tiếng Việt / English** và **Chế độ Sáng / Tối (Light/Dark Mode)** trên thanh Header.
