# PROJECT CONTEXT — Hệ thống phân tích log tập trung & phát hiện bất thường

> File này dùng làm ngữ cảnh (context) cho AI coding agent (Antigravity IDE, Claude Code, v.v.) khi bắt đầu hoặc tiếp tục triển khai đồ án tốt nghiệp. Toàn bộ nội dung dưới đây phản ánh đề cương đồ án và thực tế hệ thống đã được phát triển. **Không tự ý thay đổi kiến trúc, công nghệ hoặc phạm vi khi chưa hỏi lại người dùng.**

## 1. Thông tin đề tài

- **Tên đề tài (VN):** Nghiên cứu và xây dựng hệ thống phân tích log tập trung và phát hiện bất thường
- **Tên đề tài (EN):** Centralized Log Analytics & Anomaly Detection System
- **Loại đề tài:** Đồ án/Khóa luận tốt nghiệp ngành Công nghệ Thông tin
- **Thời gian thực hiện:** 15 tuần

## 2. Mục tiêu

### 2.1. Mục tiêu tổng quát
Xây dựng một hệ thống phân tích log tập trung có khả năng: **thu thập** log từ nhiều nguồn/dịch vụ → **chuẩn hóa** (parsing) → **lưu trữ & lập chỉ mục** → **tìm kiếm** → **phát hiện bất thường** → **hiển thị dashboard & cảnh báo tự động**.

### 2.2. Mục tiêu cụ thể
- Thu thập log qua HTTP với hàng đợi tin nhắn đảm bảo không mất dữ liệu khi tải cao.
- Chuẩn hóa nhiều định dạng log khác nhau (JSON, Nginx access log, Syslog) về một lược đồ dữ liệu thống nhất.
- Lập chỉ mục và tìm kiếm log theo thời gian thực (đã hoàn thiện Search API & Export CSV).
- Phát hiện bất thường bằng 3 phương pháp có độ sâu tăng dần: rule-based → thống kê → template mining kết hợp học máy.
- Trực quan hóa dữ liệu qua dashboard (UI hiện đại chuẩn Neon/Gradient) và cảnh báo tự động qua Telegram Bot thời gian thực.
- Đánh giá định lượng hệ thống bằng benchmark hiệu năng và các chỉ số phát hiện bất thường trên dữ liệu có gán nhãn.

## 3. Định nghĩa Anomaly và đơn vị phát hiện

**Anomaly** được định nghĩa là sự sai lệch bất thường so với hành vi log thông thường của hệ thống, biểu hiện qua: tần suất log lỗi tăng đột biến, xuất hiện chuỗi sự kiện log chưa từng gặp, hoặc độ trễ dịch vụ tăng cao bất thường.

**Đơn vị phát hiện** khác nhau theo từng nguồn dữ liệu — đây là điểm quan trọng, agent cần tuân thủ đúng khi cài đặt:

| Nguồn dữ liệu | Đơn vị phát hiện |
|---|---|
| **HDFS dataset** | Log sequence, gom theo `block_id` (mỗi block_id gán nhãn normal/anomaly cho cả chuỗi log liên quan) |
| **BGL dataset** | Log line (mỗi dòng có nhãn riêng: `-` = bình thường, khác `-` = alert), hoặc gom theo cửa sổ thời gian cố định |
| **Log tự sinh (demo)** | Cửa sổ thời gian theo từng dịch vụ (time-window per service), ví dụ mỗi 1 phút đếm số log ERROR theo service |

## 4. Dataset

- **Log giả lập / log demo:** sinh ra từ ứng dụng demo tự xây dựng (không có nhãn sẵn — dùng để test end-to-end pipeline và rule-based/thống kê).
- **HDFS log dataset:** bộ dữ liệu chuẩn quốc tế, có nhãn theo block_id, dùng để đánh giá định lượng (precision/recall/F1).
- **BGL (Blue Gene/L) log dataset:** bộ dữ liệu chuẩn quốc tế, có nhãn theo dòng log, dùng để đánh giá định lượng.

> Cả hai bộ HDFS và BGL đều nằm trong bộ sưu tập **Loghub** (He et al., ISSRE 2023) — agent có thể tham khảo cấu trúc dữ liệu từ nguồn này khi viết code tiền xử lý.

## 5. Kiến trúc hệ thống hiện tại (pipeline)

```
[Log Sources / Dataset]
       │  (HTTP POST)
       ▼
[1. Collector Service :4000] ──► [Hàng đợi tin nhắn: Redis + BullMQ]
       │
       ▼
[2. Parser / Normalization Service] (Drain Algorithm)
       │  
       ├──► [3. Storage & Indexing: OpenSearch :9200]
       │
       └──► [4. Search API / Socket.IO :5000]
                 │
                 ├──► [5. Anomaly Detection Engine] (Rule-based, Thống kê, AI/ML)
                 │
                 ├──► [6. Cảnh báo tự động: Telegram Bot API]
                 │
                 └──► [7. Dashboard Frontend :3000 (React/Vite)] (Nhận log realtime qua WebSocket, Export CSV)
```

## 6. Công nghệ đã CHỐT & Triển Khai (không tự ý đổi)

| Thành phần | Công nghệ | Ghi chú / Trạng thái |
|---|---|---|
| Ngôn ngữ Backend | **Node.js (ES6+)** | Express (đang sử dụng) |
| Hàng đợi tin nhắn | **Redis + BullMQ** | Redis AOF persistence để không mất job khi restart |
| Lưu trữ & lập chỉ mục | **OpenSearch** | Đã chốt — KHÔNG dùng Elasticsearch hay Loki. |
| Truyền tải Realtime | **Socket.IO** | Backend đẩy sự kiện `new_log` trực tiếp đến giao diện |
| Frontend / Dashboard | **React.js + Vite** | Thiết kế UI/UX hiện đại (Linear/Vercel style), Dark/Light mode |
| Ứng dụng Di động | **Expo (React Native)** | Ứng dụng Mobile 5 Tabs, Role-based navigation, Socket.IO realtime, Trợ lý AI Bubble |
| Tính năng phụ trợ | **Export CSV** | Hỗ trợ xuất dữ liệu log và anomaly ra CSV |
| Cảnh báo | **Telegram Bot API** | Gửi tin nhắn tự động khi phát hiện log mức FATAL/điểm Anomaly cao |

## 7. Anomaly Detection Engine — 3 phương pháp (bắt buộc cả 3, tăng dần độ sâu)

1. **Rule-based:** ngưỡng tần suất lỗi theo đơn vị thời gian, phát hiện từ khóa log nghiêm trọng (`Fatal Error`, `DB Connection Failed`...).
2. **Thống kê:** Z-Score hoặc moving average trên tần suất log theo thời gian, theo từng dịch vụ.
3. **Template mining + Machine Learning:** dùng thuật toán **Drain** (He et al., ICWS 2017) để tách log thành các template sự kiện, biến mỗi block_id/window log thành vector đếm số lần xuất hiện mỗi template; áp dụng **Isolation Forest** (Liu et al., ICDM 2008) hoặc **Logistic Regression** trên vector đặc trưng này để phân loại normal/anomaly.

## 8. Yêu cầu về độ tin cậy (Reliability) của pipeline

Agent cần tuân thủ/cài đặt các cơ chế sau:
- **Redis AOF persistence** — không mất job trong hàng đợi.
- **Retry với backoff** — BullMQ tự động thử lại job thất bại.
- **Idempotent write vào OpenSearch** — dùng document ID xác định (hash từ nội dung log + timestamp).
- **Decoupling & backpressure** — hàng đợi Redis giúp Collector không bị chặn khi OpenSearch tải cao.
- **Ghi theo lô (Bulk API)** — dùng Bulk API của OpenSearch để tăng throughput.

## 9. Phương pháp đánh giá & Benchmark

- **Chia tập dữ liệu theo trục thời gian** (time-based holdout): Không xáo trộn ngẫu nhiên.
- **Chỉ số đánh giá độ chính xác:** Precision, Recall, F1-score trên HDFS và BGL (có nhãn sẵn); so sánh giữa 3 phương pháp.
- **Benchmark hiệu năng hệ thống:**
  - Thông lượng xử lý (log/giây) bằng công cụ load-test (`autocannon` / `k6`).
  - Độ trễ pipeline (end-to-end latency).
  - Đo throughput/latency khi tăng tải để tìm bottleneck.

## 10. Kế hoạch triển khai (Trạng thái hiện tại)

| Tuần | Nội dung | Trạng thái |
|---|---|---|
| 1-3 | Khảo sát, phân tích yêu cầu, xác định kiến trúc | [X] Hoàn thành |
| 4-5 | Thiết kế DB + Xây Log Collector, Redis/BullMQ | [X] Hoàn thành |
| 6 | Xây Parser chuẩn hóa + Drain | [X] Hoàn thành cơ bản |
| 7 | Triển khai OpenSearch | [X] Hoàn thành |
| 8 | Xây Search API (lọc mức độ, dịch vụ, xuất CSV) | [X] Hoàn thành |
| 9 | Xây Anomaly Detection Engine (Rule, Drain, ML) | [ ] Đang thực hiện |
| 10 | Xây Dashboard (React/Vite) + Telegram Bot + Socket.IO | [X] Hoàn thành |
| 11 | Chuẩn bị dữ liệu: tiền xử lý HDFS/BGL | [ ] Chưa làm |
| 12 | Tích hợp toàn bộ pipeline end-to-end, kiểm tra luồng dữ liệu HDFS/BGL đầu cuối | [ ] Chưa làm |
| 13 | Kiểm thử: benchmark hiệu năng, tính Precision/Recall | [ ] Chưa làm |
| 14-15| Tối ưu hệ thống, viết báo cáo & bảo vệ | [ ] Chưa làm |

## 11. Nguyên tắc làm việc cho AI Agent

1. **Không tự ý đổi công nghệ đã chốt** ở mục 6 — nếu thấy cần đổi, phải hỏi lại người dùng trước.
2. **Làm theo từng module** đúng thứ tự roadmap ở mục 10, không gộp nhiều module.
3. **Giải thích rõ logic** của từng phần, đặc biệt Anomaly Detection Engine.
4. **Không tự thêm phương pháp/thuật toán ngoài phạm vi đã chốt** (chỉ dùng rule-based, Z-score/moving average, Drain, Isolation Forest/Logistic Regression).
5. **Cập nhật `tiendo.md` và `kientruchethong.md`** ngay sau khi hoàn thành task để người dùng theo dõi.
