# 📸 LocketWeb — Ứng dụng chia sẻ ảnh tức thời (bản Web, 100% miễn phí)

> Phiên bản **Web/PWA** của ứng dụng lấy cảm hứng từ Locket. Không cần App Store, không cần Apple Developer ($99), không cần Google Play ($25), không cần server trả phí. Người dùng mở bằng trình duyệt hoặc "Thêm vào màn hình chính" (PWA) để có trải nghiệm gần giống app thật, gửi/nhận ảnh real-time giữa bạn bè.

---

## 📖 Mục lục

1. [Tầm nhìn & Vì sao chọn Web thay vì App gốc](#1-tầm-nhìn--vì-sao-chọn-web-thay-vì-app-gốc)
2. [Tính năng chi tiết](#2-tính-năng-chi-tiết)
3. [Kiến trúc hệ thống (100% free tier)](#3-kiến-trúc-hệ-thống-100-free-tier)
4. [Công nghệ sử dụng — chỉ chọn thứ có gói miễn phí vĩnh viễn](#4-công-nghệ-sử-dụng--chỉ-chọn-thứ-có-gói-miễn-phí-vĩnh-viễn)
5. [Thiết kế cơ sở dữ liệu](#5-thiết-kế-cơ-sở-dữ-liệu)
6. [API / Supabase Client Calls](#6-api--supabase-client-calls)
7. ["Widget" trên Web — PWA thay thế widget màn hình chính](#7-widget-trên-web--pwa-thay-thế-widget-màn-hình-chính)
8. [Realtime (không bắt buộc Push Notification)](#8-realtime-không-bắt-buộc-push-notification)
9. [Bảo mật & Quyền riêng tư](#9-bảo-mật--quyền-riêng-tư)
10. [Cấu trúc thư mục dự án](#10-cấu-trúc-thư-mục-dự-án)
11. [🔧 Các bài toán thực tế đang/sẽ gặp phải & cách giải quyết](#11--các-bài-toán-thực-tế-đangsẽ-gặp-phải--cách-giải-quyết)
12. [Triển khai miễn phí (Deploy Guide)](#12-triển-khai-miễn-phí-deploy-guide)
13. [Chi phí vận hành = $0 (và mốc khi nào phải trả tiền)](#13-chi-phí-vận-hành--0-và-mốc-khi-nào-phải-trả-tiền)
14. [Lộ trình phát triển (Roadmap)](#14-lộ-trình-phát-triển-roadmap)
15. [Rủi ro pháp lý & lưu ý bản quyền](#15-rủi-ro-pháp-lý--lưu-ý-bản-quyền)

---

## 1. Tầm nhìn & Vì sao chọn Web thay vì App gốc

**Vấn đề gốc:** Bản mobile app (Flutter/RN + widget native Swift/Kotlin) đúng là giống Locket thật nhất, nhưng có 2 chi phí **không thể miễn phí**: Apple Developer $99/năm và công sức viết widget native. Vì bạn muốn **miễn phí toàn bộ**, bản Web loại bỏ hoàn toàn 2 rào cản đó.

**Đánh đổi cần chấp nhận (nói thẳng, không né):**

| Cái Locket thật có | Bản Web có được không? |
|---|---|
| Widget trên màn hình chính (không cần mở app) | ❌ Không thể — trình duyệt/PWA **không có quyền** vẽ lên home screen như native widget. Thay thế: icon PWA + badge số + trang mở nhanh. |
| Push notification kể cả khi app đã tắt hẳn | ⚠️ Có nhưng giới hạn: Web Push hoạt động tốt trên Android/Desktop, **rất hạn chế trên iOS Safari** (chỉ từ iOS 16.4+, và bắt buộc người dùng phải "Thêm vào màn hình chính" trước). |
| Có mặt trên App Store/Play Store | ❌ Không có, trừ khi sau này bạn đóng gói lại (Capacitor/PWA Builder) — không nằm trong phạm vi bản free này. |
| Real-time gửi/nhận ảnh tức thời khi đang mở app/tab | ✅ Hoàn toàn được, không đánh đổi gì cả. |

→ Vì bạn đã xác nhận **"không cần nhận thông báo"**, bản thiết kế này **bỏ hẳn yêu cầu push bắt buộc**, chỉ giữ real-time trong lúc người dùng đang mở web/tab — điều này giúp kiến trúc đơn giản đi rất nhiều và **100% nằm trong các gói free tier**.

**Nguyên tắc thiết kế giữ nguyên:**
- Tối giản — mở web → chụp → gửi trong 3 bước.
- Riêng tư mặc định — chỉ bạn bè 2 chiều thấy ảnh nhau.
- Không feed công khai, không số lượt like.

---

## 2. Tính năng chi tiết

### 2.1. MVP (bắt buộc, chạy online thật, không mock)

| Tính năng | Mô tả |
|---|---|
| Đăng nhập | Google Sign-In (OAuth) hoặc Email + Mật khẩu (Magic Link) — không cần OTP SMS vì SMS provider không miễn phí |
| Camera qua trình duyệt | Dùng `getUserMedia()` API để chụp ảnh trực tiếp từ webcam/camera điện thoại |
| Danh sách bạn bè | Thêm bằng username, chấp nhận 2 chiều |
| Gửi ảnh | Chọn 1/nhiều bạn kèm caption ngắn, upload trực tiếp lên Storage |
| Trang "Nhà" (thay Widget) | Trang chủ tự động hiển thị ảnh mới nhất từ bạn bè, cập nhật real-time không cần refresh (giống cảm giác widget) |
| PWA installable | "Thêm vào màn hình chính" → mở như app, có icon riêng, full-screen, không thanh địa chỉ |
| Lịch sử ảnh | Lưới ảnh đã gửi/nhận theo từng bạn |
| React nhanh | Thả emoji phản hồi |
| Đồng bộ đa thiết bị | Mọi thứ qua Supabase, mở web ở máy nào cũng thấy dữ liệu giống nhau |

### 2.2. Tuỳ chọn nâng cao (vẫn free, thêm sau)

- Web Push Notification (best-effort, không bắt buộc — xem mục 8)
- Badge số ảnh chưa xem trên icon PWA (Badging API, hỗ trợ giới hạn)
- Video ngắn 5-10s
- Bộ lọc ảnh nhẹ bằng Canvas API (client-side, không tốn server)
- Chế độ streak
- Dark mode / theme tuỳ chỉnh

### 2.3. Không nằm trong phạm vi bản free này

- Widget thật trên home screen iOS/Android (cần native + Apple Developer trả phí)
- Đăng lên App Store / Google Play
- SMS OTP (mọi provider SMS đều tính phí theo tin nhắn, không có gói free thật sự)

---

## 3. Kiến trúc hệ thống (100% free tier)

```
┌────────────────────────────┐
│   Trình duyệt (Web/PWA)     │
│  Next.js (React) + Service  │
│  Worker (cho PWA + cache)   │
└──────────────┬──────────────┘
               │ HTTPS + WebSocket
               ▼
┌──────────────────────────────────────────┐
│                Supabase                   │
│  - Auth (Google OAuth / Magic Link)       │
│  - Postgres DB (users, friends, moments)  │
│  - Row Level Security (RLS) — thay cho    │
│    backend tự viết, chặn truy cập chéo    │
│  - Realtime (Postgres Changes / Broadcast)│
│  - Storage (ảnh, có thể dùng luôn thay R2 │
│    cho MVP để đỡ quản lý 2 nơi)           │
└──────────────────┬─────────────────────────┘
                    │ (khi ảnh nhiều, > 1GB)
                    ▼
┌──────────────────────────────┐
│   Cloudflare R2 (tuỳ chọn)    │
│   Lưu ảnh khi vượt Supabase   │
└──────────────────────────────┘
```

**Điểm mấu chốt so với bản mobile:** Không cần backend Node.js riêng, không cần Redis, không cần server luôn chạy. **Supabase đóng vai trò toàn bộ "backend"** qua Auth + DB + Realtime + Storage + Row Level Security — nghĩa là bạn chỉ viết **frontend Next.js**, deploy tĩnh lên Vercel, không có server nào có thể "ngủ" hay tốn tiền.

**Luồng gửi ảnh (end-to-end):**

1. Trình duyệt chụp ảnh qua `getUserMedia()` → nén bằng `canvas.toBlob()` (giảm dung lượng trước khi upload).
2. Upload thẳng lên Supabase Storage bucket `moments` (client gọi trực tiếp SDK, không qua server trung gian).
3. Insert 1 row vào bảng `moments` với `media_url`, `recipient_ids`, `caption`.
4. Supabase Realtime tự động phát sự kiện `INSERT` tới mọi client đang subscribe (bạn bè đang mở tab) → UI cập nhật ảnh mới ngay lập tức, không cần polling.
5. (Tuỳ chọn) Nếu bật Web Push: Service Worker nhận push event, hiển thị notification kể cả khi tab đã đóng (trên trình duyệt hỗ trợ).

---

## 4. Công nghệ sử dụng — chỉ chọn thứ có gói miễn phí vĩnh viễn

| Thành phần | Lựa chọn | Vì sao free thật (không phải dùng thử) |
|---|---|---|
| Frontend framework | **Next.js** (React) | Chạy tĩnh/SSR đều được, deploy free trên Vercel |
| PWA | `next-pwa` hoặc Service Worker viết tay | Miễn phí, chỉ là code chạy trong trình duyệt |
| Styling | Tailwind CSS | Miễn phí, không phụ thuộc server |
| Backend logic + DB + Auth + Realtime + Storage | **Supabase Free Tier** | 500MB DB, 1GB Storage, 50k MAU Auth, Realtime built-in, không thẻ tín dụng bắt buộc lúc đăng ký |
| Lưu ảnh khi vượt 1GB | **Cloudflare R2 Free Tier** | 10GB/tháng free, **không tính phí egress** (khác biệt lớn so với AWS S3) |
| Hosting frontend | **Vercel Free (Hobby)** | Deploy Next.js free vĩnh viễn cho dự án cá nhân, tự cấp SSL, tự có domain `.vercel.app` |
| Web Push (tuỳ chọn) | **Web Push API chuẩn (VAPID)**, không qua dịch vụ thứ 3 trả phí | Trình duyệt hỗ trợ sẵn, không cần Firebase nếu muốn tránh phụ thuộc |
| Domain | Dùng `ten-du-an.vercel.app` miễn phí | Domain riêng (~$10/năm) là chi phí **duy nhất** nếu bạn muốn, không bắt buộc |

> ✅ Với bộ này, **không có server nào "ngủ"** (khác với backend Node.js tự viết trên Render/Fly.io) — vì không có server luôn-chạy nào cả, Vercel là serverless/edge, Supabase luôn sẵn sàng (trừ khi dự án bị tạm dừng do không hoạt động — xem mục 11).

---

## 5. Thiết kế cơ sở dữ liệu

```sql
-- Người dùng (Supabase Auth tự tạo bảng auth.users, đây là bảng profile mở rộng)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username varchar(30) unique not null,
  display_name varchar(50),
  avatar_url text,
  created_at timestamptz default now()
);

-- Bạn bè (2 chiều, 1 dòng với trạng thái)
create table friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id) on delete cascade,
  addressee_id uuid references profiles(id) on delete cascade,
  status varchar(10) not null default 'pending', -- pending | accepted | blocked
  created_at timestamptz default now(),
  unique (requester_id, addressee_id)
);

-- Khoảnh khắc (ảnh gửi đi)
create table moments (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade,
  media_url text not null,
  caption varchar(200),
  created_at timestamptz default now()
);

-- Người nhận của mỗi moment (many-to-many)
create table moment_recipients (
  moment_id uuid references moments(id) on delete cascade,
  recipient_id uuid references profiles(id) on delete cascade,
  seen_at timestamptz,
  primary key (moment_id, recipient_id)
);

-- React (emoji phản hồi)
create table reactions (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid references moments(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  emoji varchar(10) not null,
  created_at timestamptz default now()
);
```

**Row Level Security (RLS) — bắt buộc bật, đây là "backend logic" thay cho server:**

```sql
alter table moments enable row level security;
alter table moment_recipients enable row level security;

-- Chỉ người nhận hợp lệ (có trong moment_recipients) mới SELECT được moment
create policy "recipients can view moments"
on moments for select
using (
  auth.uid() = sender_id
  or exists (
    select 1 from moment_recipients
    where moment_recipients.moment_id = moments.id
    and moment_recipients.recipient_id = auth.uid()
  )
);

-- Chỉ chủ sở hữu mới insert moment với sender_id = chính mình
create policy "users can insert own moments"
on moments for insert
with check (auth.uid() = sender_id);
```

---

## 6. API / Supabase Client Calls

Không có REST backend riêng — mọi thao tác gọi thẳng qua Supabase JS SDK từ frontend, được bảo vệ bởi RLS ở trên.

```
Auth
  supabase.auth.signInWithOAuth({ provider: 'google' })
  supabase.auth.signInWithOtp({ email })      // magic link
  supabase.auth.signOut()

Bạn bè
  insert vào friendships (status: 'pending')
  update friendships set status = 'accepted' where id = ...

Gửi ảnh
  supabase.storage.from('moments').upload(path, file)
  insert vào moments { sender_id, media_url, caption }
  insert nhiều dòng vào moment_recipients

Nhận / xem
  select * from moments join moment_recipients ... order by created_at desc
  update moment_recipients set seen_at = now()

Realtime subscribe (thay cho WebSocket tự viết)
  supabase
    .channel('moments-feed')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moment_recipients',
        filter: `recipient_id=eq.${myUserId}` }, handleNewMoment)
    .subscribe()
```

---

## 7. "Widget" trên Web — PWA thay thế widget màn hình chính

Vì trình duyệt **không thể** vẽ trực tiếp lên home screen như widget native, đây là giải pháp thay thế tốt nhất trong giới hạn 100% miễn phí:

1. **Web App Manifest** (`manifest.json`) khai báo icon, tên, `display: "standalone"` → khi người dùng bấm "Thêm vào màn hình chính", app mở full-screen như app thật, không thấy thanh địa chỉ trình duyệt.
2. **Trang chủ = "widget ảo"**: mở app là thấy ngay ảnh mới nhất full màn hình (giống trải nghiệm mở widget), không có bước trung gian.
3. **Badging API** (`navigator.setAppBadge()`): hiển thị số ảnh chưa xem lên icon app trên home screen — hỗ trợ trên Android Chrome và macOS Safari, **chưa hỗ trợ trên iOS** tại thời điểm viết tài liệu này.
4. **Service Worker cache**: ảnh gần nhất được cache lại, mở app lên thấy ngay lập tức kể cả mạng chậm, tạo cảm giác "luôn có sẵn" gần giống widget.

> Nói rõ để không kỳ vọng sai: đây là **trải nghiệm gần giống**, không phải widget thật nằm ngoài app trên màn hình chính. Nếu sau này bạn có ngân sách, có thể nâng cấp bằng Capacitor + native widget module mà không phải viết lại toàn bộ frontend.

---

## 8. Realtime (không bắt buộc Push Notification)

Theo đúng yêu cầu **"không cần nhận thông báo"**, thiết kế này chia rõ 2 lớp:

- **Bắt buộc, luôn free, luôn hoạt động:** Supabase Realtime qua WebSocket — khi app/tab đang mở, ảnh mới tự hiện ngay không cần bấm refresh. Đây là phần đủ dùng cho MVP.
- **Tuỳ chọn, thêm sau nếu muốn:** Web Push (chuẩn VAPID, không qua Firebase) để báo khi tab đã đóng. Vì đây không phải yêu cầu bắt buộc, bản MVP này **không triển khai phần push**, giúp giảm hẳn độ phức tạp (không cần Service Worker xử lý push event, không cần xin quyền notification gây khó chịu cho người dùng ngay từ đầu).

---

## 9. Bảo mật & Quyền riêng tư

- Toàn bộ traffic qua HTTPS/WSS (Vercel + Supabase tự cấp SSL, không cấu hình gì thêm).
- RLS bật trên **mọi bảng** — không tin tưởng logic phía client, mọi truy vấn đều bị chặn ở tầng database nếu vi phạm quyền.
- Ảnh trong Storage: dùng bucket **private**, sinh signed URL có thời hạn khi hiển thị, không để bucket public vĩnh viễn.
- Rate limiting: Supabase Edge Functions hoặc kiểm tra ở RLS (ví dụ giới hạn số moment/phút bằng policy + trigger).
- Không thu thập vị trí, không yêu cầu số điện thoại (giảm rủi ro dữ liệu nhạy cảm khi làm dự án cá nhân/free).
- Cần trang Privacy Policy đơn giản nếu công khai cho người ngoài dùng thử, kể cả bản web.

---

## 10. Cấu trúc thư mục dự án

```
locket-web/
├── app/                        # Next.js App Router
│   ├── (auth)/login/
│   ├── (main)/home/            # Trang "widget ảo"
│   ├── (main)/friends/
│   ├── (main)/camera/
│   └── layout.tsx
├── components/
├── lib/
│   ├── supabaseClient.ts
│   └── realtime.ts
├── public/
│   ├── manifest.json
│   ├── icons/
│   └── sw.js                   # Service Worker (PWA + cache)
├── supabase/
│   ├── migrations/
│   └── policies.sql
├── next.config.js
└── package.json
```

---

## 11. 🔧 Các bài toán thực tế đang/sẽ gặp phải & cách giải quyết

Đây là phần bạn yêu cầu — liệt kê các vướng mắc thường gặp nhất khi triển khai thật, kèm cách xử lý cụ thể.

### 11.1. Đăng nhập bằng Google (OAuth) bị lỗi redirect / "Error 400: redirect_uri_mismatch"

**Nguyên nhân:** URL callback khai báo trong Google Cloud Console không khớp với URL Supabase/app đang chạy (rất hay gặp khi vừa dev local vừa deploy Vercel).

**Cách giải quyết:**
1. Vào **Google Cloud Console → APIs & Services → Credentials** → tạo OAuth Client ID loại "Web application".
2. Ở **Authorized redirect URIs**, thêm **đủ cả 3 dòng** (thiếu 1 dòng là lỗi):
   - `https://<project-ref>.supabase.co/auth/v1/callback` (bắt buộc, đây là URL Supabase xử lý)
   - `http://localhost:3000` (cho môi trường dev)
   - `https://ten-du-an.vercel.app` (cho môi trường production)
3. Copy **Client ID** và **Client Secret** dán vào Supabase Dashboard → **Authentication → Providers → Google**.
4. Trong Supabase Dashboard → **Authentication → URL Configuration**, set **Site URL** đúng domain production, và thêm cả domain dev vào **Redirect URLs** — thiếu bước này là nguyên nhân phổ biến nhất khiến login xong bị đá về trang trắng hoặc lỗi.
5. Google yêu cầu app ở trạng thái "Testing" chỉ cho tối đa 100 email được thêm thủ công vào **Test users** — nếu muốn ai cũng đăng nhập được, phải submit **OAuth consent screen** để chuyển sang "In production" (miễn phí, chỉ mất thời gian Google duyệt).

### 11.2. Upload ảnh lên Supabase Storage bị lỗi 403 / "new row violates row-level security policy"

**Nguyên nhân:** Bucket có RLS nhưng chưa tạo policy cho phép `INSERT`/`SELECT` trên `storage.objects`.

**Cách giải quyết:** Tạo policy riêng cho bucket, ví dụ chỉ cho phép user upload vào đúng folder của chính mình:
```sql
create policy "users can upload own moments"
on storage.objects for insert
with check (bucket_id = 'moments' and auth.uid()::text = (storage.foldername(name))[1]);
```
Quy ước: lưu ảnh theo path `{user_id}/{moment_id}.jpg` để policy trên hoạt động đúng.

### 11.3. Camera không hoạt động trên iPhone Safari / xin quyền camera bị từ chối im lặng

**Nguyên nhân:** `getUserMedia()` **bắt buộc HTTPS** (localhost là ngoại lệ duy nhất được phép HTTP). Nếu test qua IP nội bộ (`http://192.168.x.x`) sẽ luôn thất bại trên iOS.

**Cách giải quyết:** Luôn test trên `https://` (Vercel preview deployment tự có HTTPS) hoặc dùng `localhost` khi dev máy tính. Với test trên điện thoại thật khi đang dev, dùng `ngrok` hoặc Vercel preview URL thay vì IP LAN.

### 11.4. Ảnh không tự cập nhật real-time dù đã insert vào DB (Realtime không chạy)

**Nguyên nhân:** Supabase Realtime **mặc định tắt** cho từng bảng, phải bật thủ công.

**Cách giải quyết:**
```sql
alter publication supabase_realtime add table moment_recipients;
```
Và kiểm tra RLS: Realtime cũng bị chặn bởi RLS — nếu policy `select` chặn user thấy row đó, sự kiện realtime cũng sẽ không tới tay họ dù insert thành công.

### 11.5. Dự án Supabase Free bị tạm dừng ("paused") sau vài ngày không hoạt động

**Nguyên nhân:** Gói free tạm dừng project nếu không có traffic trong 7 ngày liên tiếp — hay gặp nhất khi demo cho người khác xem sau một thời gian không đụng tới.

**Cách giải quyết:** Vào Supabase Dashboard bấm "Restore project" (không mất dữ liệu, chỉ mất khoảng 1-2 phút để khởi động lại). Nếu cần app luôn sẵn sàng cho demo thật, cân nhắc 1 cron job miễn phí (ví dụ GitHub Actions chạy free, gọi 1 request nhẹ mỗi vài ngày) để giữ project "hoạt động".

### 11.6. Ảnh hiển thị vỡ/lỗi "Access Denied" khi mở link ảnh

**Nguyên nhân:** Bucket Storage để **private** nhưng code lại dùng `getPublicUrl()` (chỉ dùng được với bucket public).

**Cách giải quyết:** Với bucket private, phải dùng:
```js
const { data } = await supabase.storage
  .from('moments')
  .createSignedUrl(path, 3600); // có hạn 1 giờ
```
Không dùng `getPublicUrl()` trừ khi bucket được set public — cân nhắc: public dễ dùng hơn nhưng ai có link cũng xem được ảnh, nên với app riêng tư nên **luôn dùng private + signed URL**.

### 11.7. CORS lỗi khi gọi Supabase từ domain Vercel

**Nguyên nhân:** Hiếm gặp vì Supabase SDK tự xử lý, nhưng nếu tự gọi REST API trực tiếp bằng `fetch()` mà quên gửi API key/anon key đúng header sẽ bị chặn.

**Cách giải quyết:** Luôn dùng Supabase JS SDK thay vì tự viết `fetch()` thủ công tới REST endpoint, trừ khi thật sự cần custom — SDK tự đính kèm đúng header `apikey` và `Authorization`.

### 11.8. PWA không hiện nút "Thêm vào màn hình chính" trên iPhone

**Nguyên nhân:** iOS Safari **không có prompt tự động** như Android Chrome (`beforeinstallprompt` không tồn tại trên iOS).

**Cách giải quyết:** Phải tự làm UI hướng dẫn thủ công: hiện banner "Bấm nút Chia sẻ → Thêm vào Màn hình chính" khi phát hiện `navigator.userAgent` là iOS Safari và chưa ở chế độ standalone (`window.navigator.standalone === false`).

### 11.9. Vượt giới hạn 1GB Storage free của Supabase khi ảnh nhiều lên

**Cách giải quyết:** Theo dõi dung lượng trong Dashboard → khi gần đầy, chuyển bucket ảnh cũ sang Cloudflare R2 (giữ Supabase chỉ cho DB), hoặc thêm bước nén ảnh mạnh hơn phía client trước khi upload (resize xuống tối đa ví dụ 1080px cạnh dài, quality 0.7 qua `canvas.toBlob()`).

### 11.10. Đăng nhập bị mất phiên (session) sau khi đóng tab / refresh

**Nguyên nhân:** Chưa cấu hình Supabase client lưu session đúng cách (mặc định SDK có lưu localStorage, nhưng nếu tự custom client hoặc dùng chế độ SSR thì dễ set sai).

**Cách giải quyết:** Với Next.js, dùng đúng package `@supabase/ssr` (khuyến nghị hiện tại, thay cho `auth-helpers-nextjs` cũ) và cấu hình cookie-based session để cả server component lẫn client component đều đọc được session nhất quán.

---

## 12. Triển khai miễn phí (Deploy Guide)

1. Tạo project Supabase free tại supabase.com → lấy `SUPABASE_URL` và `SUPABASE_ANON_KEY`.
2. Chạy migrations trong mục 5 qua Supabase SQL Editor.
3. Bật Google OAuth theo mục 11.1.
4. Push code Next.js lên GitHub.
5. Vào vercel.com → Import Repository → thêm Environment Variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) → Deploy.
6. Vercel tự cấp domain `ten-du-an.vercel.app` + HTTPS miễn phí, không cần cấu hình gì thêm.
7. Quay lại bước 11.1, thêm domain Vercel thật vào Google Console + Supabase Redirect URLs.

---

## 13. Chi phí vận hành = $0 (và mốc khi nào phải trả tiền)

| Hạng mục | Chi phí | Khi nào phải trả |
|---|---|---|
| Vercel Hosting | $0 | Chỉ trả nếu cần domain riêng hoặc traffic thương mại quy mô lớn |
| Supabase (DB+Auth+Storage+Realtime) | $0 | Vượt 500MB DB hoặc 50k MAU hoặc 1GB Storage → $25/tháng gói Pro |
| Cloudflare R2 | $0 | Vượt 10GB/tháng → ~$0.015/GB, rất rẻ |
| Domain riêng (tuỳ chọn) | $0 | ~$10/năm nếu muốn tên đẹp thay vì `.vercel.app` |
| **Tổng khởi điểm** | **$0/tháng** | |

---

## 14. Lộ trình phát triển (Roadmap)

**Giai đoạn 0 (2-3 ngày):** Tạo Supabase project, chạy schema + RLS, cấu hình Google OAuth.

**Giai đoạn 1 — MVP (1-2 tuần):** Đăng nhập, kết bạn, chụp/gửi ảnh, trang "widget ảo" real-time.

**Giai đoạn 2 (1 tuần):** PWA manifest + service worker, hướng dẫn cài đặt cho iOS, cache offline cơ bản.

**Giai đoạn 3 (tuỳ chọn, thêm sau):** Web Push, badge số, video ngắn, filter ảnh.

---

## 15. Rủi ro pháp lý & lưu ý bản quyền

- Đây là sản phẩm **lấy cảm hứng** từ mô hình Locket, không sao chép mã nguồn hay tài sản thương hiệu (tên, logo, giao diện độc quyền) — cần tự thiết kế UI/tên gọi riêng.
- Nếu công khai cho người dùng thật, cần trang Privacy Policy + Terms of Service tối thiểu, kể cả bản miễn phí không lên store.
- Nếu nhắm tới người dùng dưới 18 tuổi, cân nhắc quy định bảo vệ trẻ em tương ứng thị trường mục tiêu.

---

## ✅ Tóm tắt để chạy online thật, miễn phí, ngay tuần này

1. Supabase free → Auth (Google) + DB (RLS) + Storage + Realtime.
2. Next.js PWA deploy free trên Vercel.
3. Không cần backend riêng, không cần push bắt buộc, không cần Apple/Google Developer account.
4. Xử lý đúng 10 bài toán ở mục 11 — đây là các lỗi 90% người tự làm sẽ gặp, đã có sẵn cách fix.

---

*File này là bản kế hoạch kỹ thuật, dùng làm điểm khởi đầu để code trực tiếp. Có thể mở rộng thêm chi tiết UI/UX hoặc OpenAPI spec riêng khi cần.*
