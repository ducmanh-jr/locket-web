"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MusicTrack } from '@/lib/types';
import {
  Search,
  Play,
  Pause,
  Bookmark,
  MoreVertical,
  X,
  Plus,
  ArrowLeft,
  Scissors,
  Check,
  Sparkles,
  Sliders,
  Volume2
} from 'lucide-react';
import { killGlobalAudio, playGlobalAudio } from '@/lib/audioPlayer';

interface MusicPickerModalProps {
  onSelectMusic: (track: MusicTrack) => void;
  onClose: () => void;
  selectedTrackId?: string;
}

interface ExtendedTrack extends MusicTrack {
  playsCount?: string;
  isCustomSaved?: boolean;
  trimStart?: number; // Cut start offset in seconds
}

// 100% V-Pop & Vietnamese Trending Preset Fallback Songs
const PRESET_TRENDING_TRACKS: ExtendedTrack[] = [
  {
    id: 'track-1',
    title: 'Flex Nhẹ Cho Các Vợ',
    artist: 'Guxxi',
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  },
  {
    id: 'track-2',
    title: 'KHUON MAT DANG THUON...',
    artist: 'KAIXOLIT',
    cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=tuesday-glitch-soft-hip-hop-118327.mp3',
  },
  {
    id: 'track-3',
    title: 'Nỗi buồn chạm đáy',
    artist: 'Lê Đăng Khôi',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=chill-abstract-intention-12099.mp3',
  },
  {
    id: 'track-4',
    title: 'ĐONG VUI QUA HỢP LỚP A',
    artist: 'Mạnh Phong',
    cover_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=gimme-some-groove-122421.mp3',
  },
  {
    id: 'track-5',
    title: 'CTBT (Beat)',
    artist: 'Coldz, 2 0 2 1',
    cover_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c52077e2.mp3?filename=lofi-chill-medium-version-110860.mp3',
  },
  {
    id: 'track-6',
    title: 'NGÀY ĐẸP TRỜI',
    artist: 'P2P.DK',
    cover_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c0e95c1024.mp3?filename=good-night-160166.mp3',
  },
  {
    id: 'track-7',
    title: 'Một Buổi Chiều Buồn',
    artist: 'QTrung, MeMe Media',
    cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3?filename=ambient-piano-logo-165357.mp3',
  },
  {
    id: 'track-8',
    title: 'Nặng Tình Hay Nhẹ Lòng (AI...',
    artist: 'Em Bé Mê Bolero',
    cover_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884b9c1d6b.mp3?filename=acoustic-guitars-ambient-118545.mp3',
  },
  {
    id: 'track-9',
    title: 'Rush To Wonderland',
    artist: 'A Léo',
    cover_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=chill-abstract-intention-12099.mp3',
  },
  {
    id: 'track-10',
    title: 'anh đã trải đủ sóng gió...',
    artist: 'Võ Viết Duy Khiêm',
    cover_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  },
  {
    id: 'track-11',
    title: 'Nơi Này Có Anh',
    artist: 'Sơn Tùng M-TP',
    cover_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  },
  {
    id: 'track-12',
    title: 'Thái Bình Mồ Hôi Rơi',
    artist: 'Sơn Tùng M-TP',
    cover_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c52077e2.mp3?filename=lofi-chill-medium-version-110860.mp3',
  },
  {
    id: 'track-13',
    title: 'Come My Way',
    artist: 'Sơn Tùng M-TP, Tyga',
    cover_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=tuesday-glitch-soft-hip-hop-118327.mp3',
  },
  {
    id: 'track-14',
    title: 'Âm Thầm Bên Em',
    artist: 'Sơn Tùng M-TP',
    cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3?filename=ambient-piano-logo-165357.mp3',
  },
  {
    id: 'track-15',
    title: 'Hành Trình Rực Rỡ',
    artist: 'Do Showbiz',
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c0e95c1024.mp3?filename=good-night-160166.mp3',
  },
];

// Sleek 3-Bar Equalizer Animation Component (Replaces Ugly Yellow Ping Circle)
const EqualizerBars: React.FC = () => (
  <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center space-x-1 z-10 rounded-xl">
    <div className="w-1 bg-[#D9266E] rounded-full animate-pulse h-4" style={{ animationDuration: '0.4s' }} />
    <div className="w-1 bg-white rounded-full animate-pulse h-6" style={{ animationDuration: '0.6s' }} />
    <div className="w-1 bg-[#D9266E] rounded-full animate-pulse h-3.5" style={{ animationDuration: '0.5s' }} />
  </div>
);

export const MusicPickerModal: React.FC<MusicPickerModalProps> = ({
  onSelectMusic,
  onClose,
  selectedTrackId,
}) => {
  const [viewMode, setViewMode] = useState<'main' | 'saved'>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [allTracks, setAllTracks] = useState<ExtendedTrack[]>(PRESET_TRENDING_TRACKS);
  const [visibleCount, setVisibleCount] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<ExtendedTrack | null>(null);
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
  const [showTrimmer, setShowTrimmer] = useState<boolean>(false);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(25);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Sheet gesture drag state
  const [dragY, setDragY] = useState<number>(0);
  const touchStartY = useRef<number | null>(null);

  // Saved bookmarks state (persisted in localStorage)
  const [savedTrackIds, setSavedTrackIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('locket_saved_music');
        return local ? JSON.parse(local) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const saveBookmarksToStorage = (ids: string[]) => {
    setSavedTrackIds(ids);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('locket_saved_music', JSON.stringify(ids));
      } catch (e) {
        console.warn('Failed to write bookmarks to storage:', e);
      }
    }
  };

  const toggleBookmark = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    if (savedTrackIds.includes(trackId)) {
      saveBookmarksToStorage(savedTrackIds.filter((id) => id !== trackId));
    } else {
      saveBookmarksToStorage([...savedTrackIds, trackId]);
    }
  };

  // Fetch Real-Time Daily Trending or Search focused on V-Pop Vietnamese songs
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const query = searchQuery.trim();
    const endpoint = query
      ? `/api/music?term=${encodeURIComponent(query)}&limit=100`
      : `/api/music?chart=trending&limit=100`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          const mapped: ExtendedTrack[] = data.results
            .filter((item: any) => item.previewUrl || item.artworkUrl100)
            .map((item: any) => ({
              id: item.trackId ? `itunes-${item.trackId}` : `tr-${Math.random()}`,
              title: item.trackName || item.title || 'Bài hát V-Pop',
              artist: item.artistName || item.artist || 'Nghệ sĩ Việt',
              cover_url: item.artworkUrl100 || item.cover_url,
              preview_url: item.previewUrl || item.preview_url,
            }));

          // Merge preset tracks + fetched tracks (ensuring V-Pop priority)
          const merged = [...mapped, ...PRESET_TRENDING_TRACKS];
          const unique = Array.from(new Map(merged.map((t) => [t.title + t.artist, t])).values());
          setAllTracks(unique);
        } else {
          setAllTracks(PRESET_TRENDING_TRACKS);
        }
      })
      .catch(() => {
        if (!isCancelled) setAllTracks(PRESET_TRENDING_TRACKS);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [searchQuery]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      killGlobalAudio();
      setPlayingTrackId(null);
    };
  }, []);

  // Infinite scroll handler — loads 15 more songs when scrolling near bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 120) {
      if (visibleCount < allTracks.length) {
        setVisibleCount((prev) => Math.min(prev + 15, allTracks.length));
      }
    }
  };

  // Drag sheet touch handlers
  const handleTouchStartHeader = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMoveHeader = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diffY = e.touches[0].clientY - touchStartY.current;
    if (diffY > 0) {
      setDragY(diffY);
    }
  };

  const handleTouchEndHeader = () => {
    if (dragY > 120) {
      onClose();
    } else {
      setDragY(0);
    }
    touchStartY.current = null;
  };

  const handleTogglePreview = (e: React.MouseEvent, track: ExtendedTrack) => {
    e.stopPropagation();

    if (playingTrackId === track.id) {
      killGlobalAudio();
      setPlayingTrackId(null);
    } else {
      setPlayingTrackId(track.id);
      setSelectedTrack(track);
      playGlobalAudio(track.preview_url, () => setPlayingTrackId(null));
    }
  };

  const handleItemClick = (track: ExtendedTrack) => {
    setSelectedTrack(track);
    setExpandedTrackId((prev) => (prev === track.id ? null : track.id));
    if (playingTrackId !== track.id) {
      setPlayingTrackId(track.id);
      playGlobalAudio(track.preview_url, () => setPlayingTrackId(null));
    }
  };

  const handleConfirmSelect = (track: ExtendedTrack) => {
    killGlobalAudio();
    setPlayingTrackId(null);
    onSelectMusic(track);
    onClose();
  };

  const savedTracks = allTracks.filter((t) => savedTrackIds.includes(t.id));
  const displayedTracks = allTracks.slice(0, visibleCount);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1C1B20] border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-4 pt-3 pb-6 shadow-2xl flex flex-col max-h-[94vh] h-[92vh] text-white select-none relative overflow-hidden transition-transform"
        style={{ transform: `translateY(${dragY}px)` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Draggable Header Handle Bar */}
        <div
          onTouchStart={handleTouchStartHeader}
          onTouchMove={handleTouchMoveHeader}
          onTouchEnd={handleTouchEndHeader}
          className="w-full pt-1 pb-3 cursor-grab active:cursor-grabbing flex justify-center flex-shrink-0"
        >
          <div className="w-12 h-1.5 bg-white/30 hover:bg-white/50 rounded-full transition-colors" />
        </div>

        {/* VIEW A: Saved Audio View ("Nhạc đã lưu") */}
        {viewMode === 'saved' ? (
          <div className="flex flex-col h-full flex-1 overflow-hidden">
            {/* Header with Back Arrow and Title */}
            <div className="flex items-center justify-between mb-5 px-1 flex-shrink-0">
              <button
                onClick={() => setViewMode('main')}
                className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                title="Quay lại"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-white text-base font-bold tracking-tight text-center">
                Nhạc đã lưu
              </h2>
              <div className="w-8" />
            </div>

            {/* Content: Empty State vs Saved Tracks List */}
            <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 text-center overflow-y-auto custom-scrollbar">
              {savedTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-4 my-auto">
                  {/* 3D Blue Archive Box Illustration */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <div className="w-24 h-20 bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] rounded-2xl shadow-[0_12px_30px_rgba(37,99,235,0.4)] border border-blue-300/30 flex flex-col justify-end p-2 relative overflow-hidden">
                      <div className="w-full h-3 bg-blue-900/50 rounded-md mb-1" />
                      <div className="w-10 h-2 bg-blue-200/80 rounded-full mx-auto" />
                    </div>
                    {/* Paper Document sticking out */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-14 bg-white/90 rounded-t-lg border border-zinc-200 shadow-md flex items-center justify-center z-0 opacity-90">
                      <div className="w-10 h-1 bg-zinc-300 rounded" />
                    </div>
                  </div>

                  <div className="space-y-1.5 max-w-xs">
                    <h3 className="text-white text-lg font-bold">Bạn chưa lưu gì cả</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Nhấn vào <span className="inline-block px-1 font-semibold text-white">🔖</span> để lưu âm thanh nhằm truy cập dễ dàng.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-2.5 pr-1">
                  {savedTracks.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => handleConfirmSelect(track)}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all"
                    >
                      <div className="flex items-center space-x-3 truncate flex-1">
                        <img src={track.cover_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                        <div className="truncate text-left">
                          <h4 className="text-white text-sm font-bold truncate">{track.title}</h4>
                          <p className="text-zinc-400 text-xs truncate mt-0.5">{track.artist}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => toggleBookmark(e, track.id)}
                        className="p-2 text-[#FFC700] hover:text-white"
                        title="Bỏ lưu"
                      >
                        <Bookmark className="w-5 h-5 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VIEW B: Main Browse & Infinite Scroll Search View */
          <div className="flex flex-col h-full flex-1 overflow-hidden">
            {/* Top Search Bar & Bookmark Icon */}
            <div className="flex items-center space-x-2.5 mb-4 flex-shrink-0">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm lời bài hát, nhạc V-Pop..."
                  className="w-full bg-[#2B2A30] text-white text-sm font-medium rounded-full pl-10 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-zinc-500 placeholder-zinc-400"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-2.5 text-zinc-400 hover:text-white p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#5B9DF6] font-semibold text-sm px-1"
                >
                  Hủy
                </button>
              ) : (
                <button
                  onClick={() => setViewMode('saved')}
                  className="w-10 h-10 rounded-full bg-[#2B2A30] text-white hover:bg-[#3B3A42] flex items-center justify-center flex-shrink-0 relative transition-all active:scale-95"
                  title="Nhạc đã lưu"
                >
                  <Bookmark className="w-5 h-5 fill-white/80" />
                  {savedTrackIds.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFC700] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                      {savedTrackIds.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Section Header */}
            <div className="flex items-center justify-between mb-3 px-1 flex-shrink-0">
              <h3 className="text-white text-base font-bold tracking-tight flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-[#D9266E]" />
                <span>{searchQuery ? 'Kết quả tìm kiếm V-Pop' : 'Mới phát hành V-Pop 🔥'}</span>
              </h3>
              {!searchQuery && (
                <span className="text-zinc-400 text-xs font-medium">
                  {displayedTracks.length}/{allTracks.length} bài
                </span>
              )}
            </div>

            {/* Infinite Scroll Song List */}
            <div
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 pb-20"
            >
              {loading && displayedTracks.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-7 h-7 rounded-full border-2 border-[#D9266E] border-t-transparent animate-spin" />
                </div>
              ) : displayedTracks.length === 0 ? (
                <p className="text-center text-zinc-500 text-xs py-10">
                  Không tìm thấy bài hát nào.
                </p>
              ) : (
                <>
                  {displayedTracks.map((track) => {
                    const isSelected = selectedTrackId === track.id || selectedTrack?.id === track.id;
                    const isPlaying = playingTrackId === track.id;
                    const isSaved = savedTrackIds.includes(track.id);
                    const isExpanded = expandedTrackId === track.id;

                    return (
                      <div
                        key={track.id}
                        onClick={() => handleItemClick(track)}
                        className={`flex flex-col p-2.5 rounded-2xl cursor-pointer transition-all ${
                          isExpanded || isSelected
                            ? 'bg-[#2B2A30] border border-white/15 shadow-md'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {/* Track Cover & Equalizer */}
                          <div className="flex items-center space-x-3 truncate flex-1 pr-2">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800 border border-white/10">
                              <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                              {/* Replaced ugly yellow ping dot with 3-bar animated equalizer */}
                              {isPlaying && <EqualizerBars />}
                            </div>

                            <div className="truncate">
                              <h4 className="text-white text-sm font-bold truncate leading-tight">
                                {track.title}
                              </h4>
                              <p className="text-zinc-400 text-xs truncate mt-0.5 font-medium">
                                {track.artist}
                              </p>
                            </div>
                          </div>

                          {/* Right Actions */}
                          {isExpanded ? (
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                                title="Tùy chọn"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              <button
                                onClick={(e) => toggleBookmark(e, track.id)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                  isSaved ? 'bg-[#FFC700] text-black' : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                                title={isSaved ? 'Đã lưu' : 'Lưu nhạc'}
                              >
                                <Bookmark className="w-4 h-4 fill-current" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConfirmSelect(track);
                                }}
                                className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                                title="Chọn bài hát này"
                              >
                                <Plus className="w-5 h-5 stroke-[2.5]" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => handleTogglePreview(e, track)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                                isPlaying
                                  ? 'bg-white text-black shadow-lg scale-105'
                                  : 'bg-[#2C2C34] text-zinc-200 hover:bg-white hover:text-black'
                              }`}
                              title={isPlaying ? 'Tạm dừng' : 'Phát nghe thử'}
                            >
                              {isPlaying ? (
                                <Pause className="w-4 h-4 fill-current" />
                              ) : (
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Infinite Scroll Loader Indicator */}
                  {visibleCount < allTracks.length && (
                    <div className="py-4 text-center">
                      <span className="text-zinc-500 text-xs font-medium animate-pulse">
                        Đang tải thêm gợi ý nhạc V-Pop...
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* FLOATING BOTTOM PLAYER DOCK */}
            {selectedTrack && (
              <div className="absolute bottom-3 left-4 right-4 bg-[#18171C]/95 backdrop-blur-2xl border border-white/15 rounded-full px-3.5 py-2 flex items-center justify-between shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-30 animate-in slide-in-from-bottom-3 duration-300">
                {/* Left: Play/Pause Toggle Button */}
                <button
                  onClick={(e) => handleTogglePreview(e, selectedTrack)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
                >
                  {playingTrackId === selectedTrack.id ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                {/* Center: Song Title & Artist text */}
                <div className="flex-1 mx-3 truncate">
                  <h5 className="text-white text-xs font-bold truncate">
                    {selectedTrack.title}
                  </h5>
                  <p className="text-zinc-400 text-[11px] truncate">
                    {selectedTrack.artist}
                  </p>
                </div>

                {/* Right Actions: Cut Scissors + Confirm Plus Circle */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => setShowTrimmer(true)}
                    className="p-2 text-white/80 hover:text-white transition-colors"
                    title="Cắt đoạn nhạc"
                  >
                    <Scissors className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleConfirmSelect(selectedTrack)}
                    className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform"
                    title="Đồng ý chọn nhạc"
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* REFINED DUAL-HANDLE MUSIC SEGMENT TRIMMER OVERLAY (Điểm Đầu & Điểm Cuối) */}
        {showTrimmer && selectedTrack && (
          <div className="absolute inset-0 z-50 bg-[#121116] p-5 flex flex-col justify-between animate-in zoom-in-95 duration-200 select-none">
            {/* Top Bar */}
            <div className="flex items-center justify-between flex-shrink-0 mb-2">
              <button
                onClick={() => setShowTrimmer(false)}
                className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                title="Đóng"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-white text-base font-bold tracking-tight">Cắt đoạn nhạc ✂</h3>
              <button
                onClick={() => {
                  setShowTrimmer(false);
                  handleConfirmSelect({
                    ...selectedTrack,
                    title: `${selectedTrack.title} (${formatTime(trimStart)}-${formatTime(trimEnd)})`,
                  });
                }}
                className="p-2 rounded-full bg-[#D9266E] text-white hover:bg-[#be185d] transition-transform active:scale-95"
                title="Lưu"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Track Info Card */}
            <div className="flex items-center space-x-3 bg-white/5 border border-white/10 p-3 rounded-2xl flex-shrink-0">
              <img
                src={selectedTrack.cover_url}
                alt=""
                className="w-14 h-14 rounded-xl object-cover shadow-md border border-white/10 flex-shrink-0"
              />
              <div className="truncate flex-1">
                <h4 className="text-white font-bold text-sm truncate">{selectedTrack.title}</h4>
                <p className="text-zinc-400 text-xs truncate mt-0.5">{selectedTrack.artist}</p>
                <div className="mt-1 flex items-center space-x-1.5 text-[11px] text-[#D9266E] font-semibold">
                  <span>{formatTime(trimStart)}</span>
                  <span>➜</span>
                  <span>{formatTime(trimEnd)}</span>
                  <span className="text-zinc-500">({Math.max(1, trimEnd - trimStart)}s)</span>
                </div>
              </div>
            </div>

            {/* Visual Waveform Bar Representation */}
            <div className="my-auto py-4 space-y-5">
              <div className="relative w-full h-20 bg-black/40 border border-white/10 rounded-2xl p-3 flex items-center justify-between overflow-hidden">
                {/* Simulated Waveform Bars */}
                {Array.from({ length: 40 }).map((_, i) => {
                  const percent = (i / 40) * 100;
                  const inRange = percent >= (trimStart / 30) * 100 && percent <= (trimEnd / 30) * 100;
                  const height = Math.sin(i * 0.7) * 35 + 45;
                  return (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        inRange ? 'bg-gradient-to-t from-[#D9266E] to-[#F43F5E] shadow-sm' : 'bg-zinc-700/50'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>

              {/* Dual-Handle Sliders: Điểm Bắt Đầu & Điểm Kết Thúc */}
              <div className="space-y-4 px-1">
                {/* Điểm Bắt Đầu Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-400">Thời gian bắt đầu:</span>
                    <span className="text-[#D9266E] font-bold">{formatTime(trimStart)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, trimEnd - 3)}
                    step={1}
                    value={trimStart}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTrimStart(val);
                      if (selectedTrack?.preview_url) {
                        setPlayingTrackId(selectedTrack.id);
                        playGlobalAudio(selectedTrack.preview_url, () => setPlayingTrackId(null), val);
                      }
                    }}
                    className="w-full accent-[#D9266E] h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Điểm Kết Thúc Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-400">Thời gian kết thúc:</span>
                    <span className="text-white font-bold">{formatTime(trimEnd)}</span>
                  </div>
                  <input
                    type="range"
                    min={trimStart + 3}
                    max={30}
                    step={1}
                    value={trimEnd}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTrimEnd(val);
                    }}
                    className="w-full accent-[#D9266E] h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Apply Action Button */}
            <button
              onClick={() => {
                setShowTrimmer(false);
                handleConfirmSelect({
                  ...selectedTrack,
                  title: `${selectedTrack.title} (${formatTime(trimStart)}-${formatTime(trimEnd)})`,
                });
              }}
              className="w-full py-3.5 bg-gradient-to-r from-[#D9266E] to-[#E11D48] text-white font-bold rounded-full shadow-[0_8px_25px_rgba(217,38,110,0.4)] hover:opacity-95 active:scale-95 transition-all text-center flex items-center justify-center space-x-2"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>Áp dụng đoạn cắt ({Math.max(1, trimEnd - trimStart)} giây)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
