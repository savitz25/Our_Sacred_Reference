-- Ensure practitioners can list client profiles for admin dashboard joins.
-- Safe to re-run.

alter table public.profiles enable row level security;

-- Clients already have "Users can view own profile".
-- Practitioners need to list all profiles for admin tables.
drop policy if exists "Practitioners can view all profiles" on public.profiles;
create policy "Practitioners can view all profiles"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.is_practitioner()
  );

-- Confirm sessions/videos practitioner select policies exist (from 001)
-- Recreate if missing
drop policy if exists "Users can view own sessions" on public.sessions;
create policy "Users can view own sessions"
  on public.sessions for select
  using (auth.uid() = user_id or public.is_practitioner());

drop policy if exists "Users can view own videos" on public.videos;
create policy "Users can view own videos"
  on public.videos for select
  using (auth.uid() = user_id or public.is_practitioner());
