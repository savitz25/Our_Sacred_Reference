# Sacred Reference Website

**Mytho-Shamanic Somatic Healing** — Next.js 15 + Supabase MVP.

Repository: [github.com/savitz25/Our_Sacred_Reference](https://github.com/savitz25/Our_Sacred_Reference)

Supabase project: `https://mbboakpdxgquntlohlix.supabase.co`

---

## Features (MVP)

| Area | Status |
|------|--------|
| Public marketing site (design) | ✅ |
| Supabase Auth (email/password, magic link, sign-up) | ✅ |
| Protected `/portal/*` routes (middleware) | ✅ |
| Auto account creation on discovery booking | ✅ |
| Profiles / sessions / videos schema + RLS | ✅ SQL migration |
| Booking calendar → `sessions` table | ✅ |
| Portal dashboard & library (real data) | ✅ |
| LiveKit video rooms | ✅ when env set; demo mode otherwise |
| **LiveKit RoomComposite Egress → Supabase Storage** | ✅ |
| Private signed URLs in session library | ✅ |
| Optional FFmpeg silence trim + loudnorm | ✅ when `ffmpeg` on PATH |
| Post-session pipeline + Resend email | ✅ |
| **Phase 3 legal disclaimers + consent flow** | ✅ |
| Terms / Privacy Policy / Informed Consent pages | ✅ |
| Stripe payments | ⏳ TODO |
| Full HIPAA/BAA production hardening | ⏳ TODO |

### Legal pages (Phase 3)

| Route | Document |
|-------|----------|
| [`/terms`](https://github.com/savitz25/Our_Sacred_Reference/blob/main/src/app/terms/page.tsx) | Terms of Service |
| [`/privacy-policy`](https://github.com/savitz25/Our_Sacred_Reference/blob/main/src/app/privacy-policy/page.tsx) | Privacy Policy |
| [`/consent`](https://github.com/savitz25/Our_Sacred_Reference/blob/main/src/app/consent/page.tsx) | Informed Consent / Service Agreement |

**Site-wide disclaimer** (homepage below hero, book-session page, footer on every public page): Sacred Reference offers alternative health, somatic, and mytho-shamanic coaching for personal growth — **not** licensed medical, psychological, or clinical therapy; not a substitute for professional care; sessions are confidential but **not HIPAA-protected**.

**Booking:** Required Informed Consent checkbox before “Confirm Free Discovery Session.” Agreement is stored in Supabase (`consents` table + `sessions.informed_consent_*` fields). Run migration `002_consents.sql` after `001`.

> These pages are for product/legal UX and are not a substitute for attorney review.

---

## Local setup

### 1. Clone & install

```bash
git clone https://github.com/savitz25/Our_Sacred_Reference.git
cd Our_Sacred_Reference
npm install
```

### 2. Environment variables

**Step A — copy the template**

```bash
cp .env.example .env.local
```

**Step B — fill in real values** in `.env.local` (never commit this file):

| Variable | Where to get it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Pre-filled in `.env.example` (`https://mbboakpdxgquntlohlix.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` (server only) |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `NEXT_PUBLIC_LIVEKIT_URL` | [LiveKit Cloud](https://cloud.livekit.io) project settings |
| `SUPABASE_S3_ACCESS_KEY` / `SUPABASE_S3_SECRET_KEY` | Supabase → Storage → S3 Access Keys (for Egress uploads) |
| `RESEND_API_KEY` | Optional — Resend dashboard |

See [`.env.example`](./.env.example) for the full list with comments.

**Step C — restart the dev server** so Next.js loads the new env vars:

```bash
# stop the running server (Ctrl+C), then:
npm run dev
```

> Vercel production: set the same variables under Project → Settings → Environment Variables, then redeploy.

### 3. Apply database schema (required once)

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/mbboakpdxgquntlohlix/sql)
2. Paste and run: `supabase/migrations/001_initial_schema.sql`
3. Paste and run: `supabase/migrations/002_consents.sql` (Informed Consent records)
4. Paste and run: `supabase/migrations/003_recording_egress.sql` (`egress_id`, `recording_path`)
5. Confirm tables: `profiles`, `sessions`, `videos`, `availability_slots`, `consents`
6. Confirm storage bucket: `session-recordings` (private)

Optional — set Michele as practitioner after she signs up:

```sql
update public.profiles
set role = 'practitioner'
where email = 'her-email@example.com';
```

### 4. LiveKit Egress setup (recordings)

1. Create a project at [LiveKit Cloud](https://cloud.livekit.io) (or self-host).
2. Copy API Key, Secret, and WebSocket URL into `.env.local` / Vercel.
3. In Supabase, create **S3 access keys** and set `SUPABASE_S3_*` env vars.
4. Ensure bucket `session-recordings` exists and is **private** (migration `001` creates it).
5. In LiveKit Cloud → **Settings → Webhooks**, add:  
   `https://your-domain/api/webhooks/livekit-egress`  
   (events: `egress_ended`, optionally `egress_updated`).
6. Flow: join session → auto-start **RoomCompositeEgress** → leave → stop egress → file lands in Supabase Storage → optional FFmpeg → `videos` row `status=ready` → Resend email → library plays via **signed URL** (`/api/videos/[id]/url`).

Without LiveKit keys the UI stays in **demo mode** (no real media).

### 5. Supabase Auth settings

In Authentication → URL configuration:

- **Site URL:** `http://localhost:3000` (and production domain)
- **Redirect URLs:**  
  - `http://localhost:3000/auth/callback`  
  - `https://your-domain.vercel.app/auth/callback`

Disable or enable **Confirm email** as you prefer. Booking uses the service role and marks emails confirmed for a smooth discovery flow.

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

---

## Deploy (Vercel)

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Add environment variables (same as `.env.local`)
3. Deploy
4. Add the production URL to Supabase Auth redirect allow-list
5. Set `NEXT_PUBLIC_SITE_URL` to the production URL

---

## Architecture

```
src/
  app/
    actions/          # Server Actions: auth, booking, profile, sessions
    api/
      livekit/token/  # LiveKit JWT minting
      webhooks/       # session-ended pipeline
    auth/callback/    # OAuth / magic-link exchange
    login/            # Real Supabase auth UI
    book-session/     # Calendar + intake → account + session
    portal/           # Protected client area
  lib/
    supabase/         # browser, server, admin, middleware clients
    auth.ts           # requireUser / requireProfile
    database.types.ts # Typed schema
  middleware.ts       # Session refresh + /portal protection
supabase/migrations/  # SQL schema + RLS
```

### Auth flow

1. **Login / sign-up** → Supabase Auth → cookies via `@supabase/ssr`
2. **Book discovery** → service role creates user (or updates existing) → signs in → inserts `sessions` row
3. **Portal** → middleware requires session → pages load profile + RLS-scoped data

### Video flow

1. Client opens `/portal/session/[id]`
2. `POST /api/livekit/token` issues room token (if LiveKit configured)
3. Leave → `endSessionAndQueueProcessing` → webhook marks video + categories
4. Library lists `videos` for the user

---

## LiveKit setup (optional)

1. Create a project at [livekit.io](https://livekit.io) or self-host
2. Set `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL` (wss://…)
3. Without these, the session room runs in **demo mode** (UI + pipeline still work)

Recording: practitioner toggle is UI-ready; wire **LiveKit Egress** to Supabase Storage in a worker for production.

---

## Remaining TODOs

### HIPAA / compliance

- [ ] Execute BAAs with Supabase, LiveKit (or Daily), hosting, email
- [ ] Audit logging for access to recordings
- [ ] Encryption review, least-privilege service keys
- [ ] Legal privacy policy / terms finalization
- [ ] No third-party AI on session content without BAA

### Product

- [ ] Stripe for paid sessions
- [ ] Cal.com white-label embed (optional; Supabase calendar works now)
- [ ] LiveKit Egress → private Storage + FFmpeg worker
- [ ] Self-hosted Whisper tagging (optional)
- [ ] Resend email templates (welcome, reminders, recording ready)
- [ ] Practitioner admin UI (all clients, availability editor)

---

## Phase history

1. **Phase 1** — Design system, public pages, portal UI mocks  
2. **Phase 2.1** — Supabase Auth, middleware, booking auto-user  
3. **Phase 2.2** — Schema + RLS + real portal data  
4. **Phase 2.3** — Scheduling → Supabase sessions  
5. **Phase 2.4** — LiveKit token + room (demo fallback)  
6. **Phase 2.5** — Post-session webhook pipeline  
7. **Phase 3** — Legal disclaimers, Terms, Privacy Policy, Informed Consent, booking consent storage  

---

## License

Private — All rights reserved © Sacred Reference.
