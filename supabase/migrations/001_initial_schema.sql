-- Sacred Reference — Phase 2 schema + RLS
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/mbboakpdxgquntlohlix/sql

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.user_role as enum ('client', 'practitioner', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.session_status as enum (
    'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.session_type as enum (
    'discovery', 'individual', 'ongoing', 'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.video_status as enum (
    'processing', 'ready', 'failed', 'archived'
  );
exception when duplicate_object then null;
end $$;

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role public.user_role not null default 'client',
  timezone text default 'America/Los_Angeles',
  notifications_enabled boolean not null default true,
  recording_consent boolean not null default true,
  intention text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sessions
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  therapist_id uuid references public.profiles (id) on delete set null,
  title text not null default 'Session with Michele',
  session_type public.session_type not null default 'individual',
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  status public.session_status not null default 'scheduled',
  meeting_url text,
  livekit_room text,
  notes text,
  recording_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on public.sessions (user_id);
create index if not exists sessions_scheduled_at_idx on public.sessions (scheduled_at);
create index if not exists sessions_status_idx on public.sessions (status);

-- Videos (private library)
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions (id) on delete set null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  category_tags text[] not null default '{}',
  storage_path text,
  public_url text,
  duration_seconds integer,
  transcript_summary text,
  status public.video_status not null default 'processing',
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists videos_user_id_idx on public.videos (user_id);
create index if not exists videos_session_id_idx on public.videos (session_id);

-- Practitioner weekly availability template (for booking calendar)
create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists sessions_updated_at on public.sessions;
create trigger sessions_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

drop trigger if exists videos_updated_at on public.videos;
create trigger videos_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

-- Auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  practitioner_email text := lower(coalesce(current_setting('app.practitioner_email', true), ''));
  new_role public.user_role := 'client';
begin
  if practitioner_email <> '' and lower(new.email) = practitioner_email then
    new_role := 'practitioner';
  end if;

  insert into public.profiles (id, email, full_name, role, phone, intention)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new_role,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'intention'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    intention = coalesce(excluded.intention, public.profiles.intention),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is current user a practitioner/admin?
create or replace function public.is_practitioner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('practitioner', 'admin')
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.videos enable row level security;
alter table public.availability_slots enable row level security;

-- Profiles policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_practitioner());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Sessions policies
drop policy if exists "Users can view own sessions" on public.sessions;
create policy "Users can view own sessions"
  on public.sessions for select
  using (auth.uid() = user_id or public.is_practitioner());

drop policy if exists "Users can insert own sessions" on public.sessions;
create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id or public.is_practitioner());

drop policy if exists "Users can update own sessions" on public.sessions;
create policy "Users can update own sessions"
  on public.sessions for update
  using (auth.uid() = user_id or public.is_practitioner());

-- Videos policies
drop policy if exists "Users can view own videos" on public.videos;
create policy "Users can view own videos"
  on public.videos for select
  using (auth.uid() = user_id or public.is_practitioner());

drop policy if exists "Practitioners manage videos" on public.videos;
create policy "Practitioners manage videos"
  on public.videos for all
  using (public.is_practitioner())
  with check (public.is_practitioner());

drop policy if exists "Users insert own videos" on public.videos;
create policy "Users insert own videos"
  on public.videos for insert
  with check (auth.uid() = user_id or public.is_practitioner());

-- Availability: anyone authenticated can read active slots
drop policy if exists "Anyone can read availability" on public.availability_slots;
create policy "Anyone can read availability"
  on public.availability_slots for select
  using (is_active = true or public.is_practitioner());

drop policy if exists "Practitioners manage availability" on public.availability_slots;
create policy "Practitioners manage availability"
  on public.availability_slots for all
  using (public.is_practitioner())
  with check (public.is_practitioner());

-- Seed default weekday availability (Mon–Fri, sample slots)
insert into public.availability_slots (day_of_week, start_time, end_time)
select d, t::time, (t::time + interval '1 hour')::time
from generate_series(1, 5) as d,
     unnest(array['09:00','11:00','13:00','15:00','17:00']) as t
where not exists (select 1 from public.availability_slots limit 1);

-- Private storage bucket for session recordings
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'session-recordings',
  'session-recordings',
  false,
  524288000, -- 500MB
  array['video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

-- Storage RLS: users can read their own folder {user_id}/*
drop policy if exists "Users read own recordings" on storage.objects;
create policy "Users read own recordings"
  on storage.objects for select
  using (
    bucket_id = 'session-recordings'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_practitioner()
    )
  );

drop policy if exists "Service or practitioner upload recordings" on storage.objects;
create policy "Service or practitioner upload recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'session-recordings'
    and public.is_practitioner()
  );

drop policy if exists "Practitioners update recordings" on storage.objects;
create policy "Practitioners update recordings"
  on storage.objects for update
  using (
    bucket_id = 'session-recordings'
    and public.is_practitioner()
  );

drop policy if exists "Practitioners delete recordings" on storage.objects;
create policy "Practitioners delete recordings"
  on storage.objects for delete
  using (
    bucket_id = 'session-recordings'
    and public.is_practitioner()
  );

-- Grant usage
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.sessions to authenticated;
grant select, insert on public.videos to authenticated;
grant select on public.availability_slots to anon, authenticated;
