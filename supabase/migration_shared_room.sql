-- ========================================================
-- 🔧 LOCKETWEB - MIGRATION: FIX FOR SHARED ROOM MODEL
-- ========================================================
-- Run this in Supabase SQL Editor to fix the database
-- for the "everyone sees everything" shared room concept.
-- ========================================================

-- =============================================
-- STEP 1: Drop old restrictive RLS policies
-- =============================================

-- Drop moments policies
drop policy if exists "Recipients and sender can view moments" on public.moments;
drop policy if exists "Users can insert own moments" on public.moments;

-- Drop profiles policies
drop policy if exists "Public profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

-- Drop reactions policies
drop policy if exists "Reactions visible to moment viewers" on public.reactions;
drop policy if exists "Users can insert reactions on accessible moments" on public.reactions;

-- Drop moment_recipients policies
drop policy if exists "Users can view moment recipients for visible moments" on public.moment_recipients;
drop policy if exists "Senders can insert moment recipients" on public.moment_recipients;
drop policy if exists "Recipients can update seen status" on public.moment_recipients;

-- Drop friendships policies
drop policy if exists "Users can view their friendships" on public.friendships;
drop policy if exists "Users can create friend requests" on public.friendships;
drop policy if exists "Users can update friendships they are part of" on public.friendships;
drop policy if exists "Users can delete their friendships" on public.friendships;

-- Drop storage policies
drop policy if exists "Users can upload own moments to storage" on storage.objects;
drop policy if exists "Users can view moment images in storage" on storage.objects;

-- =============================================
-- STEP 2: Drop old tables (with cascade)
-- =============================================

drop table if exists public.reactions cascade;
drop table if exists public.moment_recipients cascade;
drop table if exists public.moments cascade;
drop table if exists public.friendships cascade;
drop table if exists public.profiles cascade;

-- =============================================
-- STEP 3: Recreate tables with TEXT IDs
-- (Compatible with client-generated string IDs)
-- =============================================

-- Profiles table: stores all Google-authenticated users
create table public.profiles (
  id text primary key,
  username text not null default 'locket_user',
  display_name text default 'Thành viên Locket',
  avatar_url text default '',
  created_at timestamptz default now()
);

-- Moments table: the shared room photo/video stack
create table public.moments (
  id text primary key,
  sender_id text,
  media_url text not null,
  media_type text default 'photo',
  caption text default '',
  thumbnail_url text,
  created_at timestamptz default now()
);

-- Reactions table: emoji reactions on moments
create table public.reactions (
  id text primary key default gen_random_uuid()::text,
  moment_id text references public.moments(id) on delete cascade,
  user_id text,
  emoji text not null default '❤️',
  created_at timestamptz default now()
);

-- Friendships table (optional, for future use)
create table public.friendships (
  id text primary key default gen_random_uuid()::text,
  requester_id text,
  addressee_id text,
  status text default 'accepted',
  created_at timestamptz default now()
);

-- =============================================
-- STEP 4: Enable RLS but with OPEN policies
-- (Shared Room = everyone sees everything)
-- =============================================

alter table public.profiles enable row level security;
alter table public.moments enable row level security;
alter table public.reactions enable row level security;
alter table public.friendships enable row level security;

-- PROFILES: Anyone can read, anyone can insert/update
create policy "profiles_select_open" on public.profiles for select using (true);
create policy "profiles_insert_open" on public.profiles for insert with check (true);
create policy "profiles_update_open" on public.profiles for update using (true);

-- MOMENTS: Full open access for shared room
create policy "moments_select_open" on public.moments for select using (true);
create policy "moments_insert_open" on public.moments for insert with check (true);
create policy "moments_update_open" on public.moments for update using (true);
create policy "moments_delete_open" on public.moments for delete using (true);

-- REACTIONS: Full open access
create policy "reactions_select_open" on public.reactions for select using (true);
create policy "reactions_insert_open" on public.reactions for insert with check (true);

-- FRIENDSHIPS: Full open access
create policy "friendships_select_open" on public.friendships for select using (true);
create policy "friendships_insert_open" on public.friendships for insert with check (true);

-- =============================================
-- STEP 5: Storage bucket for media uploads
-- =============================================

insert into storage.buckets (id, name, public)
values ('moments', 'moments', true)
on conflict (id) do update set public = true;

-- Storage: open access for uploads and reads
create policy "storage_select_open" on storage.objects for select using (bucket_id = 'moments');
create policy "storage_insert_open" on storage.objects for insert with check (bucket_id = 'moments');
create policy "storage_update_open" on storage.objects for update using (bucket_id = 'moments');
create policy "storage_delete_open" on storage.objects for delete using (bucket_id = 'moments');

-- =============================================
-- STEP 6: Enable Realtime for instant sync
-- =============================================

alter publication supabase_realtime add table public.moments;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.profiles;
