"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/lib/providers/AuthProvider';
import { MomentsProvider } from '@/lib/providers/MomentsProvider';
import { DesktopPhoneFrame } from '@/components/DesktopPhoneFrame';

import { processOutboxQueue } from '@/lib/services/outboxQueue';

import { getStoredTheme, applyThemeToDocument } from '@/lib/theme';
import { getStoredCanvasTheme, applyCanvasThemeToDocument } from '@/lib/canvasTheme';

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isDebugPage = pathname?.startsWith('/debug');

  React.useEffect(() => {
    applyThemeToDocument(getStoredTheme());
    applyCanvasThemeToDocument(getStoredCanvasTheme());

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('[ServiceWorker] Registered successfully'))
        .catch((err) => console.warn('[ServiceWorker] Registration failed:', err));
    }

    const handleOnline = () => {
      console.log('[Network] Internet connection restored. Processing outbox queue...');
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <AuthProvider>
      <MomentsProvider>
        {isDebugPage ? children : <DesktopPhoneFrame>{children}</DesktopPhoneFrame>}
      </MomentsProvider>
    </AuthProvider>
  );
};


