import { Profile, Friendship, Moment, Reaction } from './types';

// Sample Current User Fallback
export const DEMO_CURRENT_USER: Profile = {
  id: "user-me",
  username: "manh_locket",
  display_name: "Đức Mạnh",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
};

// 3 Default Friends ALWAYS linked to every new real user
export const DEFAULT_3_FRIENDS: Profile[] = [
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

export const DEMO_FRIENDS = DEFAULT_3_FRIENDS;

// Additional Suggested Friends
export const DEMO_SUGGESTED_USERS: Profile[] = [
  ...DEFAULT_3_FRIENDS,
  {
    id: "user-quang",
    username: "quang_huy",
    display_name: "Quang Huy 🎧",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "user-tuan",
    username: "minh_tuan",
    display_name: "Minh Tuấn ⚽",
    avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "user-trinh",
    username: "ngoc_trinh",
    display_name: "Ngọc Trinh 🎀",
    avatar_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "user-chau",
    username: "bao_chau",
    display_name: "Bảo Châu 🎨",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "user-ducanh",
    username: "duc_anh",
    display_name: "Đức Anh 📷",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "user-yen",
    username: "hai_yen",
    display_name: "Hải Yến ☕",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "user-trung",
    username: "thanh_trung",
    display_name: "Thành Trung 🎸",
    avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80",
  },
];

// 20 Rich Moments from the 3 default friends
export const DEMO_20_MOMENTS: Moment[] = [
  {
    id: "m-20",
    sender_id: "user-minh",
    sender: DEFAULT_3_FRIENDS[0],
    media_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    caption: "Cà phê sáng cùng bạn bè ☕✨",
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    reactions: [],
  },
  {
    id: "m-19",
    sender_id: "user-hoang",
    sender: DEFAULT_3_FRIENDS[1],
    media_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    caption: "Hoàng hôn tuyệt đẹp hôm nay 🌅",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    reactions: [],
  },
  {
    id: "m-18",
    sender_id: "user-linh",
    sender: DEFAULT_3_FRIENDS[2],
    media_url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80",
    caption: "Cún cưng đang ngủ 🐶💤",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    reactions: [],
  },
  {
    id: "m-17",
    sender_id: "user-minh",
    sender: DEFAULT_3_FRIENDS[0],
    media_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    caption: "Trà matcha chiều thu 🍵",
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    reactions: [],
  },
  {
    id: "m-16",
    sender_id: "user-hoang",
    sender: DEFAULT_3_FRIENDS[1],
    media_url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80",
    caption: "Chụp ảnh phong cảnh núi ⛰️",
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    reactions: [],
  },
  {
    id: "m-15",
    sender_id: "user-linh",
    sender: DEFAULT_3_FRIENDS[2],
    media_url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80",
    caption: "Tiệc sinh nhật ấm cúng 🎉🎈",
    created_at: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    reactions: [],
  },
  {
    id: "m-14",
    sender_id: "user-minh",
    sender: DEFAULT_3_FRIENDS[0],
    media_url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
    caption: "Góc làm việc chiều mưa 💻🌧️",
    created_at: new Date(Date.now() - 1000 * 60 * 700).toISOString(),
    reactions: [],
  },
  {
    id: "m-13",
    sender_id: "user-hoang",
    sender: DEFAULT_3_FRIENDS[1],
    media_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
    caption: "Tập đàn guitar acoustic 🎸",
    created_at: new Date(Date.now() - 1000 * 60 * 900).toISOString(),
    reactions: [],
  },
  {
    id: "m-12",
    sender_id: "user-linh",
    sender: DEFAULT_3_FRIENDS[2],
    media_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    caption: "Pizza ngon xỉu xỉu 🍕🔥",
    created_at: new Date(Date.now() - 1000 * 60 * 1100).toISOString(),
    reactions: [],
  },
  {
    id: "m-11",
    sender_id: "user-minh",
    sender: DEFAULT_3_FRIENDS[0],
    media_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    caption: "Bãi biển miền nhiệt đới 🌊🏖️",
    created_at: new Date(Date.now() - 1000 * 60 * 1400).toISOString(),
    reactions: [],
  },
  {
    id: "m-10",
    sender_id: "user-hoang",
    sender: DEFAULT_3_FRIENDS[1],
    media_url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
    caption: "Sương mù buổi sáng 🌫️",
    created_at: new Date(Date.now() - 1000 * 60 * 1800).toISOString(),
    reactions: [],
  },
  {
    id: "m-9",
    sender_id: "user-linh",
    sender: DEFAULT_3_FRIENDS[2],
    media_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    caption: "Bát salad healthy 🥗✨",
    created_at: new Date(Date.now() - 1000 * 60 * 2200).toISOString(),
    reactions: [],
  },
  {
    id: "m-8",
    sender_id: "user-minh",
    sender: DEFAULT_3_FRIENDS[0],
    media_url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80",
    caption: "Du lịch núi rừng thiên nhiên 🌲",
    created_at: new Date(Date.now() - 1000 * 60 * 2600).toISOString(),
    reactions: [],
  },
  {
    id: "m-7",
    sender_id: "user-hoang",
    sender: DEFAULT_3_FRIENDS[1],
    media_url: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80",
    caption: "Đèn đường buổi tối 🌃",
    created_at: new Date(Date.now() - 1000 * 60 * 3000).toISOString(),
    reactions: [],
  },
  {
    id: "m-6",
    sender_id: "user-linh",
    sender: DEFAULT_3_FRIENDS[2],
    media_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    caption: "Selfie phong cách retro 📸",
    created_at: new Date(Date.now() - 1000 * 60 * 3500).toISOString(),
    reactions: [],
  },
  {
    id: "m-5",
    sender_id: "user-minh",
    sender: DEFAULT_3_FRIENDS[0],
    media_url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
    caption: "Đọc sách buổi chiều 📖☕",
    created_at: new Date(Date.now() - 1000 * 60 * 4000).toISOString(),
    reactions: [],
  },
  {
    id: "m-4",
    sender_id: "user-hoang",
    sender: DEFAULT_3_FRIENDS[1],
    media_url: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=80",
    caption: "Mèo con dễ thương 🐱🧡",
    created_at: new Date(Date.now() - 1000 * 60 * 4500).toISOString(),
    reactions: [],
  },
  {
    id: "m-3",
    sender_id: "user-linh",
    sender: DEFAULT_3_FRIENDS[2],
    media_url: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=800&q=80",
    caption: "Vườn hoa rực rỡ 🌻🌸",
    created_at: new Date(Date.now() - 1000 * 60 * 5000).toISOString(),
    reactions: [],
  },
  {
    id: "m-2",
    sender_id: "user-minh",
    sender: DEFAULT_3_FRIENDS[0],
    media_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    caption: "Cốc latte art trái tim ☕❤️",
    created_at: new Date(Date.now() - 1000 * 60 * 5500).toISOString(),
    reactions: [],
  },
  {
    id: "m-1",
    sender_id: "user-hoang",
    sender: DEFAULT_3_FRIENDS[1],
    media_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
    caption: "Bữa tối ấm cúng cùng gia đình 🍲✨",
    created_at: new Date(Date.now() - 1000 * 60 * 6000).toISOString(),
    reactions: [],
  },
];

export function getStoredDemoMoments(): Moment[] {
  if (typeof window === 'undefined') return DEMO_20_MOMENTS;
  try {
    const stored = localStorage.getItem('locket_demo_moments');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEMO_20_MOMENTS;
}

export function saveStoredDemoMoments(moments: Moment[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('locket_demo_moments', JSON.stringify(moments));
  } catch (e) {}
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
