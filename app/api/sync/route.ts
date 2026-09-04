import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  getActiveFeed,
  pushProfileToStore,
  pushMomentToStore,
  deleteMomentFromStore,
  deleteMemberFromStore,
} from '@/lib/server/dataStore';

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

export async function GET() {
  try {
    const feed = await getActiveFeed(300);
    return NextResponse.json(feed, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (e: any) {
    return NextResponse.json({
      moments: [],
      profiles: [],
      deleted_member_ids: [],
      deleted_moment_ids: [],
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, moment, profile, is_fresh_login, moment_id } = body;

    let authedUser: any = null;
    if (isSupabaseConfigured()) {
      const { user, error: authErr } = await verifyUserToken(request);
      if (authErr && action === 'delete_member') {
        return NextResponse.json({ error: 'Xác thực không hợp lệ: ' + authErr }, { status: 401 });
      }
      authedUser = user;
    }

    if (action === 'push_profile' && profile) {
      const ok = await pushProfileToStore(profile, is_fresh_login === true);
      if (!ok) {
        return NextResponse.json(
          { error: 'Thành viên đã bị xóa khỏi căn phòng' },
          { status: 403 }
        );
      }
      const feed = await getActiveFeed(300);
      return NextResponse.json({ success: true, deleted_member_ids: feed.deleted_member_ids });
    }

    if (action === 'push_moment' && moment) {
      const ok = await pushMomentToStore(moment);
      if (!ok) {
        return NextResponse.json(
          { error: 'Khoảnh khắc hoặc thành viên đã bị xóa' },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_moment' && moment_id) {
      await deleteMomentFromStore(moment_id);
      const feed = await getActiveFeed(300);
      return NextResponse.json({ success: true, deleted_moment_ids: feed.deleted_moment_ids });
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
      await deleteMemberFromStore(targetId);
      const feed = await getActiveFeed(300);
      return NextResponse.json({ success: true, deleted_member_ids: feed.deleted_member_ids });
    }

    return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
