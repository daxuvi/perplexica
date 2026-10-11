# Hướng Dẫn Triển Khai Perplexica Pro Lên Vercel (Miễn Phí 100%)

Với Vercel, ứng dụng AI Search của bạn sẽ chạy trên đám mây **24/7**, **không bao giờ bị tắt máy**, và bạn có thể truy cập từ **điện thoại, máy ở nhà, laptop** ở bất kỳ đâu với tên miền HTTPS riêng!

---

## 🚀 Cách 1: Deploy Bằng 1-Click Ngay Tại Máy Này (Khuyên Dùng)

1. Nhấp đúp chuột vào file [deploy-vercel.bat](file:///h:/My%20Drive/00%20TAI%20LIEU/00a%20CODE/AI-Tool/Perplexica/deploy-vercel.bat).
2. Lần đầu tiên, cửa sổ console sẽ hỏi bạn:
   - `Log in to Vercel`: Chọn đăng nhập bằng GitHub hoặc Email (trình duyệt sẽ tự mở để xác nhận).
   - `Set up and deploy?`: Nhấn `y` rồi Enter.
   - Các câu hỏi tiếp theo (`Which scope?`, `Link to existing project?`): Cứ nhấn Enter để chọn mặc định.
3. Sau 30 giây, Vercel sẽ cấp cho bạn một đường link chính thức dạng:
   👉 **`https://ten-du-an-cua-ban.vercel.app`**
4. Để xuất bản bản Production chính thức, bạn chỉ cần gõ:
   ```bash
   npx vercel --prod
   ```

---

## 🌐 Cách 2: Deploy Qua GitHub

1. Truy cập [GitHub.com](https://github.com/) và tạo một Repository mới (ví dụ: `my-gemini-search`).
2. Tải toàn bộ mã nguồn trong thư mục này lên GitHub Repo đó.
3. Truy cập [Vercel.com](https://vercel.com/) và đăng nhập bằng tài khoản GitHub.
4. Nhấn nút **Add New...** -> Chọn **Project** -> Chọn Repository `my-gemini-search`.
5. Nhấn **Deploy**. Sau 30 giây bạn sẽ có ngay website hoạt động vĩnh viễn!

---

## 🔑 Mẹo Hay: Cấu Hình API Key Sẵn Trên Vercel Để Khỏi Cần Nhập Lại Trên Điện Thoại

Để khi mở trang web trên điện thoại hay bất kỳ máy tính nào mà **không cần phải gõ lại API Key**:

1. Trên trang quản lý dự án tại [Vercel Dashboard](https://vercel.com/dashboard):
2. Vào mục **Settings** -> Chọn **Environment Variables**.
3. Thêm biến:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Dán mã Gemini API Key (Pro) của bạn vào.
4. Nhấn **Save** và bấm **Redeploy**.
5. Bây giờ, bất kỳ thiết bị nào mở đường link web của bạn lên đều sẽ tự động kết nối sẵn sàng tìm kiếm ngay lập tức!

---

## 🏷️ Gắn Tên Miền Riêng (Custom Domain)

Nếu bạn có sẵn tên miền riêng (ví dụ `search.tenban.com` hoặc `.vn`, `.com`):
1. Vào **Settings** -> **Domains** trên Vercel.
2. Nhập tên miền của bạn vào và làm theo hướng dẫn trỏ bản ghi DNS CNAME của Vercel.
3. Vercel sẽ tự động cấp chứng chỉ bảo mật SSL HTTPS miễn phí cho tên miền của bạn!
