-- Sacred Reference — Stripe payments (card-only)
-- Run in Supabase SQL Editor after deploying this migration file.

-- Payment status for sessions
do $$ begin
  create type public.session_payment_status as enum (
    'not_required',
    'pending',
    'processing',
    'paid',
    'failed',
    'refunded'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_record_status as enum (
    'pending',
    'processing',
    'succeeded',
    'failed',
    'canceled',
    'refunded'
  );
exception when duplicate_object then null;
end $$;

-- Profiles: Stripe Customer linkage
alter table public.profiles
  add column if not exists stripe_customer_id text;

alter table public.profiles
  add column if not exists stripe_default_payment_method_id text;

create unique index if not exists profiles_stripe_customer_id_uidx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- Sessions: amount + payment tracking
alter table public.sessions
  add column if not exists payment_status public.session_payment_status not null default 'not_required';

alter table public.sessions
  add column if not exists amount_cents integer;

alter table public.sessions
  add column if not exists currency text not null default 'usd';

alter table public.sessions
  add column if not exists stripe_payment_intent_id text;

alter table public.sessions
  add column if not exists charged_at timestamptz;

alter table public.sessions
  add column if not exists payment_error text;

create index if not exists sessions_payment_status_idx
  on public.sessions (payment_status);

create index if not exists sessions_stripe_pi_idx
  on public.sessions (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- Payment ledger (audit trail)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  amount_cents integer not null,
  currency text not null default 'usd',
  status public.payment_record_status not null default 'pending',
  payment_method_last4 text,
  payment_method_brand text,
  error_message text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments (user_id);
create index if not exists payments_session_id_idx on public.payments (session_id);
create unique index if not exists payments_stripe_pi_uidx
  on public.payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id or public.is_practitioner());

-- Clients never insert/update payments directly (server/service role only)
drop policy if exists "Practitioners can view all payments" on public.payments;
create policy "Practitioners can view all payments"
  on public.payments for select
  using (public.is_practitioner());

comment on column public.profiles.stripe_customer_id is
  'Stripe Customer id (cus_…) linked to this profile';
comment on column public.sessions.payment_status is
  'not_required for free discovery; pending until charged after session or at booking';
comment on table public.payments is
  'Ledger of Stripe PaymentIntents for Sacred Reference sessions';
