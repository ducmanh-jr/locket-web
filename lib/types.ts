export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  created_at?: string;
  email?: string;
  isAdmin?: boolean;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  friend?: Profile;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
  preview_url: string;
}

export interface Moment {
  id: string;
  sender_id: string;
  sender?: Profile;
  media_url: string;
  media_type?: 'photo' | 'video';
  audio_option?: 'mute' | 'original' | 'music';
  caption?: string;
  created_at: string;
  recipients?: MomentRecipient[];
  reactions?: Reaction[];
  music?: MusicTrack;
  thumbnail_url?: string;
  blur_placeholder?: string;
}

export interface MomentRecipient {
  moment_id: string;
  recipient_id: string;
  seen_at?: string | null;
  recipient?: Profile;
}

export interface Reaction {
  id: string;
  moment_id: string;
  user_id: string;
  user?: Profile;
  emoji: string;
  created_at: string;
}
