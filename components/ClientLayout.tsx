"use client";

import React from 'react';
import { AuthProvider } from '@/lib/providers/AuthProvider';
import { MomentsProvider } from '@/lib/providers/MomentsProvider';
import { DesktopPhoneFrame } from '@/components/DesktopPhoneFrame';

import { processOutboxQueue } from '@/lib/services/outboxQueue';

import { getStoredTheme, applyThemeToDocument } from '@/lib/theme';

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    applyThemeToDocument(getStoredTheme());

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
        <DesktopPhoneFrame>{children}</DesktopPhoneFrame>
      </MomentsProvider>
    </AuthProvider>
  );
};

