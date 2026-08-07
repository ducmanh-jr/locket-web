"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMoments } from '@/lib/providers/MomentsProvider';
import { LocketHistoryGrid } from '@/components/LocketHistoryGrid';
import { ArrowLeft } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { filteredMoments } = useMoments();

  return (
    <div className="h-full flex flex-col justify-between bg-black text-white px-4 pt-3 pb-4 select-none">
      <div className="flex items-center space-x-3 pb-3 border-b border-zinc-900 flex-shrink-0">
        <button
          onClick={() => router.push('/profile')}
          className="p-1.5 rounded-full text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
        </button>
        <h1 className="text-white text-lg font-extrabold">Lịch sử Khoảnh khắc</h1>
      </div>

      <div className="flex-1 overflow-hidden mt-2">
        <LocketHistoryGrid
          moments={filteredMoments}
          onSelectMoment={(_moment) => {
            router.push('/');
          }}
          onOpenCamera={() => {
            router.push('/');
          }}
        />
      </div>
    </div>
  );
}
