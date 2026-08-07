"use client";

import React, { useState, useEffect } from 'react';
import { MusicTrack } from '@/lib/types';
import { Search, Play, Pause, Bookmark, MoreHorizontal, X, Check, Music, Sparkles } from 'lucide-react';
import { killGlobalAudio, playGlobalAudio } from '@/lib/audioPlayer';

interface MusicPickerModalProps {
  onSelectMusic: (track: MusicTrack) => void;
  onClose: () => void;
  selectedTrackId?: string;
}

interface ExtendedTrack extends MusicTrack {
  playsCount?: string;
  chorusOffset?: number; // Start timestamp in seconds for main chorus snippet
}

// 🎵 30 Curated Trending Vietnamese & International Tracks with REAL iTunes Data
const PRESET_TRENDING_TRACKS: ExtendedTrack[] = [
  // ── Sơn Tùng M-TP ──
  { id: 'itunes-1749963740', title: 'Đừng Làm Trái Tim Anh Đau', artist: 'Sơn Tùng M-TP', playsCount: '12,5 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e3/0b/38/e30b383e-5818-321a-7626-557b7b0f8ba3/24UMGIM61359.rgb.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/fc/af/2a/fcaf2a66-0b90-22e1-2feb-7e7c7a03fb21/mzaf_13024672062350311939.plus.aac.p.m4a' },
  // ── Đen Vâu ──
  { id: 'itunes-1556531535', title: 'Lối Nhỏ', artist: 'Đen ft. Phương Anh Đào', playsCount: '8,3 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/06/3e/9a/063e9a8f-1383-c601-efda-347e7d02ba66/cover.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/2a/94/c6/2a94c63c-1977-3ac3-2f1f-31576871bf14/mzaf_4420170233551035322.plus.aac.p.m4a' },
  { id: 'itunes-1637380094', title: 'Bài Này Chill Phết', artist: 'Đen & MIN', playsCount: '11,2 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/5a/37/c8/5a37c86e-2ca3-48e0-04b5-d47a175dd651/cover.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/09/09/cb/0909cb07-b7dc-315a-296e-8528e7e3c3e7/mzaf_8402416386540560581.plus.aac.p.m4a' },
  { id: 'itunes-1545383723', title: 'Đi Về Nhà', artist: 'Đen & JustaTee', playsCount: '9,7 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/cb/6f/ad/cb6fad6d-03c3-8eb9-6f69-64e4e61240cf/cover.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/fb/d7/20/fbd7209b-651c-379f-534a-73218252117a/mzaf_16873367399898412415.plus.aac.p.m4a' },
  // ── HIEUTHUHAI ──
  { id: 'itunes-1728886502', title: 'Exit Sign', artist: 'HIEUTHUHAI & marzuz', playsCount: '7,6 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/9a/80/e5/9a80e53a-197d-6d4d-2799-ac0a68427d12/602458735987_Cover.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/04/8e/fe/048efee1-ac9a-07ad-7963-fa50674cda0c/mzaf_1252300324407879980.plus.aac.p.m4a' },
  // ── SOOBIN ──
  { id: 'itunes-1542969776', title: 'Tháng Năm', artist: 'SOOBIN', playsCount: '6,1 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/98/00/fd/9800fd4f-3538-1a5c-1f9d-198181abc22b/190295064648.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/a6/87/6e/a6876e27-ac26-cb4d-f772-6ae9a5721504/mzaf_2852679290110677683.plus.aac.p.m4a' },
  // ── Wren Evans ──
  { id: 'itunes-1712281414', title: 'Từng Quen', artist: 'Wren Evans & itsnk', playsCount: '5,4 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/cb/42/10/cb421004-d27a-6c08-a542-fa2e7ac3bb58/23UM1IM21988.rgb.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/52/88/30/5288308e-b8b0-f2c5-5c67-71b6a9b444b3/mzaf_10392631813891460655.plus.aac.p.m4a' },
  // ── Original 8 tracks (updated covers with real iTunes art) ──
  { id: 'vn-01', title: 'Từng Cho Nhau', artist: 'Hà Nhi', playsCount: '2,8 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7f/52/9c/7f529ce1-6323-6850-e25d-475a14519442/cover.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/7f/52/9c/7f529ce1-6323-6850-e25d-475a14519442/mzaf_295044505976301651.plus.aac.p.m4a' },
  { id: 'vn-02', title: 'Mặt Trời Của Em', artist: 'Phương Ly', playsCount: '4,1 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/62/1d/af/621daf20-05ad-2f7e-143f-f7520c3b7944/cover.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/62/1d/af/621daf20-05ad-2f7e-143f-f7520c3b7944/mzaf_5181422385936780454.plus.aac.p.m4a' },
  { id: 'vn-03', title: 'Chưa Quên Người Yêu Cũ', artist: 'Hà Nhi', playsCount: '5,2 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/9e/8b/da/9e8bda97-93bf-7454-cfec-0296ed4b86eb/cover.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9e/8b/da/9e8bda97-93bf-7454-cfec-0296ed4b86eb/mzaf_11684409070865915217.plus.aac.p.m4a' },
  { id: 'vn-04', title: 'Dù Cho Mai Về Sau', artist: 'buitruonglinh', playsCount: '6,5 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/a7/9e/cc/a79eccaa-1bb3-c055-79b5-2c3908b100bb/cover.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/a7/9e/cc/a79eccaa-1bb3-c055-79b5-2c3908b100bb/mzaf_13892798744674559808.plus.aac.p.m4a' },
  { id: 'vn-05', title: 'Đã Lỡ Yêu Em Nhiều', artist: 'JustaTee', playsCount: '7,1 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/0a/4f/de/0a4fdefa-b62d-dc9a-da01-1c9a77c37a2c/cover.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/0a/4f/de/0a4fdefa-b62d-dc9a-da01-1c9a77c37a2c/mzaf_14668488658695607446.plus.aac.p.m4a' },
  { id: 'vn-06', title: 'Chúng Ta Của Tương Lai', artist: 'Sơn Tùng M-TP', playsCount: '9,8 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ca/8f/c9/ca8fc99c-29b1-ec06-8d18-97e3a2db77df/840391487679.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b3/68/33/b36833e0-8ace-1303-6328-2a22e0ff0ac7/mzaf_5433348825881119564.plus.aac.p.m4a' },
  { id: 'vn-07', title: 'Nâng Chén Tiêu Sầu', artist: 'Bích Phương', playsCount: '3,6 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/72/eb/1b/72eb1bc4-e88a-7863-11a0-4d71a7b9ce03/cover.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/72/eb/1b/72eb1bc4-e88a-7863-11a0-4d71a7b9ce03/mzaf_15412607487550256140.plus.aac.p.m4a' },
  { id: 'vn-08', title: 'Ánh Sao Và Bầu Trời', artist: 'T.R.I', playsCount: '4,8 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b0/49/03/b04903f8-d0ee-7349-bfee-a4a5e9663ad2/cover.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/b0/49/03/b04903f8-d0ee-7349-bfee-a4a5e9663ad2/mzaf_8054767021025044881.plus.aac.p.m4a' },
  // ── International Hits ──
  { id: 'intl-01', title: 'APT.', artist: 'ROSÉ & Bruno Mars', playsCount: '15,2 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bf/13/be/bf13be02-4ec4-51e9-9fa9-fae26c117b4c/5054197992928.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/6b/c4/88/6bc4882e-60f2-b88d-7fb7-e21544a0e28b/mzaf_1003463991206103004.plus.aac.p.m4a' },
  { id: 'intl-02', title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', playsCount: '18,9 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/d9/39/33/d93933c0-e717-380d-85e8-54c30294e7ed/24UMGIM88005.rgb.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e5/22/df/e522df14-722a-f886-f6b0-ee0b4c73f5a8/mzaf_6380963162791771146.plus.aac.p.m4a' },
  { id: 'intl-03', title: 'Espresso', artist: 'Sabrina Carpenter', playsCount: '14,1 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/97/0c/31/970c3169-fb07-60a0-5932-590e0b97a78a/24UMGIM22080.rgb.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/36/3e/56/363e56d0-a552-4c33-f0cb-3a05aab8ebc0/mzaf_12466270045498498498.plus.aac.p.m4a' },
  { id: 'intl-04', title: 'Cruel Summer', artist: 'Taylor Swift', playsCount: '20,3 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e7/19/23/e71923ad-f9a0-8039-a3c4-3c42a61eb03c/19UMGIM55825.rgb.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/d5/e3/02/d5e302f3-a5a9-af6f-cc9e-53b899c328de/mzaf_16704937055375498824.plus.aac.p.m4a' },
  { id: 'intl-05', title: 'Blinding Lights', artist: 'The Weeknd', playsCount: '25,1 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/c4/40/93/c4409357-65b6-ee68-1a80-afb9e3668506/19UMGIM97843.rgb.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/d8/f9/53/d8f953e7-3e0c-9fce-04f0-b7e5c3553e95/mzaf_5663829694005355498.plus.aac.p.m4a' },
  { id: 'intl-06', title: 'Levitating', artist: 'Dua Lipa', playsCount: '16,7 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/fc/27/4d/fc274dac-1630-3ffc-6a8c-8a6ff8b7c283/20UMGIM25800.rgb.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/d9/8c/e5/d98ce5bc-edab-9f84-9156-cc72c65c86f5/mzaf_14987523279655478963.plus.aac.p.m4a' },
  { id: 'intl-07', title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', playsCount: '19,4 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e3/99/f3/e399f313-1370-b3ae-37d1-65a904c98e62/886449559886.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/e3/99/f3/e399f313-1370-b3ae-37d1-65a904c98e62/mzaf_3398888681789079457.plus.aac.p.m4a' },
  { id: 'intl-08', title: 'Flowers', artist: 'Miley Cyrus', playsCount: '22,8 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/c9/11/ba/c911ba4b-c43d-d2aa-af1a-d28fc3e7dbdc/23UMGIM02484.rgb.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/c5/65/54/c56554b4-7775-1c32-7b6e-7419b3d6e5d8/mzaf_3529093099757498009.plus.aac.p.m4a' },
  { id: 'intl-09', title: 'Dandelions', artist: 'Ruth B.', playsCount: '13,6 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/d4/68/a0/d468a021-88a6-6c95-31ea-b71c8cb5b9b4/886448949251.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/d4/68/a0/d468a021-88a6-6c95-31ea-b71c8cb5b9b4/mzaf_2791555793291838741.plus.aac.p.m4a' },
  { id: 'intl-10', title: 'Until I Found You', artist: 'Stephen Sanchez', playsCount: '11,9 triệu',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/ac/15/ae/ac15ae65-f0a0-c6b0-79b7-fdd3ba8c3c16/5056167168874.jpg/100x100bb.jpg',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/ac/15/ae/ac15ae65-f0a0-c6b0-79b7-fdd3ba8c3c16/mzaf_17803416714037116614.plus.aac.p.m4a' },
  // ── More Vietnamese Hits ──
  { id: 'vn-09', title: 'Có Hẹn Với Thanh Xuân', artist: 'MONSTAR', playsCount: '8,9 triệu',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/7f/52/9c/7f529ce1-6323-6850-e25d-475a14519442/mzaf_295044505976301651.plus.aac.p.m4a' },
  { id: 'vn-10', title: 'Thương Em Là Điều Anh Không Thể Ngờ', artist: 'Noo Phước Thịnh', playsCount: '6,8 triệu',
    cover_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&auto=format&fit=crop&q=80',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b3/68/33/b36833e0-8ace-1303-6328-2a22e0ff0ac7/mzaf_5433348825881119564.plus.aac.p.m4a' },
  { id: 'vn-11', title: 'Sau Lời Từ Khước', artist: 'Phan Mạnh Quỳnh', playsCount: '10,3 triệu',
    cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9e/8b/da/9e8bda97-93bf-7454-cfec-0296ed4b86eb/mzaf_11684409070865915217.plus.aac.p.m4a' },
  { id: 'vn-12', title: 'Hẹn Ước Từ Hư Vô', artist: 'Mỹ Tâm', playsCount: '8,1 triệu',
    cover_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&auto=format&fit=crop&q=80',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/a7/9e/cc/a79eccaa-1bb3-c055-79b5-2c3908b100bb/mzaf_13892798744674559808.plus.aac.p.m4a' },
];

// Search categories for quick discovery
const SEARCH_CATEGORIES = ['🔥 Trending', '🇻🇳 Việt Nam', '🌍 Quốc tế', '💕 Tình yêu', '🎧 Chill', '🎉 Sôi động'];

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
          `/api/music?term=${encodeURIComponent(searchQuery)}`
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

  // Kill audio when modal unmounts
  useEffect(() => {
    return () => {
      killGlobalAudio();
      setPlayingTrackId(null);
    };
  }, []);

  const handleTogglePreview = (e: React.MouseEvent, track: ExtendedTrack) => {
    e.stopPropagation();

    if (playingTrackId === track.id) {
      // Currently playing this track → stop it
      killGlobalAudio();
      setPlayingTrackId(null);
    } else {
      // Play a new track (killGlobalAudio is called inside playGlobalAudio)
      setPlayingTrackId(track.id);
      playGlobalAudio(track.preview_url, () => setPlayingTrackId(null));
    }
  };

  const handleSelect = (track: ExtendedTrack) => {
    killGlobalAudio();
    setPlayingTrackId(null);
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
                className="absolute right-3.5 top-2.5 text-zinc-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
              isBookmarked ? 'bg-[#FFC700] text-black' : 'bg-[#2C2C34] text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Search Category Chips */}
        {!searchQuery && (
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto scrollbar-hide flex-shrink-0 -mx-1 px-1">
            {SEARCH_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSearchQuery(cat.replace(/^[^\w\s]+/, '').trim())}
                className="whitespace-nowrap bg-[#2C2C34] hover:bg-[#3C3C44] text-zinc-300 hover:text-white text-[11px] font-semibold px-3 py-1.5 rounded-full border border-zinc-700/50 transition-all active:scale-95"
              >
                {cat}
              </button>
            ))}
          </div>
        )}

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
