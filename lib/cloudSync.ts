import { Moment } from './types';
import { hasRenderableMedia, sanitizeMoments } from './media';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getDeletedMemberIds, addDeletedMemberId } from './demoStore';

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

    // 1. Direct Supabase Storage upload from Browser Client (High Reliability)
    if (isSupabaseConfigured()) {
      try {
        const mime = fileToUpload.type || 'video/mp4';
        const ext = mime.includes('webm') ? 'webm' : mime.includes('mp4') ? 'mp4' : mime.includes('png') ? 'png' : 'jpg';
        const fileName = `${fallbackName}_${Date.now()}.${ext}`;
        const { data: storageData, error: storageErr } = await supabase.storage
          .from('moments')
          .upload(fileName, fileToUpload, { contentType: mime, upsert: true });

        if (!storageErr && storageData?.path) {
          const { data: publicUrlData } = supabase.storage
            .from('moments')
            .getPublicUrl(storageData.path);
          if (publicUrlData?.publicUrl) {
            return publicUrlData.publicUrl;
          }
        }
      } catch (sbErr) {}
    }

    // 2. Server API Route Upload Fallback
    const formData = new FormData();
    formData.append('file', fileToUpload);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (
      typeof data.url === 'string' &&
      (data.url.startsWith('http://') ||
        data.url.startsWith('https://') ||
        data.url.startsWith('/') ||
        data.url.startsWith('data:'))
    ) {
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

    // 1. Direct Supabase Storage upload from Browser Client (High Reliability)
    if (isSupabaseConfigured()) {
      try {
        const fileName = `${fallbackName}_${Date.now()}.${ext}`;
        const { data: storageData, error: storageErr } = await supabase.storage
          .from('moments')
          .upload(fileName, file, { contentType: mime, upsert: true });

        if (!storageErr && storageData?.path) {
          const { data: publicUrlData } = supabase.storage
            .from('moments')
            .getPublicUrl(storageData.path);
          if (publicUrlData?.publicUrl) {
            return publicUrlData.publicUrl;
          }
        }
      } catch (sbErr) {}
    }

    // 2. Server API Route Upload Fallback
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (
      typeof data.url === 'string' &&
      (data.url.startsWith('http://') ||
        data.url.startsWith('https://') ||
        data.url.startsWith('/') ||
        data.url.startsWith('data:'))
    ) {
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
  const deletedSet = new Set(getDeletedMemberIds());
  try {
    const res = await fetch('/api/sync', { cache: 'no-store' });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data.deleted_member_ids)) {
          data.deleted_member_ids.forEach((id: string) => deletedSet.add(id));
        }
        if (Array.isArray(data.profiles)) {
          return data.profiles.filter((p: any) => p && p.id && !deletedSet.has(p.id));
        }
      }
    }
  } catch (e) {}

  // Fallback: Query Supabase directly
  if (isSupabaseConfigured()) {
    try {
      const { data: profs } = await supabase.from('profiles').select('*').limit(100);
      if (profs && profs.length > 0) {
        return (profs as CloudProfile[]).filter((p) => p && p.id && !deletedSet.has(p.id));
      }
    } catch (e) {}
  }

  return [];
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

    // 1. Primary: Try API Sync Endpoint
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'push_moment', moment: compressedMoment }),
      });
      if (res.ok) return true;
    } catch (apiErr) {}

    // 2. Direct Supabase JS Client Fallback (Guarantees DB insert directly from browser)
    if (isSupabaseConfigured()) {
      const senderId = compressedMoment.sender_id || compressedMoment.sender?.id;
      if (senderId) {
        const senderObj: any = compressedMoment.sender || {};
        await supabase.from('profiles').upsert({
          id: senderId,
          username: senderObj.username || `user_${senderId.substring(0, 6)}`,
          display_name: senderObj.display_name || 'Thành viên Locket',
          avatar_url: senderObj.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderId}`,
        });
      }

      const { error: dbErr } = await supabase.from('moments').upsert({
        id: compressedMoment.id,
        sender_id: senderId,
        media_url: compressedMoment.media_url,
        thumbnail_url: compressedMoment.thumbnail_url || null,
        media_type: compressedMoment.media_type || 'photo',
        audio_option: compressedMoment.audio_option || null,
        caption: compressedMoment.caption || '',
        music: compressedMoment.music || null,
        created_at: compressedMoment.created_at || new Date().toISOString(),
      });
      return !dbErr;
    }

    return false;
  } catch (e) {
    return false;
  }
}

export async function fetchGlobalCloudMoments(): Promise<Moment[]> {
  // 1. Primary: Try the API route
  try {
    const res = await fetch('/api/sync', { cache: 'no-store' });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        let momentsList = Array.isArray(data.moments) ? data.moments : [];
        if (Array.isArray(data.deleted_member_ids) && data.deleted_member_ids.length > 0) {
          const deletedSet = new Set(data.deleted_member_ids as string[]);
          momentsList = momentsList.filter(
            (m: any) => !deletedSet.has(m.sender_id) && !deletedSet.has(m.sender?.id)
          );
        }
        if (momentsList.length > 0) {
          console.log('[CloudSync] API route returned', momentsList.length, 'moments');
          return sanitizeMoments(momentsList);
        }
      } else {
        console.warn('[CloudSync] API route returned non-JSON (possible Vercel protection). Falling back to direct Supabase.');
      }
    } else {
      console.warn('[CloudSync] API route failed with status', res.status, '. Falling back to direct Supabase.');
    }
  } catch (apiErr) {
    console.warn('[CloudSync] API route fetch error:', apiErr, '. Falling back to direct Supabase.');
  }

  // 2. Fallback: Query Supabase directly from browser (bypasses Vercel Deployment Protection)
  if (isSupabaseConfigured()) {
    try {
      const { data: dbProfiles } = await supabase.from('profiles').select('*').limit(100);
      const profilesMap = new Map((dbProfiles || []).map((p: any) => [p.id, p]));

      const { data: rawMoments } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (rawMoments && rawMoments.length > 0) {
        const enriched = rawMoments.map((m: any) => {
          const senderProfile = profilesMap.get(m.sender_id);
          return {
            ...m,
            sender: senderProfile || {
              id: m.sender_id || 'unknown',
              username: m.sender_id ? `user_${m.sender_id.substring(0, 6)}` : 'locket_user',
              display_name: 'Thành viên Locket',
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.sender_id || 'locket'}`,
            },
          };
        });
        console.log('[CloudSync] Direct Supabase fallback returned', enriched.length, 'moments');
        return sanitizeMoments(enriched);
      }
    } catch (dbErr) {
      console.error('[CloudSync] Direct Supabase fallback also failed:', dbErr);
    }
  }

  return [];
}

export async function deleteMomentFromGlobalCloud(momentId: string): Promise<boolean> {
  let apiSuccess = false;
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_moment', moment_id: momentId }),
    });
    if (res.ok) apiSuccess = true;
  } catch (e) {}

  if (apiSuccess) return true;

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('moments').delete().eq('id', momentId);
      return !error;
    } catch (e) {
      return false;
    }
  }

  return false;
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

export async function deleteMemberFromGlobalCloud(memberId: string): Promise<boolean> {
  if (!memberId) return false;

  // Add to client persistent deleted members registry immediately
  addDeletedMemberId(memberId);

  let apiSuccess = false;
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_member', member_id: memberId }),
    });
    if (res.ok) apiSuccess = true;
  } catch (e) {}

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('reactions').delete().eq('user_id', memberId);
      await supabase.from('moments').delete().eq('sender_id', memberId);
      await supabase.from('profiles').delete().eq('id', memberId);
      return true;
    } catch (e) {
      console.error('[CloudSync] Direct DB member deletion fallback error:', e);
    }
  }

  return apiSuccess;
}
