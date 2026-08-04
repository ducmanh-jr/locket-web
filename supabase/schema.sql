-- ========================================================
-- 📸 LOCKETWEB - DATABASE SCHEMA & RLS POLICIES (SUPABASE)
-- ========================================================

-- 1. Profiles Table (Extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username varchar(30) unique not null,
  display_name varchar(50),
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. Friendships Table (2-way friend requests)
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status varchar(10) not null default 'pending', -- 'pending' | 'accepted' | 'blocked'
  created_at timestamptz default now(),
  unique (requester_id, addressee_id)
);

-- 3. Moments Table (Captured photos)
create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  media_url text not null,
  caption varchar(200),
  created_at timestamptz default now()
);

-- 4. Moment Recipients Table (Many-to-Many recipients of moments)
create table if not exists public.moment_recipients (
  moment_id uuid references public.moments(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  seen_at timestamptz,
  primary key (moment_id, recipient_id)
);

-- 5. Reactions Table (Emoji responses)
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid references public.moments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji varchar(10) not null,
  created_at timestamptz default now()
);

-- ========================================================
-- 🔐 ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.moments enable row level security;
alter table public.moment_recipients enable row level security;
alter table public.reactions enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

-- Friendships Policies
create policy "Users can view their friendships"
on public.friendships for select
to authenticated
using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can create friend requests"
on public.friendships for insert
to authenticated
with check (auth.uid() = requester_id);

create policy "Users can update friendships they are part of"
on public.friendships for update
to authenticated
using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can delete their friendships"
on public.friendships for delete
to authenticated
using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Moments Policies
create policy "Recipients and sender can view moments"
on public.moments for select
to authenticated
using (
  auth.uid() = sender_id
  or exists (
    select 1 from public.moment_recipients
    where moment_recipients.moment_id = moments.id
    and moment_recipients.recipient_id = auth.uid()
  )
);

create policy "Users can insert own moments"
on public.moments for insert
to authenticated
with check (auth.uid() = sender_id);

-- Moment Recipients Policies
create policy "Users can view moment recipients for visible moments"
on public.moment_recipients for select
to authenticated
using (
  auth.uid() = recipient_id
  or exists (
    select 1 from public.moments
    where moments.id = moment_recipients.moment_id
    and moments.sender_id = auth.uid()
  )
);

create policy "Senders can insert moment recipients"
on public.moment_recipients for insert
to authenticated
with check (
  exists (
    select 1 from public.moments
    where moments.id = moment_recipients.moment_id
    and moments.sender_id = auth.uid()
  )
);

create policy "Recipients can update seen status"
on public.moment_recipients for update
to authenticated
using (auth.uid() = recipient_id);

-- Reactions Policies
create policy "Reactions visible to moment viewers"
on public.reactions for select
to authenticated
using (
  exists (
    select 1 from public.moments
    where moments.id = reactions.moment_id
    and (
      moments.sender_id = auth.uid()
      or exists (
        select 1 from public.moment_recipients
        where moment_recipients.moment_id = moments.id
        and moment_recipients.recipient_id = auth.uid()
      )
    )
  )
);

create policy "Users can insert reactions on accessible moments"
on public.reactions for insert
to authenticated
with check (auth.uid() = user_id);

-- ========================================================
-- 📦 STORAGE BUCKET & POLICIES
-- ========================================================
-- Run these in Supabase SQL Editor if creating bucket via SQL:

insert into storage.buckets (id, name, public)
values ('moments', 'moments', false)
on conflict (id) do nothing;

create policy "Users can upload own moments to storage"
on storage.objects for insert
to authenticated
with check (bucket_id = 'moments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view moment images in storage"
on storage.objects for select
to authenticated
using (bucket_id = 'moments');

-- ========================================================
-- ⚡ REALTIME PUBLICATION SETUP
-- ========================================================

-- Enable Realtime for key tables
alter publication supabase_realtime add table public.moments;
alter publication supabase_realtime add table public.moment_recipients;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.friendships;

-- Trigger to create profile automatically on auth user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', concat('user_', substring(new.id::text, 1, 8))),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Locket User'),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
