"use client";

import React from 'react';
import { AuthProvider } from '@/lib/providers/AuthProvider';
import { MomentsProvider } from '@/lib/providers/MomentsProvider';
import { DesktopPhoneFrame } from '@/components/DesktopPhoneFrame';

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <MomentsProvider>
        <DesktopPhoneFrame>{children}</DesktopPhoneFrame>
      </MomentsProvider>
    </AuthProvider>
  );
};
