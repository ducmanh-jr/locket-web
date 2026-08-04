"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { CameraView } from '@/components/CameraView';
import { DEMO_FRIENDS, DEMO_CURRENT_USER, getStoredDemoMoments, addDemoMoment } from '@/lib/demoStore';
import { Moment } from '@/lib/types';
import { Grid, Calendar, X, Heart, MessageSquare } from 'lucide-react';
import { CapturedImage } from '@/lib/camera';

export default function HistoryPage() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [showCamera, setShowCamera] = useState<boolean>(false);

  useEffect(() => {
    setMoments(getStoredDemoMoments());
  }, []);

  const handleSendMoment = async (
    image: CapturedImage,
    caption: string,
    recipientIds: string[]
  ) => {
    const newMoment: Moment = {
      id: `moment-${Date.now()}`,
      sender_id: DEMO_CURRENT_USER.id,
      sender: DEMO_CURRENT_USER,
      media_url: image.dataUrl,
      caption: caption,
      created_at: new Date().toISOString(),
      reactions: [],
    };
    const updated = addDemoMoment(newMoment);
    setMoments(updated);
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-4 pb-28">
      <div>
        {/* Header */}
        <div className="flex items-center space-x-2 mb-4">
          <Grid className="w-6 h-6 text-[#FFC700]" />
          <h1 className="text-white text-xl font-extrabold">Lịch sử Khoảnh khắc</h1>
        </div>

        {/* Gallery Grid 3x3 */}
        {moments.length === 0 ? (
          <div className="bg-[#18181C] border border-[#2C2C34] rounded-3xl p-8 text-center my-8">
            <p className="text-zinc-400 text-sm">Chưa có ảnh nào trong lịch sử.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {moments.map((moment) => (
              <div
                key={moment.id}
                onClick={() => setSelectedMoment(moment)}
                className="relative aspect-square rounded-2xl overflow-hidden bg-[#18181C] border border-[#2C2C34] cursor-pointer hover:border-[#FFC700] transition-all group"
              >
                <img
                  src={moment.media_url}
                  alt={moment.caption || 'Moment thumbnail'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />

                {/* Reaction badge count indicator */}
                {moment.reactions && moment.reactions.length > 0 && (
                  <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[10px] text-white flex items-center space-x-1">
                    <span>{moment.reactions[0].emoji}</span>
                    <span className="font-bold">{moment.reactions.length}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedMoment && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#18181C] border border-[#2C2C34] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Close button */}
            <button
              onClick={() => setSelectedMoment(null)}
              className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Sender Info */}
            <div className="p-3 flex items-center space-x-2.5 border-b border-[#2C2C34]">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border border-[#FFC700]/40">
                <img
                  src={selectedMoment.sender?.avatar_url || ''}
                  alt={selectedMoment.sender?.display_name || ''}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-white text-xs font-bold">
                  {selectedMoment.sender?.display_name}
                </h4>
                <p className="text-zinc-400 text-[10px]">
                  {new Date(selectedMoment.created_at).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Photo 1:1 */}
            <div className="relative aspect-square w-full bg-black">
              <img
                src={selectedMoment.media_url}
                alt="Selected moment full"
                className="w-full h-full object-cover"
              />

              {selectedMoment.caption && (
                <div className="absolute bottom-3 left-3 right-3 text-center">
                  <span className="inline-block bg-black/80 backdrop-blur-md border border-white/10 text-white text-xs px-3 py-1.5 rounded-xl">
                    {selectedMoment.caption}
                  </span>
                </div>
              )}
            </div>

            {/* Reaction Details */}
            <div className="p-3 bg-[#18181C] flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Cảm xúc:</span>
              <div className="flex items-center space-x-1">
                {selectedMoment.reactions && selectedMoment.reactions.length > 0 ? (
                  selectedMoment.reactions.map((r, i) => (
                    <span key={i} className="text-base">
                      {r.emoji}
                    </span>
                  ))
                ) : (
                  <span className="text-zinc-500 text-[11px]">Chưa có reaction</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Navbar onOpenCamera={() => setShowCamera(true)} />

      {showCamera && (
        <CameraView
          friends={DEMO_FRIENDS}
          onClose={() => setShowCamera(false)}
          onSendMoment={handleSendMoment}
        />
      )}
    </div>
  );
}
