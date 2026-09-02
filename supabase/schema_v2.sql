-- ========================================================
-- 📸 LOCKETWEB - DATABASE SCHEMA V2 (PRODUCTION DOCKER & POSTGRES)
-- ========================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL DEFAULT 'locket_user',
  display_name VARCHAR(100) DEFAULT 'Thành viên Locket',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Moments Table (Soft Delete support with deleted_at)
CREATE TABLE IF NOT EXISTS public.moments (
  id VARCHAR(64) PRIMARY KEY,
  sender_id VARCHAR(64) REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type VARCHAR(20) DEFAULT 'photo',
  caption TEXT DEFAULT '',
  thumbnail_url TEXT,
  audio_option VARCHAR(20) DEFAULT 'original',
  music_json JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Index for Active Feed (Fast Order by created_at DESC filtering out soft-deleted items)
CREATE INDEX IF NOT EXISTS idx_moments_active_feed 
ON public.moments (created_at DESC) 
WHERE deleted_at IS NULL;

-- 3. Tombstone Ledger Table (Prevents client offline re-push resurrection)
CREATE TABLE IF NOT EXISTS public.deleted_ledger (
  entity_type VARCHAR(20) NOT NULL, -- 'moment' or 'member'
  entity_id VARCHAR(64) PRIMARY KEY,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Reactions Table
CREATE TABLE IF NOT EXISTS public.reactions (
  id VARCHAR(64) PRIMARY KEY,
  moment_id VARCHAR(64) REFERENCES public.moments(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL DEFAULT '❤️',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Friendships Table
CREATE TABLE IF NOT EXISTS public.friendships (
  id VARCHAR(64) PRIMARY KEY,
  requester_id VARCHAR(64) REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id VARCHAR(64) REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'accepted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
