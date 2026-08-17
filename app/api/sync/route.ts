import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// Global Server-Side In-Memory Shared Room Store (Syncs all devices even without Supabase env vars)
let globalSharedMoments: any[] = [];
let globalSharedProfiles: any[] = [];

function isVideoMoment(moment: any): boolean {
  if (!moment) return false;
  const mediaUrl = String(moment?.media_url || '').toLowerCase();
  return (
    moment?.media_type === 'video' ||
    String(moment?.id || '').includes('video') ||
    mediaUrl.startsWith('data:video/') ||
    mediaUrl.endsWith('.mp4') ||
    mediaUrl.endsWith('.webm') ||
    mediaUrl.endsWith('.mov')
  );
}

function hasRenderableMedia(moment: any): boolean {
  const mediaUrl = String(moment?.media_url || '');
  if (!moment?.id || !mediaUrl) return false;
  if (mediaUrl.startsWith('blob:')) return false;

  return (
    mediaUrl.startsWith('https://') ||
    mediaUrl.startsWith('http://') ||
    mediaUrl.startsWith('/') ||
    mediaUrl.startsWith('data:')
  );
}

function sanitizeMoments(moments: any[]): any[] {
  const unique = moments
    .filter(hasRenderableMedia)
    .filter((m, i, self) => i === self.findIndex((x) => x?.id === m?.id));

  unique.sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });

  return unique.slice(0, 300);
}

export async function GET() {
  try {
    let dbMoments: any[] = [];
    let dbProfiles: any[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data: profs } = await supabase.from('profiles').select('*').limit(100);
        if (profs && profs.length > 0) {
          dbProfiles = profs;
        }

        const { data: joinMoments, error: joinErr } = await supabase
          .from('moments')
          .select('*, sender:profiles(*)')
          .order('created_at', { ascending: false })
          .limit(200);

        if (!joinErr && joinMoments && joinMoments.length > 0) {
          dbMoments = joinMoments;
        } else {
          const { data: rawMoments } = await supabase
            .from('moments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);
          if (rawMoments) dbMoments = rawMoments;
        }

        // Auto-Recovery Fallback: If DB table moments is empty, auto-recover photos/videos from Storage bucket
        if (!dbMoments || dbMoments.length === 0) {
          const { data: storageFiles } = await supabase.storage
            .from('moments')
            .list('', { limit: 1000 });

          if (storageFiles && storageFiles.length > 0) {
            for (const item of storageFiles) {
              if (!item.name || item.name.startsWith('.')) continue;
              const { data: publicUrlData } = supabase.storage
                .from('moments')
                .getPublicUrl(item.name);

              if (publicUrlData?.publicUrl) {
                const isVid =
                  item.name.endsWith('.mp4') ||
                  item.name.endsWith('.webm') ||
                  item.name.includes('video');

                const recoveredM = {
                  id: `storage-${item.name.replace(/[^a-zA-Z0-9]/g, '-')}`,
                  sender_id: 'user-dm',
                  sender: {
                    id: 'user-dm',
                    username: 'manh_locket',
                    display_name: 'Đức Mạnh',
                    avatar_url:
                      '/user-photos/1785829393992_567716528849713056_g276929852367586455_e887fb48d4d113fc528e29488435b6f7.jpg',
                  },
                  media_url: publicUrlData.publicUrl,
                  thumbnail_url: isVid ? publicUrlData.publicUrl : undefined,
                  media_type: isVid ? 'video' : 'photo',
                  caption: 'Khoảnh khắc Locket ✨',
                  created_at: item.created_at || new Date().toISOString(),
                };
                dbMoments.push(recoveredM);

                // Auto insert back into DB table so it's persisted permanently
                try {
                  await supabase.from('moments').upsert({
                    id: recoveredM.id,
                    sender_id: recoveredM.sender_id,
                    media_url: recoveredM.media_url,
                    media_type: recoveredM.media_type,
                    caption: recoveredM.caption,
                    created_at: recoveredM.created_at,
                  });
                } catch (e) {}
              }
            }
          }
        }
      } catch (err) {}
    }

    // Merge DB profiles with In-Memory profiles
    const allProfiles = [...dbProfiles, ...globalSharedProfiles].filter(
      (p, i, self) => p && p.id && i === self.findIndex((x) => x && x.id === p.id)
    );
    const profilesMap = new Map(allProfiles.map((p) => [p.id, p]));

    // Merge DB moments with In-Memory moments so 100% of devices get identical data
    const allRawMoments = [...dbMoments, ...globalSharedMoments].map((m: any) => {
      const senderObj =
        m.sender ||
        profilesMap.get(m.sender_id) || {
          id: m.sender_id || 'unknown',
          username: m.sender_id ? `user_${m.sender_id.substring(0, 6)}` : 'locket_user',
          display_name: 'Thành viên Locket',
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.sender_id || 'locket'}`,
        };
      return { ...m, sender: senderObj };
    });

    const sanitized = sanitizeMoments(allRawMoments);

    return NextResponse.json(
      { profiles: allProfiles, moments: sanitized },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (e: any) {
    const sanitized = sanitizeMoments(globalSharedMoments);
    return NextResponse.json(
      { profiles: globalSharedProfiles, moments: sanitized },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, profile, moment, moment_id } = body;

    if (action === 'push_profile' && profile?.id) {
      globalSharedProfiles = [profile, ...globalSharedProfiles.filter((p) => p.id !== profile.id)];

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('profiles').upsert({
            id: profile.id,
            username: profile.username || `user_${profile.id.substring(0, 6)}`,
            display_name: profile.display_name || 'Thành viên Locket',
            avatar_url: profile.avatar_url || '',
          });
        } catch (e) {}
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'push_moment' && moment?.id && moment?.media_url) {
      if (!hasRenderableMedia(moment)) {
        return NextResponse.json(
          { error: 'Đường dẫn media không hợp lệ' },
          { status: 422 }
        );
      }

      const senderId = moment.sender_id || moment.sender?.id;

      const cleanMoment = {
        ...moment,
        media_type: moment.media_type || (isVideoMoment(moment) ? 'video' : 'photo'),
      };
      globalSharedMoments = [cleanMoment, ...globalSharedMoments.filter((m) => m.id !== moment.id)];

      if (senderId && moment.sender) {
        globalSharedProfiles = [moment.sender, ...globalSharedProfiles.filter((p) => p.id !== senderId)];
      }

      if (isSupabaseConfigured()) {
        try {
          if (senderId) {
            const senderObj = moment.sender || {};
            await supabase.from('profiles').upsert({
              id: senderId,
              username: senderObj.username || `user_${senderId.substring(0, 6)}`,
              display_name: senderObj.display_name || 'Thành viên Locket',
              avatar_url: senderObj.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderId}`,
            });
          }

          await supabase.from('moments').upsert({
            id: moment.id,
            sender_id: senderId,
            media_url: moment.media_url,
            thumbnail_url: moment.thumbnail_url || null,
            media_type: moment.media_type || (isVideoMoment(moment) ? 'video' : 'photo'),
            audio_option: moment.audio_option || null,
            caption: moment.caption || '',
            music: moment.music || null,
            created_at: moment.created_at || new Date().toISOString(),
          });
        } catch (dbErr) {}
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'delete_moment' && moment_id) {
      globalSharedMoments = globalSharedMoments.filter((m) => m.id !== moment_id);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('moments').delete().eq('id', moment_id);
        } catch (e) {}
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server Error' }, { status: 500 });
  }
}
