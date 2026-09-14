# 💛 LocketWeb — Khoảnh khắc Bạn bè

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Realtime_&_Storage-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-11.3-f08?style=for-the-badge&logo=framer&logoColor=white)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-10091D?style=for-the-badge&logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

<p align="center">
  <b>Trải nghiệm mạng xã hội ảnh Widget chuẩn 1:1 như ứng dụng Locket thật trên trình duyệt web, iPhone, Android và Desktop.</b>
</p>

[Tính năng nổi bật](#-tính-năng-nổi-bật) • [Công nghệ sử dụng](#-công-nghệ-sử-dụng) • [Cấu trúc thư mục](#-cấu-trúc-thư-mục-dự-án) • [Cài đặt nhanh](#-hướng-dẫn-cài-đặt--chạy-local) • [Cơ sở dữ liệu](#-cấu-hình-supabase-database) • [Triển khai](#-triển-khai-online-miễn-phí-0tháng)

---

</div>

## 📖 Giới thiệu Dự án

**LocketWeb** (`ducmanh-jr/locket-web`) là một ứng dụng Progressive Web App (PWA) mô phỏng chính xác và trọn vẹn trải nghiệm của ứng dụng chia sẻ khoảnh khắc nổi tiếng **Locket Widget**. 

Được thiết kế theo triết lý **Mobile-First**, dự án mang phong cách giao diện **Dark Rose Glassmorphism** sang trọng, chuyển động vật lý vuốt feed tỉ lệ 1:1 siêu mượt, tích hợp camera đa năng, trình phát nhạc nền lofi chill từ Apple iTunes, tương tác biểu cảm 3D sống động và hệ thống đồng bộ hóa thời gian thực (Realtime WebSocket).

---

## ✨ Tính năng Nổi bật

### 📸 1. Camera & Sáng tạo Khoảnh khắc
- **Chụp ảnh & Quay video 5s**: Chạm nút chụp tròn để chụp ảnh tức thời; nhấn giữ để quay video ngắn tối đa 5 giây với thanh tiến trình đếm ngược sinh động.
- **Lật Camera linh hoạt**: Nhấn nút chuyển hoặc **chạm đúp (double-tap)** vào màn hình để đảo nhanh giữa camera trước và sau.
- **Tải lên & Cắt gọt Video (Trimmer)**: Tải ảnh hoặc video từ thư viện máy ảnh của thiết bị; công cụ `LocketVideoTrimmerModal` cho phép cắt đoạn video 5 giây ưng ý nhất trước khi đăng.
- **Bật/Tắt Flashlight**: Hỗ trợ đèn flash trợ sáng đối với các thiết bị di động có hỗ trợ MediaTrack Constraints.

### 🎵 2. Âm nhạc & Lofi Chill (Apple iTunes Search)
- **Tích hợp kho nhạc iTunes**: Tìm kiếm hàng triệu bài hát trực tiếp từ Apple Music Store API.
- **Bảng xếp hạng Trending V-Pop**: Tự động gợi ý các giai điệu V-Pop Lofi Chill, Acoustic nhẹ nhàng thích hợp làm nhạc nền cho khoảnh khắc.
- **Đồng bộ Âm thanh**: Tự động phát đoạn preview chất lượng cao khi người xem cuộn tới thẻ khoảnh khắc, đi kèm hiệu ứng sóng nhạc (Visualizer Waveform) đang phát.

### 🏷️ 3. Caption Thông minh & Widget Độc quyền
- **Live Battery Widget**: Tự động đọc phần trăm pin thực tế từ thiết bị người gửi qua Battery Status API.
- **Live Clock & Date**: Thẻ đồng hồ kỹ thuật số và thời gian chụp thực tế.
- **Weather & Mood Icons**: Sticker thời tiết và tâm trạng phong cách nguyên bản của Locket.
- **Kiểu chữ đa dạng**: Font chữ bo tròn, font máy đánh chữ cổ điển, viền mờ tương phản cao chống chói.

### 👆 4. Thao tác Vuốt Feed Chuẩn 1:1 (True Touch Physics)
- **Khóa chuyển động ngón tay**: Phản hồi tức thì với độ trễ 0ms (`duration: 0` khi kéo), thẻ ảnh dịch chuyển theo từng pixel ngón tay di chuyển.
- **Khoảng cách thẻ chuẩn**: Thẻ trên và thẻ dưới cách nhau đúng `100vh` (tâm màn hình 1 tới tâm màn hình 2).
- **Hệ thống lò xo vật lý (Spring Dynamics)**: Thiết lập tối ưu `stiffness: 190`, `damping: 26`, `mass: 0.9` đem lại cảm giác chuyển ảnh đằm tay, êm ái và không rung giật.
- **Tự động cân bằng vị trí**: Tọa độ `dragYOffset` luôn được reset về `0` ngay khi nhấc ngón tay, loại bỏ hoàn toàn lỗi lệch khung hình.

### 💖 5. Tương tác Thả Tim & Phản ứng Emoji 3D
- **Tap đúp để thả tim**: Chạm hai lần liên tiếp vào ảnh để bắn hiệu ứng tim bay ngập tràn màn hình.
- **Thanh Reaction Emoji phong phú**: Gửi cảm xúc biểu tượng `❤️`, `🔥`, `🥰`, `😂`, `🥺`, `✨`, `🎉` với hiệu ứng nổ pháo hoa hạt `canvas-confetti` và âm thanh vui tai.

### 💬 6. Nhắn tin Trực tiếp (Direct Chat Sheet)
- **Khung chat dạng Bottom Sheet**: Kéo mở mượt mà ngay trên khoảnh khắc đang xem mà không làm gián đoạn trải nghiệm feed.
- **Trạng thái tin nhắn đa cấp**: Hiển thị rõ ràng các mốc `Đã gửi` ➔ `Đã nhận` ➔ `Đã đọc`.
- **Quản trị tin nhắn cá nhân**: Cho phép sửa nội dung hoặc thu hồi tin nhắn trực tiếp với cơ chế xác thực quyền sở hữu.
- **Thông báo badge tin chưa đọc**: Cập nhật tức thời số tin nhắn mới trên thanh công cụ dưới.

### 🗓️ 7. Lưới Lịch sử (History Grid) & Lọc Bạn bè
- **Bộ lọc bạn bè**: Lọc khoảnh khắc theo từng người gửi cụ thể hoặc xem chế độ "Tất cả bạn bè".
- **Lưới xem toàn cảnh (Grid View)**: Chuyển đổi linh hoạt giữa chế độ lướt từng ảnh và chế độ lưới album ảnh lưu giữ kỷ niệm theo dòng thời gian.

### 💻 8. Desktop Phone Frame Simulator
- Khi truy cập trên máy tính cá nhân, màn hình lớn hoặc laptop, hệ thống tự động bọc giao diện vào **Khung mô phỏng iPhone 15/16** sang trọng với Dynamic Island, thanh viền thép bo tròn và hiệu ứng ánh sáng kính mờ nền tối.

### 📲 9. Ứng dụng PWA (Progressive Web App)
- Cho phép người dùng **"Thêm vào màn hình chính" (Add to Home Screen)** trên cả iOS Safari và Android Chrome.
- Hoạt động toàn màn hình (Standalone Mode), không hiển thị thanh URL của trình duyệt, khởi động tức thì.

### 🔄 10. Chế độ Khách & Ngoại tuyến (Offline First)
- **Public Guest View**: Cho phép khách truy cập tự do ngắm nhìn khoảnh khắc chung mà không bị ép đăng nhập bắt buộc.
- **Outbox Queue & IndexedDB**: Khi mất kết nối mạng, các khoảnh khắc và tương tác được lưu trữ an toàn trong IndexedDB của trình duyệt và tự động đồng bộ lên máy chủ khi có internet trở lại.

---

## 🎨 Quy chuẩn Thiết kế (Design System & UI/UX)

```
┌────────────────────────────────────────────────────────┐
│                   Dark Rose Palette                    │
├─────────────────┬──────────────────┬───────────────────┤
│  Rose Accent    │   Deep Violet    │   Obsidian Dark   │
│    #D9266E      │     #BE185D      │      #10091D      │
└─────────────────┴──────────────────┴───────────────────┘
```

1. **Phong cách Thủy tinh mờ (Frosted Glassmorphism)**:
   - Các bảng điều khiển sử dụng lớp kính: `bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg`.
2. **Hệ thống phân tầng Z-Index (Layer Hierarchy)**:
   - **Lớp điều hướng tĩnh (`z-40`)**: `LocketHeader` (thanh trên) và `LocketDock` (thanh dưới) luôn cố định ở lớp trên cùng để ảnh trượt mượt mà bên dưới.
   - **Lớp phủ Modal & Menu Tùy chọn (`z-[999]`)**: Menu tùy chọn khoảnh khắc sử dụng React Portal `createPortal(..., document.body)` đè lên toàn bộ giao diện, tránh bị che khuất bởi các nút điều hướng.

---

## 💻 Công nghệ Sử dụng

| Tầng công nghệ | Công nghệ / Thư viện | Mục đích |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Khung ứng dụng React Server Components & API Route Handlers |
| **Giao diện** | React 18, Tailwind CSS | Xây dựng component và tạo kiểu giao diện hiện đại |
| **Hoạt ảnh & Vật lý** | Framer Motion 11 | Điều khiển chuyển động vuốt chạm, spring animation và layout transition |
| **Hiệu ứng & Icon** | Canvas-Confetti, Lucide React | Hiệu ứng pháo hoa hạt và bộ icon tinh giản |
| **Cơ sở dữ liệu** | Supabase (PostgreSQL) | Lưu trữ profiles, moments, reactions, messages kèm bảo mật RLS |
| **Lưu trữ đa phương tiện** | Supabase Storage Bucket | Lưu trữ và phân phối hình ảnh/video tốc độ cao |
| **Thời gian thực** | Supabase Realtime | Đồng bộ dữ liệu khoảnh khắc, tim và tin nhắn qua WebSocket |
| **Lưu trữ ngoại tuyến** | IndexedDB, Web Cache API | Lưu trữ cục bộ đảm bảo ứng dụng chạy offline và phản hồi tức thì |
| **Container hóa** | Docker (Alpine Multi-stage) | Đóng gói môi trường chạy độc lập siêu nhẹ (~120MB) |

---

## 📂 Cấu trúc Thư mục Dự án

```
locket-web/
├── 📁 app/                          # Next.js App Router
│   ├── 📁 api/                      # Backend API Route Handlers
│   │   ├── 📁 chat/route.ts         # API tin nhắn trực tiếp (GET, POST, Sửa, Xóa)
│   │   ├── 📁 debug/                # API chẩn đoán, backup và cứu hộ dữ liệu
│   │   ├── 📁 music/route.ts        # API tìm kiếm nhạc & BXH V-Pop iTunes
│   │   ├── 📁 sync/route.ts         # API đồng bộ trạng thái đám mây
│   │   └── 📁 upload/route.ts       # API xử lý upload file ảnh/video
│   ├── 📁 debug/page.tsx            # Bảng điều khiển Debug trạng thái ứng dụng
│   ├── 📁 friends/page.tsx          # Trang danh sách bạn bè và kết nối
│   ├── 📁 history/page.tsx          # Trang lưới lịch sử khoảnh khắc
│   ├── 📁 login/page.tsx            # Trang đăng nhập Google OAuth / Demo
│   ├── 📁 profile/page.tsx          # Trang cá nhân, chỉnh sửa avatar và tên
│   ├── globals.css                  # Thiết lập CSS, font và hiệu ứng Dark Rose
│   ├── layout.tsx                   # Root Layout bọc Providers và Phone Frame
│   └── page.tsx                     # Trang chủ chính: Feed vuốt, Camera, Dock
│
├── 📁 components/                   # UI Components dùng chung
│   ├── CameraView.tsx               # Màn hình chụp ảnh, quay 5s, flash, lật cam
│   ├── DesktopPhoneFrame.tsx        # Khung mô phỏng iPhone trên màn hình máy tính
│   ├── LocketCaptionWidgetSelector  # Bảng chọn widget pin, đồng hồ, thời tiết
│   ├── LocketChatSheet.tsx          # Bottom Sheet nhắn tin tương tác thời gian thực
│   ├── LocketDock.tsx               # Thanh điều khiển dưới (Grid, Chụp, Chat)
│   ├── LocketErrorBoundary.tsx      # Xử lý bắt lỗi ngoại lệ giao diện
│   ├── LocketFeedCard.tsx           # Thẻ hiển thị ảnh chính với thao tác vuốt 1:1
│   ├── LocketHeader.tsx             # Thanh tiêu đề trên (Bộ lọc bạn bè, Avatar)
│   ├── LocketHistoryGrid.tsx        # Chế độ xem lưới album khoảnh khắc
│   ├── LocketThemePickerModal.tsx   # Modal tùy chỉnh chủ đề màu sắc
│   ├── LocketVideoTrimmerModal.tsx  # Modal cắt độ dài video 5 giây
│   ├── MusicPickerModal.tsx         # Modal chọn nhạc nền iTunes
│   └── PWAInstallBanner.tsx         # Banner nhắc nhở cài đặt PWA
│
├── 📁 lib/                          # Thư viện tiện ích, Hooks và State
│   ├── 📁 providers/                # Context Providers
│   │   ├── AuthProvider.tsx         # Quản lý phiên đăng nhập người dùng
│   │   └── MomentsProvider.tsx      # Quản lý khoảnh khắc, lọc và đồng bộ
│   ├── 📁 storage/                  # Lưu trữ dữ liệu
│   │   └── indexedDb.ts             # Bộ đệm IndexedDB ngoại tuyến
│   ├── 📁 services/                 # Dịch vụ ngầm
│   │   └── outboxQueue.ts           # Hàng đợi đẩy dữ liệu ngoại tuyến
│   ├── audioPlayer.ts               # Điều khiển phát/dừng nhạc toàn cục
│   ├── camera.ts                    # Tiện ích truy xuất MediaDevices & WebCam
│   ├── cloudSync.ts                 # Các hàm đồng bộ với Supabase Cloud
│   ├── demoStore.ts                 # Dữ liệu giả lập cho chế độ Demo
│   ├── media.ts                     # Xử lý nén ảnh, video thumbnail, lọc dữ liệu
│   ├── supabaseClient.ts            # Khởi tạo Supabase Client
│   └── types.ts                     # Khai báo TypeScript Interfaces & Types
│
├── 📁 public/                       # Static Assets & Icons PWA
│   ├── icon.svg                     # Icon vector biểu tượng ứng dụng
│   └── manifest.json                # PWA Manifest cấu hình Standalone App
│
├── 📁 supabase/                     # Script Cơ sở dữ liệu
│   ├── migration_shared_room.sql    # Migration SQL hoàn chỉnh cho Shared Room
│   └── schema.sql                   # Schema bảng và cấu hình RLS cơ sở
│
├── Dockerfile                       # Multi-stage Docker Build độc lập
├── PROJECT_MEMORY.md                # Ghi nhớ ngữ cảnh và quy chuẩn dự án cho AI
├── package.json                     # Danh mục dependencies và scripts
└── tailwind.config.ts               # Cấu hình màu sắc, animation Tailwind CSS
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy Local

### 1. Yêu cầu Tiên quyết
- **Node.js**: Phiên bản `>= 18.17.0` (Khuyến nghị Node.js 20 LTS).
- **Trình quản lý gói**: `npm`, `yarn` hoặc `pnpm`.

### 2. Tải mã nguồn & Cài đặt Thư viện
```bash
# Clone repository
git clone https://github.com/ducmanh-jr/locket-web.git

# Di chuyển vào thư mục dự án
cd locket-web

# Cài đặt toàn bộ dependencies
npm install
```

### 3. Cấu hình Biến môi trường
Tạo file `.env.local` tại thư mục gốc của dự án với nội dung:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# (Tùy chọn) Khóa dịch vụ quản trị Supabase nếu chạy backend tác vụ cao
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

*(Nếu chưa thiết lập tài khoản Supabase, ứng dụng vẫn tự động hoạt động mượt mà ở chế độ Demo & Local Cache với dữ liệu mẫu).*

### 4. Khởi chạy Ứng dụng
```bash
# Khởi động server phát triển
npm run dev
```

Mở trình duyệt và truy cập: **`http://localhost:3000`**

---

## 🗄️ Cấu hình Supabase Database

Để kích hoạt tính năng đồng bộ trực tuyến giữa nhiều người dùng trên các thiết bị khác nhau:

1. Đăng ký tài khoản miễn phí tại [https://supabase.com](https://supabase.com) và tạo một **New Project** (Khu vực khuyến nghị: `Singapore (ap-southeast-1)`).
2. Vào mục **SQL Editor** trong bảng điều khiển của Supabase.
3. Mở file [`supabase/migration_shared_room.sql`](supabase/migration_shared_room.sql), sao chép toàn bộ nội dung và dán vào SQL Editor rồi bấm **Run**.
   - Script này tự động thiết lập:
     - Bảng `profiles`: Hồ sơ người dùng Google / Demo.
     - Bảng `moments`: Khoảnh khắc ảnh và video đính kèm nhạc.
     - Bảng `reactions`: Lượt thả biểu tượng cảm xúc.
     - Bảng `friendships`: Danh sách liên kết bạn bè.
     - Storage Bucket `moments`: Chế độ Public dùng để lưu trữ file đa phương tiện.
     - Phân quyền **Row Level Security (RLS)** theo mô hình Shared Room (mọi người cùng chia sẻ và xem được khoảnh khắc của nhau).
     - Kích hoạt **Realtime Publication** cho các bảng để WebSocket tự đẩy dữ liệu mới tức thời.
4. Truy cập **Project Settings ➔ API** để lấy `Project URL` và `anon key`, sau đó điền vào file `.env.local`.

---

## 🐳 Chạy bằng Docker

Dự án đã có sẵn cấu hình **Dockerfile Multi-stage** tối ưu hóa dung lượng:

```bash
# Xây dựng Docker image
docker build -t locket-web .

# Chạy container trên cổng 3000
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  locket-web
```

---

## 🌐 Triển khai Online Miễn phí ($0/tháng)

Ứng dụng có thể triển khai online 100% miễn phí vĩnh viễn với kiến trúc:

| Dịch vụ | Nhiệm vụ | Chi phí |
|---|---|---|
| **Vercel** (Hobby Plan) | Hosting ứng dụng Next.js, tự động cấp chứng chỉ SSL HTTPS, CDN toàn cầu | **$0** |
| **Supabase** (Free Tier) | Database PostgreSQL, 1GB Storage ảnh/video, WebSocket Realtime | **$0** |
| **Cron-Job.org** | Gửi request định kỳ 3 ngày/lần giữ Supabase luôn thức (chống tạm ngưng do nhàn rỗi) | **$0** |

### Các bước Triển khai lên Vercel:
1. Đẩy mã nguồn lên tài khoản GitHub của bạn:
   ```bash
   git add .
   git commit -m "Deploy LocketWeb"
   git push origin main
   ```
2. Đăng nhập [Vercel](https://vercel.com) ➔ Bấm **Add New... ➔ Project** ➔ Chọn repo `locket-web`.
3. Trong phần **Environment Variables**, cấu hình 2 biến:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Bấm **Deploy**. Vercel sẽ tự động build và cung cấp đường link trực tuyến dạng `https://locket-web.vercel.app`.

---

## 📲 Hướng dẫn Cài đặt PWA lên Điện thoại

### 🍏 Trên iPhone / iPad (iOS Safari):
1. Mở đường link ứng dụng trên trình duyệt **Safari**.
2. Nhấn vào biểu tượng **Chia sẻ (Share)** hình ô vuông có mũi tên chỉ lên ở thanh công cụ dưới.
3. Cuộn danh sách và chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
4. Nhấn **Thêm**. Biểu tượng LocketWeb sẽ xuất hiện trên màn hình điện thoại, mở ra trải nghiệm tràn viền 100% không thanh duyệt web.

### 🤖 Trên Điện thoại Android (Google Chrome):
1. Mở trang web bằng trình duyệt **Chrome**.
2. Nhấn vào biểu tượng dấu 3 chấm `⋮` ở góc trên cùng bên phải.
3. Chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào màn hình chính"**.

---

## 🧭 Lộ trình Phát triển (Roadmap)

- [x] Giao diện chuẩn 1:1 theo app Locket gốc (Dark Rose Glassmorphism).
- [x] Thao tác vuốt feed 1:1 siêu mượt kết hợp Framer Motion.
- [x] Chụp ảnh, quay video ngắn 5 giây, lật camera và cắt video.
- [x] Tích hợp nhạc nền lofi chill từ Apple iTunes Search API.
- [x] Hệ thống cảm xúc 3D Emoji tương tác với Canvas Confetti.
- [x] Trò chuyện trực tiếp (Direct Message) kèm trạng thái đã đọc / thu hồi.
- [x] Khung mô phỏng iPhone cho trải nghiệm Desktop.
- [x] Hoạt động ngoại tuyến (Offline First với IndexedDB & Outbox Queue).
- [ ] Tính năng Widget màn hình chính iOS/Android thông qua Scriptable / Native Companion.
- [ ] Bộ lọc màu camera cổ điển (Vintage / Retro Film Filters).
- [ ] Thông báo đẩy Web Push Notifications khi bạn bè đăng ảnh mới.

---

## 🤝 Đóng góp Dự án

Mọi sự đóng góp cải tiến đều được hoan nghênh! Vui lòng thực hiện theo các bước:

1. **Fork** repository này về tài khoản cá nhân.
2. Tạo nhánh tính năng mới (`git checkout -b feature/tinh-nang-moi`).
3. Commit thay đổi của bạn (`git commit -m "feat: thêm tính năng mới"`).
4. Push nhánh lên GitHub (`git push origin feature/tinh-nang-moi`).
5. Mở một **Pull Request** giải thích chi tiết các thay đổi.

---

## 📄 Bản quyền (License)

Dự án được phát hành theo giấy phép mã nguồn mở **MIT License**. Bạn được toàn quyền sử dụng, sửa đổi và triển khai cho mục đích cá nhân hoặc phi thương mại.

<div align="center">

**Được phát triển với niềm đam mê bởi [ducmanh-jr](https://github.com/ducmanh-jr)** ❤️

</div>
