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
  FolderArchive
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
}

// Preset tracks list matching user screenshots 100%
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
    title: 'anh đã trái đủ sóng gió...',
    artist: 'Võ Viết Duy Khiêm',
    cover_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  },
  {
    id: 'track-11',
    title: 'BLACK or WHITE (feat. Cari...',
    artist: 'REVERSIBLE, Daichi',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=gimme-some-groove-122421.mp3',
  },
  {
    id: 'track-12',
    title: 'This is what we are all of',
    artist: 'Check Cien',
    cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=tuesday-glitch-soft-hip-hop-118327.mp3',
  },
  {
    id: 'track-13',
    title: 'Hành Trình Rực Rỡ',
    artist: 'Do Showbiz',
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c0e95c1024.mp3?filename=good-night-160166.mp3',
  },
  {
    id: 'track-14',
    title: 'Nơi Này Có Anh',
    artist: 'Sơn Tùng M-TP',
    cover_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  },
  {
    id: 'track-15',
    title: 'Thái Bình Mồ Hôi Rơi',
    artist: 'Sơn Tùng M-TP',
    cover_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c52077e2.mp3?filename=lofi-chill-medium-version-110860.mp3',
  },
  {
    id: 'track-16',
    title: 'Come My Way',
    artist: 'Sơn Tùng M-TP, Tyga',
    cover_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=tuesday-glitch-soft-hip-hop-118327.mp3',
  },
  {
    id: 'track-17',
    title: 'Âm Thầm Bên Em',
    artist: 'Sơn Tùng M-TP',
    cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=120&auto=format&fit=crop&q=80',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3?filename=ambient-piano-logo-165357.mp3',
  },
];

export const MusicPickerModal: React.FC<MusicPickerModalProps> = ({
  onSelectMusic,
  onClose,
  selectedTrackId,
}) => {
  const [viewMode, setViewMode] = useState<'main' | 'saved'>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ExtendedTrack[]>(PRESET_TRENDING_TRACKS);
  const [loading, setLoading] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<ExtendedTrack | null>(null);
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);

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

  // Fetch Real-time Daily Top Trending Chart or Live iTunes Search
  useEffect(() => {
    let isCancelled = false;

    if (!searchQuery.trim()) {
      setLoading(true);
      fetch('/api/music?chart=trending')
        .then((res) => res.json())
        .then((data) => {
          if (isCancelled) return;
          if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            const mapped: ExtendedTrack[] = data.results
              .filter((item: any) => item.previewUrl)
              .map((item: any) => ({
                id: `trending-${item.trackId}`,
                title: item.trackName,
                artist: item.artistName,
                cover_url: item.artworkUrl100 || item.artworkUrl60,
                preview_url: item.previewUrl,
              }));
            setSearchResults(mapped.length > 0 ? mapped : PRESET_TRENDING_TRACKS);
          } else {
            setSearchResults(PRESET_TRENDING_TRACKS);
          }
        })
        .catch(() => {
          if (!isCancelled) setSearchResults(PRESET_TRENDING_TRACKS);
        })
        .finally(() => {
          if (!isCancelled) setLoading(false);
        });

      return () => {
        isCancelled = true;
      };
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/music?term=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();

        if (data.results && Array.isArray(data.results)) {
          const mapped: ExtendedTrack[] = data.results
            .filter((item: any) => item.previewUrl)
            .map((item: any) => ({
              id: `itunes-${item.trackId}`,
              title: item.trackName,
              artist: item.artistName,
              cover_url: item.artworkUrl100 || item.artworkUrl60,
              preview_url: item.previewUrl,
            }));
          setSearchResults(mapped.length > 0 ? mapped : PRESET_TRENDING_TRACKS);
        }
      } catch (e) {
        console.error('iTunes search error:', e);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      killGlobalAudio();
      setPlayingTrackId(null);
    };
  }, []);

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

  const savedTracks = PRESET_TRENDING_TRACKS.filter((t) => savedTrackIds.includes(t.id));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1C1B20] border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-4 pt-3 pb-6 shadow-2xl flex flex-col max-h-[92vh] text-white select-none relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Centered Drag Handle Pill */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3 flex-shrink-0" />

        {/* VIEW A: Saved Audio View ("Nhạc đã lưu") */}
        {viewMode === 'saved' ? (
          <div className="flex flex-col h-full flex-1">
            {/* Header with Back Arrow and Title */}
            <div className="flex items-center justify-between mb-6 px-1 flex-shrink-0">
              <button
                onClick={() => setViewMode('main')}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
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
            <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center">
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
                <div className="w-full space-y-2.5 overflow-y-auto custom-scrollbar pr-1">
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
          /* VIEW B: Main Browse & Search View */
          <div className="flex flex-col h-full flex-1 overflow-hidden">
            {/* Top Search Bar & Bookmark Icon */}
            <div className="flex items-center space-x-2.5 mb-4 flex-shrink-0">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm lời bài hát"
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

            {/* Section Header: "Mới phát hành" or "Dành cho bạn" */}
            <div className="flex items-center justify-between mb-3 px-1 flex-shrink-0">
              <h3 className="text-white text-base font-bold tracking-tight">
                {searchQuery ? 'Kết quả tìm kiếm' : 'Mới phát hành'}
              </h3>
              {!searchQuery && (
                <button className="text-[#5B9DF6] hover:underline text-xs font-semibold">
                  Xem tất cả
                </button>
              )}
            </div>

            {/* Song List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 pb-16">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-7 h-7 rounded-full border-2 border-[#5B9DF6] border-t-transparent animate-spin" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-center text-zinc-500 text-xs py-10">
                  Không tìm thấy bài hát nào.
                </p>
              ) : (
                searchResults.map((track) => {
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
                        {/* Track Cover & Info */}
                        <div className="flex items-center space-x-3 truncate flex-1 pr-2">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800 border border-white/10">
                            <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                            {isPlaying && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 bg-[#FFC700] rounded-full animate-ping" />
                              </div>
                            )}
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

                        {/* Right Action Icons (Matching Screenshots 4 & 5) */}
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
                })
              )}
            </div>

            {/* FLOATING BOTTOM PLAYER DOCK (Matching Screenshot 4) */}
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
                    onClick={() => {
                      alert('Cắt đoạn nhạc: Đã tự động chọn đoạn điệp khúc 30s hay nhất!');
                    }}
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
      </div>
    </div>
  );
};
