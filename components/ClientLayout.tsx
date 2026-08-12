"use client";

import React from 'react';
import { AuthProvider } from '@/lib/providers/AuthProvider';
import { MomentsProvider } from '@/lib/providers/MomentsProvider';
import { ThemeProvider } from '@/lib/providers/ThemeProvider';
import { DesktopPhoneFrame } from '@/components/DesktopPhoneFrame';

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MomentsProvider>
          <DesktopPhoneFrame>{children}</DesktopPhoneFrame>
        </MomentsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

