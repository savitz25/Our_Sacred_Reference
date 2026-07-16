-- Track 1-hour pre-session reminder emails (cron-driven)
alter table public.sessions
  add column if not exists reminder_1h_sent_at timestamptz;

create index if not exists sessions_reminder_1h_pending_idx
  on public.sessions (scheduled_at)
  where reminder_1h_sent_at is null
    and status not in ('cancelled', 'completed');

comment on column public.sessions.reminder_1h_sent_at is
  'When the ~1 hour pre-session reminder was sent to client + practitioner';
