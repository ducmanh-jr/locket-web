import { Profile, Moment, Reaction } from './types';
import { sanitizeMoments } from './media';

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

// Clean 100% Real-User Architecture: Empty sample dataset
const PHOTO_DATASET: { file: string; caption: string }[] = [];

export const DEMO_50_MOMENTS: Moment[] = [];

const LEGACY_CACHE_KEYS = [
  'locket_demo_moments_v5',
  'locket_demo_moments_v6',
  'locket_demo_moments_v7',
  'locket_demo_moments_v8',
  'locket_user_moments_permanent_v1',
];

const ACTIVE_CACHE_KEY = 'locket_moments_shared_cache_v9';
const ACCOUNT_CACHE_PREFIX = 'locket_moments_account_v1_';
const DELETED_CACHE_KEY = 'locket_deleted_moments_v1';

export function getDeletedMomentIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DELETED_CACHE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function addDeletedMomentId(momentId: string): void {
  if (typeof window === 'undefined' || !momentId) return;
  try {
    const deleted = getDeletedMomentIds();
    if (!deleted.includes(momentId)) {
      const updated = [...deleted, momentId];
      localStorage.setItem(DELETED_CACHE_KEY, JSON.stringify(updated));
    }
  } catch (e) {}
}

function getAccountCacheKey(userId?: string): string | null {
  if (!userId) return null;
  return `${ACCOUNT_CACHE_PREFIX}${encodeURIComponent(userId)}`;
}

function readMomentsFromKey(key: string): Moment[] {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? sanitizeMoments(parsed) : [];
  } catch (e) {
    return [];
  }
}

function dedupeMoments(moments: Moment[]): Moment[] {
  return moments.filter(
    (m, i, self) => m && m.id && i === self.findIndex((x) => x && x.id === m.id)
  );
}

export function getStoredDemoMoments(_userId?: string): Moment[] {
  return [];
}

export function saveStoredDemoMoments(moments: Moment[], userId?: string): void {
  if (typeof window === 'undefined') return;

  const normalized = sanitizeMoments(dedupeMoments(moments));
  const payload = JSON.stringify(normalized);

  try {
    localStorage.setItem(ACTIVE_CACHE_KEY, payload);
  } catch (e) {}

  const accountCacheKey = getAccountCacheKey(userId);
  if (accountCacheKey) {
    try {
      localStorage.setItem(accountCacheKey, payload);
    } catch (e) {}
  }
}

export function addDemoMoment(newMoment: Moment, userId?: string): Moment[] {
  const current = getStoredDemoMoments(userId);
  const updated = dedupeMoments([newMoment, ...current]);
  saveStoredDemoMoments(updated, userId);
  return updated;
}

export function addDemoReaction(momentId: string, emoji: string, user: Profile, cacheUserId?: string): Moment[] {
  const current = getStoredDemoMoments(cacheUserId);
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
  saveStoredDemoMoments(updated, cacheUserId);
  return updated;
}
