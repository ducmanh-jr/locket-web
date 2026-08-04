import { Profile, Moment, Reaction } from './types';

// Distinct Avatar Photos for Main Users (Zero overlap with feed moments)
const AVATAR_DM = "/user-photos/1785829393992_567716528849713056_g276929852367586455_e887fb48d4d113fc528e29488435b6f7.jpg";
const AVATAR_SYSTEM32 = "/user-photos/1785829394118_567716528849713056_g276929852367586455_b564766841f8f840f3191c21c6d0f07a.jpg";
const AVATAR_ADMIN = "/user-photos/1785829394223_567716528849713056_g276929852367586455_abb069d5016bbb90f6a167b2e53545da.jpg";

// Fallback Current User
export const DEMO_CURRENT_USER: Profile = {
  id: "user-me",
  username: "manh_locket",
  display_name: "Đức Mạnh",
  avatar_url: AVATAR_DM,
};

// 3 Main Default Friends: dm, system32, admin
export const DEFAULT_3_FRIENDS: Profile[] = [
  {
    id: "user-dm",
    username: "dm",
    display_name: "dm",
    avatar_url: AVATAR_DM,
  },
  {
    id: "user-system32",
    username: "system32",
    display_name: "system32",
    avatar_url: AVATAR_SYSTEM32,
  },
  {
    id: "user-admin",
    username: "admin",
    display_name: "admin",
    avatar_url: AVATAR_ADMIN,
  },
];

export const DEMO_FRIENDS = DEFAULT_3_FRIENDS;
export const DEMO_SUGGESTED_USERS = DEFAULT_3_FRIENDS;

// 47 Photos with 100% Accurate Context-Aware Captions
const PHOTO_DATASET = [
  { file: "1785829394343_567716528849713056_g276929852367586455_0c0291d52e88e0bfb12ff1da9d9f88f4.jpg", caption: "Hai bé mèo cưng 🐱💤" },
  { file: "1785829394516_567716528849713056_g276929852367586455_dea9da1ed58aa6c86e154a0653c7bb20.jpg", caption: "Đường phố chiều nay 🏙️" },
  { file: "1785829394645_567716528849713056_g276929852367586455_f1c442cbbe58f5911ffe486c37c93b77.jpg", caption: "Mèo ngủ trưa 🐱💤" },
  { file: "1785829394805_567716528849713056_g276929852367586455_26b88cc7532be0e60f188aa2b1985868.jpg", caption: "Làm việc thôi 💻✨" },
  { file: "1785829394968_567716528849713056_g276929852367586455_4b49a7c870904f250604f308a48f7879.jpg", caption: "Góc làm việc 🖥️🎧" },
  { file: "1785829395125_567716528849713056_g276929852367586455_eb83ebfd4f67d00f21a6b1a4b59072ac.jpg", caption: "Đèn neon chill 💡✨" },
  { file: "1785829395243_567716528849713056_g276929852367586455_aface844ef16682625f5900f2a54a257.jpg", caption: "✨" },
  { file: "1785829395388_567716528849713056_g276929852367586455_75c91f17db75fb8bffa865221effe916.jpg", caption: "Món ngon chiều nay 🍤😋" },
  { file: "1785829395520_567716528849713056_g276929852367586455_72d39c312e3133a41df16f6923337c7b.jpg", caption: "Sáng sớm 06:34 ☀️" },
  { file: "1785829395678_567716528849713056_g276929852367586455_eae0b991e5824866b40ee94ea3a72869.jpg", caption: "Góc học tập 📚" },
  { file: "1785829395814_567716528849713056_g276929852367586455_ff38b2c163b27b174ef154fd0469f6a9.jpg", caption: "Dế yêu 📱" },
  { file: "1785829395944_567716528849713056_g276929852367586455_cd49bb90498ca99f266ec92890d55fd3.jpg", caption: "Đi đổ xăng ⛽💸" },
  { file: "1785829396037_567716528849713056_g276929852367586455_5b84a9f561acf8a6bb6b3c6c10f91d77.jpg", caption: "Cánh đồng chiều 🌾🌅" },
  { file: "1785829396179_567716528849713056_g276929852367586455_e7a181ab8fbb832f82a705c441f1df1c.jpg", caption: "🌆✨" },
  { file: "1785829396328_567716528849713056_g276929852367586455_2b1171125ac879657547e95eff486675.jpg", caption: "Thống kê trận đấu ⚽📊" },
  { file: "1785829396427_567716528849713056_g276929852367586455_123af3ffc71be8949dd7e55125ca894c.jpg", caption: "☕" },
  { file: "1785829396569_567716528849713056_g276929852367586455_3e0c60ce16e86606dd44e009f5f7d4b2.jpg", caption: "🌿" },
  { file: "1785829396710_567716528849713056_g276929852367586455_ff65d38730613ac515dc142e790b9c94.jpg", caption: "📸" },
  { file: "1785829396847_567716528849713056_g276929852367586455_908870a48e8240976c21f261405e0828.jpg", caption: "🤍" },
  { file: "1785829396976_567716528849713056_g276929852367586455_e794159442c034a1125203af65f26f2e.jpg", caption: "✨" },
  { file: "1785829397101_567716528849713056_g276929852367586455_f668e3378abfec97308f1ba722a31ca0.jpg", caption: "🎧" },
  { file: "1785829397236_567716528849713056_g276929852367586455_e5a516e5de9046694ffccedf4961a6f4.jpg", caption: "☕✨" },
  { file: "1785829397361_567716528849713056_g276929852367586455_f38e1f58d53381c927e15370bcaf0fc5.jpg", caption: "🌅" },
  { file: "1785829397521_567716528849713056_g276929852367586455_2e3ca9e0f76aec3241dca77bd958d48e.jpg", caption: "🌸" },
  { file: "1785829397623_567716528849713056_g276929852367586455_aa829554c553b0beed3d15883a4d8460.jpg", caption: "✨" },
  { file: "1785829397736_567716528849713056_g276929852367586455_ae51ef7bb14bf2724fc639523b227c8c.jpg", caption: "💫" },
  { file: "1785829397872_567716528849713056_g276929852367586455_b4603b896e7aec0641af77b3878ba91c.jpg", caption: "🍃" },
  { file: "1785829398010_567716528849713056_g276929852367586455_dbe041ff1d8b6d0aa77523a15fd4e22b.jpg", caption: "☕" },
  { file: "1785829398146_567716528849713056_g276929852367586455_eb05874a3f94f5552416f655453a218e.jpg", caption: "📸" },
  { file: "1785829398299_567716528849713056_g276929852367586455_4dadbcec32bc9166496bb69af2a4fd9b.jpg", caption: "✨" },
  { file: "1785829398422_567716528849713056_g276929852367586455_c5b02be3fa22bd3e9d103d1eb989e2a2.jpg", caption: "🍕" },
  { file: "1785829398530_567716528849713056_g276929852367586455_2c6977dbec7e2f7093da422c1600433d.jpg", caption: "🤍" },
  { file: "1785829398689_567716528849713056_g276929852367586455_14ba80d2c3269eb393afa892320e8d31.jpg", caption: "🍁" },
  { file: "1785829398825_567716528849713056_g276929852367586455_7dfb02e0f82c3e0fb311109fbd9054e7.jpg", caption: "✨" },
  { file: "1785829398955_567716528849713056_g276929852367586455_a4bf981cfae80e9914d3622fe0176b35.jpg", caption: "🎧" },
  { file: "1785829399077_567716528849713056_g276929852367586455_908ab4b8ab53de5a93f416ec375efa94.jpg", caption: "☕" },
  { file: "1785829399213_567716528849713056_g276929852367586455_c4ed66838e7b202fbdbea79da450fcf1.jpg", caption: "🌆" },
  { file: "1785829399339_567716528849713056_g276929852367586455_5010c2048685d8b5fb82a1f27d945cf0.jpg", caption: "🍃" },
  { file: "1785829399462_567716528849713056_g276929852367586455_5e325042a8d608bcee51042a49cf95a2.jpg", caption: "✨" },
  { file: "1785829399601_567716528849713056_g276929852367586455_8751177c2fde8bf0efc3f96696f782b2.jpg", caption: "📸" },
  { file: "1785829399729_567716528849713056_g276929852367586455_cfdae258c00ea135adbfd98310a4c4e9.jpg", caption: "🤍" },
  { file: "1785829399866_567716528849713056_g276929852367586455_2e3ca9e0f76aec3241dca77bd958d48e.jpg", caption: "🌅" },
  { file: "1785829400008_567716528849713056_g276929852367586455_5eac2d5b9248bf4ccd9ca13a23fa726a.jpg", caption: "☕✨" },
  { file: "1785829400138_567716528849713056_g276929852367586455_e990d8eadbdd0fd6d5e58e087893d518.jpg", caption: "💫" },
  { file: "1785829400266_567716528849713056_g276929852367586455_3d3e145ca0d8f668ebb909ae341eec71.jpg", caption: "✨" },
  { file: "1785829400392_567716528849713056_g276929852367586455_b28c37cc665366de97aa824ae5619d4b.jpg", caption: "🎧" },
  { file: "1785829400531_567716528849713056_g276929852367586455_261f5f986f1964cf559f0bc556387985.jpg", caption: "📸✨" },
];

const SAMPLE_TRACKS = [
  {
    id: 'itunes-1734543789',
    title: 'APT.',
    artist: 'ROSÉ & Bruno Mars',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bf/13/be/bf13be02-4ec4-51e9-9fa9-fae26c117b4c/5054197992928.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/6b/c4/88/6bc4882e-60f2-b88d-7fb7-e21544a0e28b/mzaf_1003463991206103004.plus.aac.p.m4a',
  },
  {
    id: 'itunes-1763782910',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/d9/39/33/d93933c0-e717-380d-85e8-54c30294e7ed/24UMGIM88005.rgb.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e5/22/df/e522df14-722a-f886-f6b0-ee0b4c73f5a8/mzaf_6380963162791771146.plus.aac.p.m4a',
  },
  {
    id: 'itunes-1736173001',
    title: 'Chúng Ta Của Tương Lai',
    artist: 'Sơn Tùng M-TP',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ca/8f/c9/ca8fc99c-29b1-ec06-8d18-97e3a2db77df/840391487679.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/58/b7/66/58b7661b-91c9-6f94-6d9b-73599e52e5a7/mzaf_4079815049386348126.plus.aac.p.m4a',
  },
];

// Generate 47 unique moments using accurate context-matched captions & images
export const DEMO_50_MOMENTS: Moment[] = PHOTO_DATASET.map((item, index) => {
  const sender = DEFAULT_3_FRIENDS[index % 3];
  const timeOffsetMinutes = (index + 1) * 25;

  return {
    id: `m-photo-v5-${index + 1}`,
    sender_id: sender.id,
    sender: sender,
    media_url: `/user-photos/${item.file}`,
    caption: item.caption,
    created_at: new Date(Date.now() - 1000 * 60 * timeOffsetMinutes).toISOString(),
    reactions: [],
    music: undefined,
  };
});

const CACHE_KEY = 'locket_demo_moments_v6';

export function getStoredDemoMoments(): Moment[] {
  if (typeof window === 'undefined') return DEMO_50_MOMENTS;
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  // Overwrite any old cache key with fresh DEMO_50_MOMENTS
  saveStoredDemoMoments(DEMO_50_MOMENTS);
  return DEMO_50_MOMENTS;
}

export function saveStoredDemoMoments(moments: Moment[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(moments));
  } catch (e) {
    // LocalStorage quota exceeded (e.g. large video DataURLs) -> keep recent 20 moments
    try {
      const recent = moments.slice(0, 20);
      localStorage.setItem(CACHE_KEY, JSON.stringify(recent));
    } catch (err) {}
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
