/**
 * Utility functions for camera capture, square 1:1 cropping, and blob compression.
 */

export interface CapturedImage {
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
): Promise<CapturedImage> {
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
          resolve({ dataUrl, blob });
        } else {
          reject(new Error('Failed to compress image canvas to blob'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}
