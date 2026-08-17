"use client";

import React, { useEffect } from 'react';
import { AuthProvider } from '@/lib/providers/AuthProvider';
import { MomentsProvider } from '@/lib/providers/MomentsProvider';
import { DesktopPhoneFrame } from '@/components/DesktopPhoneFrame';

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let reg of registrations) {
            reg.unregister().catch(() => {});
          }
        }).catch(() => {});
      }
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        }).catch(() => {});
      }
    }
  }, []);

  return (
    <AuthProvider>
      <MomentsProvider>
        <DesktopPhoneFrame>{children}</DesktopPhoneFrame>
      </MomentsProvider>
    </AuthProvider>
  );
};
