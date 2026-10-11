# Hướng dẫn Deploy Perplexica (Vane) Mã Gốc Lên Railway

Bản gốc của Perplexica (đã đổi tên thành **Vane**) chạy bằng Docker container đầy đủ gồm:
- Giao diện Next.js 16 chính thức của tác giả
- Công cụ tìm kiếm SearXNG (Python) ngầm
- Trình duyệt Playwright Chromium để đọc nội dung web
- Cơ sở dữ liệu SQLite

---

## Cách 1: Triển khai 1-Click Template (Khuyên Dùng - Đơn giản nhất)

Tác giả **ItzCrazyKns** đã cung cấp template chính thức được tối ưu riêng cho Railway:

1. **Mở link Template:**
   👉 Truy cập: **[https://railway.com/template/perplexica](https://railway.com/template/perplexica)**

2. **Đăng nhập Railway:**
   - Bạn có thể đăng nhập bằng tài khoản GitHub hoặc Email.

3. **Cấu hình biến môi trường (Environment Variables):**
   - **`GEMINI_API_KEY`**: `YOUR_GEMINI_API_KEY`
   - **`PORT`**: `3000`

4. **Bấm "Deploy":**
   - Railway sẽ tự động:
     - Kéo Docker image chính thức `itzcrazykns1337/vane:latest`.
     - Tự tạo persistent disk volume tại `/home/vane/data`.
     - Cấp tên miền HTTPS công khai (dạng `https://perplexica-xxxx.up.railway.app`).

5. **Truy cập và sử dụng:**
   - Mở domain được cấp trên điện thoại hoặc laptop.
   - Hoàn tất bước thiết lập ban đầu (Wizard) chọn mô hình Gemini Pro để bắt đầu tìm kiếm!

---

## Cách 2: Triển khai từ GitHub Repository Cá nhân

Nếu bạn muốn kết nối repo GitHub của bạn vào Railway:
1. Tạo một repo mới trên GitHub và push thư mục mã nguồn này lên.
2. Vào **[Railway Dashboard](https://railway.com/dashboard)** -> Chọn **New Project** -> **Deploy from GitHub repo**.
3. Chọn repo của bạn.
4. Thêm Volume:
   - Vào Settings của Service -> mục **Volumes** -> Chọn **Add Volume**.
   - Mount Path: `/home/vane/data`.
5. Thêm biến môi trường:
   - `GEMINI_API_KEY`: `YOUR_GEMINI_API_KEY`.
6. Railway sẽ tự build và sinh public URL cho bạn.
