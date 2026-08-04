import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DesktopPhoneFrame } from '@/components/DesktopPhoneFrame';

export const metadata: Metadata = {
  title: 'LocketWeb — Chia sẻ khoảnh khắc tức thời với Bạn bè',
  description:
    'Ứng dụng Web/PWA chia sẻ ảnh tức thời giữa bạn bè chuẩn 100% như Locket. Chụp ảnh, chọn bạn bè, nhận ảnh real-time.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LocketWeb',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#0E0E10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <DesktopPhoneFrame>{children}</DesktopPhoneFrame>
      </body>
    </html>
  );
}
