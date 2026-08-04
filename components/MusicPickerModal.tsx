"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MusicTrack } from '@/lib/types';
import { Search, Play, Pause, Bookmark, MoreHorizontal, X, Check } from 'lucide-react';

interface MusicPickerModalProps {
  onSelectMusic: (track: MusicTrack) => void;
  onClose: () => void;
  selectedTrackId?: string;
}

interface ExtendedTrack extends MusicTrack {
  playsCount?: string;
}

const PRESET_TRENDING_TRACKS: ExtendedTrack[] = [
  {
    id: 'itunes-1734543789',
    title: 'Thế Mà Lại Hay',
    artist: 'Guxxi',
    playsCount: '1,1 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bf/13/be/bf13be02-4ec4-51e9-9fa9-fae26c117b4c/5054197992928.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/6b/c4/88/6bc4882e-60f2-b88d-7fb7-e21544a0e28b/mzaf_1003463991206103004.plus.aac.p.m4a',
  },
  {
    id: 'itunes-1763782910',
    title: 'Dù Có Cách Xa (NVT Remix)',
    artist: 'Kim Phương Anh',
    playsCount: '575.450',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/d9/39/33/d93933c0-e717-380d-85e8-54c30294e7ed/24UMGIM88005.rgb.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e5/22/df/e522df14-722a-f886-f6b0-ee0b4c73f5a8/mzaf_6380963162791771146.plus.aac.p.m4a',
  },
  {
    id: 'itunes-1736173001',
    title: 'Chấp Niệm Trong Em (Remix)',
    artist: 'Ngân Ngân',
    playsCount: '749.245',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ca/8f/c9/ca8fc99c-29b1-ec06-8d18-97e3a2db77df/840391487679.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/58/b7/66/58b7661b-91c9-6f94-6d9b-73599e52e5a7/mzaf_4079815049386348126.plus.aac.p.m4a',
  },
  {
    id: 'itunes-1735160200',
    title: 'Chúng Ta Của Tương Lai',
    artist: 'Sơn Tùng M-TP',
    playsCount: '2,8 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/57/95/92/579592bd-5561-26c7-31ef-8d655f41261d/840391489006.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/31/53/35/3153359d-648b-3e58-f3ff-568b6b15e4f4/mzaf_16480572573215570535.plus.aac.p.m4a',
  },
  {
    id: 'itunes-1735160201',
    title: 'APT.',
    artist: 'ROSÉ & Bruno Mars',
    playsCount: '15,4 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bf/13/be/bf13be02-4ec4-51e9-9fa9-fae26c117b4c/5054197992928.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/6b/c4/88/6bc4882e-60f2-b88d-7fb7-e21544a0e28b/mzaf_1003463991206103004.plus.aac.p.m4a',
  },
  {
    id: 'itunes-1735160202',
    title: 'Năng Lượng Tích Cực #1',
    artist: 'QTrung, MeMe Media',
    playsCount: '1,8 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/d9/39/33/d93933c0-e717-380d-85e8-54c30294e7ed/24UMGIM88005.rgb.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e5/22/df/e522df14-722a-f886-f6b0-ee0b4c73f5a8/mzaf_6380963162791771146.plus.aac.p.m4a',
  },
];

export const MusicPickerModal: React.FC<MusicPickerModalProps> = ({
  onSelectMusic,
  onClose,
  selectedTrackId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ExtendedTrack[]>(PRESET_TRENDING_TRACKS);
  const [loading, setLoading] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Search iTunes API when user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(PRESET_TRENDING_TRACKS);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(
            searchQuery
          )}&media=music&entity=song&limit=20`
        );
        const data = await res.json();

        if (data.results && Array.isArray(data.results)) {
          const mapped: ExtendedTrack[] = data.results
            .filter((item: any) => item.previewUrl)
            .map((item: any) => ({
              id: `itunes-${item.trackId}`,
              title: item.trackName,
              artist: item.artistName,
              playsCount: `${Math.floor(Math.random() * 800 + 100)}k`,
              cover_url: item.artworkUrl100 || item.artworkUrl60,
              preview_url: item.previewUrl,
            }));
          setSearchResults(mapped);
        }
      } catch (e) {
        console.error('iTunes search failed:', e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Clean up audio player on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleTogglePreview = (e: React.MouseEvent, track: ExtendedTrack) => {
    e.stopPropagation();

    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const newAudio = new Audio(track.preview_url);
      newAudio.volume = 0.75;
      newAudio.play().catch(() => {});
      newAudio.onended = () => setPlayingTrackId(null);
      audioRef.current = newAudio;
      setPlayingTrackId(track.id);
    }
  };

  const handleSelect = (track: ExtendedTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onSelectMusic(track);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1C1C21] border border-zinc-800 rounded-t-[2.25rem] sm:rounded-[2.25rem] p-4 pt-5 pb-6 shadow-2xl flex flex-col max-h-[90vh] text-white select-none relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: Search Bar & Bookmark Icon Matching Screenshot */}
        <div className="flex items-center space-x-2.5 mb-4 flex-shrink-0">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nghệ sĩ"
              className="w-full bg-[#2C2C34]/80 text-white text-sm font-medium rounded-full pl-10 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-zinc-600 placeholder-zinc-400"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Bookmark Button */}
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
              isBookmarked
                ? 'bg-[#FFC700] text-black'
                : 'bg-[#2C2C34]/80 text-white hover:bg-[#383842]'
            }`}
            title="Đã lưu"
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Section Header: "Dành cho bạn" & "Xem tất cả" */}
        <div className="flex items-center justify-between mb-3 px-1 flex-shrink-0">
          <h3 className="text-white text-base font-bold tracking-tight">Dành cho bạn</h3>
          <button className="text-[#5B9DF6] hover:underline text-xs font-semibold">
            Xem tất cả
          </button>
        </div>

        {/* Tracks List matching Screenshot layout */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 rounded-full border-2 border-[#FFC700] border-t-transparent animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <p className="text-center text-zinc-500 text-xs py-10">
              Không tìm thấy kết quả nào.
            </p>
          ) : (
            searchResults.map((track) => {
              const isSelected = selectedTrackId === track.id;
              const isPlaying = playingTrackId === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleSelect(track)}
                  className={`flex items-center justify-between p-2 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#FFC700]/15 border border-[#FFC700]/40'
                      : 'hover:bg-[#282830]'
                  }`}
                >
                  {/* Left: Cover Art + Titles */}
                  <div className="flex items-center space-x-3 truncate pr-2 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 border border-zinc-800">
                      <img
                        src={track.cover_url}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="w-2 h-2 bg-[#FFC700] rounded-full animate-ping" />
                        </div>
                      )}
                    </div>

                    <div className="truncate">
                      <h4 className="text-white text-sm font-bold truncate leading-tight">
                        {track.title}
                      </h4>
                      <p className="text-zinc-400 text-xs truncate mt-1 font-medium">
                        {track.artist}
                        {track.playsCount ? ` • ${track.playsCount}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right: Three Dots + Play Button */}
                  <div className="flex items-center space-x-2.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1 text-zinc-400 hover:text-white transition-colors"
                      title="Tùy chọn"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    <button
                      onClick={(e) => handleTogglePreview(e, track)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isPlaying
                          ? 'bg-[#FFC700] text-black shadow-lg scale-105'
                          : 'bg-[#2C2C34] text-zinc-200 hover:bg-white hover:text-black'
                      }`}
                      title={isPlaying ? 'Tạm dừng' : 'Nghe thử'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#FFC700] text-black flex items-center justify-center ml-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
