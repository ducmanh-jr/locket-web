"use client";

import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(true);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in PWA standalone mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

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
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      {/* Smart Banner Top/Bottom */}
      <div className="w-full bg-gradient-to-r from-[#18181C] via-[#222228] to-[#18181C] border border-[#FFC700]/30 rounded-2xl p-3.5 mb-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFC700] flex items-center justify-center text-[#0E0E10] font-black text-xl shadow-locket-glow">
            L
          </div>
          <div>
            <h4 className="text-white text-sm font-bold leading-tight">Cài đặt LocketWeb</h4>
            <p className="text-zinc-400 text-xs mt-0.5">Trải nghiệm như App thật trên Màn hình chính</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleInstallClick}
            className="py-1.5 px-3 bg-[#FFC700] hover:bg-[#FFD633] text-[#0E0E10] font-bold text-xs rounded-xl shadow-sm transition-transform active:scale-95 flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải ngay</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Step-by-Step Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#18181C] border border-[#2C2C34] rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FFC700]/20 border border-[#FFC700]/40 text-[#FFC700] flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-white text-lg font-bold mb-2">Thêm vào Màn hình chính (iOS)</h3>
            <p className="text-zinc-400 text-xs mb-6">
              Trên iPhone/iPad, làm theo 2 bước đơn giản dưới đây để dùng LocketWeb full màn hình:
            </p>

            <div className="space-y-4 text-left mb-6">
              <div className="flex items-start space-x-3 bg-[#222228] p-3 rounded-2xl border border-[#2C2C34]">
                <div className="w-7 h-7 rounded-full bg-[#FFC700] text-[#0E0E10] font-bold flex items-center justify-center text-xs flex-shrink-0">
                  1
                </div>
                <div className="text-xs text-zinc-300">
                  Nhấp vào nút <span className="text-[#FFC700] font-semibold">Chia sẻ</span>{' '}
                  <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> ở thanh công cụ Safari phía dưới.
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-[#222228] p-3 rounded-2xl border border-[#2C2C34]">
                <div className="w-7 h-7 rounded-full bg-[#FFC700] text-[#0E0E10] font-bold flex items-center justify-center text-xs flex-shrink-0">
                  2
                </div>
                <div className="text-xs text-zinc-300">
                  Cuộn xuống và chọn <span className="text-[#FFC700] font-semibold">Thêm vào Màn hình chính</span>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-zinc-300" />.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 bg-[#FFC700] text-[#0E0E10] font-bold rounded-2xl"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
