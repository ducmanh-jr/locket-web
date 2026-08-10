import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string; // 'all' for room chat or specific user_id
  content: string;
  media_url?: string;
  created_at: string;
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ messages: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friend_id');

    let query = supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(100);

    if (friendId && friendId !== 'all') {
      query = query.or(`and(sender_id.eq.${friendId}),and(recipient_id.eq.${friendId})`);
    }

    const { data, error } = await query;

    if (error) {
      // If table 'messages' doesn't exist yet, return empty list gracefully
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json(
      { messages: data || [] },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (e: any) {
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, warning: 'Supabase không khả dụng' });
  }

  try {
    const body = await request.json();
    const { sender_id, recipient_id, content, media_url, sender_name, sender_avatar } = body;

    if (!sender_id || !content) {
      return NextResponse.json({ error: 'Thiếu thông tin người gửi hoặc nội dung' }, { status: 400 });
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    // 1. Guaranteed profile upsert for sender
    if (sender_id) {
      try {
        await supabase.from('profiles').upsert({
          id: sender_id,
          username: `user_${sender_id.substring(0, 6)}`,
          display_name: sender_name || 'Thành viên Locket',
          avatar_url: sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender_id}`,
        });
      } catch (e) {}
    }

    // 2. Insert into messages table
    const { error } = await supabase.from('messages').insert({
      id: messageId,
      sender_id,
      recipient_id: recipient_id || 'all',
      content,
      media_url: media_url || null,
      created_at: createdAt,
    });

    if (error) {
      console.warn('Lưu tin nhắn vào Supabase bị lỗi (có thể chưa có bảng messages):', error.message);
    }

    return NextResponse.json({
      success: true,
      message: {
        id: messageId,
        sender_id,
        recipient_id: recipient_id || 'all',
        content,
        media_url,
        created_at: createdAt,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
