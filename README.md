# Sacred Reference Website

**Mytho-Shamanic Somatic Healing** — Next.js 15 + Supabase + LiveKit.

Repository: [github.com/savitz25/Our_Sacred_Reference](https://github.com/savitz25/Our_Sacred_Reference)  
Supabase: `https://mbboakpdxgquntlohlix.supabase.co`

> **Ready for Launch** — Feature-complete MVP: auth, booking + informed consent, portal, LiveKit video + RoomComposite Egress recordings, private library with signed URLs, legal pages, and production security headers. Complete the [Production Launch Checklist](#production-launch-checklist) with real keys and domain DNS before opening to clients.

---

## Features

| Area | Status |
|------|--------|
| Public marketing site | ✅ |
| Supabase Auth + protected `/portal` | ✅ |
| Discovery booking + auto account creation | ✅ |
| Informed Consent (required checkbox + DB) | ✅ |
| Legal: Terms, Privacy Policy, Consent + disclaimers | ✅ |
| Session calendar → `sessions` table | ✅ |
| LiveKit in-browser video | ✅ (demo mode without keys) |
| RoomComposite Egress → private Supabase Storage | ✅ |
| Optional FFmpeg post-process | ✅ when `ffmpeg` on PATH |
| Library signed URLs | ✅ |
| Resend “recording ready” email | ✅ optional |
| Security headers, sitemap, robots, health check | ✅ |
| Practitioner **Admin** (`/admin`) — appointments & recordings | ✅ |
| Admin auth/role hardening for production | ✅ |
| Stripe payments | ⏳ future |
| Full HIPAA / BAAs | ⏳ legal + vendor BAAs |

### Legal pages

| Route | Document |
|-------|----------|
| `/terms` | Terms of Service |
| `/privacy-policy` | Privacy Policy |
| `/consent` | Informed Consent / Service Agreement |

Site-wide disclaimer: alternative health / somatic / mytho-shamanic **coaching** — not licensed clinical therapy; confidential but **not HIPAA**.

---

## Local setup

### 1. Clone & install

```bash
git clone https://github.com/savitz25/Our_Sacred_Reference.git
cd Our_Sacred_Reference
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in real values in `.env.local` (never commit this file):

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Pre-filled (`mbboakpdxgquntlohlix`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally; production HTTPS domain on Vercel |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `NEXT_PUBLIC_LIVEKIT_URL` | [LiveKit Cloud](https://cloud.livekit.io) |
| `SUPABASE_S3_ACCESS_KEY` / `SUPABASE_S3_SECRET_KEY` | Supabase → Storage → S3 Access Keys |
| `RESEND_API_KEY` | [Resend](https://resend.com) → API Keys |
| `RESEND_FROM_EMAIL` | e.g. `Michele \| Sacred Reference <michele@oursacredreference.com>` |
| `PRACTITIONER_NOTIFY_EMAIL` | `michele@oursacredreference.com` |

Full comments: [`.env.example`](./.env.example). Checklist: `npm run vercel:env-checklist`.

#### Fix: “Supabase environment variables may be missing on Vercel”

That login error means Production is missing public Supabase keys.

1. Vercel → Project → **Settings → Environment Variables**
2. Add for **Production** (and Preview):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://mbboakpdxgquntlohlix.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from Supabase API settings)
   - `SUPABASE_SERVICE_ROLE_KEY` = (service_role — server only)
   - `NEXT_PUBLIC_SITE_URL` = `https://your-production-domain`
3. Do **not** wrap values in quotes in the Vercel UI
4. **Redeploy** (Deployments → Redeploy) — required for `NEXT_PUBLIC_*` changes
5. Confirm: `https://your-domain/api/health` → `"status":"ready"`

**Restart the dev server** after editing local env:

```bash
npm run dev
```

### 3. Database migrations (once)

In [Supabase SQL Editor](https://supabase.com/dashboard/project/mbboakpdxgquntlohlix/sql), run in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_consents.sql`
3. `supabase/migrations/003_recording_egress.sql`
4. `supabase/migrations/004_admin_profile_select.sql`

**Michele admin account** (password via env only — never commit):

```bash
# PowerShell example
$env:MICHELE_PASSWORD="your-secure-password"
npm run setup:michele
```

Or SQL for role only:

```sql
update public.profiles
set role = 'practitioner'
where email = 'michele@oursacredreference.com';
```

Sign in: **[/login?next=/admin](/login?next=/admin)** — practitioners are sent to `/admin` after login.

### 4. Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run setup:michele` | Ensure Michele practitioner user (needs `MICHELE_PASSWORD`) |
| `npm run vercel:env-checklist` | Print Vercel env setup steps |

---

## Production Launch Checklist

Use this before inviting real clients.

### A. Vercel project

- [ ] Import GitHub repo → deploy Next.js app  
- [ ] Set **all** env vars from `.env.example` for **Production** (and Preview if desired)  
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain (e.g. `https://www.sacredreference.com`)  
- [ ] Confirm deploy succeeds and `/api/health` returns `"status":"ready"`  

### B. Custom domain & DNS

Detailed guide: [`docs/DOMAIN_AND_DNS.md`](./docs/DOMAIN_AND_DNS.md).

- [ ] Vercel → **Settings → Domains** → add apex + `www`  
- [ ] DNS at registrar:

  | Type | Name | Value (typical) |
  |------|------|------------------|
  | A | `@` | `76.76.21.21` |
  | CNAME | `www` | `cname.vercel-dns.com` |

  (Use exact values from Vercel Domains UI.)  
- [ ] Choose preferred host (recommend `www`); enable redirect for the other  
- [ ] Wait for SSL certificate (automatic)  
- [ ] Verify `https://www.yourdomain.com` loads with a valid certificate  

### C. Supabase

- [ ] Migrations `001`–`003` applied  
- [ ] Auth → URL configuration:  
  - Site URL = production domain  
  - Redirect URLs include `https://www.yourdomain.com/auth/callback`  
- [ ] Private bucket `session-recordings` exists  
- [ ] S3 access keys created → `SUPABASE_S3_ACCESS_KEY` / `SUPABASE_S3_SECRET_KEY` on Vercel  
- [ ] Practitioner role set for Michele’s account  

### D. LiveKit

- [ ] Project created; API key, secret, WSS URL on Vercel  
- [ ] Webhook URL: `https://www.yourdomain.com/api/webhooks/livekit-egress`  
  - Events: at least `egress_ended`  
- [ ] Test join room (not demo mode)  

### E. Resend transactional email

1. Create an API key at [resend.com](https://resend.com) → **API Keys**.
2. Add and verify domain `oursacredreference.com` (or your domain) under **Domains** (SPF/DKIM DNS).
3. Set on Vercel / `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=Michele | Sacred Reference <michele@oursacredreference.com>
PRACTITIONER_NOTIFY_EMAIL=michele@oursacredreference.com
```

4. Restart / redeploy.
5. Test:
   - Book a discovery session → **booking confirmation** to **customer + Michele**
   - Session reminder cron → same dual recipients
   - Recording ready → **customer only** (library + private link)
6. Optional reminders: call `POST /api/cron/session-reminders` hourly with  
   `Authorization: Bearer <CRON_SECRET>` (set `CRON_SECRET` in env).

Until the domain is verified, Resend may only allow sends to your account email; use their test mode or verify DNS for production.

### F. End-to-end user journey test

1. Open `/book-session`  
2. Select date/time → complete intake  
3. Check **Informed Consent** + communications checkboxes → confirm  
4. Land in `/portal` with upcoming session  
5. **Join Secure Video Session** → cameras/mics work; egress recording indicator on  
6. **Leave** → session-complete / processing state  
7. Wait for LiveKit webhook (or short poll) → `/portal/library` shows video `ready`  
8. Play via **signed URL** player  
9. Confirm legal pages: `/terms`, `/privacy-policy`, `/consent`  
10. Confirm disclaimers on home, book, footer  

### G. Security & ops

- [ ] No secrets in git (`.env*` gitignored; only `.env.example` committed)  
- [ ] Service role key only on server/Vercel (never `NEXT_PUBLIC_`)  
- [ ] Security headers active (see `next.config.ts`)  
- [ ] Uptime check on `/api/health` (optional)  
- [ ] Legal counsel review of Terms / Privacy / Consent before marketing as final  

### H. Post-launch (not blockers for soft launch)

- [ ] Stripe for paid packages  
- [ ] Vendor BAAs if treating as regulated PHI (current positioning is coaching, not HIPAA therapy)  
- [ ] Practitioner admin UI  
- [ ] Self-hosted FFmpeg worker for silence trim in production  

---

## Deploy (Vercel) — quick path

1. [vercel.com/new](https://vercel.com/new) → import this repo  
2. Environment variables (same as `.env.local`, production domain for `NEXT_PUBLIC_SITE_URL`)  
3. Deploy  
4. Domain + DNS (section B)  
5. Supabase Auth redirects + LiveKit webhook (sections C–D)  

`vercel.json` sets framework/region defaults; headers are also defined in `next.config.ts`.

---

## Architecture

```
src/
  app/
    actions/           # auth, booking, profile, sessions
    api/
      health/          # deploy readiness
      livekit/         # token + recording start/stop
      videos/[id]/url  # private signed URLs
      webhooks/        # session-ended + livekit-egress
    book-session/      # calendar + consent intake
    portal/            # client dashboard, library, video room
    admin/             # practitioner admin (appointments + recordings)
  components/
    admin/             # AdminDashboard tables, filters, CSV export
  lib/
    livekit/           # egress helpers
    recording/         # pipeline orchestration
    storage/           # Supabase storage helpers
    supabase/          # browser, server, admin clients
  middleware.ts        # session refresh + /portal auth
supabase/migrations/
docs/DOMAIN_AND_DNS.md
```

### User journey (happy path)

1. **Book** → consent stored → account + `sessions` row  
2. **Login / portal** → join LiveKit room → RoomCompositeEgress starts  
3. **Leave** → stop egress → `videos` processing → webhook/finalize → ready  
4. **Library** → signed URL playback (owner / practitioner only)  

---

## Production env vars (Vercel)

Copy from [`.env.example`](./.env.example). Minimum for production:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL          # https://www.yourdomain.com
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
NEXT_PUBLIC_LIVEKIT_URL
SUPABASE_S3_ACCESS_KEY
SUPABASE_S3_SECRET_KEY
```

**Email (Resend):** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`  
Optional: S3 endpoint overrides, `CRON_SECRET` for session reminders.

### Transactional emails (Resend)

| Trigger | Recipients | Email |
|---------|------------|--------|
| Successful `/book-session` | Customer **+** Michele | Booking confirmation |
| Cron `/api/cron/session-reminders` | Customer **+** Michele | Session reminder (~24h) |
| Recording ready (egress pipeline) | Customer only | Library + optional 48h signed URL |

**From:** `michele@oursacredreference.com` (override with `RESEND_FROM_EMAIL`).  
Templates: forest/gold branded HTML in `src/lib/email/templates.ts`.

---

## Remaining product TODOs

- Stripe paid sessions  
- HIPAA/BAA path only if clinical positioning changes  
- Practitioner multi-client admin UI  
- Welcome/reminder email templates  

---

## Phase history

1. Design system + marketing + portal UI  
2. Supabase auth, schema, scheduling, LiveKit, post-session pipeline  
3. Legal disclaimers + Informed Consent  
4. Full LiveKit Egress + Storage + signed library  
5. Production readiness (headers, domain docs, launch checklist)  

---

## License

Private — All rights reserved © Sacred Reference.
