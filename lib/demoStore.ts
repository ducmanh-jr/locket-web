import { Profile, Moment, Reaction } from './types';
import { sanitizeMoments } from './media';

export const ADMIN_AVATAR_URL = "https://ui-avatars.com/api/?name=%C4%90%E1%BB%B1c+M%E1%BA%A1nh&background=D9266E&color=fff&size=256&bold=true";

export function getCleanFallbackAvatar(nameOrUsername?: string, isAdmin?: boolean): string {
  if (isAdmin) return ADMIN_AVATAR_URL;
  const cleanName = (nameOrUsername || 'Locket User').trim();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=D9266E&color=fff&size=256&bold=true`;
}

export function getGoogleAvatarUrl(email?: string, nameOrUsername?: string, isAdmin?: boolean): string {
  return getCleanFallbackAvatar(nameOrUsername, isAdmin);
}

// Fallback Current User
export const DEMO_CURRENT_USER: Profile = {
  id: "guest_user",
  username: "locket_user",
  display_name: "Thành viên Locket",
  avatar_url: ADMIN_AVATAR_URL,
};


// Clean 100% Real-User Architecture

const ACTIVE_CACHE_KEY = 'locket_moments_shared_cache_v9';
const ACCOUNT_CACHE_PREFIX = 'locket_moments_account_v1_';
const DELETED_CACHE_KEY = 'locket_deleted_moments_v1';
const DELETED_MEMBERS_KEY = 'locket_deleted_members_v1';

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

export function clearDeletedMomentIds(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DELETED_CACHE_KEY);
  } catch (e) {}
}

export function addDeletedMomentId(momentId: string): void {
  if (typeof window === 'undefined' || !momentId) return;
  try {
    const deleted = getDeletedMomentIds();
    if (!deleted.includes(momentId)) {
      const updated = [...deleted, momentId];
      localStorage.setItem(DELETED_CACHE_KEY, JSON.stringify(updated));
    }

    // Purge deleted moment from active localStorage caches so it can NEVER be re-pushed
    ['locket_moments_v1', ACTIVE_CACHE_KEY].forEach((key) => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((m: any) => m && m.id !== momentId);
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      } catch (e) {}
    });
  } catch (e) {}
}

export function syncDeletedMomentIdsWithServer(serverList: string[]): void {
  if (typeof window === 'undefined' || !Array.isArray(serverList)) return;
  try {
    const existing = new Set(getDeletedMomentIds());
    serverList.forEach((id) => {
      if (id) {
        existing.add(id);
        addDeletedMomentId(id);
      }
    });
    localStorage.setItem(DELETED_CACHE_KEY, JSON.stringify(Array.from(existing)));
  } catch (e) {}
}

export function getDeletedMemberIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DELETED_MEMBERS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function addDeletedMemberId(memberId: string): void {
  if (typeof window === 'undefined' || !memberId) return;
  try {
    const deleted = getDeletedMemberIds();
    if (!deleted.includes(memberId)) {
      const updated = [...deleted, memberId];
      localStorage.setItem(DELETED_MEMBERS_KEY, JSON.stringify(updated));
    }
  } catch (e) {}
}

export function removeDeletedMemberId(memberId: string): void {
  if (typeof window === 'undefined' || !memberId) return;
  try {
    const deleted = getDeletedMemberIds();
    const cleanTarget = memberId.trim().toLowerCase();
    const updated = deleted.filter((id) => {
      const lower = id.trim().toLowerCase();
      return lower !== cleanTarget && !lower.includes(cleanTarget) && !cleanTarget.includes(lower);
    });
    localStorage.setItem(DELETED_MEMBERS_KEY, JSON.stringify(updated));
  } catch (e) {}
}

export function clearAllDeletedMemberIds(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DELETED_MEMBERS_KEY);
  } catch (e) {}
}

export function syncDeletedMemberIdsWithServer(serverDeletedIds: string[]): void {
  if (typeof window === 'undefined' || !Array.isArray(serverDeletedIds)) return;
  try {
    localStorage.setItem(DELETED_MEMBERS_KEY, JSON.stringify(serverDeletedIds));
  } catch (e) {}
}

export function isMemberDeleted(memberId: string): boolean {
  if (!memberId) return false;
  return getDeletedMemberIds().includes(memberId);
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
