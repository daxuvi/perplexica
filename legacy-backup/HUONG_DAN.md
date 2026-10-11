# Hướng Dẫn Sử Dụng Web App AI Search Riêng Biệt (Perplexica Pro)

Hệ thống cung cấp **Web App AI Search riêng biệt từ A-Z** thiết kế theo chuẩn trải nghiệm cao cấp của **Perplexity Pro**, kết nối trực tiếp với **Google Gemini Pro API** và tính năng **Google Search Grounding (Tìm kiếm thời gian thực)**.

---

## 🚀 1. Cách Khởi Chạy Web App Riêng (Khuyên Dùng Nhất)

- **Bước 1**: Nhấp đúp chuột vào file [run-web.bat](file:///h:/My%20Drive/00%20TAI%20LIEU/00a%20CODE/AI-Tool/Perplexica/run-web.bat).
- **Bước 2**: Trình duyệt sẽ tự động mở tại địa chỉ: **[http://localhost:5000](http://localhost:5000)**.
- **Bước 3**: Bấm vào nút **Cài đặt & API Key (⚙️)** ở góc dưới bên trái:
  - Dán mã **Google Gemini API Key** của bạn vào.
  - Bấm **Kiểm tra key** (hệ thống sẽ test ngay xem key hoạt động hay không).
  - Chọn mô hình mặc định: `Gemini 1.5 Pro` (khuyên dùng cho nghiên cứu sâu) hoặc `Gemini 2.0 Flash` (siêu tốc độ).
  - Bấm **Lưu cài đặt**.

*(Lưu ý: Web App này chạy trực tiếp bằng Node.js tích hợp sẵn, khởi động chỉ trong 1 giây, siêu nhẹ và **không cần bật Docker**).*

---

## 🌟 2. Các Tính Năng Cao Cấp Tương Đương Perplexity Pro

| Tính năng | Mô tả chi tiết |
| :--- | :--- |
| **Google Search Grounding** | Tự động truy vấn công cụ tìm kiếm Google theo thời gian thực và trích xuất thông tin mới nhất. |
| **Nguồn trích dẫn trực quan (Sources)** | Hiển thị danh thiếp nguồn web có favicon, tên miền, tiêu đề và link trực tiếp. |
| **Trích dẫn tương tác `[1]`, `[2]`** | Nhấp hoặc rê chuột vào số trích dẫn trong văn bản sẽ tự động đánh dấu (highlight) nguồn tương ứng. |
| **Các chế độ nghiên cứu (Focus Modes)** | 🌐 **Web Search** (Tìm kiếm tin tức)<br>🔬 **Deep Research Pro** (Phân tích chuyên sâu nhiều góc độ)<br>🎓 **Học thuật** (Bài báo khoa học, lý thuyết)<br>💻 **Code & Kỹ thuật** (Lập trình, thuật toán kèm syntax highlight)<br>✍️ **Sáng tạo & Viết lách** (Không duyệt web). |
| **Câu hỏi đào sâu (Related Questions)** | Tự động sinh ra 3 câu hỏi gợi ý liên quan sau mỗi lần trả lời. Bấm vào là AI tiếp tục trả lời theo mạch ngữ cảnh. |
| **Đọc thành tiếng (Text-to-Speech)** | Bấm nút **🔊 Đọc** để nghe câu trả lời bằng giọng đọc tiếng Việt tự nhiên. |
| **Xuất tài liệu (Export Markdown)** | Nút **Xuất MD** trên thanh điều hướng cho phép tải toàn bộ phiên nghiên cứu thành file Markdown. |
| **Đính kèm file & hình ảnh** | Hỗ trợ tải lên ảnh hoặc tài liệu để Gemini Pro đọc và phân tích thị giác (Multimodal). |
| **Lưu lịch sử hội thoại** | Tự động lưu các chủ đề nghiên cứu vào thanh bên trái (Sidebar). |

---

## 🐳 3. Tùy Chọn: Chạy Perplexica Gốc Qua Docker (Nếu Muốn)

Nếu bạn vẫn muốn dùng thêm bản Perplexica gốc (Vane) chạy qua Docker và SearXNG:
- Bật Docker Desktop trên máy.
- Nhấp đúp vào [start.bat](file:///h:/My%20Drive/00%20TAI%20LIEU/00a%20CODE/AI-Tool/Perplexica/start.bat) -> truy cập `http://localhost:3000`.
- Nhấp đúp vào [stop.bat](file:///h:/My%20Drive/00%20TAI%20LIEU/00a%20CODE/AI-Tool/Perplexica/stop.bat) khi muốn dừng container.
