-- Phase 4: LiveKit Egress tracking columns
-- Run in Supabase SQL Editor after 001 + 002

alter table public.sessions
  add column if not exists egress_id text,
  add column if not exists recording_path text;

alter table public.videos
  add column if not exists egress_id text;

create index if not exists sessions_egress_id_idx on public.sessions (egress_id);
create index if not exists videos_egress_id_idx on public.videos (egress_id);
