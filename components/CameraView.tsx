"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Profile } from '@/lib/types';
import { captureSquarePhoto, createVideoRecorder, CapturedMedia } from '@/lib/camera';
import { LocketCaptionWidgetSelector } from '@/components/LocketCaptionWidgetSelector';
import {
  Camera,
  RotateCcw,
  Send,
  X,
  Sparkles,
  Music,
  VolumeX,
  Mic,
  ImagePlus,
} from 'lucide-react';
import { MusicTrack } from '@/lib/types';
import { MusicPickerModal } from './MusicPickerModal';
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

  // Gallery Upload (Locket Gold Feature)
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideoFile = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const media: CapturedMedia = {
        dataUrl,
        type: isVideoFile ? 'video' : 'photo',
        blob: file,
      };
      setCapturedMedia(media);
      setAudioOption('mute');
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

  const stopRecording = async () => {
    if (!isRecording && !recorderRef.current) return;
    setIsRecording(false);

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
    <div className="absolute inset-0 z-50 bg-black flex flex-col justify-between items-center p-4 selection:bg-[#FFC700] selection:text-black">
      {/* Top Header Bar */}
      <div className="w-full max-w-sm flex items-center justify-between z-10 pt-2">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[#18181C] text-zinc-400 flex items-center justify-center border border-zinc-800 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
          {isRecording ? 'Đang quay video (max 5s)...' : 'Chụp Khoảnh Khắc Locket Gold'}
        </span>

        {!capturedMedia ? (
          <button
            onClick={toggleFacingMode}
            disabled={isRecording}
            className="w-10 h-10 rounded-full bg-[#18181C] flex items-center justify-center border border-zinc-800 hover:bg-[#262626] transition-colors disabled:opacity-40"
            style={{ color: 'var(--theme-primary)' }}
            title="Đổi camera trước/sau"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Main Viewfinder / Media Review */}
      <div className="relative w-full max-w-sm aspect-square my-auto rounded-[2.5rem] overflow-hidden bg-[#18181C] locket-theme-card-border shadow-2xl flex items-center justify-center transition-all duration-300">
        {cameraError ? (
          <div className="p-6 text-center text-red-400 text-xs">
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
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] px-2.5 py-1 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                Nhấn đúp để đổi cam 🔄
              </div>
            )}
            {isRecording && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/90 text-white font-bold text-xs px-3.5 py-1 rounded-full flex items-center space-x-2 animate-pulse shadow-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span>Quay video: {(recordingProgress * 0.05).toFixed(1)}s / 5s</span>
              </div>
            )}
          </div>
        ) : capturedMedia.type === 'video' ? (
          <div className="relative w-full h-full bg-black">
            <video
              ref={previewVideoRef}
              src={capturedMedia.dataUrl}
              autoPlay
              loop
              playsInline
              muted={audioOption !== 'original'}
              controls={false}
              preload="auto"
              onCanPlay={(e) => e.currentTarget.play().catch(() => {})}
              className="w-full h-full object-cover rounded-[2.5rem]"
            />
            <div className="absolute top-4 left-3 right-3 flex items-center justify-center space-x-1.5 bg-black/80 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-xl z-20">
              <button
                onClick={() => { killGlobalAudio(); setAudioOption('mute'); }}
                className={`flex-1 py-1 px-2.5 rounded-full text-[11px] font-bold flex items-center justify-center space-x-1 transition-all ${
                  audioOption === 'mute'
                    ? 'bg-white text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
                style={audioOption === 'mute' ? { background: 'var(--theme-primary)', color: 'black' } : {}}
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Im lặng 🔇</span>
              </button>

              <button
                onClick={() => { killGlobalAudio(); setAudioOption('original'); }}
                className={`flex-1 py-1 px-2.5 rounded-full text-[11px] font-bold flex items-center justify-center space-x-1 transition-all ${
                  audioOption === 'original'
                    ? 'bg-white text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
                style={audioOption === 'original' ? { background: 'var(--theme-primary)', color: 'black' } : {}}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Âm gốc 🎙️</span>
              </button>

              <button
                onClick={() => {
                  setAudioOption('music');
                  setShowMusicPicker(true);
                }}
                className={`flex-1 py-1 px-2.5 rounded-full text-[11px] font-bold flex items-center justify-center space-x-1 transition-all ${
                  audioOption === 'music'
                    ? 'bg-white text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
                style={audioOption === 'music' ? { background: 'var(--theme-primary)', color: 'black' } : {}}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Thêm nhạc 🎵</span>
              </button>
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

      {/* Bottom Controls / Action Buttons */}
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

            <div className="flex items-center space-x-5">
              {/* Left: Gallery Upload Button (Gold Exclusive) */}
              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={isRecording}
                className="w-14 h-14 rounded-full bg-[#18181C] border-2 flex items-center justify-center flex-col space-y-0.5 active:scale-90 transition-all disabled:opacity-30 shadow-lg"
                style={{
                  borderColor: 'var(--theme-primary)',
                  boxShadow: '0 0 12px var(--theme-glow)',
                }}
                title="Tải ảnh/video từ thư viện 🖼️ (Locket Gold)"
              >
                <ImagePlus className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                <span
                  className="text-[7px] font-black tracking-wider leading-none"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  GOLD
                </span>
              </button>

              {/* Center: Shutter Button with Themed Progress Ring */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                {isRecording && (
                  <svg
                    className="absolute inset-0 w-20 h-20 -rotate-90 pointer-events-none z-20 gold-progress-ring"
                    viewBox="0 0 80 80"
                  >
                    <circle
                      cx="40" cy="40" r="36"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="5"
                      fill="transparent"
                    />
                    <circle
                      cx="40" cy="40" r="36"
                      stroke="var(--theme-primary)"
                      strokeWidth="5"
                      fill="transparent"
                      strokeLinecap="round"
                      strokeDasharray={226}
                      strokeDashoffset={226 - (226 * recordingProgress) / 100}
                      className="transition-all duration-75 ease-linear"
                    />
                  </svg>
                )}

                <button
                  onMouseDown={handleShutterDown}
                  onMouseUp={handleShutterUp}
                  onTouchStart={handleShutterDown}
                  onTouchEnd={handleShutterUp}
                  className={`w-20 h-20 rounded-full border-4 p-1.5 flex items-center justify-center transition-all active:scale-90 ${
                    isRecording ? 'scale-105' : ''
                  }`}
                  style={{
                    borderColor: 'var(--theme-primary)',
                    boxShadow: isRecording
                      ? '0 0 25px var(--theme-glow)'
                      : '0 0 18px var(--theme-glow)',
                  }}
                  title="Nhấn để chụp ảnh • Nhấn giữ để quay video (max 5s)"
                >
                  <div
                    className="w-full h-full transition-all duration-200"
                    style={isRecording ? {
                      background: 'var(--theme-primary)',
                      borderRadius: '30%',
                      transform: 'scale(0.72)',
                    } : {
                      background: 'white',
                      borderRadius: '9999px',
                    }}
                  />
                </button>
              </div>

              <div className="w-14 h-14" />
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
                <span>Quay/Chụp lại</span>
              </button>

              <button
                onClick={handleSend}
                disabled={isSending}
                className="flex-1 py-3.5 text-black font-extrabold text-xs rounded-full flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed gold-shimmer-overlay"
                style={{
                  background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
                  boxShadow: '0 0 20px var(--theme-glow)',
                }}
              >
                {isSending ? (
                  <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 fill-black" />
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
    </div>
  );
};
