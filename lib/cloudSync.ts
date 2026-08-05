import { Moment } from './types';
import { hasRenderableMedia, sanitizeMoments } from './media';

const JSONBLOB_STORE_URL = 'https://jsonblob.com/api/jsonBlob/019fcc1e-0de5-7e25-bd85-bd9756144094';

export interface CloudProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

function dataUrlToFile(dataUrl: string, fallbackName: string): File | null {
  try {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/^data:([^;]+);base64$/)?.[1];
    if (!mime || !base64) return null;

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    const ext = mime.includes('webm')
      ? 'webm'
      : mime.includes('mp4')
        ? 'mp4'
        : mime.includes('png')
          ? 'png'
          : 'jpg';

    return new File([bytes], `${fallbackName}.${ext}`, { type: mime });
  } catch (e) {
    return null;
  }
}

export async function uploadMediaToPublicUrl(dataUrl: string, fallbackName: string): Promise<string | null> {
  if (typeof window === 'undefined' || !dataUrl.startsWith('data:')) return null;

  const file = dataUrlToFile(dataUrl, fallbackName);
  if (!file) return null;

  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.url === 'string' && (data.url.startsWith('http://') || data.url.startsWith('https://') || data.url.startsWith('/'))) {
      return data.url;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Compresses an image DataURL to 1080x1080 JPEG quality 0.90.
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
        const targetSize = 1080;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetSize, targetSize);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.90);
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
    if (profile.id.startsWith('user-') || profile.id.startsWith('user_dev_') || profile.username === 'manh_locket') {
      return false;
    }

    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'push_profile', profile }),
    });
    return res.ok;
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
    const res = await fetch('/api/sync', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.profiles) && data.profiles.length > 0) {
        rawProfiles = data.profiles;
      }
    }

    if (rawProfiles.length === 0) {
      const jsonRes = await fetch(JSONBLOB_STORE_URL, { cache: 'no-store' });
      if (jsonRes.ok) {
        const data = await jsonRes.json();
        if (Array.isArray(data.profiles)) rawProfiles = data.profiles;
      }
    }

    return rawProfiles.filter(
      (p) => p && p.id && !p.id.startsWith('user-') && !p.id.startsWith('user_dev_') && p.username !== 'manh_locket'
    );
  } catch (e) {
    return [];
  }
}

/**
 * Pushes a newly posted moment to Global Cloud.
 * Reliable public upload fallback ensures photos/videos are converted to lightweight URLs.
 */
export async function pushMomentToGlobalCloud(moment: Moment): Promise<boolean> {
  try {
    if (!moment.id || !moment.media_url) return false;

    let finalMediaUrl = moment.media_url;
    let finalThumbnailUrl = moment.thumbnail_url;

    // Convert data: URLs into short durable HTTP/HTTPS URLs
    if (moment.media_url.startsWith('data:')) {
      const uploadedUrl = await uploadMediaToPublicUrl(moment.media_url, `locket_${moment.id}`);
      if (uploadedUrl) {
        finalMediaUrl = uploadedUrl;
      } else if (moment.media_type !== 'video') {
        finalMediaUrl = await compressImageForCloudSync(moment.media_url);
      }
    }

    if (moment.thumbnail_url?.startsWith('data:')) {
      const uploadedThumb = await uploadMediaToPublicUrl(moment.thumbnail_url, `locket_${moment.id}_thumb`);
      if (uploadedThumb) finalThumbnailUrl = uploadedThumb;
    }

    const compressedMoment: Moment = {
      ...moment,
      media_url: finalMediaUrl,
      thumbnail_url: finalThumbnailUrl,
    };

    if (!hasRenderableMedia(compressedMoment)) return false;

    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'push_moment', moment: compressedMoment }),
    });
    return res.ok;
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

  return sanitizeMoments(allMoments).filter(
    (m, i, self) => i === self.findIndex((x) => x && x.id === m.id)
  );
}

/**
 * Deletes a moment from Global Cloud store.
 */
export async function deleteMomentFromGlobalCloud(momentId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_moment', moment_id: momentId }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

