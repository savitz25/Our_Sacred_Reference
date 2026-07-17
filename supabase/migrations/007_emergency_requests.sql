-- Emergency session requests (client → practitioner proposal → client confirm)
do $$ begin
  create type public.emergency_request_status as enum (
    'pending',
    'proposed',
    'accepted',
    'declined',
    'expired',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.emergency_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reason text,
  status public.emergency_request_status not null default 'pending',
  -- Practitioner proposal
  delay_minutes integer check (delay_minutes is null or delay_minutes in (0, 15, 30, 45, 60)),
  proposed_at timestamptz,
  proposed_by uuid references public.profiles (id) on delete set null,
  practitioner_note text,
  -- Linked session (created when Michele proposes)
  session_id uuid references public.sessions (id) on delete set null,
  -- Secure token for email Accept / Decline links
  response_token text not null unique,
  client_responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists emergency_requests_status_idx
  on public.emergency_requests (status, created_at desc);
create index if not exists emergency_requests_user_idx
  on public.emergency_requests (user_id, created_at desc);
create index if not exists emergency_requests_token_idx
  on public.emergency_requests (response_token);

drop trigger if exists emergency_requests_updated_at on public.emergency_requests;
create trigger emergency_requests_updated_at
  before update on public.emergency_requests
  for each row execute function public.set_updated_at();

alter table public.emergency_requests enable row level security;

-- Clients: read own + insert own
drop policy if exists "Users read own emergency requests" on public.emergency_requests;
create policy "Users read own emergency requests"
  on public.emergency_requests for select
  using (auth.uid() = user_id or public.is_practitioner());

drop policy if exists "Users insert own emergency requests" on public.emergency_requests;
create policy "Users insert own emergency requests"
  on public.emergency_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own emergency requests" on public.emergency_requests;
create policy "Users update own emergency requests"
  on public.emergency_requests for update
  using (auth.uid() = user_id or public.is_practitioner())
  with check (auth.uid() = user_id or public.is_practitioner());

-- Practitioners manage all
drop policy if exists "Practitioners manage emergency requests" on public.emergency_requests;
create policy "Practitioners manage emergency requests"
  on public.emergency_requests for all
  using (public.is_practitioner())
  with check (public.is_practitioner());

grant select, insert, update on public.emergency_requests to authenticated;

comment on table public.emergency_requests is
  'Client emergency session requests; practitioner proposes instant or delayed slot; client accepts/declines';
