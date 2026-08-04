"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MusicTrack } from '@/lib/types';
import { Search, Music, Play, Pause, Check, X, Sparkles } from 'lucide-react';

interface MusicPickerModalProps {
  onSelectMusic: (track: MusicTrack) => void;
  onClose: () => void;
  selectedTrackId?: string;
}

const PRESET_TRENDING_TRACKS: MusicTrack[] = [
  {
    id: 'itunes-1734543789',
    title: 'APT.',
    artist: 'ROSÉ & Bruno Mars',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bf/13/be/bf13be02-4ec4-51e9-9fa9-fae26c117b4c/5054197992928.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/6b/c4/88/6bc4882e-60f2-b88d-7fb7-e21544a0e28b/mzaf_1003463991206103004.plus.aac.p.m4a',
  },
  {
    id: 'itunes-1763782910',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/d9/39/33/d93933c0-e717-380d-85e8-54c30294e7ed/24UMGIM88005.rgb.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e5/22/df/e522df14-722a-f886-f6b0-ee0b4c73f5a8/mzaf_6380963162791771146.plus.aac.p.m4a',
  },
  {
    id: 'itunes-1736173001',
    title: 'Chúng Ta Của Tương Lai',
    artist: 'Sơn Tùng M-TP',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ca/8f/c9/ca8fc99c-29b1-ec06-8d18-97e3a2db77df/840391487679.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/58/b7/66/58b7661b-91c9-6f94-6d9b-73599e52e5a7/mzaf_4079815049386348126.plus.aac.p.m4a',
  },
  {
    id: 'itunes-1735160200',
    title: 'Nâng Chén Tiêu Sầu',
    artist: 'Bích Phương',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/57/95/92/579592bd-5561-26c7-31ef-8d655f41261d/840391489006.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/31/53/35/3153359d-648b-3e58-f3ff-568b6b15e4f4/mzaf_16480572573215570535.plus.aac.p.m4a',
  },
];

export const MusicPickerModal: React.FC<MusicPickerModalProps> = ({
  onSelectMusic,
  onClose,
  selectedTrackId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicTrack[]>(PRESET_TRENDING_TRACKS);
  const [loading, setLoading] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
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
          )}&media=music&entity=song&limit=15`
        );
        const data = await res.json();

        if (data.results && Array.isArray(data.results)) {
          const mapped: MusicTrack[] = data.results
            .filter((item: any) => item.previewUrl)
            .map((item: any) => ({
              id: `itunes-${item.trackId}`,
              title: item.trackName,
              artist: item.artistName,
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
    }, 350);

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

  const handleTogglePreview = (e: React.MouseEvent, track: MusicTrack) => {
    e.stopPropagation();

    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const newAudio = new Audio(track.preview_url);
      newAudio.volume = 0.7;
      newAudio.play().catch(() => {});
      newAudio.onended = () => setPlayingTrackId(null);
      audioRef.current = newAudio;
      setPlayingTrackId(track.id);
    }
  };

  const handleSelect = (track: MusicTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onSelectMusic(track);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#18181C] border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Music className="w-5 h-5 text-[#FFC700]" />
            <h2 className="text-white text-base font-bold">Thêm nhạc vào khoảnh khắc</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative my-3 flex-shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm bài hát, ca sĩ..."
            className="w-full bg-[#262626] border border-zinc-700 text-white text-xs font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FFC700] placeholder-zinc-400"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-0.5">
          {!searchQuery.trim() && (
            <div className="flex items-center space-x-1 text-zinc-400 text-xs font-bold px-1 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FFC700]" />
              <span>Gợi ý Nhạc HOT Trend</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-7 h-7 rounded-full border-2 border-[#FFC700] border-t-transparent animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <p className="text-center text-zinc-500 text-xs py-8">
              Không tìm thấy bài hát nào phù hợp.
            </p>
          ) : (
            searchResults.map((track) => {
              const isSelected = selectedTrackId === track.id;
              const isPlaying = playingTrackId === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleSelect(track)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#FFC700]/15 border-[#FFC700]/50'
                      : 'bg-[#222228]/60 border-transparent hover:bg-[#26262c]'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate pr-2">
                    {/* Cover Art */}
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 border border-zinc-700">
                      <img
                        src={track.cover_url}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => handleTogglePreview(e, track)}
                        className="absolute inset-0 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 fill-white text-white" />
                        ) : (
                          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Track Titles */}
                    <div className="truncate">
                      <h4 className="text-white text-xs font-bold truncate">{track.title}</h4>
                      <p className="text-zinc-400 text-[11px] truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {/* Select Status */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={(e) => handleTogglePreview(e, track)}
                      className={`p-2 rounded-full border text-xs font-bold transition-all ${
                        isPlaying
                          ? 'bg-[#FFC700] text-black border-[#FFC700]'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                      }`}
                      title="Nghe thử 30s"
                    >
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#FFC700] text-black flex items-center justify-center">
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
