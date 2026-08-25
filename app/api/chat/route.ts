import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  media_url?: string;
  created_at: string;
}

// Global In-Memory Fallback Chat Store for instant cross-device delivery
let globalSharedMessages: ChatMessage[] = [];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const friendId = searchParams.get('friend_id');

    let dbMessages: ChatMessage[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(300);

        if (!error && Array.isArray(data)) {
          dbMessages = data;
        }
      } catch (err) {}
    }

    // Merge DB messages with in-memory fallback messages
    const merged = [...dbMessages, ...globalSharedMessages];
    const unique = merged.filter((m, i, self) => m && m.id && i === self.findIndex((x) => x?.id === m?.id));
    unique.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

    let filtered = unique;

    if (userId && friendId) {
      // 1-on-1 thread between userId and friendId
      filtered = unique.filter(
        (m) =>
          (m.sender_id === userId && m.recipient_id === friendId) ||
          (m.sender_id === friendId && m.recipient_id === userId)
      );
    } else if (userId) {
      // All messages involving userId
      filtered = unique.filter(
        (m) => m.sender_id === userId || m.recipient_id === userId
      );
    } else if (friendId) {
      // Fallback: all messages involving friendId
      filtered = unique.filter(
        (m) => m.sender_id === friendId || m.recipient_id === friendId
      );
    }

    return NextResponse.json(
      { messages: filtered },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (e: any) {
    return NextResponse.json({ messages: globalSharedMessages });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sender_id, recipient_id, content, media_url, sender_name, sender_avatar } = body;

    if (!sender_id || (!content && !media_url)) {
      return NextResponse.json({ error: 'Thiếu thông tin người gửi hoặc nội dung' }, { status: 400 });
    }

    const messageId = body.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = body.created_at || new Date().toISOString();

    const newMsg: ChatMessage = {
      id: messageId,
      sender_id,
      recipient_id: recipient_id || '',
      content: content || '',
      media_url: media_url || undefined,
      created_at: createdAt,
    };

    // Store in global in-memory store
    globalSharedMessages = [...globalSharedMessages.filter((m) => m.id !== messageId), newMsg].slice(-500);

    if (isSupabaseConfigured()) {
      try {
        if (sender_id) {
          await supabase.from('profiles').upsert({
            id: sender_id,
            username: `user_${sender_id.substring(0, 6)}`,
            display_name: sender_name || 'Thành viên Locket',
            avatar_url: sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender_id}`,
          });
        }

        await supabase.from('messages').insert({
          id: messageId,
          sender_id,
          recipient_id: recipient_id || '',
          content: content || '',
          media_url: media_url || null,
          created_at: createdAt,
        });
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      message: newMsg,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
