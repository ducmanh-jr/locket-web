import { Moment } from './types';
import { hasRenderableMedia, sanitizeMoments } from './media';

export interface CloudProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

function dataUrlToFile(dataUrl: string, fallbackName: string): File | null {
  try {
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return null;

    const header = dataUrl.slice(0, commaIdx);
    const base64 = dataUrl.slice(commaIdx + 1);
    if (!base64) return null;

    const mimeMatch = header.match(/^data:([^;,]+)/);
    const mime = mimeMatch ? mimeMatch[1] : 'video/mp4';

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

export async function uploadMediaToPublicUrl(mediaUrl: string, fallbackName: string): Promise<string | null> {
  if (typeof window === 'undefined' || !mediaUrl) return null;

  try {
    let fileToUpload: File | Blob | null = null;

    if (mediaUrl.startsWith('blob:')) {
      const blobRes = await fetch(mediaUrl);
      const blobData = await blobRes.blob();
      const mime = blobData.type || 'video/mp4';
      const ext = mime.includes('webm') ? 'webm' : mime.includes('mp4') ? 'mp4' : mime.includes('png') ? 'png' : 'jpg';
      fileToUpload = new File([blobData], `${fallbackName}.${ext}`, { type: mime });
    } else if (mediaUrl.startsWith('data:')) {
      fileToUpload = dataUrlToFile(mediaUrl, fallbackName);
    }

    if (!fileToUpload) return null;

    const formData = new FormData();
    formData.append('file', fileToUpload);
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

export async function uploadBlobToPublicUrl(blob: Blob, fallbackName: string): Promise<string | null> {
  if (typeof window === 'undefined' || !blob || blob.size === 0) return null;

  try {
    const mime = blob.type || 'video/mp4';
    const ext = mime.includes('webm') ? 'webm' : mime.includes('mp4') ? 'mp4' : mime.includes('png') ? 'png' : 'jpg';
    const file = new File([blob], `${fallbackName}.${ext}`, { type: mime });

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

export async function pushProfileToGlobalCloud(profile: CloudProfile): Promise<boolean> {
  try {
    if (!profile.id || !profile.username) return false;
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

export async function fetchGlobalCloudProfiles(): Promise<CloudProfile[]> {
  try {
    const res = await fetch('/api/sync', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.profiles)) {
        return data.profiles;
      }
    }
    return [];
  } catch (e) {
    return [];
  }
}

export async function blobToDataUrl(url: string): Promise<string> {
  if (typeof window === 'undefined' || !url || !url.startsWith('blob:')) return url;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve((reader.result as string) || url);
      };
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return url;
  }
}

export async function pushMomentToGlobalCloud(moment: Moment): Promise<boolean> {
  try {
    if (!moment.id || !moment.media_url) return false;

    let finalMediaUrl = moment.media_url;
    let finalThumbnailUrl = moment.thumbnail_url;

    if (moment.media_url.startsWith('data:') || moment.media_url.startsWith('blob:')) {
      const uploadedUrl = await uploadMediaToPublicUrl(moment.media_url, `locket_${moment.id}`);
      if (uploadedUrl) {
        finalMediaUrl = uploadedUrl;
      } else if (moment.media_url.startsWith('blob:')) {
        finalMediaUrl = await blobToDataUrl(moment.media_url);
      } else if (moment.media_type !== 'video') {
        finalMediaUrl = await compressImageForCloudSync(moment.media_url);
      }
    }

    if (moment.thumbnail_url?.startsWith('data:') || moment.thumbnail_url?.startsWith('blob:')) {
      const uploadedThumb = await uploadMediaToPublicUrl(moment.thumbnail_url, `locket_${moment.id}_thumb`);
      if (uploadedThumb) {
        finalThumbnailUrl = uploadedThumb;
      } else if (moment.thumbnail_url.startsWith('blob:')) {
        finalThumbnailUrl = await blobToDataUrl(moment.thumbnail_url);
      }
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

export async function fetchGlobalCloudMoments(): Promise<Moment[]> {
  try {
    const res = await fetch('/api/sync', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.moments)) {
        return sanitizeMoments(data.moments);
      }
    }
    return [];
  } catch (e) {
    return [];
  }
}

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

export async function pushMomentToGlobalCloudWithRetry(
  moment: Moment,
  _maxDurationMs: number = 5000
): Promise<boolean> {
  // Simple single-retry with short 1.5s delay
  let ok = await pushMomentToGlobalCloud(moment);
  if (ok) return true;

  await new Promise((resolve) => setTimeout(resolve, 1500));
  return await pushMomentToGlobalCloud(moment);
}
