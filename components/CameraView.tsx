"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Profile } from '@/lib/types';
import { captureSquarePhoto, CapturedImage } from '@/lib/camera';
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
} from 'lucide-react';

interface CameraViewProps {
  friends: Profile[];
  onClose: () => void;
  onSendMoment: (
    image: CapturedImage,
    caption: string,
    recipientIds: string[]
  ) => Promise<void>;
}

export const CameraView: React.FC<CameraViewProps> = ({
  friends,
  onClose,
  onSendMoment,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedImage | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(
    friends.map((f) => f.id)
  );
  const [isSending, setIsSending] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Auto-select all friends when friends prop finishes loading
  useEffect(() => {
    if (friends.length > 0 && selectedFriendIds.length === 0) {
      setSelectedFriendIds(friends.map((f) => f.id));
    }
  }, [friends]);

  // Initialize Camera Stream
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function startCamera() {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1080 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        currentStream = stream;
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

  // Capture Snapshot (With Front Camera Mirroring Fix!)
  const handleShutter = async () => {
    if (!videoRef.current) return;
    try {
      const isFront = facingMode === 'user';
      const captured = await captureSquarePhoto(videoRef.current, 0.85, 1080, isFront);
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
          Chụp Khoảnh Khắc Locket
        </span>

        {!capturedPhoto ? (
          <button
            onClick={toggleFacingMode}
            className="w-10 h-10 rounded-full bg-[#18181C] text-[#FFC700] flex items-center justify-center border border-zinc-800 hover:bg-[#262626] transition-colors"
            title="Đổi camera trước/sau"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Main Viewfinder / Photo Review */}
      <div className="relative w-full max-w-sm aspect-square my-auto rounded-[2.5rem] overflow-hidden bg-[#18181C] border border-zinc-800 shadow-2xl flex items-center justify-center">
        {cameraError ? (
          <div className="p-6 text-center text-red-400 text-xs">
            {cameraError}
          </div>
        ) : !capturedPhoto ? (
          /* Live Camera Stream Video */
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              facingMode === 'user' ? 'scale-x-[-1]' : ''
            }`}
          />
        ) : (
          /* Captured Photo Review & Caption Overlay */
          <div className="relative w-full h-full">
            <img
              src={capturedPhoto.dataUrl}
              alt="Locket Snapshot"
              className="w-full h-full object-cover"
            />
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
        {!capturedPhoto ? (
          /* Live Shutter Button */
          <div className="flex items-center justify-center">
            <button
              onClick={handleShutter}
              className="w-20 h-20 rounded-full border-4 border-[#FFC700] p-1.5 flex items-center justify-center shadow-locket-glow active:scale-90 transition-transform"
              title="Chụp ảnh"
            >
              <div className="w-full h-full bg-white rounded-full shadow-inner" />
            </button>
          </div>
        ) : (
          /* Post Capture: Select Friends & Send Buttons */
          <div className="space-y-3">
            {/* Friends Selector Pill List */}
            <div className="bg-[#18181C] border border-zinc-800 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-xs font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#FFC700]" />
                  Gửi đến: ({selectedFriendIds.length}/{friends.length})
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-[#FFC700] text-[11px] font-semibold hover:underline"
                >
                  {selectedFriendIds.length === friends.length
                    ? 'Bỏ chọn tất cả'
                    : 'Chọn tất cả'}
                </button>
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-1">
                {friends.map((friend) => {
                  const isSelected = selectedFriendIds.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      onClick={() => handleToggleFriend(friend.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 flex-shrink-0 ${
                        isSelected
                          ? 'bg-[#FFC700] text-black border-[#FFC700]'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                      }`}
                    >
                      <img
                        src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                        alt={friend.display_name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span>{friend.display_name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons: Retake & Send */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRetake}
                disabled={isSending}
                className="flex-1 py-3 bg-[#18181C] hover:bg-[#262626] border border-zinc-800 text-zinc-300 font-bold text-xs rounded-2xl flex items-center justify-center space-x-1.5 transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-zinc-400" />
                <span>Chụp lại</span>
              </button>

              <button
                onClick={handleSend}
                disabled={isSending || selectedFriendIds.length === 0}
                className="flex-1 py-3 bg-[#FFC700] hover:bg-[#FFD633] text-black font-bold text-xs rounded-2xl flex items-center justify-center space-x-1.5 shadow-locket-glow transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
};
