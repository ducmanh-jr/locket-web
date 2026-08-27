import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// Global Server-Side In-Memory Shared Room Store (Syncs all devices even without Supabase env vars)
let globalSharedMoments: any[] = [];
let globalSharedProfiles: any[] = [];
// Blocklist: IDs of members permanently deleted by Admin — prevents auto-sync re-push resurrection
const deletedMemberIds: Set<string> = new Set();
// Blocklist: IDs of moments permanently deleted — prevents auto-sync re-push resurrection
const deletedMomentIds: Set<string> = new Set();

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
    .filter((m) => m && m.id && !deletedMomentIds.has(m.id) && !m.id?.startsWith('del_moment_'))
    .filter((m, i, self) => i === self.findIndex((x) => x?.id === m?.id));

  unique.sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });

  return unique.slice(0, 300);
}

async function loadDeletedMembersFromDB(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const freshSet = new Set<string>();
    const { data: profs } = await supabase.from('profiles').select('id, display_name, avatar_url').limit(500);
    if (profs && profs.length > 0) {
      profs.forEach((p: any) => {
        if (p?.display_name === '__DELETED_MEMBER__' && p.avatar_url) {
          freshSet.add(p.avatar_url);
        }
        if (p?.display_name === '__DELETED__') {
          freshSet.add(p.id);
        }
        if (p?.id?.startsWith('del_marker_')) {
          freshSet.add(p.id.replace('del_marker_', ''));
        }
      });
    }
    deletedMemberIds.clear();
    freshSet.forEach((id) => deletedMemberIds.add(id));
  } catch (e) {}
}

async function loadDeletedMomentsFromDB(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const freshSet = new Set<string>();
    const { data: moments } = await supabase.from('moments').select('id, caption').limit(1000);
    if (moments && moments.length > 0) {
      moments.forEach((m: any) => {
        if (m?.caption === '__DELETED_MOMENT__') {
          freshSet.add(m.id);
        }
        if (m?.id?.startsWith('del_moment_')) {
          freshSet.add(m.id.replace('del_moment_', ''));
        }
      });
    }
    deletedMomentIds.clear();
    freshSet.forEach((id) => deletedMomentIds.add(id));
  } catch (e) {}
}

export async function GET() {
  try {
    await loadDeletedMembersFromDB();
    await loadDeletedMomentsFromDB();

    let dbMoments: any[] = [];
    let dbProfiles: any[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data: profs } = await supabase.from('profiles').select('*').limit(200);
        if (profs && profs.length > 0) {
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
      } catch (e) {}

      try {
        const { data: mms } = await supabase
          .from('moments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(300);

        if (mms && mms.length > 0) {
          dbMoments = mms.filter(
            (m: any) =>
              m &&
              m.id &&
              !m.id.startsWith('del_moment_') &&
              m.caption !== '__DELETED_MOMENT__' &&
              !deletedMomentIds.has(m.id) &&
              !deletedMemberIds.has(m.sender_id)
          );
        }
      } catch (e) {}
    }

    // Merge in-memory and DB data, excluding deleted ones
    const profilesMap = new Map();
    dbProfiles.forEach((p) => {
      if (p && p.id && !deletedMemberIds.has(p.id)) profilesMap.set(p.id, p);
    });
    globalSharedProfiles.forEach((p) => {
      if (p && p.id && !deletedMemberIds.has(p.id)) profilesMap.set(p.id, p);
    });
    const mergedProfiles = Array.from(profilesMap.values());

    const rawMoments = [...dbMoments, ...globalSharedMoments].filter(
      (m) =>
        m &&
        m.id &&
        !deletedMomentIds.has(m.id) &&
        !m.id.startsWith('del_moment_') &&
        !deletedMemberIds.has(m.sender_id) &&
        !deletedMemberIds.has(m.sender?.id)
    );

    const mergedMoments = sanitizeMoments(
      rawMoments.map((m: any) => {
        const senderObj =
          m.sender ||
          profilesMap.get(m.sender_id) || {
            id: m.sender_id,
            username: `user_${String(m.sender_id).substring(0, 6)}`,
            display_name: 'Thành viên Locket',
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.sender_id}`,
          };
        return { ...m, sender: senderObj };
      })
    );

    return NextResponse.json(
      {
        moments: mergedMoments,
        profiles: mergedProfiles,
        deleted_member_ids: Array.from(deletedMemberIds),
        deleted_moment_ids: Array.from(deletedMomentIds),
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (e: any) {
    return NextResponse.json({
      moments: sanitizeMoments(globalSharedMoments),
      profiles: globalSharedProfiles,
      deleted_member_ids: Array.from(deletedMemberIds),
      deleted_moment_ids: Array.from(deletedMomentIds),
    });
  }
}

async function verifyUserToken(request: Request) {
  if (!isSupabaseConfigured()) return { user: null, error: null };
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return { user: null, error: 'Missing Authorization header' };
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return { user: null, error: 'Empty token' };
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return { user: null, error: error?.message || 'Invalid token' };
    return { user: data.user, error: null };
  } catch (e: any) {
    return { user: null, error: e?.message || 'Auth check error' };
  }
}

export async function POST(request: Request) {
  try {
    await loadDeletedMembersFromDB();
    await loadDeletedMomentsFromDB();

    const body = await request.json();
    const { action, moment, profile, is_fresh_login, moment_id } = body;

    // Verify Auth JWT Token when Supabase is configured
    let authedUser: any = null;
    if (isSupabaseConfigured()) {
      const { user, error: authErr } = await verifyUserToken(request);
      if (authErr && action === 'delete_member') {
        return NextResponse.json({ error: 'Xác thực không hợp lệ: ' + authErr }, { status: 401 });
      }
      authedUser = user;
    }

    if (action === 'push_profile' && profile) {
      const targetId = profile.id;

      if (deletedMemberIds.has(targetId)) {
        if (is_fresh_login === true) {
          deletedMemberIds.delete(targetId);
          if (isSupabaseConfigured()) {
            try {
              await supabase.from('profiles').delete().eq('id', `del_marker_${targetId}`);
              await supabase.from('profiles').delete().eq('id', targetId);
            } catch (e) {}
          }
        } else {
          return NextResponse.json(
            { error: 'Thành viên đã bị xóa khỏi căn phòng', deleted_member_ids: Array.from(deletedMemberIds) },
            { status: 403 }
          );
        }
      }

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

      return NextResponse.json({ success: true, deleted_member_ids: Array.from(deletedMemberIds) });
    }

    if (action === 'push_moment' && moment) {
      const senderId = moment.sender_id || moment.sender?.id;

      if (deletedMomentIds.has(moment.id) || String(moment.id).startsWith('del_moment_')) {
        return NextResponse.json(
          { error: 'Khoảnh khắc đã bị xóa', deleted_moment_ids: Array.from(deletedMomentIds) },
          { status: 403 }
        );
      }

      if (senderId && deletedMemberIds.has(senderId)) {
        return NextResponse.json(
          { error: 'Thành viên đã bị xóa khỏi căn phòng', deleted_member_ids: Array.from(deletedMemberIds) },
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
          if (senderId && !deletedMemberIds.has(senderId)) {
            const senderObj = moment.sender || {};
            await supabase.from('profiles').upsert({
              id: senderId,
              username: senderObj.username || `user_${senderId.substring(0, 6)}`,
              display_name: senderObj.display_name || 'Thành viên Locket',
              avatar_url: senderObj.avatar_url || '',
            });
          }

          if (!senderId || !deletedMemberIds.has(senderId)) {
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
          }
        } catch (dbErr) {}
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'delete_moment' && moment_id) {
      deletedMomentIds.add(moment_id);
      deletedMomentIds.add(`del_moment_${moment_id}`);
      globalSharedMoments = globalSharedMoments.filter(
        (m) =>
          m &&
          m.id !== moment_id &&
          m.id !== `del_moment_${moment_id}` &&
          m.caption !== '__DELETED_MOMENT__' &&
          !m.media_url?.includes('deleted.invalid')
      );

      if (isSupabaseConfigured()) {
        try {
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

          // Delete original row from moments table
          await supabase.from('moments').delete().eq('id', moment_id);

          // Upsert persistent deletion marker so cold starts remember
          await supabase.from('moments').upsert({
            id: `del_moment_${moment_id}`,
            sender_id: 'deleted',
            caption: '__DELETED_MOMENT__',
            media_url: 'https://deleted.invalid/placeholder.png',
            created_at: new Date().toISOString(),
          });
        } catch (e) {}
      }
      return NextResponse.json({ success: true, deleted_moment_ids: Array.from(deletedMomentIds) });
    }

    if (action === 'delete_member' && (body.member_id || body.profile_id)) {
      const ADMIN_EMAIL = 'nguyenducmanh.ovaltine@gmail.com';
      if (isSupabaseConfigured()) {
        if (!authedUser || authedUser.email?.toLowerCase().trim() !== ADMIN_EMAIL) {
          return NextResponse.json(
            { error: 'Forbidden: Bạn không có quyền Admin để xóa thành viên khỏi căn phòng' },
            { status: 403 }
          );
        }
      }

      const targetId = body.member_id || body.profile_id;

      deletedMemberIds.add(targetId);
      globalSharedProfiles = globalSharedProfiles.filter((p) => p && p.id !== targetId);
      globalSharedMoments = globalSharedMoments.filter(
        (m) => m && m.sender_id !== targetId && m.sender?.id !== targetId
      );

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('profiles').upsert({
            id: `del_marker_${targetId}`,
            username: `del_${targetId.substring(0, 6)}`,
            display_name: '__DELETED_MEMBER__',
            avatar_url: targetId,
          });

          await supabase.from('moments').delete().eq('sender_id', targetId);
          await supabase.from('profiles').delete().eq('id', targetId);
        } catch (e) {}
      }

      return NextResponse.json({ success: true, deleted_member_ids: Array.from(deletedMemberIds) });
    }

    return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
