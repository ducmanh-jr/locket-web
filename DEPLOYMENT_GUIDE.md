# 🌐 Hướng dẫn Triển khai LocketWeb Online Miễn phí 100% ($0/tháng)

Tài liệu này hướng dẫn chi tiết từng bước để bạn đưa ứng dụng **LocketWeb** lên mạng internet hoàn toàn miễn phí, cho phép bạn và bạn bè sử dụng thực tế trên iPhone, Android và Máy tính.

---

## 🏗️ 1. Kiến trúc Online Miễn phí vĩnh viễn

| Thành phần | Dịch vụ chọn | Hạn mức Miễn phí (Free Tier) | Chi phí |
|---|---|---|---|
| **Frontend & Hosting** | **Vercel** (Hobby) | Tự động SSL HTTPS, băng thông 100GB/tháng, domain `.vercel.app` | **$0** |
| **Database + Auth + Storage + Realtime** | **Supabase** (Free Tier) | 500MB Database, 1GB Ảnh storage, 50,000 người dùng hàng tháng | **$0** |
| **Ứng dụng di động (PWA)** | Trình duyệt iOS/Android | Thêm vào màn hình chính (Add to Home Screen) | **$0** |
| **Giữ Server luôn thức** | Cron-Job.org / GitHub Actions | 1 request tự động mỗi vài ngày để Supabase không bị Pause | **$0** |

---

## ⚡ 2. Bước 1: Khởi tạo Database Supabase (3 phút)

1. Truy cập [https://supabase.com](https://supabase.com) và đăng ký tài khoản miễn phí (bằng GitHub hoặc Email).
2. Bấm **New Project**:
   - **Name**: `locket-web`
   - **Database Password**: Tạo mật khẩu (lưu lại nếu cần).
   - **Region**: Chọn **Singapore (`ap-southeast-1`)** để đạt tốc độ nhanh nhất tại Việt Nam.
   - **Pricing Plan**: Chọn **Free Tier ($0/month)**.
3. Sau khi dự án khởi tạo xong (~1 phút):
   - Vào tab **SQL Editor** ở menu bên trái.
   - Mở file [`supabase/migration_shared_room.sql`](file:///c:/Users/Admin/ducmanh/DM_locket/supabase/migration_shared_room.sql) trong thư mục dự án này, copy toàn bộ nội dung SQL.
   - Dán vào SQL Editor trên Supabase và bấm nút **RUN**.
   - *(Lệnh này sẽ tự động tạo toàn bộ các bảng `profiles`, `friendships`, `moments`, `moment_recipients`, `reactions`, phân quyền RLS bảo mật và bật tính năng Realtime WebSocket)*.
4. Lấy API Keys:
   - Vào **Project Settings ➔ API**.
   - Copy 2 giá trị:
     - `Project URL` (dạng `https://xxxx.supabase.co`)
     - `anon / public` API Key (dạng `eyJhbGci...`)

---

## 🔑 3. Bước 2: Cấu hình Đăng nhập (Google OAuth hoặc Email)

### Cách 1: Đăng nhập bằng Email Magic Link (Mặc định - Đơn giản nhất)
- Supabase tích hợp sẵn Magic Link qua Email. Người dùng chỉ cần nhập Email ➔ Supabase gửi link xác nhận ➔ Đăng nhập thành công mà không tốn chi phí SMS OTP.

### Cách 2: Đăng nhập bằng Google (OAuth)
1. Vào [Google Cloud Console](https://console.cloud.google.com/) ➔ Tạo Project mới.
2. Vào **APIs & Services ➔ Credentials** ➔ Tạo **OAuth 2.0 Client IDs** (Loại Web application).
3. Tại **Authorized redirect URIs**, thêm 3 đường dẫn sau:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - `http://localhost:3000`
   - `https://<ten-app-cua-ban>.vercel.app`
4. Copy **Client ID** và **Client Secret** dán vào Supabase Dashboard ➔ **Authentication ➔ Providers ➔ Google** ➔ Enable.

---

## 🚀 4. Bước 3: Deploy Frontend lên Vercel (2 phút)

1. Push mã nguồn này lên tài khoản **GitHub** của bạn:
   ```bash
   git init
   git add .
   git commit -m "Deploy LocketWeb"
   git branch -M main
   git remote add origin https://github.com/username/locket-web.git
   git push -u origin main
   ```
2. Truy cập [https://vercel.com](https://vercel.com) và đăng nhập bằng GitHub.
3. Bấm **Add New... ➔ Project** ➔ Chọn repository `locket-web`.
4. Tại mục **Environment Variables**, thêm 2 biến môi trường:
   - `NEXT_PUBLIC_SUPABASE_URL` = *(Dán Project URL từ Bước 1)*
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *(Dán anon key từ Bước 1)*
5. Bấm **Deploy**.
6. Sau ~1 phút, Vercel sẽ cấp cho bạn một đường dẫn chạy thật (ví dụ: `https://locket-web.vercel.app`).

---

## 📱 5. Bước 4: Hướng dẫn Cài đặt lên Điện thoại (PWA)

### Trên iPhone / iPad (iOS Safari):
1. Mở trang web `https://locket-web.vercel.app` bằng **Safari**.
2. Bấm vào nút **Chia sẻ (Share)** hình ô vuông có mũi tên chỉ lên ở thanh công cụ phía dưới.
3. Cuộn xuống chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
4. Mở ứng dụng từ icon trên Màn hình chính ➔ Trải nghiệm full màn hình 100% như app tải trên App Store!

### Trên điện thoại Android (Chrome):
1. Mở trang web bằng **Google Chrome**.
2. Bấm vào biểu tượng 3 chấm ở góc trên bên phải.
3. Chọn **"Cài đặt ứng dụng" (Install App)** hoặc **"Thêm vào Màn hình chính"**.

---

## ⏰ 6. Bí quyết giữ Supabase không bao giờ bị "Pause" (Keep-Alive $0)

Dự án Supabase gói Free sẽ tạm dừng (pause) nếu trong 7 ngày không có ai truy cập. Để app của bạn luôn sống 24/7 mà không cần quan tâm:

1. Đăng ký tài khoản miễn phí tại [https://cron-job.org](https://cron-job.org).
2. Tạo 1 Cronjob mới:
   - **URL**: `https://<your-project-ref>.supabase.co/rest/v1/`
   - **Execution schedule**: Chạy 3 ngày 1 lần.
3. Hoặc tạo file `.github/workflows/keep-alive.yml` để GitHub Actions tự động gửi request gọi Supabase mỗi vài ngày.

---

## ✅ Tóm tắt Quy trình 3 Bước nhanh nhất:

```
[1. Tạo Supabase Free] ──> [2. Push Code lên GitHub] ──> [3. Import Vercel & Thêm Env]
         │                                                            │
         ▼                                                            ▼
Chạy schema.sql (30s)                                          Có ngay Link Online!
```
