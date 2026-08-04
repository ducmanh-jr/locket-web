import { Profile, Friendship, Moment, Reaction } from './types';

// Sample Profiles
export const DEMO_CURRENT_USER: Profile = {
  id: "user-me",
  username: "manh_locket",
  display_name: "Đức Mạnh",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
};

export const DEMO_FRIENDS: Profile[] = [
  {
    id: "user-minh",
    username: "minh_anh",
    display_name: "Minh Anh ✨",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "user-hoang",
    username: "hoang_nam",
    display_name: "Hoàng Nam ⚡",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "user-linh",
    username: "phuong_linh",
    display_name: "Phương Linh 🌸",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
  },
];

// Sample Initial Moments
export const DEMO_INITIAL_MOMENTS: Moment[] = [
  {
    id: "moment-1",
    sender_id: "user-minh",
    sender: DEMO_FRIENDS[0],
    media_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    caption: "Cà phê sáng cùng bạn bè ☕✨",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    reactions: [
      {
        id: "react-1",
        moment_id: "moment-1",
        user_id: "user-me",
        user: DEMO_CURRENT_USER,
        emoji: "❤️",
        created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      },
    ],
  },
  {
    id: "moment-2",
    sender_id: "user-hoang",
    sender: DEMO_FRIENDS[1],
    media_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    caption: "Hoàng hôn tuyệt đẹp hôm nay 🌅",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    reactions: [
      {
        id: "react-2",
        moment_id: "moment-2",
        user_id: "user-me",
        user: DEMO_CURRENT_USER,
        emoji: "🔥",
        created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      },
    ],
  },
  {
    id: "moment-3",
    sender_id: "user-linh",
    sender: DEMO_FRIENDS[2],
    media_url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80",
    caption: "Cún cưng đang ngủ 🐶💤",
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
    reactions: [],
  },
];

// Helper to get local demo storage
export function getStoredDemoMoments(): Moment[] {
  if (typeof window === 'undefined') return DEMO_INITIAL_MOMENTS;
  try {
    const stored = localStorage.getItem('locket_demo_moments');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to parse demo moments", e);
  }
  return DEMO_INITIAL_MOMENTS;
}

export function saveStoredDemoMoments(moments: Moment[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('locket_demo_moments', JSON.stringify(moments));
  } catch (e) {
    console.error("Failed to save demo moments", e);
  }
}

export function addDemoMoment(newMoment: Moment): Moment[] {
  const current = getStoredDemoMoments();
  const updated = [newMoment, ...current];
  saveStoredDemoMoments(updated);
  return updated;
}

export function addDemoReaction(momentId: string, emoji: string, user: Profile): Moment[] {
  const current = getStoredDemoMoments();
  const updated = current.map((m) => {
    if (m.id === momentId) {
      const existingReactions = m.reactions || [];
      const newReaction: Reaction = {
        id: `react-${Date.now()}`,
        moment_id: momentId,
        user_id: user.id,
        user: user,
        emoji: emoji,
        created_at: new Date().toISOString(),
      };
      return {
        ...m,
        reactions: [...existingReactions, newReaction],
      };
    }
    return m;
  });
  saveStoredDemoMoments(updated);
  return updated;
}
