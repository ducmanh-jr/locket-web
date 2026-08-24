# PROJECT MEMORY & AI CONTEXT
> File lưu trữ ngữ cảnh dự án LocketWeb cho AI Agent đọc tự động.

## 📌 Tổng quan Dự án (Project Overview)
- **Tên dự án**: LocketWeb (`ducmanh-jr/locket-web`)
- **Công nghệ**: Next.js 14 (App Router), React, Framer Motion, Tailwind CSS, Supabase / LocalStorage Sync.
- **Mục tiêu**: Web App trải nghiệm chuẩn 1:1 như ứng dụng Locket thật trên điện thoại iOS/Android.

---

## 🎨 Quy chuẩn Thiết kế & Giao diện (UI/UX Guidelines)
1. **Tông màu chủ đạo**:
   - Dark Mode cao cấp với dải màu Dark Rose: `#D9266E`, `#BE185D`, `#10091D`, `#160b13`.
   - Phong cách **Frosted Glassmorphism**: `bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg`.

2. **Cấu trúc Lớp hiển thị (Layer Hierarchy)**:
   - **Thanh Header trên** (`LocketHeader`) & **Thanh Đốc dưới** (`LocketDock`): `z-40`, luôn nằm cố định ở lớp trên cùng để ảnh trượt bên dưới.
   - **Bảng Menu / Modal tùy chọn** (ví dụ: `Tùy chọn Khoảnh khắc`): Sử dụng `createPortal(..., document.body)` với `z-[999]` để tự động phủ lên trên 100% màn hình, không bị các nút bấm khác đè lên.

3. **Chuyển động Vuốt Feed (`Feed Drag & Physics`)**:
   - **Tốc độ vuốt 1:1**: Phản hồi 0ms theo sát từng pixel di chuyển của ngón tay (`duration: 0` khi đang chạm kéo).
   - **Khoảng cách ảnh chuẩn**: Các bức ảnh xếp trên/dưới cách nhau đúng **1 chiều cao màn hình (`100vh`)**, đại diện cho tâm màn hình 1 và tâm màn hình 2.
   - **Độ nét tuyệt đối**: Loại bỏ hoàn toàn mờ mờ mờ ảo (`opacity: 1`, `scale: 1`, gỡ bỏ `backdrop-blur` thừa trên thẻ ảnh).
   - **Thông số Lò xo chuyển ảnh**: `stiffness: 190`, `damping: 26`, `mass: 0.9` (chuyển ảnh chậm rãi, đằm tay và êm ái).
   - **Reset Tọa độ**: `dragYOffset` luôn reset về `0` ngay khi thả tay (`handleTouchEnd`) để tránh lỗi ảnh bị đứng lệch vị trí.

4. **Trang Cá nhân & Quyền hạn (Profile & Permissions)**:
   - **Bỏ icon vương miện Admin**: Giữ nguyên toàn bộ quyền Admin (xóa ảnh bất kỳ, tải ảnh) nhưng đã gỡ icon vương miện cho đỡ xấu.
   - **Giao diện Cài đặt gọn gàng**: Đã lược bỏ các mục rườm rà như "Tiện ích Widget Màn hình" và "Bảo mật & Quyền riêng tư".

5. **Giao diện Camera & PWA Banner**:
   - **Camera**: Dùng badge kính mờ tinh tế cho câu hướng dẫn *"Chạm để chụp • Giữ quay (5s) • Nhấn đúp đổi cam"*.
   - **PWA Banner**: Icon vuông chữ **L** gradient Dark Rose nhã nhặn, viền kính mờ nhã nhặn.

---

## 🛠️ File Kiến trúc Chính (Key Files Map)
- `app/page.tsx`: Trang chủ quản lý các View (Feed / Grid), trạng thái kéo `isFeedDragging` và Modal.
- `components/LocketFeedCard.tsx`: Thẻ hiển thị khoảnh khắc chính, chứa toàn bộ logic vuốt 1:1, hiệu ứng thả tim 3D emoji và Menu Tùy chọn (Portal).
- `components/LocketHeader.tsx`: Thanh Header trên (`👥 X người bạn`, loa thông báo, avatar).
- `components/LocketDock.tsx`: Thanh Đốc dưới (nút chuyển Grid, nút Chụp tròn, bong bóng Chat).
- `components/CameraView.tsx`: Màn hình chụp ảnh/quay video 5s, tải ảnh từ thư viện, thêm nhạc.
- `app/profile/page.tsx`: Trang chỉnh sửa cá nhân, avatar, đổi tên hiển thị và đăng xuất.
