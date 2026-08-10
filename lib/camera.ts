/**
 * Utility functions for camera capture, square 1:1 HD cropping, and high-performance video recording.
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
 * Converts a Video Element snapshot into a compressed 1:1 HD square image Blob & DataURL.
 * Supports isFrontCamera mirroring fix so captured photos match camera preview!
 */
export async function captureSquarePhoto(
  videoElement: HTMLVideoElement,
  quality: number = 0.92,
  maxDimension: number = 1080,
  isFrontCamera: boolean = true
): Promise<CapturedMedia> {
  const canvas = document.createElement('canvas');
  const videoWidth = videoElement.videoWidth || 1280;
  const videoHeight = videoElement.videoHeight || 720;

  // Determine square dimensions
  const minDimension = Math.min(videoWidth, videoHeight);
  const startX = (videoWidth - minDimension) / 2;
  const startY = (videoHeight - minDimension) / 2;

  // Output target size (crisp 1080x1080 HD)
  const targetSize = Math.min(minDimension, maxDimension);
  canvas.width = targetSize;
  canvas.height = targetSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2d context from canvas');
  }

  // High quality image smoothing for crisp HD photos
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

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
 * High-performance MediaRecorder helper for 5-second HD video clip capture.
 * Configured with 3.5 Mbps HD bitrate and crystal clear audio.
 */
export function createVideoRecorder(stream: MediaStream): {
  start: () => void;
  stop: () => Promise<CapturedMedia>;
} {
  let mediaRecorder: MediaRecorder | null = null;
  const chunks: Blob[] = [];

  const candidateTypes = [
    'video/mp4',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/webm;codecs=vp9,opus',
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
    videoBitsPerSecond: 3500000, // 3.5 Mbps HD crisp video quality
    audioBitsPerSecond: 128000,  // 128 kbps crystal clear audio
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

          // Fast local blob ObjectURL for instant HTML5 video playback
          let previewDataUrl = '';
          try {
            previewDataUrl = URL.createObjectURL(blob);
          } catch (e) {}

          resolve({ type: 'video', dataUrl: previewDataUrl || '', blob });
        };

        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      });
    },
  };
}

/**
 * Extracts a 1:1 square JPEG poster snapshot from a video DataURL / ObjectURL.
 */
export function captureVideoThumbnail(videoDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !videoDataUrl) return resolve('');
    let resolved = false;
    const safeResolve = (val: string) => {
      if (!resolved) {
        resolved = true;
        resolve(val);
      }
    };

    const timer = setTimeout(() => {
      safeResolve('');
    }, 1500);

    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      const generateSnap = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 720;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(video, 0, 0, size, size);
            clearTimeout(timer);
            safeResolve(canvas.toDataURL('image/jpeg', 0.88));
          } else {
            clearTimeout(timer);
            safeResolve('');
          }
        } catch (e) {
          clearTimeout(timer);
          safeResolve('');
        }
      };

      video.onloadedmetadata = () => {
        try {
          video.currentTime = 0.05;
        } catch (e) {
          generateSnap();
        }
      };

      video.onseeked = generateSnap;
      video.onerror = () => {
        clearTimeout(timer);
        safeResolve('');
      };

      video.src = videoDataUrl;
      video.load();
    } catch (e) {
      clearTimeout(timer);
      safeResolve('');
    }
  });
}
