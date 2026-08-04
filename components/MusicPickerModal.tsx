"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MusicTrack } from '@/lib/types';
import { Search, Play, Pause, Bookmark, MoreHorizontal, X, Check, Music, Sparkles } from 'lucide-react';
import { createGuaranteedAudio } from '@/lib/audioPlayer';

interface MusicPickerModalProps {
  onSelectMusic: (track: MusicTrack) => void;
  onClose: () => void;
  selectedTrackId?: string;
}

interface ExtendedTrack extends MusicTrack {
  playsCount?: string;
  chorusOffset?: number; // Start timestamp in seconds for main chorus snippet
}

// Curated FB Story Trending Light & Gentle Music List (Acoustic, Chill Lofi, V-Pop & US-UK Hits)
const PRESET_TRENDING_TRACKS: ExtendedTrack[] = [
  {
    id: 'itunes-1734543789',
    title: 'Từng Cho Nhau',
    artist: 'Hà Nhi (Acoustic Chill)',
    playsCount: '1,8 triệu',
    chorusOffset: 35,
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'itunes-1763782910',
    title: 'Tình Cờ Thích Em',
    artist: 'Vũ. (Indie Chill)',
    playsCount: '2,4 triệu',
    chorusOffset: 40,
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 'itunes-1736173001',
    title: 'Mặt Trời Của Em',
    artist: 'Phương Ly',
    playsCount: '3,1 triệu',
    chorusOffset: 30,
    cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'itunes-1735160201',
    title: 'APT.',
    artist: 'ROSÉ & Bruno Mars',
    playsCount: '15,4 triệu',
    chorusOffset: 25,
    cover_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&auto=format&fit=crop&q=80',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'itunes-1735160203',
    title: 'Until I Found You',
    artist: 'Stephen Sanchez (Retro Vibe)',
    playsCount: '8,5 triệu',
    chorusOffset: 35,
    cover_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&auto=format&fit=crop&q=80',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: 'itunes-1735160204',
    title: 'Golden Hour',
    artist: 'JVKE (Piano Lofi)',
    playsCount: '12,1 triệu',
    chorusOffset: 45,
    cover_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&auto=format&fit=crop&q=80',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 'itunes-1735160205',
    title: 'Chưa Quên Người Yêu Cũ',
    artist: 'Hà Nhi',
    playsCount: '4,2 triệu',
    chorusOffset: 30,
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'itunes-1735160206',
    title: 'Nối Với Nhau Bằng Nụ Cười',
    artist: 'Chillies',
    playsCount: '1,5 triệu',
    chorusOffset: 35,
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: 'itunes-1735160200',
    title: 'Chúng Ta Của Tương Lai',
    artist: 'Sơn Tùng M-TP',
    playsCount: '9,8 triệu',
    chorusOffset: 30,
    cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
];

const TrackCoverImage: React.FC<{ src: string; isPlaying: boolean }> = ({ src, isPlaying }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 flex-shrink-0 border border-zinc-700/60 shadow-md flex items-center justify-center">
      {!imgError && src ? (
        <img
          src={src}
          alt=""
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-tr from-[#FFC700] via-[#FF8800] to-purple-600 flex items-center justify-center">
          <Music className="w-5 h-5 text-black stroke-[2.5]" />
        </div>
      )}
      {isPlaying && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
          <div className="w-3 h-3 bg-[#FFC700] rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
};

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
  const activeAudioHandle = useRef<{ stop: () => void } | null>(null);

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
              chorusOffset: 30, // Main chorus snippet default
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
      if (activeAudioHandle.current) {
        activeAudioHandle.current.stop();
        activeAudioHandle.current = null;
      }
    };
  }, []);

  const handleTogglePreview = (e: React.MouseEvent, track: ExtendedTrack) => {
    e.stopPropagation();

    if (playingTrackId === track.id) {
      if (activeAudioHandle.current) {
        activeAudioHandle.current.stop();
        activeAudioHandle.current = null;
      }
      setPlayingTrackId(null);
    } else {
      if (activeAudioHandle.current) {
        activeAudioHandle.current.stop();
      }

      setPlayingTrackId(track.id);
      // Play starting directly at Main Chorus snippet offset (~30s)
      activeAudioHandle.current = createGuaranteedAudio(
        track.preview_url,
        () => setPlayingTrackId(null),
        track.chorusOffset || 30
      );
    }
  };

  const handleSelect = (track: ExtendedTrack) => {
    if (activeAudioHandle.current) {
      activeAudioHandle.current.stop();
      activeAudioHandle.current = null;
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
        <div className="flex items-center space-x-2.5 mb-3 flex-shrink-0">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài hát, nghệ sĩ..."
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

        {/* Section Header: "Nhạc nhẹ Trend FB Stories" & "Xem tất cả" */}
        <div className="flex items-center justify-between mb-3 px-1 flex-shrink-0">
          <h3 className="text-white text-base font-bold tracking-tight flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#FFC700]" />
            <span>Nhạc nhẹ Trend FB Stories</span>
          </h3>
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
                    <TrackCoverImage src={track.cover_url} isPlaying={isPlaying} />

                    <div className="truncate">
                      <h4 className="text-white text-sm font-bold truncate leading-tight flex items-center gap-1.5">
                        <span className="truncate">{track.title}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FFC700]/15 text-[#FFC700] font-semibold flex-shrink-0">
                          Điệp khúc 🔥
                        </span>
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
                      title={isPlaying ? 'Tạm dừng' : 'Nghe điệp khúc'}
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
