-- Phase 3: Informed consent records
-- Run in Supabase SQL Editor after 001_initial_schema.sql

-- Optional columns on sessions for quick audit
alter table public.sessions
  add column if not exists informed_consent_at timestamptz,
  add column if not exists informed_consent_version text;

-- Dedicated consents log
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  consent_type text not null,
  version text not null default '2026-07-16',
  agreed boolean not null default true,
  agreed_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists consents_user_id_idx on public.consents (user_id);
create index if not exists consents_session_id_idx on public.consents (session_id);
create index if not exists consents_type_idx on public.consents (consent_type);

alter table public.consents enable row level security;

drop policy if exists "Users can view own consents" on public.consents;
create policy "Users can view own consents"
  on public.consents for select
  using (auth.uid() = user_id or public.is_practitioner());

drop policy if exists "Users can insert own consents" on public.consents;
create policy "Users can insert own consents"
  on public.consents for insert
  with check (auth.uid() = user_id or public.is_practitioner());

grant select, insert on public.consents to authenticated;
