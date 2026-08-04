"use client";

import React, { useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { Database, AlertCircle, X } from 'lucide-react';

export const SupabaseConfigNotice: React.FC = () => {
  const isConnected = isSupabaseConfigured();
  const [showModal, setShowModal] = useState(false);

  // If live Supabase is connected, hide top banner on main feed to keep UI 100% clean like native Locket!
  if (isConnected) return null;

  return (
    <>
      <div className="w-full bg-[#18181C] border border-[#2C2C34] rounded-2xl px-3.5 py-2 mb-4 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-[#FFC700]" />
          <span className="text-zinc-300 font-medium">⚡ Chế độ Demo Tương Tác ($0 Server)</span>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="text-[#FFC700] hover:underline font-semibold text-[11px]"
        >
          Cấu hình DB
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
                <p className="text-zinc-400 text-xs">Đang chạy Demo offline mượt mà</p>
              </div>
            </div>

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
