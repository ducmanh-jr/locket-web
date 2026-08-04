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

  const deviceProfile: Profile = DEMO_CURRENT_USER;
  localStorage.setItem('locket_device_profile', JSON.stringify(deviceProfile));
  return deviceProfile;
}

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<Profile | null>(DEMO_CURRENT_USER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkUserSession() {
      if (!isSupabaseConfigured()) {
        setUserProfile(getOrCreateDeviceProfile());
        setLoading(false);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setUserProfile(getOrCreateDeviceProfile());
        } else {
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

          setUserProfile(newProfile);
        }
      } catch (e) {
        setUserProfile(getOrCreateDeviceProfile());
      } finally {
        setLoading(false);
      }
    }

    checkUserSession();
  }, [pathname]);

  return { userProfile, loading };
}
