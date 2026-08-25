"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { Profile } from '@/lib/types';
import { pushProfileToGlobalCloud } from '@/lib/cloudSync';

interface AuthContextValue {
  userProfile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => void;
  loginWithProfile: (profile: Profile) => void;
}

const AuthContext = createContext<AuthContextValue>({
  userProfile: null,
  loading: true,
  signOut: async () => {},
  updateProfile: () => {},
  loginWithProfile: () => {},
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

async function fetchMergedProfile(user: any): Promise<Profile> {
  const baseProfile = buildProfileFromSupabaseUser(user);
  const cached = readCachedProfile();

  let dbProfile: any = null;
  if (isSupabaseConfigured()) {
    try {
      if (user?.id) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) dbProfile = data;
      }
      if (!dbProfile && baseProfile.email) {
        const { data } = await supabase.from('profiles').select('*').eq('email', baseProfile.email).maybeSingle();
        if (data) dbProfile = data;
      }
    } catch (e) {}
  }

  const finalUsername = dbProfile?.username || (cached && cached.id === user.id && cached.username ? cached.username : baseProfile.username);
  const finalDisplayName = dbProfile?.display_name || (cached && cached.id === user.id && cached.display_name ? cached.display_name : baseProfile.display_name);

  let finalAvatarUrl = baseProfile.avatar_url;
  if (dbProfile?.avatar_url && dbProfile.avatar_url.trim() !== '') {
    finalAvatarUrl = dbProfile.avatar_url;
  } else if (cached && cached.id === user.id && cached.avatar_url && cached.avatar_url.trim() !== '') {
    finalAvatarUrl = cached.avatar_url;
  }

  const merged: Profile = {
    ...baseProfile,
    username: finalUsername,
    display_name: finalDisplayName,
    avatar_url: finalAvatarUrl,
  };

  saveCachedProfile(merged);
  return merged;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // Hydration-safe initial profile read
      const cached = readCachedProfile();
      if (cached && mounted) {
        setUserProfile(cached);
      }

      if (!isSupabaseConfigured()) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!mounted) return;

        if (user) {
          const profile = await fetchMergedProfile(user);
          if (mounted) {
            setUserProfile(profile);
          }
          await pushProfileToGlobalCloud({
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url || '',
          }).catch(() => {});
        } else {
          // No active session — check cached profile
          const cached = readCachedProfile();
          if (!cached) {
            setUserProfile(null);
          }
        }
      } catch (e) {
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
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;

        if (session?.user) {
          const profile = await fetchMergedProfile(session.user);
          if (mounted) {
            setUserProfile(profile);
          }
          pushProfileToGlobalCloud({
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url || '',
          }).catch(() => {});
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

      (async () => {
        if (isSupabaseConfigured() && prev.id) {
          try {
            await supabase.from('profiles').upsert({
              id: prev.id,
              username: updated.username || prev.username,
              display_name: updated.display_name || prev.display_name,
              avatar_url: updated.avatar_url || prev.avatar_url || '',
            });
          } catch (e) {}

          try {
            await supabase.auth.updateUser({
              data: {
                username: updated.username,
                full_name: updated.display_name,
                avatar_url: updated.avatar_url,
              },
            });
          } catch (e) {}
        }

        pushProfileToGlobalCloud({
          id: prev.id,
          username: updated.username || prev.username,
          display_name: updated.display_name || prev.display_name,
          avatar_url: updated.avatar_url || prev.avatar_url || '',
        }).catch(() => {});
      })();

      return updated;
    });
  }, []);

  const loginWithProfile = useCallback((profile: Profile) => {
    setUserProfile(profile);
    saveCachedProfile(profile);
    pushProfileToGlobalCloud({
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url || '',
    }).catch(() => {});
    if (isSupabaseConfigured() && profile.id) {
      (async () => {
        try {
          await supabase.from('profiles').upsert({
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url || '',
          });
        } catch (e) {}
      })();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ userProfile, loading, signOut, updateProfile, loginWithProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
