"use client";

import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';

interface PWAInstallBannerProps {
  forceDisplay?: boolean;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ forceDisplay = false }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in PWA standalone mode
    const isStandaloneMode =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true);
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const iosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(iosDevice);
    }

    // Listen for Android/Desktop PWA prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowIOSModal(true);
    }
  };

  if (!forceDisplay) {
    if (isStandalone || dismissed) return null;
    if (!deferredPrompt && !isIOS) return null;
  }

  return (
    <>
      {/* Sleek Minimalist Glassmorphic PWA Banner */}
      <div className="w-full bg-[#160b13]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex items-center justify-between transition-all">
        <div className="flex items-center space-x-3 min-w-0 pr-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D9266E] to-[#9F1239] text-white font-bold text-base shadow-sm flex items-center justify-center flex-shrink-0 border border-white/15">
            L
          </div>
          <div className="text-left min-w-0">
            <h4 className="text-white text-xs font-semibold leading-tight truncate">Cài đặt LocketWeb</h4>
            <p className="text-zinc-400 text-[11px] mt-0.5 truncate">Dùng mượt hơn trên Màn hình chính</p>
          </div>
        </div>

        <div className="flex items-center flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="py-1.5 px-3.5 bg-[#D9266E] hover:bg-[#BE185D] text-white font-medium text-xs rounded-full shadow-md transition-all active:scale-95 flex items-center space-x-1.5 border border-white/15"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải ngay</span>
          </button>
        </div>
      </div>

      {/* iOS Step-by-Step Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#18181C] border border-[#FF2A85]/40 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FF2A85]/20 border border-[#FF2A85]/40 text-[#FF2A85] flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-white text-lg font-bold mb-2">Thêm vào Màn hình chính (iOS)</h3>
            <p className="text-zinc-400 text-xs mb-6">
              Trên iPhone/iPad, làm theo 2 bước đơn giản dưới đây để dùng LocketWeb full màn hình:
            </p>

            <div className="space-y-4 text-left mb-6">
              <div className="flex items-start space-x-3 bg-[#222228] p-3 rounded-2xl border border-zinc-800">
                <div className="w-7 h-7 rounded-full bg-[#FF2A85] text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                  1
                </div>
                <div className="text-xs text-zinc-300">
                  Nhấp vào nút <span className="text-[#FF2A85] font-semibold">Chia sẻ</span>{' '}
                  <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> ở thanh công cụ Safari phía dưới.
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-[#222228] p-3 rounded-2xl border border-zinc-800">
                <div className="w-7 h-7 rounded-full bg-[#FF2A85] text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                  2
                </div>
                <div className="text-xs text-zinc-300">
                  Cuộn xuống và chọn <span className="text-[#FF2A85] font-semibold">Thêm vào Màn hình chính</span>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-zinc-300" />.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 bg-[#FF2A85] text-white font-bold rounded-2xl shadow-[0_0_15px_rgba(255,42,133,0.5)]"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
