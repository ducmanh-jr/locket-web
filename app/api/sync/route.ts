import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// Global Server-Side In-Memory Shared Room Store (Syncs all devices even without Supabase env vars)
let globalSharedMoments: any[] = [];
let globalSharedProfiles: any[] = [];
// Blocklist: IDs of members permanently deleted by Admin — prevents auto-sync re-push resurrection
const deletedMemberIds: Set<string> = new Set();

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
        const { data: profs } = await supabase.from('profiles').select('*').limit(200);
        if (profs && profs.length > 0) {
          profs.forEach((p: any) => {
            if (p?.display_name === '__DELETED_MEMBER__' && p.avatar_url) {
              deletedMemberIds.add(p.avatar_url);
            } else if (p?.id?.startsWith('del_marker_')) {
              deletedMemberIds.add(p.id.replace('del_marker_', ''));
            } else if (p?.display_name === '__DELETED__') {
              deletedMemberIds.add(p.id);
            }
          });
          dbProfiles = profs.filter(
            (p: any) =>
              p &&
              p.id &&
              !p.id.startsWith('del_marker_') &&
              p.display_name !== '__DELETED_MEMBER__' &&
              p.display_name !== '__DELETED__' &&
              !deletedMemberIds.has(p.id)
          );
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
      } catch (err) {}
    }

    // Merge DB profiles with In-Memory profiles (excluding deleted member IDs)
    const allProfiles = [...dbProfiles, ...globalSharedProfiles].filter(
      (p, i, self) =>
        p &&
        p.id &&
        !deletedMemberIds.has(p.id) &&
        !p.id.startsWith('del_marker_') &&
        p.display_name !== '__DELETED_MEMBER__' &&
        p.display_name !== '__DELETED__' &&
        i === self.findIndex((x) => x && x.id === p.id)
    );
    const profilesMap = new Map(allProfiles.map((p) => [p.id, p]));

    // Merge DB moments with In-Memory moments so 100% of devices get identical data
    const allRawMoments = [...dbMoments, ...globalSharedMoments]
      .filter(
        (m: any) =>
          m &&
          m.sender_id &&
          !deletedMemberIds.has(m.sender_id) &&
          !deletedMemberIds.has(m.sender?.id)
      )
      .map((m: any) => {
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
      { profiles: allProfiles, moments: sanitized, deleted_member_ids: Array.from(deletedMemberIds) },
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

      // Block re-push of moments from deleted members
      if (senderId && deletedMemberIds.has(senderId)) {
        return NextResponse.json(
          { error: 'Thành viên đã bị xóa khỏi căn phòng' },
          { status: 403 }
        );
      }

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
          // Delete file from Storage bucket if exists
          const { data: targetM } = await supabase
            .from('moments')
            .select('media_url')
            .eq('id', moment_id)
            .single();

          if (targetM?.media_url) {
            const parts = targetM.media_url.split('/moments/');
            if (parts[1]) {
              await supabase.storage.from('moments').remove([parts[1]]);
            }
          }

          await supabase.from('moments').delete().eq('id', moment_id);
        } catch (e) {}
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_member' && (body.member_id || body.profile_id)) {
      const targetId = body.member_id || body.profile_id;

      // 0. Add to permanent blocklist to prevent auto-sync re-push resurrection
      deletedMemberIds.add(targetId);

      // 1. Purge from in-memory server arrays
      globalSharedProfiles = globalSharedProfiles.filter((p) => p && p.id !== targetId);
      globalSharedMoments = globalSharedMoments.filter(
        (m) => m && m.sender_id !== targetId && m.sender?.id !== targetId
      );

      // 2. Purge from Supabase DB tables & Storage + write persistent DB deletion markers
      if (isSupabaseConfigured()) {
        try {
          // Store permanent DB deletion marker row in Supabase profiles table
          await supabase.from('profiles').upsert({
            id: `del_marker_${targetId}`,
            username: `__del_${targetId.substring(0, 8)}`,
            display_name: '__DELETED_MEMBER__',
            avatar_url: targetId,
          });

          // Soft delete target profile
          await supabase.from('profiles').upsert({
            id: targetId,
            display_name: '__DELETED__',
          });

          await supabase.from('reactions').delete().eq('user_id', targetId);

          const { data: userMoments } = await supabase
            .from('moments')
            .select('id, media_url')
            .eq('sender_id', targetId);

          if (userMoments && userMoments.length > 0) {
            const storagePaths: string[] = [];
            userMoments.forEach((um: any) => {
              if (um.media_url?.includes('/moments/')) {
                const parts = um.media_url.split('/moments/');
                if (parts[1]) storagePaths.push(parts[1]);
              }
            });
            if (storagePaths.length > 0) {
              await supabase.storage.from('moments').remove(storagePaths);
            }
          }

          await supabase.from('moments').delete().eq('sender_id', targetId);
          await supabase.from('profiles').delete().eq('id', targetId);
        } catch (e) {
          console.error('[API Sync] Delete member error:', e);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server Error' }, { status: 500 });
  }
}
