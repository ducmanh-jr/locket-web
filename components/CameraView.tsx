"use client";

import React, { useRef, useState, useEffect } from 'react';
import { captureSquarePhoto, CapturedImage } from '@/lib/camera';
import { Profile } from '@/lib/types';
import { FriendSelector } from './FriendSelector';
import { RefreshCw, Flashlight, Grid, X, Send, Camera as CameraIcon } from 'lucide-react';

interface CameraViewProps {
  friends: Profile[];
  onClose: () => void;
  onSendMoment: (image: CapturedImage, caption: string, recipientIds: string[]) => Promise<void>;
}

export const CameraView: React.FC<CameraViewProps> = ({
  friends,
  onClose,
  onSendMoment,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedImage | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(friends.map((f) => f.id));
  const [showFriendSelector, setShowFriendSelector] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Initialize Camera Stream
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function startCamera() {
      try {
        setCameraError(null);
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1080 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = newStream;
        setStream(newStream);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err: any) {
        console.error('Error starting camera:', err);
        setCameraError(
          'Không thể truy cập camera. Vui lòng cấp quyền camera trong trình duyệt hoặc chạy qua HTTPS/localhost.'
        );
      }
    }

    if (!capturedPhoto) {
      startCamera();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, capturedPhoto]);

  // Flip Front/Back Camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Capture Snapshot
  const handleShutter = async () => {
    if (!videoRef.current) return;
    try {
      const captured = await captureSquarePhoto(videoRef.current, 0.85, 1080);
      setCapturedPhoto(captured);
    } catch (err) {
      console.error('Capture failed:', err);
    }
  };

  // Retake Photo
  const handleRetake = () => {
    setCapturedPhoto(null);
    setCaption('');
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

  // Final Send
  const handleSend = async () => {
    if (!capturedPhoto || selectedFriendIds.length === 0) return;
    setIsSending(true);
    try {
      await onSendMoment(capturedPhoto, caption, selectedFriendIds);
      onClose();
    } catch (e) {
      console.error('Failed to send moment', e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0E0E10] flex flex-col items-center justify-between p-4 max-w-md mx-auto">
      {/* Flash Overlay Simulation */}
      {isFlashOn && !capturedPhoto && (
        <div className="absolute inset-0 bg-white/30 pointer-events-none z-40 transition-opacity" />
      )}

      {/* Top Bar */}
      <div className="w-full flex items-center justify-between pt-2 px-2 z-30">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[#18181C] text-white flex items-center justify-center border border-[#2C2C34]"
        >
          <X className="w-5 h-5" />
        </button>

        {!capturedPhoto && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsFlashOn(!isFlashOn)}
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                isFlashOn
                  ? 'bg-[#FFC700] text-[#0E0E10] border-[#FFC700]'
                  : 'bg-[#18181C] text-white border-[#2C2C34]'
              }`}
              title="Đèn Flash"
            >
              <Flashlight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                showGrid
                  ? 'bg-[#FFC700] text-[#0E0E10] border-[#FFC700]'
                  : 'bg-[#18181C] text-white border-[#2C2C34]'
              }`}
              title="Lưới Căn Chỉnh"
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Viewfinder / Photo Container */}
      <div className="relative w-full aspect-square my-auto rounded-[2.5rem] overflow-hidden bg-[#18181C] border-2 border-[#2C2C34] shadow-2xl flex items-center justify-center">
        {!capturedPhoto ? (
          <>
            {/* Live Video View */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />

            {/* Grid Overlay lines */}
            {showGrid && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/10">
                <div className="border border-white/10" />
                <div className="border border-white/10" />
                <div className="border border-white/10" />
                <div className="border border-white/10" />
                <div className="border border-white/10" />
                <div className="border border-white/10" />
                <div className="border border-white/10" />
                <div className="border border-white/10" />
                <div className="border border-white/10" />
              </div>
            )}

            {/* Camera Error Display fallback */}
            {cameraError && (
              <div className="absolute inset-0 bg-[#18181C]/90 p-6 flex flex-col items-center justify-center text-center">
                <CameraIcon className="w-12 h-12 text-[#FFC700] mb-3" />
                <p className="text-white text-sm font-medium">{cameraError}</p>
              </div>
            )}
          </>
        ) : (
          /* Captured Preview Image */
          <div className="relative w-full h-full">
            <img
              src={capturedPhoto.dataUrl}
              alt="Snapshot preview"
              className="w-full h-full object-cover"
            />
            {/* Caption Input Overlay */}
            <div className="absolute bottom-4 left-4 right-4 text-center z-20">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Viết chú thích..."
                maxLength={100}
                className="w-full bg-[#0E0E10]/80 backdrop-blur-md border border-white/20 text-white text-center text-sm font-medium px-4 py-2.5 rounded-2xl focus:outline-none focus:border-[#FFC700] placeholder-zinc-400 shadow-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="w-full pb-8 px-4 z-30 flex flex-col items-center">
        {!capturedPhoto ? (
          /* Shutter Controls */
          <div className="w-full flex items-center justify-between px-6">
            <div className="w-12" /> {/* Spacer */}
            <button
              onClick={handleShutter}
              className="w-20 h-20 rounded-full border-4 border-[#FFC700] p-1.5 flex items-center justify-center shadow-locket-glow active:scale-90 transition-transform"
            >
              <div className="w-full h-full bg-[#FFC700] rounded-full" />
            </button>
            <button
              onClick={toggleFacingMode}
              className="w-12 h-12 rounded-full bg-[#18181C] text-white flex items-center justify-center border border-[#2C2C34] hover:bg-[#222228]"
              title="Đổi camera"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Captured Action Buttons */
          <div className="w-full flex flex-col space-y-3">
            {/* Recipient Trigger Pill */}
            <button
              onClick={() => setShowFriendSelector(true)}
              className="w-full py-2.5 px-4 bg-[#18181C] border border-[#2C2C34] rounded-2xl text-zinc-300 text-sm font-semibold flex items-center justify-between hover:border-[#FFC700]"
            >
              <span>Gửi đến: {selectedFriendIds.length} người bạn</span>
              <span className="text-[#FFC700] font-bold text-xs">Thay đổi &gt;</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRetake}
                className="flex-1 py-3.5 px-4 bg-[#18181C] text-white font-semibold rounded-2xl border border-[#2C2C34] hover:bg-[#222228]"
              >
                Chụp lại
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || selectedFriendIds.length === 0}
                className="flex-1 py-3.5 px-4 bg-[#FFC700] hover:bg-[#FFD633] text-[#0E0E10] font-bold rounded-2xl shadow-locket-glow active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>{isSending ? 'Đang gửi...' : 'Gửi ngay'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recipient Selector Modal */}
      {showFriendSelector && (
        <FriendSelector
          friends={friends}
          selectedFriendIds={selectedFriendIds}
          onToggleFriend={handleToggleFriend}
          onSelectAll={handleSelectAll}
          onClose={() => setShowFriendSelector(false)}
          onConfirmSend={() => {
            setShowFriendSelector(false);
            handleSend();
          }}
          isSending={isSending}
        />
      )}
    </div>
  );
};
