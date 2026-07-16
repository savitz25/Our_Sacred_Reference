-- Practitioner unavailability blocks (hide from public booking calendar)
-- Run in Supabase SQL Editor after previous migrations.

do $$ begin
  create type public.availability_block_kind as enum (
    'date_range',      -- one or more whole days (or hours on those days)
    'datetime_range',  -- explicit start/end timestamps
    'recurring_weekly' -- every weekday (optional hours) until recurrence_until
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  kind public.availability_block_kind not null,
  -- date_range / datetime_range
  starts_on date,
  ends_on date,
  -- optional daily window within date_range (null = all day)
  start_time time,
  end_time time,
  -- datetime_range (preferred when set)
  start_at timestamptz,
  end_at timestamptz,
  -- recurring_weekly
  day_of_week smallint check (day_of_week is null or day_of_week between 0 and 6),
  recurrence_until date,
  label text,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists availability_blocks_active_idx
  on public.availability_blocks (is_active);
create index if not exists availability_blocks_dates_idx
  on public.availability_blocks (starts_on, ends_on);
create index if not exists availability_blocks_dow_idx
  on public.availability_blocks (day_of_week)
  where kind = 'recurring_weekly';

drop trigger if exists availability_blocks_updated_at on public.availability_blocks;
create trigger availability_blocks_updated_at
  before update on public.availability_blocks
  for each row execute function public.set_updated_at();

alter table public.availability_blocks enable row level security;

-- Anyone can read active blocks (needed for public booking calendar)
drop policy if exists "Anyone can read active availability blocks" on public.availability_blocks;
create policy "Anyone can read active availability blocks"
  on public.availability_blocks for select
  using (is_active = true or public.is_practitioner());

-- Practitioners manage all blocks
drop policy if exists "Practitioners manage availability blocks" on public.availability_blocks;
create policy "Practitioners manage availability blocks"
  on public.availability_blocks for all
  using (public.is_practitioner())
  with check (public.is_practitioner());

grant select on public.availability_blocks to anon, authenticated;
grant insert, update, delete on public.availability_blocks to authenticated;
