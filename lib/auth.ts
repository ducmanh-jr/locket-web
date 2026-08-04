import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { Profile } from './types';
import { useRouter, usePathname } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserSession() {
      if (!isSupabaseConfigured()) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Strictly requiring Google Login: No dummy fallback session allowed!
          setUserProfile(null);
        } else {
          // Authentic Google OAuth User Session
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
        setUserProfile(null);
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
          setUserProfile(null);
          router.replace('/login');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [pathname, router]);

  return { userProfile, loading };
}
