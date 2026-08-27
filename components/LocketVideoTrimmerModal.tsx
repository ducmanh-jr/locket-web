"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CapturedMedia } from '@/lib/camera';
import { X, Scissors, Volume2, VolumeX } from 'lucide-react';

interface LocketVideoTrimmerModalProps {
  videoSrc: string;
  videoFile: File;
  onConfirmTrim: (trimmedMedia: CapturedMedia) => void;
  onClose: () => void;
}

export const LocketVideoTrimmerModal: React.FC<LocketVideoTrimmerModalProps> = ({
  videoSrc,
  videoFile,
  onConfirmTrim,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const CLIP_DURATION = 5; // 5-second fixed Locket video length

  // 1. Generate Filmstrip Thumbnails across video duration
  useEffect(() => {
    if (!videoSrc) return;

    let isMounted = true;
    const tempVideo = document.createElement('video');
    tempVideo.muted = true;
    tempVideo.playsInline = true;
    tempVideo.crossOrigin = 'anonymous';

    tempVideo.onloadedmetadata = async () => {
      if (!isMounted) return;
      const vidDuration = tempVideo.duration || 10;
      setDuration(vidDuration);

      // Generate 8 frame thumbnails for filmstrip
      const count = 8;
      const frames: string[] = [];
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');

      for (let i = 0; i < count; i++) {
        if (!isMounted) break;
        const seekTime = (i / (count - 1)) * Math.max(0, vidDuration - 0.2);
        tempVideo.currentTime = seekTime;
        await new Promise((r) => {
          tempVideo.onseeked = r;
        });

        if (ctx) {
          ctx.drawImage(tempVideo, 0, 0, 120, 120);
          frames.push(canvas.toDataURL('image/jpeg', 0.6));
        }
      }

      if (isMounted && frames.length > 0) {
        setThumbnails(frames);
      }
    };

    tempVideo.src = videoSrc;
    tempVideo.load();

    return () => {
      isMounted = false;
      tempVideo.src = '';
    };
  }, [videoSrc]);

  // 2. Real-time Live Loop Preview within selected 5-second window
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const endTime = Math.min(duration, startTime + CLIP_DURATION);
    if (video.currentTime >= endTime || video.currentTime < startTime) {
      video.currentTime = startTime;
      if (isPlaying) {
        video.play().catch(() => {});
      }
    }
  }, [startTime, duration, isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = startTime;
    if (isPlaying) {
      video.play().catch(() => {});
    }
  }, [startTime]);

  // 3. Draggable 5-second Selection Slider Handler
  const handleTimelineInteraction = (clientX: number) => {
    const timeline = timelineRef.current;
    if (!timeline || duration <= 0) return;

    const rect = timeline.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = offsetX / rect.width;

    const maxStart = Math.max(0, duration - CLIP_DURATION);
    const newStart = Math.min(maxStart, pct * duration);
    setStartTime(newStart);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleTimelineInteraction(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleTimelineInteraction(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleTimelineInteraction(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleTimelineInteraction(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 4. Fast Client-Side 5-Second Video Trimmer Engine
  const handleConfirmTrim = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(10);
    let audioContext: AudioContext | null = null;

    try {
      // If original video is already <= 5.5 seconds, use direct Blob
      if (duration <= CLIP_DURATION + 0.5) {
        onConfirmTrim({
          type: 'video',
          dataUrl: videoSrc,
          blob: videoFile,
        });
        return;
      }

      // Record exact 5s clip using Offscreen Canvas & MediaRecorder
      const renderVideo = document.createElement('video');
      renderVideo.muted = false;
      renderVideo.playsInline = true;
      renderVideo.crossOrigin = 'anonymous';
      renderVideo.src = videoSrc;

      await new Promise((r) => {
        renderVideo.onloadedmetadata = r;
      });

      renderVideo.currentTime = startTime;
      await new Promise((r) => {
        renderVideo.onseeked = r;
      });

      const canvas = document.createElement('canvas');
      const size = Math.min(renderVideo.videoWidth || 720, renderVideo.videoHeight || 720, 1080);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(30);
      
      // Capture audio track if present
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          audioContext = new AudioCtxClass();
          const source = audioContext.createMediaElementSource(renderVideo);
          const destination = audioContext.createMediaStreamDestination();
          source.connect(destination);
          destination.stream.getAudioTracks().forEach((track) => {
            stream.addTrack(track);
          });
        }
      } catch (e) {}

      const candidateTypes = [
        'video/mp4',
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      let selectedMime = 'video/mp4';
      for (const t of candidateTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
          selectedMime = t;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 3500000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const recordPromise = new Promise<CapturedMedia>((resolve, reject) => {
        recorder.onstop = () => {
          if (audioContext && audioContext.state !== 'closed') {
            audioContext.close().catch(() => {});
          }
          const finalBlob = new Blob(chunks, { type: selectedMime });
          const finalUrl = URL.createObjectURL(finalBlob);
          resolve({
            type: 'video',
            dataUrl: finalUrl,
            blob: finalBlob,
          });
        };
        recorder.onerror = (err) => reject(err);
      });

      recorder.start(100);
      renderVideo.play();

      const startTimeMs = Date.now();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTimeMs) / 1000;
        setExportProgress(Math.min(95, Math.floor((elapsed / CLIP_DURATION) * 100)));

        if (ctx && renderVideo) {
          const vw = renderVideo.videoWidth || size;
          const vh = renderVideo.videoHeight || size;
          const minDim = Math.min(vw, vh);
          const sx = (vw - minDim) / 2;
          const sy = (vh - minDim) / 2;
          ctx.drawImage(renderVideo, sx, sy, minDim, minDim, 0, 0, size, size);
        }

        if (elapsed >= CLIP_DURATION || renderVideo.currentTime >= startTime + CLIP_DURATION) {
          clearInterval(interval);
          renderVideo.pause();
          recorder.stop();
        }
      }, 33);

      const trimmedResult = await recordPromise;
      setExportProgress(100);
      onConfirmTrim(trimmedResult);
    } catch (err) {
      console.warn('Video trim fallback to full video:', err);
      onConfirmTrim({
        type: 'video',
        dataUrl: videoSrc,
        blob: videoFile,
      });
    } finally {
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
      setIsExporting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  const sliderWidthPct = duration > 0 ? Math.min(100, (CLIP_DURATION / duration) * 100) : 100;
  const sliderLeftPct = duration > 0 ? (startTime / duration) * 100 : 0;

  return (
    <div className="absolute inset-0 z-50 bg-[#0c060a]/95 backdrop-blur-xl flex flex-col justify-between items-center p-4 selection:bg-[#D9266E] selection:text-white">
      {/* Header Bar */}
      <div className="w-full max-w-sm flex items-center justify-between z-10 pt-2">
        <button
          onClick={onClose}
          disabled={isExporting}
          className="w-10 h-10 rounded-full bg-[#1b0c17] text-zinc-400 flex items-center justify-center border border-zinc-800 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-[#D9266E] flex items-center gap-1.5">
          <Scissors className="w-4 h-4 animate-bounce text-[#D9266E]" />
          <span>Chọn đoạn 5s phát thử</span>
        </span>

        <button
          onClick={() => setIsMuted((prev) => !prev)}
          className="w-10 h-10 rounded-full bg-[#1b0c17] text-zinc-300 flex items-center justify-center border border-zinc-800 hover:text-white"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-[#D9266E]" />}
        </button>
      </div>

      {/* Main Live Loop Video Preview (Exact 1:1 HD Square) */}
      <div className="relative w-full max-w-sm aspect-square my-auto rounded-[2.8rem] overflow-hidden bg-black shadow-2xl flex items-center justify-center border border-[#D9266E]/30">
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          playsInline
          muted={isMuted}
          controls={false}
          onTimeUpdate={handleTimeUpdate}
          className="w-full h-full object-cover rounded-[2.8rem]"
        />

        {/* Live Loop Time Overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md text-white font-extrabold text-xs px-4 py-1.5 rounded-full flex items-center space-x-2 border border-[#D9266E]/50 shadow-lg z-20">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D9266E] animate-ping" />
          <span>
            {formatTime(startTime)} - {formatTime(Math.min(duration, startTime + CLIP_DURATION))}
          </span>
        </div>

        {/* Exporting Spinner */}
        {isExporting && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center space-y-3 z-30">
            <div className="w-12 h-12 rounded-full border-4 border-[#D9266E] border-t-transparent animate-spin" />
            <span className="text-white text-xs font-bold">Đang cắt đoạn 5s HD... {exportProgress}%</span>
          </div>
        )}
      </div>

      {/* Interactive Filmstrip Slider Bar */}
      <div
        className="w-full max-w-sm space-y-3 pb-6 z-10 select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-zinc-400">
          <span>Kéo thanh trượt chọn 5s ✨</span>
          <span>Tổng video: {formatTime(duration)}</span>
        </div>

        {/* Timeline Track with Thumbnails */}
        <div
          ref={timelineRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="relative w-full h-16 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 cursor-pointer shadow-inner flex items-center"
        >
          {/* Filmstrip Frame Snapshots */}
          <div className="absolute inset-0 flex items-center justify-between opacity-60">
            {thumbnails.length > 0
              ? thumbnails.map((thumb, idx) => (
                  <img key={idx} src={thumb} alt="" className="h-full flex-1 object-cover" />
                ))
              : Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="h-full flex-1 bg-zinc-800/80 border-r border-zinc-900" />
                ))}
          </div>

          {/* Draggable 5-Second Highlight Window */}
          <div
            className="absolute top-0 bottom-0 border-2 border-[#D9266E] bg-[#D9266E]/25 rounded-xl shadow-[0_0_15px_rgba(217,38,110,0.6)] flex items-center justify-between transition-all duration-75"
            style={{
              left: `${sliderLeftPct}%`,
              width: `${Math.max(15, sliderWidthPct)}%`,
            }}
          >
            {/* Left Handle */}
            <div className="w-2.5 h-8 bg-[#D9266E] rounded-r-md ml-0.5 flex items-center justify-center">
              <div className="w-0.5 h-3 bg-white rounded-full" />
            </div>

            <span className="text-[10px] font-black text-white drop-shadow-md">5s</span>

            {/* Right Handle */}
            <div className="w-2.5 h-8 bg-[#D9266E] rounded-l-md mr-0.5 flex items-center justify-center">
              <div className="w-0.5 h-3 bg-white rounded-full" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 py-3.5 bg-[#18181C] hover:bg-[#262626] border border-zinc-800 text-white font-bold text-xs rounded-full flex items-center justify-center space-x-2 transition-all active:scale-95"
          >
            <X className="w-4 h-4 text-zinc-400" />
            <span>Hủy</span>
          </button>

          <button
            onClick={handleConfirmTrim}
            disabled={isExporting}
            className="flex-1 py-3.5 bg-gradient-to-r from-[#D9266E] via-[#BE185D] to-[#9F1239] text-white font-extrabold text-xs rounded-full flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_22px_rgba(217,38,110,0.6)]"
          >
            {isExporting ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <Scissors className="w-4 h-4" />
                <span>Xác nhận đoạn 5s ✂️</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
