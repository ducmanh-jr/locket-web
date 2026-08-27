import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  media_url?: string;
  created_at: string;
  status?: 'sent' | 'delivered' | 'read';
}

// Global In-Memory Fallback Chat Store for instant cross-device delivery
let globalSharedMessages: ChatMessage[] = [];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const friendId = searchParams.get('friend_id');
    const isThreadActive = searchParams.get('active') === 'true';

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

    // Mark messages as delivered or read when recipient queries
    if (userId) {
      globalSharedMessages.forEach((m) => {
        if (m.recipient_id === userId) {
          if (isThreadActive && friendId && m.sender_id === friendId) {
            m.status = 'read';
          } else if (m.status !== 'read') {
            m.status = 'delivered';
          }
        }
      });
    }

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

    // Assign dynamic status fallback if missing
    const enriched = filtered.map((m) => {
      let currentStatus: 'sent' | 'delivered' | 'read' = m.status || 'sent';
      if (userId && m.sender_id === userId) {
        // If sender is me, find memory status
        const mem = globalSharedMessages.find((x) => x.id === m.id);
        if (mem?.status) currentStatus = mem.status;
      }
      return { ...m, status: currentStatus };
    });

    return NextResponse.json(
      { messages: enriched },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (e: any) {
    return NextResponse.json({ messages: globalSharedMessages });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, sender_id, recipient_id, content, media_url, sender_name, sender_avatar, message_id } = body;

    let authedUserId: string | null = null;
    if (isSupabaseConfigured()) {
      try {
        const authHeader = request.headers.get('Authorization');
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '').trim();
          if (token) {
            const { data } = await supabase.auth.getUser(token);
            if (data?.user) authedUserId = data.user.id;
          }
        }
      } catch (e) {}
    }

    // Action: Mark thread as read
    if (action === 'mark_read' && sender_id && recipient_id) {
      globalSharedMessages.forEach((m) => {
        if (m.sender_id === recipient_id && m.recipient_id === sender_id) {
          m.status = 'read';
        }
      });
      return NextResponse.json({ success: true });
    }

    // Action: Edit message (Requires Auth & Ownership)
    if (action === 'edit_message' && message_id) {
      if (isSupabaseConfigured()) {
        if (!authedUserId) {
          return NextResponse.json({ error: 'Unauthorized: Bạn cần đăng nhập để chỉnh sửa tin nhắn' }, { status: 401 });
        }
        const { data: targetMsg } = await supabase.from('messages').select('sender_id').eq('id', message_id).maybeSingle();
        if (targetMsg && targetMsg.sender_id !== authedUserId) {
          return NextResponse.json({ error: 'Forbidden: Bạn chỉ có thể sửa tin nhắn do chính mình gửi' }, { status: 403 });
        }
      }

      globalSharedMessages.forEach((m) => {
        if (m.id === message_id) {
          m.content = content || '';
        }
      });
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('messages').update({ content: content || '' }).eq('id', message_id);
        } catch (e) {}
      }
      return NextResponse.json({ success: true });
    }

    // Action: Delete message (Requires Auth & Ownership)
    if (action === 'delete_message' && message_id) {
      if (isSupabaseConfigured()) {
        if (!authedUserId) {
          return NextResponse.json({ error: 'Unauthorized: Bạn cần đăng nhập để xóa tin nhắn' }, { status: 401 });
        }
        const { data: targetMsg } = await supabase.from('messages').select('sender_id').eq('id', message_id).maybeSingle();
        if (targetMsg && targetMsg.sender_id !== authedUserId) {
          return NextResponse.json({ error: 'Forbidden: Bạn chỉ có thể xóa tin nhắn do chính mình gửi' }, { status: 403 });
        }
      }

      globalSharedMessages = globalSharedMessages.filter((m) => m.id !== message_id);
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('messages').delete().eq('id', message_id);
        } catch (e) {}
      }
      return NextResponse.json({ success: true });
    }

    if (!sender_id || (!content && !media_url)) {
      return NextResponse.json({ error: 'Thiếu thông tin người gửi hoặc nội dung' }, { status: 400 });
    }

    const messageId = body.id || message_id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = body.created_at || new Date().toISOString();

    const newMsg: ChatMessage = {
      id: messageId,
      sender_id,
      recipient_id: recipient_id || '',
      content: content || '',
      media_url: media_url || undefined,
      created_at: createdAt,
      status: 'sent',
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
