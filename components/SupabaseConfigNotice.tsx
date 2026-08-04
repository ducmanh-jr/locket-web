"use client";

import React, { useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { Database, CheckCircle2, AlertCircle, Terminal, X, RefreshCw } from 'lucide-react';

export const SupabaseConfigNotice: React.FC = () => {
  const isConnected = isSupabaseConfigured();
  const [showModal, setShowModal] = useState(false);

  const urlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const keyEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <>
      <div className="w-full bg-[#18181C] border border-[#2C2C34] rounded-2xl px-3.5 py-2 mb-4 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#FFC700]" />
          )}
          <span className="text-zinc-300 font-medium">
            {isConnected ? '🟢 Supabase Live Connected' : '⚡ Chế độ Demo Tương Tác ($0 Server)'}
          </span>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="text-[#FFC700] hover:underline font-semibold text-[11px]"
        >
          {isConnected ? 'Chi tiết DB' : 'Cấu hình Supabase'}
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#18181C] border border-[#2C2C34] rounded-3xl p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FFC700]/20 text-[#FFC700] flex items-center justify-center border border-[#FFC700]/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white text-base font-bold">Trạng thái Cấu hình Supabase</h3>
                <p className="text-zinc-400 text-xs">
                  {isConnected ? 'Dữ liệu lưu trực tiếp Cloud Supabase' : 'Đang chạy Demo offline mượt mà'}
                </p>
              </div>
            </div>

            <div className="bg-[#222228] p-4 rounded-2xl border border-[#2C2C34] mb-4 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-zinc-700/50">
                <span className="text-zinc-400">SUPABASE_URL:</span>
                <span className="font-mono text-zinc-200">
                  {urlEnv ? '✓ Đã kết nối' : 'Chưa nhận trên Vercel'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400">SUPABASE_ANON_KEY:</span>
                <span className="font-mono text-zinc-200">
                  {keyEnv ? '✓ Đã kết nối' : 'Chưa nhận trên Vercel'}
                </span>
              </div>
            </div>

            {!isConnected && (
              <div className="bg-[#FFC700]/10 border border-[#FFC700]/30 p-3 rounded-xl mb-4 text-xs text-[#FFC700]">
                💡 <strong>Mẹo:</strong> Nếu bạn vừa điền Biến môi trường trên Vercel, hãy vào Vercel Dashboard ➔ Deployments ➔ Bấm <strong>Redeploy</strong> để Vercel cập nhật chìa khóa mới!
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-[#FFC700] text-[#0E0E10] font-bold rounded-2xl"
            >
              Đã hiểu & Tiếp tục
            </button>
          </div>
        </div>
      )}
    </>
  );
};
