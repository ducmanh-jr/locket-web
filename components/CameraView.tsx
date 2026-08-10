"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Profile } from '@/lib/types';
import { captureSquarePhoto, createVideoRecorder, CapturedMedia } from '@/lib/camera';
import {
  Camera,
  RotateCcw,
  Send,
  X,
  Check,
  CheckSquare,
  Square,
  Users,
  Sparkles,
  Music,
  VolumeX,
  Mic,
  Video,
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

  // Video Recording States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const [videoPlaying, setVideoPlaying] = useState<boolean>(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recorderRef = useRef<{ start: () => void; stop: () => Promise<CapturedMedia> } | null>(null);
  const startTimeRef = useRef<number>(0);

  // Kill any feed audio when camera opens, and clean up when it closes
  useEffect(() => {
    killGlobalAudio();
    return () => {
      killGlobalAudio();
    };
  }, []);

  // Auto-select all friends when friends prop finishes loading
  useEffect(() => {
    if (friends.length > 0 && selectedFriendIds.length === 0) {
      setSelectedFriendIds(friends.map((f) => f.id));
    }
  }, [friends]);

  // Initialize Camera Stream with Video + Audio (for Video Recording capability)
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
            audio: true, // Try microphone for original video audio
          });
        } catch (audioErr) {
          // Fallback to video-only if microphone permission is denied
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
          'Không thể truy cập camera. Vui lòng cấp quyền camera trong trình duyệt hoặc chạy qua HTTPS/localhost.'
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

  // Flip Front/Back Camera with 700ms Hardware Lock
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

  // Double Tap on Viewfinder to Flip Camera (Desktop Click)
  const handleViewfinderTap = () => {
    if (capturedMedia || isRecording) return;
    if (isTouchHandledRef.current) {
      isTouchHandledRef.current = false;
      return; // Ignore synthesized mouse click from mobile touch
    }
    const now = Date.now();
    if (now - lastTapTimeRef.current > 60 && now - lastTapTimeRef.current < 380) {
      triggerCameraFlip();
      lastTapTimeRef.current = 0;
    } else {
      lastTapTimeRef.current = now;
    }
  };

  // Double Tap on Viewfinder to Flip Camera (Mobile Touch)
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

  // Trigger Haptic Feedback
  const triggerHaptic = (ms = 35) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  };

  // Stop Recording Video & Save Clip
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
        setVideoPlaying(false);
        setCapturedMedia(media);
        setAudioOption('mute');
      } catch (e) {
        console.error('Failed to stop video recorder:', e);
      }
    }
  };

  // Start Video Recording
  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    triggerHaptic(60);
    setIsRecording(true);
    setRecordingProgress(0);
    startTimeRef.current = Date.now();

    const recorder = createVideoRecorder(mediaStreamRef.current);
    recorderRef.current = recorder;
    recorder.start();

    // 5-second max duration progress ticker (50ms interval)
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / 5000) * 100);
      setRecordingProgress(pct);

      if (elapsed >= 5000) {
        stopRecording();
      }
    }, 50);
  };

  // Press & Hold Shutter Button Handlers
  const handleShutterDown = () => {
    if (capturedMedia || isRecording) return;

    // Start 400ms hold timer to distinguish tap vs hold
    pressTimerRef.current = setTimeout(() => {
      startRecording();
    }, 400);
  };

  const handleShutterUp = async () => {
    if (capturedMedia) return;

    if (isRecording) {
      // User released finger while recording -> Stop recording
      await stopRecording();
    } else if (pressTimerRef.current) {
      // User released finger before 400ms -> Take Photo!
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

  // Retake Photo/Video
  const handleRetake = () => {
    killGlobalAudio();
    setCapturedMedia(null);
    setCaption('');
    setSelectedMusic(null);
    setAudioOption('original');
    setVideoPlaying(false);
    setIsRecording(false);
    setRecordingProgress(0);
  };

  // Toggle Friend Selection
  const handleToggleFriend = (id: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedFriendIds.length === friends.length) {
      setSelectedFriendIds([]);
    } else {
      setSelectedFriendIds(friends.map((f) => f.id));
    }
  };

  // Final Send Moment
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
          <Sparkles className="w-3.5 h-3.5 text-[#FFC700]" />
          {isRecording ? 'Đang quay video (max 5s)...' : 'Chụp Khoảnh Khắc Locket'}
        </span>

        {!capturedMedia ? (
          <button
            onClick={toggleFacingMode}
            disabled={isRecording}
            className="w-10 h-10 rounded-full bg-[#18181C] text-[#FFC700] flex items-center justify-center border border-zinc-800 hover:bg-[#262626] transition-colors disabled:opacity-40"
            title="Đổi camera trước/sau"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Main Viewfinder / Media Review */}
      <div className="relative w-full max-w-sm aspect-square my-auto rounded-[2.5rem] overflow-hidden bg-[#18181C] border border-zinc-800 shadow-2xl flex items-center justify-center">
        {cameraError ? (
          <div className="p-6 text-center text-red-400 text-xs">
            {cameraError}
          </div>
        ) : !capturedMedia ? (
          /* Live Camera Stream Video */
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
            {/* Double Tap Hint Badge */}
            {!isRecording && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] px-2.5 py-1 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                Nhấn đúp để đổi cam 🔄
              </div>
            )}
            {/* Live Recording Pulsing Banner Overlay */}
            {isRecording && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/90 text-white font-bold text-xs px-3.5 py-1 rounded-full flex items-center space-x-2 animate-pulse shadow-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span>Quay video: {(recordingProgress * 0.05).toFixed(1)}s / 5s</span>
              </div>
            )}
          </div>
        ) : capturedMedia.type === 'video' ? (
          /* Captured Video Review & 3 Audio Option Overlay */
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
              onLoadedData={(e) => {
                const v = e.currentTarget;
                v.play().then(() => {
                  setVideoPlaying(true);
                }).catch(() => {
                  v.muted = true;
                  v.play().then(() => setVideoPlaying(true)).catch(() => {});
                });
              }}
              onCanPlay={(e) => {
                const v = e.currentTarget;
                v.play().then(() => setVideoPlaying(true)).catch(() => {});
              }}
              className="w-full h-full object-cover rounded-[2.5rem]"
            />
            {/* 3 Audio Mode Selector Pill Top Bar */}
            <div className="absolute top-4 left-3 right-3 flex items-center justify-center space-x-1.5 bg-black/80 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-xl z-20">
              <button
                onClick={() => { killGlobalAudio(); setAudioOption('mute'); }}
                className={`flex-1 py-1 px-2.5 rounded-full text-[11px] font-bold flex items-center justify-center space-x-1 transition-all ${
                  audioOption === 'mute'
                    ? 'bg-[#FFC700] text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Im lặng 🔇</span>
              </button>

              <button
                onClick={() => { killGlobalAudio(); setAudioOption('original'); }}
                className={`flex-1 py-1 px-2.5 rounded-full text-[11px] font-bold flex items-center justify-center space-x-1 transition-all ${
                  audioOption === 'original'
                    ? 'bg-[#FFC700] text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
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
                    ? 'bg-[#FFC700] text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Thêm nhạc 🎵</span>
              </button>
            </div>

            {/* Selected Music Badge Display */}
            {audioOption === 'music' && selectedMusic && (
              <div className="absolute top-16 left-4 right-4 flex items-center justify-center">
                <div className="flex items-center space-x-2 bg-black/85 backdrop-blur-md border border-[#FFC700]/50 text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg max-w-[90%]">
                  <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-[#FFC700]/60 animate-spin">
                    <img src={selectedMusic.cover_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-semibold text-xs truncate">
                    {selectedMusic.title} • {selectedMusic.artist}
                  </span>
                </div>
              </div>
            )}

            {/* Caption Input Pill inside Video at Bottom Center */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Viết chú thích..."
                maxLength={60}
                className="w-[85%] bg-black/75 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-2xl border border-white/15 text-center placeholder-zinc-400 focus:outline-none focus:border-[#FFC700]"
              />
            </div>
          </div>
        ) : (
          /* Captured Photo Review & Caption Overlay */
          <div className="relative w-full h-full">
            <img
              src={capturedMedia.dataUrl}
              alt="Locket Snapshot"
              className="w-full h-full object-cover"
            />
            {/* Music Badge Sticker at Top Center of Photo */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-center">
              {selectedMusic ? (
                <div className="flex items-center space-x-2 bg-black/80 backdrop-blur-md border border-[#FFC700]/50 text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg max-w-[90%]">
                  <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-[#FFC700]/60 animate-spin">
                    <img src={selectedMusic.cover_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-semibold text-xs truncate">
                    {selectedMusic.title} • {selectedMusic.artist}
                  </span>
                  <button
                    onClick={() => { killGlobalAudio(); setSelectedMusic(null); }}
                    className="text-zinc-400 hover:text-white p-0.5"
                    title="Gỡ bài hát"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowMusicPicker(true)}
                  className="bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-[#FFC700] text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center space-x-1.5 transition-all active:scale-95 shadow-md"
                >
                  <Music className="w-3.5 h-3.5 text-[#FFC700]" />
                  <span>Thêm nhạc 🎵</span>
                </button>
              )}
            </div>

            {/* Caption Input Pill inside Photo at Bottom Center */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Viết chú thích..."
                maxLength={60}
                className="w-[85%] bg-black/75 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-2xl border border-white/15 text-center placeholder-zinc-400 focus:outline-none focus:border-[#FFC700]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls / Recipients Selector */}
      <div className="w-full max-w-sm pb-6 z-10">
        {!capturedMedia ? (
          /* Live Shutter Button (Tap = Photo, Hold >= 400ms = Record Video max 5s) */
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Animated Progress Ring for Video Recording */}
              {isRecording && (
                <svg className="absolute inset-0 w-20 h-20 -rotate-90 pointer-events-none z-20">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#EF4444"
                    strokeWidth="5"
                    fill="transparent"
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
                className={`w-20 h-20 rounded-full border-4 ${
                  isRecording ? 'border-red-500 scale-105' : 'border-[#FFC700]'
                } p-1.5 flex items-center justify-center shadow-locket-glow transition-all active:scale-90`}
                title="Nhấn để chụp ảnh • Nhấn giữ 2s để quay video (max 5s)"
              >
                <div
                  className={`w-full h-full ${
                    isRecording ? 'bg-red-500 rounded-2xl scale-75' : 'bg-white rounded-full'
                  } transition-all duration-200 shadow-inner`}
                />
              </button>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400 text-center">
              Chạm để chụp • Nhấn giữ để quay video (5s)
            </span>
          </div>
        ) : (
          /* Post Capture: Action Buttons (Retake & Send directly to Shared Room) */
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRetake}
                disabled={isSending}
                className="flex-1 py-3.5 bg-[#18181C] hover:bg-[#262626] border border-zinc-800 text-zinc-300 font-bold text-xs rounded-2xl flex items-center justify-center space-x-1.5 transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-zinc-400" />
                <span>Quay/Chụp lại</span>
              </button>

              <button
                onClick={handleSend}
                disabled={isSending}
                className="flex-1 py-3.5 bg-[#FFC700] hover:bg-[#FFD633] text-black font-extrabold text-xs rounded-2xl flex items-center justify-center space-x-1.5 shadow-locket-glow transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
      {/* Music Picker Modal */}
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
