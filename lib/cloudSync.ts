import { Moment } from './types';

const JSONBLOB_STORE_URL = 'https://jsonblob.com/api/jsonBlob/019fcc1e-0de5-7e25-bd85-bd9756144094';

export interface CloudProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

/**
 * Compresses an image DataURL to 360x360 JPEG quality 0.50.
 * Reduces base64 payload size from ~500KB down to ~12KB - 15KB!
 */
export function compressImageForCloudSync(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !dataUrl) return resolve(dataUrl);
    if (dataUrl.startsWith('data:video/') || dataUrl.startsWith('blob:') || !dataUrl.startsWith('data:image/')) return resolve(dataUrl);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const targetSize = 720; // 720x720 HD High Quality Crisp Square
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetSize, targetSize);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressedDataUrl);
        } else {
          resolve(dataUrl);
        }
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Registers a user profile to the Global Cloud.
 */
export async function pushProfileToGlobalCloud(profile: CloudProfile): Promise<boolean> {
  try {
    if (!profile.id || !profile.username) return false;
    // Reject non-Google dummy accounts
    if (profile.id.startsWith('user-') || profile.id.startsWith('user_dev_') || profile.username === 'manh_locket') {
      return false;
    }

    // 1. Send to Serverless Sync API
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'push_profile', profile }),
    });

    // 2. Also send to JSONBlob
    try {
      const getRes = await fetch(JSONBLOB_STORE_URL, { cache: 'no-store' });
      if (getRes.ok) {
        const data = await getRes.json();
        let profiles = Array.isArray(data.profiles) ? data.profiles : [];
        profiles = profiles.filter((p: any) => p && p.id && !p.id.startsWith('user-') && !p.id.startsWith('user_dev_'));
        const idx = profiles.findIndex((p: any) => p.id === profile.id || p.username === profile.username);
        if (idx >= 0) profiles[idx] = profile;
        else profiles.push(profile);
        data.profiles = profiles;
        await fetch(JSONBLOB_STORE_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
    } catch (e) {}

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Fetches all user profiles from Global Cloud (Google Accounts Only).
 */
export async function fetchGlobalCloudProfiles(): Promise<CloudProfile[]> {
  try {
    let rawProfiles: CloudProfile[] = [];
    // Try Serverless API first
    const res = await fetch('/api/sync', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.profiles) && data.profiles.length > 0) {
        rawProfiles = data.profiles;
      }
    }

    if (rawProfiles.length === 0) {
      // Fallback to JSONBlob
      const jsonRes = await fetch(JSONBLOB_STORE_URL, { cache: 'no-store' });
      if (jsonRes.ok) {
        const data = await jsonRes.json();
        if (Array.isArray(data.profiles)) rawProfiles = data.profiles;
      }
    }

    // Filter out non-Google accounts
    return rawProfiles.filter(
      (p) => p && p.id && !p.id.startsWith('user-') && !p.id.startsWith('user_dev_') && p.username !== 'manh_locket'
    );
  } catch (e) {
    return [];
  }
}

/**
 * Pushes a newly posted moment to Global Cloud.
 * The photo is compressed to ~12KB before sending so it uploads instantly!
 */
export async function pushMomentToGlobalCloud(moment: Moment): Promise<boolean> {
  try {
    if (!moment.id || !moment.media_url) return false;

    // CRITICAL: Never push blob: URLs to cloud - they are ephemeral browser-session-only
    // references that become black screens on any other tab/device/account
    if (moment.media_url.startsWith('blob:')) return false;

    // Compress photo to ~12KB if it's base64 dataUrl (skip for videos)
    let finalMediaUrl = moment.media_url;
    if (moment.media_url.startsWith('data:') && moment.media_type !== 'video' && !moment.media_url.startsWith('data:video/')) {
      finalMediaUrl = await compressImageForCloudSync(moment.media_url);
    }

    const compressedMoment: Moment = {
      ...moment,
      media_url: finalMediaUrl,
    };

    // 1. Send to Serverless Sync API
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'push_moment', moment: compressedMoment }),
    });

    // 2. Also send to JSONBlob
    try {
      const getRes = await fetch(JSONBLOB_STORE_URL, { cache: 'no-store' });
      if (getRes.ok) {
        const data = await getRes.json();
        const moments = Array.isArray(data.moments) ? data.moments : [];
        const exists = moments.some((m: any) => m.id === compressedMoment.id);
        if (!exists) {
          moments.unshift(compressedMoment);
          if (moments.length > 200) moments.splice(200);
          data.moments = moments;
          await fetch(JSONBLOB_STORE_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
        }
      }
    } catch (e) {}

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Fetches all moments posted across all accounts from Global Cloud.
 */
export async function fetchGlobalCloudMoments(): Promise<Moment[]> {
  const allMoments: Moment[] = [];

  try {
    // 1. Fetch from Serverless API
    const res = await fetch('/api/sync', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.moments)) {
        allMoments.push(...data.moments);
      }
    }
  } catch (e) {}

  try {
    // 2. Fetch from JSONBlob Store
    const jsonRes = await fetch(JSONBLOB_STORE_URL, { cache: 'no-store' });
    if (jsonRes.ok) {
      const data = await jsonRes.json();
      if (Array.isArray(data.moments)) {
        allMoments.push(...data.moments);
      }
    }
  } catch (e) {}

  // Deduplicate by moment ID
  return allMoments
    .filter((m) => m && m.id && m.media_url)
    .filter((m, i, self) => i === self.findIndex((x) => x && x.id === m.id));
}
