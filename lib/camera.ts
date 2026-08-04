/**
 * Utility functions for camera capture, square 1:1 cropping, and video recording.
 */

export interface CapturedImage {
  dataUrl: string;
  blob: Blob;
  type?: 'photo' | 'video';
}

export interface CapturedMedia {
  type: 'photo' | 'video';
  dataUrl: string;
  blob: Blob;
}

/**
 * Converts a Video Element snapshot into a compressed 1:1 square image Blob & DataURL.
 * Supports isFrontCamera mirroring fix so captured photos match camera preview!
 */
export async function captureSquarePhoto(
  videoElement: HTMLVideoElement,
  quality: number = 0.82,
  maxDimension: number = 1080,
  isFrontCamera: boolean = true
): Promise<CapturedMedia> {
  const canvas = document.createElement('canvas');
  const videoWidth = videoElement.videoWidth || 640;
  const videoHeight = videoElement.videoHeight || 480;

  // Determine square dimensions
  const minDimension = Math.min(videoWidth, videoHeight);
  const startX = (videoWidth - minDimension) / 2;
  const startY = (videoHeight - minDimension) / 2;

  // Output target size (e.g., max 1080x1080)
  const targetSize = Math.min(minDimension, maxDimension);
  canvas.width = targetSize;
  canvas.height = targetSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2d context from canvas');
  }

  // Fix Front Camera Inversion: Flip canvas horizontally if front camera
  if (isFrontCamera) {
    ctx.translate(targetSize, 0);
    ctx.scale(-1, 1);
  }

  // Draw square crop from center of video stream
  ctx.drawImage(
    videoElement,
    startX,
    startY,
    minDimension,
    minDimension,
    0,
    0,
    targetSize,
    targetSize
  );

  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ type: 'photo', dataUrl, blob });
        } else {
          reject(new Error('Failed to compress image canvas to blob'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Helper to record a video clip from MediaStream up to maxDurationMs (5000ms max).
 * Capped at 600kbps bitrate (5s = ~350KB ultra-lightweight portable video), preventing black screen bugs!
 */
export function createVideoRecorder(stream: MediaStream): {
  start: () => void;
  stop: () => Promise<CapturedMedia>;
} {
  let mediaRecorder: MediaRecorder | null = null;
  const chunks: Blob[] = [];

  const candidateTypes = [
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  let selectedType = '';
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
    for (const type of candidateTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedType = type;
        break;
      }
    }
  }

  const options: MediaRecorderOptions = {
    videoBitsPerSecond: 600000, // 600 kbps: 5s video = ~350KB lightweight video!
  };
  if (selectedType) options.mimeType = selectedType;

  try {
    mediaRecorder = new MediaRecorder(stream, options);
  } catch (e) {
    try {
      mediaRecorder = selectedType
        ? new MediaRecorder(stream, { mimeType: selectedType })
        : new MediaRecorder(stream);
    } catch (err) {
      console.error('MediaRecorder initialization failed:', err);
    }
  }

  if (mediaRecorder) {
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };
  }

  return {
    start: () => {
      chunks.length = 0;
      if (mediaRecorder && mediaRecorder.state === 'inactive') {
        mediaRecorder.start(100);
      }
    },
    stop: (): Promise<CapturedMedia> => {
      return new Promise((resolve, reject) => {
        if (!mediaRecorder) return reject(new Error('No MediaRecorder available'));

        mediaRecorder.onstop = () => {
          const finalMime = mediaRecorder?.mimeType || selectedType || 'video/mp4';
          const blob = new Blob(chunks, { type: finalMime });

          // CRITICAL: Always convert blob to base64 data URL.
          // NEVER use blob: URLs - they are ephemeral and die when page reloads,
          // causing black screen on feed AND failing cloud sync entirely.
          const reader = new FileReader();

          reader.onloadend = () => {
            let dataUrl = reader.result as string;
            if (!dataUrl || dataUrl === 'data:') {
              // FileReader produced empty result - this should never happen
              // but if it does, we must NOT fallback to blob: URL
              reject(new Error('FileReader produced empty result for video'));
              return;
            }
            // Clean up MIME type header
            if (dataUrl && !dataUrl.startsWith('data:video/')) {
              const actualMime = finalMime.split(';')[0] || 'video/mp4';
              dataUrl = dataUrl.replace(/^data:[^;]*;/, `data:${actualMime};`);
            }
            resolve({ type: 'video', dataUrl, blob });
          };

          reader.onerror = () => {
            reject(new Error('FileReader failed to convert video blob to base64'));
          };

          reader.readAsDataURL(blob);
        };

        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      });
    },
  };
}

/**
 * Extracts a 1:1 square JPEG poster snapshot from a video DataURL.
 * This guarantees a crisp fallback image if video playback is unsupported on a specific mobile browser.
 */
export function captureVideoThumbnail(videoDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !videoDataUrl) return resolve('');
    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      video.onloadeddata = () => {
        try {
          video.currentTime = 0.1;
        } catch (e) {}
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 720;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, size, size);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            resolve('');
          }
        } catch (e) {
          resolve('');
        }
      };

      video.onerror = () => resolve('');
      video.src = videoDataUrl;
    } catch (e) {
      resolve('');
    }
  });
}
