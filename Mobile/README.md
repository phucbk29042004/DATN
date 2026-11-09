# LogPulse AI Mobile (Expo / React Native)

Ứng dụng di động giám sát và phân tích log thời gian thực dành cho hệ sinh thái **LogPulse AI Enterprise**, hỗ trợ 2 vai trò: **Quản Trị Viên (Admin)** và **Giám Sát Viên (Viewer)**.

---

## 📱 Kiến Trúc Ứng Dụng (Mobile Architecture)

1. **Role-Based Navigation**:
   - `RootNavigator`: Tự động phân loại `AuthStack` (Login) và `AppStack` (Dashboard, Sự cố, Tra cứu, Mẫu log, Cài đặt).
   - Mô hình **Nested Stack bọc Tab**: Khi chuyển sang các màn hình phụ (`IncidentDetail`, `ChangePassword`, `AdminSettings`), Bottom Tab Bar sẽ tự động ẩn đi để tối đa hóa không gian trải nghiệm.
2. **Elevated Dock Tab Bar (5 Tabs)**:
   - Chiều cao thoáng đãng (68px – 72px) tính toán chuẩn `SafeAreaInsets`.
   - Đổ bóng hướng lên trên (`Upward Elevation Shadow`).
   - Nút **Tra Cứu Nhanh** (Tab 3 Trung tâm) nhô cao (-10px) nổi bật.
   - Chỉ báo Active hiện đại dạng khung viên nang bo mềm (`Pill Active Indicator`).
3. **Theme Tokens 2 Chiều (Dark & Light Mode)**:
   - Giao diện Tối (Dark Palette): Màu nhấn Tím Indigo (`#6366f1`) trên nền đen than chì (`#09090b`).
   - Giao diện Sáng (Light Palette): Màu nhấn Xanh Da Trời (`#0284c7`) trên nền trắng ngà (`#fafafa`).
   - Lưu trữ trạng thái giao diện bền vững qua `AsyncStorage`.
4. **Global Floating AI Assistant Bubble**:
   - Nút tròn trợ lý ảo nổi ở góc dưới mọi màn hình, bấm vào mở Drawer phân tích log theo vai trò (RBAC) kết nối trực tiếp với backend AI (`/api/v1/ai/query`).

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Cài đặt các thư viện phụ thuộc:
Mở terminal tại thư mục `d:\DATN\Mobile` và chạy:
```bash
cd d:\DATN\Mobile
npm install
```

### 2. Khởi chạy ứng dụng với Expo:
```bash
npx expo start
```
hoặc:
```bash
npm start
```

### 3. Mở ứng dụng trên điện thoại:
- **Android**: Cài đặt ứng dụng **Expo Go** từ Google Play Store, mở camera hoặc ứng dụng Expo Go để quét mã QR trên màn hình terminal.
- **iOS**: Mở ứng dụng **Camera** trên iPhone và quét mã QR để mở qua ứng dụng **Expo Go**.
- **Máy ảo Android / iOS Simulator**: Nhấn phím `a` (cho Android) hoặc `i` (cho iOS).

### 4. Kết nối API Backend:
- Đảm bảo Backend (`node index.js`) đang chạy tại cổng `5000` và `4000`.
- Trên màn hình Đăng nhập của ứng dụng Mobile, bạn có thể nhấn vào dòng **"Cấu hình địa chỉ IP máy chủ API"** để nhập IP mạng LAN của máy tính (ví dụ: `http://192.168.1.x:5000`) giúp điện thoại thật kết nối thông suốt với Search API.

