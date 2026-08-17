"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Profile } from '@/lib/types';
import { captureSquarePhoto, createVideoRecorder, CapturedMedia } from '@/lib/camera';
import { LocketCaptionWidgetSelector } from '@/components/LocketCaptionWidgetSelector';
import {
  RotateCcw,
  Send,
  X,
  Sparkles,
  Music,
  ImagePlus,
} from 'lucide-react';
import { MusicTrack } from '@/lib/types';
import { MusicPickerModal } from './MusicPickerModal';
import { LocketVideoTrimmerModal } from './LocketVideoTrimmerModal';
import { killGlobalAudio } from '@/lib/audioPlayer';

interface CameraViewProps {
  friends: Profile[];
  onClose: () => void;
  onSendMoment: (
    media: CapturedMedia,
    caption: string,
    recipientIds: string[],
    music?: MusicTrack,
    audioOption?: 'mute' | 'original' | 'music'
  ) => Promise<void>;
}

export const CameraView: React.FC<CameraViewProps> = ({
  friends,
  onClose,
  onSendMoment,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia | null>(null);
  const [audioOption, setAudioOption] = useState<'mute' | 'original' | 'music'>('original');
  const [caption, setCaption] = useState<string>('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(
    friends.map((f) => f.id)
  );
  const [isSending, setIsSending] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState<boolean>(false);
  const [trimmerTarget, setTrimmerTarget] = useState<{ src: string; file: File } | null>(null);

  // Gallery Upload
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideoFile = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;

      if (isVideoFile) {
        // Open 5-second interactive video trimmer modal
        setTrimmerTarget({ src: dataUrl, file });
      } else {
        const media: CapturedMedia = {
          dataUrl,
          type: 'photo',
          blob: file,
        };
        setCapturedMedia(media);
        setAudioOption('mute');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Video Recording States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recorderRef = useRef<{ start: () => void; stop: () => Promise<CapturedMedia> } | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    killGlobalAudio();
    return () => {
      killGlobalAudio();
    };
  }, []);

  useEffect(() => {
    if (friends.length > 0 && selectedFriendIds.length === 0) {
      setSelectedFriendIds(friends.map((f) => f.id));
    }
  }, [friends]);

  useEffect(() => {
    async function startCamera() {
      try {
        setCameraError(null);
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 1080 },
              height: { ideal: 1080 },
            },
            audio: true,
          });
        } catch (audioErr) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 1080 },
              height: { ideal: 1080 },
            },
            audio: false,
          });
        }

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error starting camera:', err);
        setCameraError(
          'Không thể truy cập camera. Vui lòng cấp quyền camera trong trình duyệt.'
        );
      }
    }

    if (!capturedMedia) {
      startCamera();
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [facingMode, capturedMedia]);

  const isFlippingRef = useRef<boolean>(false);

  const toggleFacingMode = () => {
    if (isFlippingRef.current) return;
    isFlippingRef.current = true;
    setTimeout(() => {
      isFlippingRef.current = false;
    }, 700);

    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const lastTapTimeRef = useRef<number>(0);
  const isTouchHandledRef = useRef<boolean>(false);

  const triggerCameraFlip = () => {
    toggleFacingMode();
    triggerHaptic(50);
  };

  const handleViewfinderTap = () => {
    if (capturedMedia || isRecording) return;
    if (isTouchHandledRef.current) {
      isTouchHandledRef.current = false;
      return;
    }
    const now = Date.now();
    if (now - lastTapTimeRef.current > 60 && now - lastTapTimeRef.current < 380) {
      triggerCameraFlip();
      lastTapTimeRef.current = 0;
    } else {
      lastTapTimeRef.current = now;
    }
  };

  const handleTouchEndViewfinder = (e: React.TouchEvent) => {
    if (capturedMedia || isRecording) return;
    const now = Date.now();
    if (now - lastTapTimeRef.current > 60 && now - lastTapTimeRef.current < 380) {
      e.preventDefault();
      isTouchHandledRef.current = true;
      triggerCameraFlip();
      lastTapTimeRef.current = 0;
    } else {
      lastTapTimeRef.current = now;
    }
  };

  const triggerHaptic = (ms = 35) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  };

  const [posterSnapshot, setPosterSnapshot] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);

  const stopRecording = async () => {
    if (!isRecording && !recorderRef.current) return;
    setIsRecording(false);

    // Capture instant snapshot of current video stream frame to eliminate any black screen flash!
    if (videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        const size = 720;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          if (facingMode === 'user') {
            ctx.translate(size, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(videoRef.current, 0, 0, size, size);
          setPosterSnapshot(canvas.toDataURL('image/jpeg', 0.88));
        }
      } catch (e) {}
    }

    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    triggerHaptic(50);

    if (recorderRef.current) {
      try {
        const media = await recorderRef.current.stop();
        recorderRef.current = null;
        setIsVideoReady(false);
        setCapturedMedia(media);
        setAudioOption('mute');
      } catch (e) {
        console.error('Failed to stop video recorder:', e);
      }
    }
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    triggerHaptic(60);
    setIsRecording(true);
    setRecordingProgress(0);
    startTimeRef.current = Date.now();

    const recorder = createVideoRecorder(mediaStreamRef.current);
    recorderRef.current = recorder;
    recorder.start();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / 5000) * 100);
      setRecordingProgress(pct);

      if (elapsed >= 5000) {
        stopRecording();
      }
    }, 50);
  };

  const handleShutterDown = () => {
    if (capturedMedia || isRecording) return;
    pressTimerRef.current = setTimeout(() => {
      startRecording();
    }, 400);
  };

  const handleShutterUp = async () => {
    if (capturedMedia) return;

    if (isRecording) {
      await stopRecording();
    } else if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;

      if (!videoRef.current) return;
      triggerHaptic(35);
      try {
        const isFront = facingMode === 'user';
        const photo = await captureSquarePhoto(videoRef.current, 0.85, 1080, isFront);
        setCapturedMedia(photo);
        setAudioOption('mute');
      } catch (err) {
        console.error('Capture photo failed:', err);
      }
    }
  };

  const handleRetake = () => {
    killGlobalAudio();
    setCapturedMedia(null);
    setPosterSnapshot(null);
    setIsVideoReady(false);
    setCaption('');
    setSelectedMusic(null);
    setAudioOption('original');
    setIsRecording(false);
    setRecordingProgress(0);
  };

  const handleSend = async () => {
    if (!capturedMedia) return;
    setIsSending(true);
    try {
      await onSendMoment(
        capturedMedia,
        caption,
        selectedFriendIds.length > 0 ? selectedFriendIds : ['all'],
        audioOption === 'music' ? (selectedMusic || undefined) : undefined,
        audioOption
      );
      onClose();
    } catch (err) {
      console.error('Failed to send moment:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#0c060a] flex flex-col justify-between items-center p-4 selection:bg-[#D9266E] selection:text-white">
      {/* Top Header Bar */}
      <div className="w-full max-w-sm flex items-center justify-between z-10 pt-2">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[#1c0c16]/80 backdrop-blur-md text-zinc-400 flex items-center justify-center border border-white/10 hover:text-white transition-all active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-[#1c0c16]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-[#D9266E]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">
            {isRecording ? 'Đang quay (max 5s)...' : 'Khoảnh khắc Locket'}
          </span>
        </div>

        <div className="w-10" />
      </div>

      {/* Main Viewfinder Box */}
      <div className="relative w-full max-w-sm aspect-square my-auto rounded-[2.8rem] overflow-hidden bg-black/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-center border border-white/10">
        {/* Ultra-Thin Refined Dark Rose Recording Progress Border (1.8px) */}
        {isRecording && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect
              x="1"
              y="1"
              width="98"
              height="98"
              rx="12"
              ry="12"
              fill="none"
              stroke="#D9266E"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeDasharray={370}
              strokeDashoffset={370 - (370 * recordingProgress) / 100}
              className="transition-all duration-75 ease-linear"
              style={{ filter: 'drop-shadow(0 0 6px rgba(217, 38, 110, 0.85))' }}
            />
          </svg>
        )}
        {cameraError ? (
          <div className="p-6 text-center text-red-400 text-xs font-semibold">
            {cameraError}
          </div>
        ) : !capturedMedia ? (
          <div
            onClick={handleViewfinderTap}
            onTouchEnd={handleTouchEndViewfinder}
            className="relative w-full h-full cursor-pointer group select-none"
            title="Chạm đúp để đổi camera trước/sau 🔄"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />
            {!isRecording && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 text-white/80 text-[10px] font-semibold px-3 py-1 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                Nhấn đúp để đổi cam 🔄
              </div>
            )}
            {isRecording && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#D9266E] text-white font-extrabold text-xs px-4 py-1.5 rounded-full flex items-center space-x-2 animate-pulse shadow-[0_0_15px_rgba(217,38,110,0.7)]">
                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>{(recordingProgress * 0.05).toFixed(1)}s / 5s</span>
              </div>
            )}
          </div>
        ) : capturedMedia.type === 'video' ? (
          <div className="relative w-full h-full bg-black">
            {/* Zero-Black-Screen Snapshot Poster Layer */}
            {posterSnapshot && (
              <img
                src={posterSnapshot}
                alt=""
                className={`absolute inset-0 w-full h-full object-cover rounded-[2.8rem] z-10 pointer-events-none transition-opacity duration-300 ${
                  isVideoReady ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}

            <video
              ref={previewVideoRef}
              src={capturedMedia.dataUrl}
              autoPlay
              loop
              playsInline
              muted={true}
              controls={false}
              preload="auto"
              onCanPlay={() => setIsVideoReady(true)}
              onPlaying={() => setIsVideoReady(true)}
              className="w-full h-full object-cover rounded-[2.8rem]"
            />

            {/* Clean Music Selector Pill Button at top of video preview */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
              {selectedMusic ? (
                <div className="flex items-center space-x-2 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#D9266E]/60 shadow-xl">
                  <Music className="w-3.5 h-3.5 text-[#D9266E] animate-spin" />
                  <span className="text-white text-xs font-bold truncate max-w-[140px]">
                    {selectedMusic.title}
                  </span>
                  <button
                    onClick={() => {
                      killGlobalAudio();
                      setSelectedMusic(null);
                      setAudioOption('mute');
                    }}
                    className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-[10px] ml-1"
                    title="Xóa nhạc"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAudioOption('music');
                    setShowMusicPicker(true);
                  }}
                  className="flex items-center space-x-2 bg-black/75 backdrop-blur-md hover:bg-black/90 px-4 py-1.5 rounded-full border border-white/20 shadow-xl active:scale-95 transition-all text-white font-bold text-xs"
                >
                  <Music className="w-3.5 h-3.5 text-[#D9266E]" />
                  <span>Thêm nhạc 🎵</span>
                </button>
              )}
            </div>

            <div className="absolute bottom-2 left-2 right-2 flex justify-center z-20">
              <LocketCaptionWidgetSelector value={caption} onChange={setCaption} />
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <img
              src={capturedMedia.dataUrl}
              alt="Locket Snapshot"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 right-4 flex justify-center z-20">
              <LocketCaptionWidgetSelector value={caption} onChange={setCaption} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-sm pb-6 z-10">
        {!capturedMedia ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleGalleryUpload}
            />

            <div className="w-full flex items-center justify-around px-4">
              {/* Left: Gallery Icon */}
              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={isRecording}
                className="w-12 h-12 flex items-center justify-center text-white/70 hover:text-white active:scale-90 transition-all disabled:opacity-30 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
                title="Tải ảnh/video từ thư viện 🖼️"
              >
                <ImagePlus className="w-6 h-6" />
              </button>

              {/* Center: Sleek Minimalist Dark Rose Shutter Button + Ultra-Thin Progress Ring */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                {isRecording && (
                  <svg
                    className="absolute inset-0 w-20 h-20 -rotate-90 pointer-events-none z-20"
                    viewBox="0 0 80 80"
                  >
                    <circle
                      cx="40" cy="40" r="36"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="2"
                      fill="transparent"
                    />
                    <circle
                      cx="40" cy="40" r="36"
                      stroke="#D9266E"
                      strokeWidth="2.2"
                      fill="transparent"
                      strokeLinecap="round"
                      strokeDasharray={226}
                      strokeDashoffset={226 - (226 * recordingProgress) / 100}
                      className="transition-all duration-75 ease-linear"
                      style={{ filter: 'drop-shadow(0 0 5px #D9266E)' }}
                    />
                  </svg>
                )}

                <button
                  onMouseDown={handleShutterDown}
                  onMouseUp={handleShutterUp}
                  onTouchStart={handleShutterDown}
                  onTouchEnd={handleShutterUp}
                  className={`w-20 h-20 rounded-full border-2 border-white/80 p-1.5 flex items-center justify-center transition-all active:scale-90 shadow-[0_0_20px_rgba(217,38,110,0.4)] ${
                    isRecording ? 'scale-105 border-[#D9266E] shadow-[0_0_25px_rgba(217,38,110,0.7)]' : ''
                  }`}
                  title="Nhấn để chụp ảnh • Nhấn giữ để quay video (max 5s)"
                >
                  <div
                    className="w-full h-full transition-all duration-200"
                    style={isRecording ? {
                      background: '#D9266E',
                      borderRadius: '30%',
                      transform: 'scale(0.72)',
                    } : {
                      background: 'rgba(255,255,255,0.4)',
                      borderRadius: '9999px',
                    }}
                  />
                </button>
              </div>

              {/* Right: Flip Camera Icon */}
              <button
                onClick={triggerCameraFlip}
                disabled={isRecording}
                className="w-12 h-12 flex items-center justify-center text-white/70 hover:text-white active:scale-90 transition-all disabled:opacity-30 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
                title="Đổi camera trước/sau 🔄"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
            </div>

            <span className="text-[11px] font-semibold text-zinc-400 text-center">
              {isRecording
                ? `⏺ Đang quay… ${(recordingProgress * 0.05).toFixed(1)}s / 5s`
                : 'Chạm để chụp • Giữ để quay video (5s)'}
            </span>
          </div>
        ) : (
          <div className="space-y-3 px-2">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRetake}
                disabled={isSending}
                className="flex-1 py-3.5 bg-[#18181C] hover:bg-[#262626] border border-zinc-800 text-white font-bold text-xs rounded-full flex items-center justify-center space-x-2 shadow-md transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-zinc-400" />
                <span>Chụp/Quay lại</span>
              </button>

              <button
                onClick={handleSend}
                disabled={isSending}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#D9266E] via-[#BE185D] to-[#9F1239] text-white font-extrabold text-xs rounded-full flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_22px_rgba(217,38,110,0.6)]"
              >
                {isSending ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 fill-white" />
                    <span>Gửi khoảnh khắc 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {showMusicPicker && (
        <MusicPickerModal
          selectedTrackId={selectedMusic?.id}
          onSelectMusic={(track) => {
            setSelectedMusic(track);
            setAudioOption('music');
          }}
          onClose={() => setShowMusicPicker(false)}
        />
      )}

      {trimmerTarget && (
        <LocketVideoTrimmerModal
          videoSrc={trimmerTarget.src}
          videoFile={trimmerTarget.file}
          onConfirmTrim={(trimmedMedia) => {
            setCapturedMedia(trimmedMedia);
            setAudioOption('original');
            setTrimmerTarget(null);
          }}
          onClose={() => setTrimmerTarget(null)}
        />
      )}
    </div>
  );
};
