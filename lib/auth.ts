import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { Profile } from './types';
import { useRouter, usePathname } from 'next/navigation';
import { DEMO_CURRENT_USER } from './demoStore';

function getOrCreateDeviceProfile(): Profile {
  if (typeof window === 'undefined') {
    return DEMO_CURRENT_USER;
  }
  const stored = localStorage.getItem('locket_device_profile');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.id && parsed.username) {
        return parsed;
      }
    } catch (e) {}
  }

  // Generate a unique device profile for each browser tab/device
  const randNum = Math.floor(100 + Math.random() * 900);
  const deviceProfile: Profile = {
    id: `user_dev_${Date.now()}_${randNum}`,
    username: `user_${randNum}`,
    display_name: `Tài khoản ${randNum}`,
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=user_${randNum}`,
    created_at: new Date().toISOString(),
  };

  localStorage.setItem('locket_device_profile', JSON.stringify(deviceProfile));
  return deviceProfile;
}

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserSession() {
      if (!isSupabaseConfigured()) {
        const fallbackProfile = getOrCreateDeviceProfile();
        setUserProfile(fallbackProfile);
        setLoading(false);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Check if there is a local session profile or create fallback
          const localProfile = getOrCreateDeviceProfile();
          setUserProfile(localProfile);
        } else {
          // Logged in Google/Supabase user
          const name =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'Locket User';
          const username =
            user.user_metadata?.username ||
            user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
            `user_${user.id.substring(0, 6)}`;
          const avatarUrl =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

          const newProfile: Profile = {
            id: user.id,
            username,
            display_name: name,
            avatar_url: avatarUrl,
            created_at: new Date().toISOString(),
          };

          try {
            await supabase.from('profiles').upsert(newProfile);
          } catch (e) {}

          setUserProfile(newProfile);
        }
      } catch (e) {
        console.error('Auth error:', e);
        setUserProfile(getOrCreateDeviceProfile());
      } finally {
        setLoading(false);
      }
    }

    checkUserSession();

    if (isSupabaseConfigured()) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          checkUserSession();
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('locket_device_profile');
          setUserProfile(null);
          router.push('/login');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [pathname, router]);

  return { userProfile, loading };
}
