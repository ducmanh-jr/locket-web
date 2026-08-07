"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { Profile } from '@/lib/types';

interface AuthContextValue {
  userProfile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextValue>({
  userProfile: null,
  loading: true,
  signOut: async () => {},
  updateProfile: () => {},
});

const STORAGE_KEY = 'locket_google_user_v1';

function readCachedProfile(): Profile | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.id && parsed.id.length > 5) return parsed;
    }
  } catch (e) {}
  return null;
}

function saveCachedProfile(profile: Profile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {}
}

function clearCachedProfile(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('locket_device_profile');
  } catch (e) {}
}

function buildProfileFromSupabaseUser(user: any): Profile {
  const email = user.email || user.user_metadata?.email || '';
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    email.split('@')[0] ||
    'Locket User';
  const username =
    user.user_metadata?.username ||
    email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
    `user_${user.id.substring(0, 6)}`;
  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

  const ADMIN_EMAIL = 'nguyenducmanh.ovaltine@gmail.com';
  const isAdmin = email.toLowerCase().trim() === ADMIN_EMAIL;

  return {
    id: user.id,
    username,
    display_name: name,
    avatar_url: avatarUrl,
    email,
    isAdmin,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with cached profile for instant render, but loading=true until verified
  const [userProfile, setUserProfile] = useState<Profile | null>(() => readCachedProfile());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured()) {
        // No Supabase → rely on cached profile only
        const cached = readCachedProfile();
        if (mounted) {
          setUserProfile(cached);
          setLoading(false);
        }
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!mounted) return;

        if (user) {
          const profile = buildProfileFromSupabaseUser(user);
          saveCachedProfile(profile);
          setUserProfile(profile);
        } else {
          // No active session — check cached profile
          const cached = readCachedProfile();
          if (!cached) {
            setUserProfile(null);
          }
          // If cached exists, keep it (may be stale but better UX)
        }
      } catch (e) {
        // Network error — fall back to cache
        if (mounted) {
          const cached = readCachedProfile();
          setUserProfile(cached);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listen for auth state changes (login, logout, token refresh)
    let subscription: { unsubscribe: () => void } | null = null;

    if (isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;

        if (session?.user) {
          const profile = buildProfileFromSupabaseUser(session.user);
          saveCachedProfile(profile);
          setUserProfile(profile);
        } else if (_event === 'SIGNED_OUT') {
          clearCachedProfile();
          setUserProfile(null);
        }
        setLoading(false);
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    clearCachedProfile();
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    setUserProfile(null);
  }, []);

  const updateProfile = useCallback((updates: Partial<Profile>) => {
    setUserProfile((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      saveCachedProfile(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ userProfile, loading, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
