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
        setLoading(false);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Not logged in -> redirect to login if not already on /login
          setUserProfile(null);
          if (pathname !== '/login') {
            router.push('/login');
          }
        } else {
          // Logged in user -> fetch or create profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profile) {
            setUserProfile(profile as Profile);
          } else {
            // Create profile from Google / Auth metadata
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

            await supabase.from('profiles').upsert(newProfile);
            setUserProfile(newProfile);
          }
        }
      } catch (e) {
        console.error('Auth error:', e);
      } finally {
        setLoading(false);
      }
    }

    checkUserSession();

    // Listen for auth state changes (login/logout/OAuth callback)
    if (isSupabaseConfigured()) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          checkUserSession();
        } else if (event === 'SIGNED_OUT') {
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
