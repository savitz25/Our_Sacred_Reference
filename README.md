# Sacred Reference Website

**Mytho-Shamanic Somatic Healing** — Phase 1 design deliverable for Michele’s Sacred Reference practice.

A production-ready **Next.js 15 (App Router)** marketing site and client portal UI mock, with Tailwind CSS v4, TypeScript, and a serene forest-green / gold / cream design system.

**Repository:** [github.com/savitz25/Our_Sacred_Reference](https://github.com/savitz25/Our_Sacred_Reference)

---

## Quick start

```bash
git clone https://github.com/savitz25/Our_Sacred_Reference.git
cd Our_Sacred_Reference
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script        | Description                |
| ------------- | -------------------------- |
| `npm run dev` | Dev server (Turbopack)     |
| `npm run build` | Production build         |
| `npm run start` | Start production server  |
| `npm run lint`  | ESLint                   |

---

## Deploy on Vercel (preferred)

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Next.js** (auto-detected).
3. Root directory: repository root.
4. Deploy — no env vars required for Phase 1 (UI only).

CLI alternative:

```bash
npm i -g vercel
vercel
```

---

## What’s included (Phase 1)

### Public marketing site

| Route            | Description                                      |
| ---------------- | ------------------------------------------------ |
| `/`              | Hero, mission (verbatim), approach cards, CTAs   |
| `/about`         | Michele & Sacred Reference                       |
| `/approach`      | Seven pillars + methodology narrative            |
| `/offerings`     | Session types & pricing placeholders             |
| `/blog`          | Resources hub teaser                             |
| `/book-session`  | Calendar UI + intake form mock                   |
| `/login`         | Portal login mock (any credentials → portal)     |
| `/privacy`, `/terms` | Legal placeholders                          |

### Client portal (UI mock)

| Route                        | Description                                      |
| ---------------------------- | ------------------------------------------------ |
| `/portal`                    | Dashboard, upcoming sessions, quick-join         |
| `/portal/library`            | Filterable/searchable session video grid         |
| `/portal/profile`            | Account & preferences mock                       |
| `/portal/session/[id]`       | Full-screen WebRTC-style video room mock         |
| `/portal/session-complete`   | Post-session automation success UI               |

### Design system

- **Palette:** Forest `#0A3D33`, Gold `#D4A017`, Cream `#F5F0E8`, Teal `#2A8C7E`
- **Typography:** Playfair Display (headings) + Inter (body)
- **Aesthetic:** Spacious, feminine, mystical, professional — mytho-shamanic foregrounded

### Tech stack

- Next.js 15 App Router + React 19
- Tailwind CSS v4 (`@theme` tokens in `globals.css`)
- TypeScript
- `lucide-react` icons
- Unsplash nature imagery (remote patterns configured)

---

## Project structure

```
src/
  app/                 # Routes (public + portal)
  components/
    layout/            # Header, Footer
    home/              # Hero, Mission, ApproachCards, …
    booking/           # Calendar + intake
    portal/            # Library, video room, nav
    ui/                # Button, Card, Section, Badge
  lib/
    content.ts         # Mission, pillars, nav (verbatim copy)
    mock-data.ts       # Portal sessions & videos
    utils.ts           # cn() helper
```

---

## Next phases (full-stack)

1. **Auth & DB** — Supabase (JWT, roles: client / practitioner), profiles, sessions schema  
2. **Scheduling** — Cal.com white-label or custom FullCalendar + webhooks for account creation  
3. **Video** — LiveKit or Daily.co embedded rooms, practitioner-only recording, S3/Supabase Storage  
4. **Post-session pipeline** — Webhook → FFmpeg trim → private storage → optional self-hosted Whisper tagging → portal library + email (Resend)  
5. **Payments** — Stripe (packages, discovery free)  
6. **Compliance** — BAAs (Supabase / LiveKit / Daily), encryption, audit logs, legal review  

> Phase 1 is **design-only**: no real auth, video, or PHI storage. Do not collect real client data on this mock.

---

## Notes

- Login and booking flows are interactive UI mocks for stakeholder review.
- Session library uses static mock data (`src/lib/mock-data.ts`).
- Mission statement and seven approach pillars are used **verbatim** as specified.

---

## License

Private — All rights reserved © Sacred Reference.
