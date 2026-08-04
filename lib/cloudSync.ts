import { Moment } from './types';

const GLOBAL_SYNC_ENDPOINT = 'https://api.restful-api.dev/objects';
const SYNC_TAG = 'locket_v5_global_moment';

/**
 * Uploads a newly posted moment to the Global Public Cloud Store.
 * The media_url stored is either a Supabase signed URL or a base64 dataUrl.
 * For base64, we only store metadata (caption, sender) and the URL will be
 * resolved locally from localStorage on the receiving device.
 */
export async function pushMomentToGlobalCloud(moment: Moment): Promise<boolean> {
  try {
    // Don't push base64 data URLs to cloud (too large). Only push if we have a real URL.
    const mediaUrlToStore = moment.media_url?.startsWith('data:')
      ? '__base64_local__'
      : moment.media_url;

    const payload = {
      name: SYNC_TAG,
      data: {
        id: moment.id,
        sender_id: moment.sender_id,
        sender: moment.sender
          ? {
              id: moment.sender.id,
              username: moment.sender.username,
              display_name: moment.sender.display_name,
              avatar_url: moment.sender.avatar_url,
            }
          : null,
        media_url: mediaUrlToStore,
        caption: moment.caption || '',
        created_at: moment.created_at,
        reactions: [],
      },
    };

    const res = await fetch(GLOBAL_SYNC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (e) {
    console.error('pushMomentToGlobalCloud error:', e);
    return false;
  }
}

/**
 * Fetches all user-posted moments from the Global Cloud Store.
 * Filters by our SYNC_TAG name to only get Locket moments.
 */
export async function fetchGlobalCloudMoments(): Promise<Moment[]> {
  try {
    // The API returns all objects; we filter client-side by our tag name
    const res = await fetch(GLOBAL_SYNC_ENDPOINT, { cache: 'no-store' });
    if (!res.ok) return [];

    const list = await res.json();
    if (!Array.isArray(list)) return [];

    const cloudMoments: Moment[] = list
      .filter((item: any) => item?.name === SYNC_TAG && item?.data?.id && item?.data?.media_url)
      // Skip items where media was base64 (can't be resolved on other devices)
      .filter((item: any) => item.data.media_url !== '__base64_local__')
      .map((item: any) => ({
        id: item.data.id,
        sender_id: item.data.sender_id || 'unknown',
        sender: item.data.sender || {
          id: item.data.sender_id || 'unknown',
          username: 'user',
          display_name: 'Locket User',
          avatar_url: '',
        },
        media_url: item.data.media_url,
        caption: item.data.caption || '',
        created_at: item.data.created_at || new Date().toISOString(),
        reactions: item.data.reactions || [],
      }));

    return cloudMoments;
  } catch (e) {
    console.error('fetchGlobalCloudMoments error:', e);
    return [];
  }
}

// ========================
// GLOBAL CLOUD PROFILE SYNC
// ========================

const PROFILE_TAG = 'locket_v5_profile';

/**
 * Registers a user profile to the Global Cloud so other accounts can see them as friends.
 */
export async function pushProfileToGlobalCloud(profile: { id: string; username: string; display_name: string; avatar_url: string }): Promise<boolean> {
  try {
    const res = await fetch(GLOBAL_SYNC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: PROFILE_TAG,
        data: {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          registered_at: new Date().toISOString(),
        },
      }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Fetches all registered user profiles from the Global Cloud.
 */
export async function fetchGlobalCloudProfiles(): Promise<{ id: string; username: string; display_name: string; avatar_url: string }[]> {
  try {
    const res = await fetch(GLOBAL_SYNC_ENDPOINT, { cache: 'no-store' });
    if (!res.ok) return [];

    const list = await res.json();
    if (!Array.isArray(list)) return [];

    return list
      .filter((item: any) => item?.name === PROFILE_TAG && item?.data?.id)
      .map((item: any) => ({
        id: item.data.id,
        username: item.data.username || 'user',
        display_name: item.data.display_name || 'Locket User',
        avatar_url: item.data.avatar_url || '',
      }))
      // Deduplicate by username
      .filter(
        (p: any, i: number, self: any[]) => i === self.findIndex((x) => x.username === p.username)
      );
  } catch (e) {
    return [];
  }
}
