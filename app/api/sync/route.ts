import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

function isVideoMoment(moment: any): boolean {
  return (
    moment?.media_type === 'video' ||
    String(moment?.id || '').includes('video') ||
    String(moment?.media_url || '').startsWith('data:video/')
  );
}

function hasRenderableMedia(moment: any): boolean {
  const mediaUrl = String(moment?.media_url || '');
  if (!moment?.id || !mediaUrl) return false;
  if (mediaUrl.startsWith('blob:')) return false;

  if (isVideoMoment(moment)) {
    return (
      mediaUrl.startsWith('https://') ||
      mediaUrl.startsWith('http://') ||
      mediaUrl.startsWith('/') ||
      mediaUrl.startsWith('data:video/')
    );
  }

  return (
    mediaUrl.startsWith('https://') ||
    mediaUrl.startsWith('http://') ||
    mediaUrl.startsWith('/') ||
    mediaUrl.startsWith('data:image/')
  );
}

function isSystemMoment(moment: any): boolean {
  if (!moment) return false;
  const senderId = String(moment.sender_id || moment.sender?.id || '');
  const id = String(moment.id || '');
  return (
    senderId === 'user-dm' ||
    senderId === 'user-system32' ||
    senderId === 'user-admin' ||
    senderId.startsWith('user-') ||
    id.startsWith('m-photo-v5-')
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

  return unique.slice(0, 250);
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { profiles: [], moments: [] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const { data: profilesData } = await supabase.from('profiles').select('*').limit(100);

    let momentsData: any[] | null = null;
    const { data: joinMoments, error: joinErr } = await supabase
      .from('moments')
      .select('*, sender:profiles(*)')
      .order('created_at', { ascending: false })
      .limit(150);

    if (!joinErr && joinMoments && joinMoments.length > 0) {
      momentsData = joinMoments;
    } else {
      // Fallback: Direct select without implicit FK join
      const { data: rawMoments } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(150);
      momentsData = rawMoments;
    }

    // Fallback profile mapping in case foreign key join is missing
    const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));
    const momentsWithSender = (momentsData || []).map((m: any) => {
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

    const sanitized = sanitizeMoments(momentsWithSender);

    return NextResponse.json(
      { profiles: profilesData || [], moments: sanitized },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Lỗi kết nối cơ sở dữ liệu' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, warning: 'Supabase chưa được cấu hình' });
  }

  try {
    const body = await request.json();
    const { action, profile, moment, moment_id } = body;

    if (action === 'push_profile' && profile?.id) {
      await supabase.from('profiles').upsert({
        id: profile.id,
        username: profile.username || `user_${profile.id.substring(0, 6)}`,
        display_name: profile.display_name || 'Thành viên Locket',
        avatar_url: profile.avatar_url || '',
      });
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

      // Guaranteed Profile Upsert first so foreign key constraint is ALWAYS satisfied
      if (senderId) {
        const senderObj = moment.sender || {};
        await supabase.from('profiles').upsert({
          id: senderId,
          username: senderObj.username || `user_${senderId.substring(0, 6)}`,
          display_name: senderObj.display_name || 'Thành viên Locket',
          avatar_url: senderObj.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderId}`,
        });
      }

      const { error: insertErr } = await supabase.from('moments').upsert({
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

      if (insertErr) {
        console.error('Lỗi lưu khoảnh khắc vào Supabase DB:', insertErr.message);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'delete_moment' && moment_id) {
      await supabase.from('moments').delete().eq('id', moment_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server Error' }, { status: 500 });
  }
}
