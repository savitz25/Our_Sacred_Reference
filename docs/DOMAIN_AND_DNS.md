# Custom domain & DNS (Vercel)

Sacred Reference is designed to deploy on **Vercel**. SSL certificates are automatic once DNS is correct.

## 1. Deploy the app

1. Import [Our_Sacred_Reference](https://github.com/savitz25/Our_Sacred_Reference) at [vercel.com/new](https://vercel.com/new).
2. Framework: **Next.js** (auto-detected).
3. Add all environment variables from `.env.example` (Production + Preview).
4. Deploy and note the default URL, e.g. `https://our-sacred-reference.vercel.app`.

## 2. Add a custom domain in Vercel

1. Vercel project → **Settings → Domains**.
2. Add:
   - `sacredreference.com` (apex)
   - `www.sacredreference.com` (recommended primary)
3. Vercel shows required DNS records. Prefer **www as primary** and redirect apex → www (or the reverse).

### Typical DNS records

| Type | Name | Value | Notes |
|------|------|-------|--------|
| **A** | `@` | `76.76.21.21` | Apex → Vercel |
| **CNAME** | `www` | `cname.vercel-dns.com` | www → Vercel |

Exact values are shown in the Vercel Domains UI — always prefer those if they differ.

### Optional email / other records

Do **not** remove MX/TXT records used for email (Google Workspace, etc.). Only add Vercel A/CNAME as instructed.

## 3. SSL

- Vercel issues **Let's Encrypt** certificates automatically after DNS propagates (often minutes; up to 48h).
- Force HTTPS is default on Vercel.
- The app sets `Strict-Transport-Security` in production via `next.config.ts`.

## 4. Redirects

Configured in the app:

- `/privacy` → `/privacy-policy` (301, permanent)

Domain-level apex ↔ www redirects are managed in **Vercel Domains** (set preferred domain; Vercel redirects the other).

## 5. Update services after go-live

| Service | What to update |
|---------|----------------|
| **Vercel** | `NEXT_PUBLIC_SITE_URL=https://www.sacredreference.com` |
| **Supabase Auth** | Site URL + Redirect URLs: `https://www.sacredreference.com/auth/callback` |
| **LiveKit Webhooks** | `https://www.sacredreference.com/api/webhooks/livekit-egress` |
| **Resend** | Verified sending domain + `RESEND_FROM_EMAIL` |

## 6. Verify

```bash
# After deploy
curl -sI https://www.sacredreference.com | head
curl -s https://www.sacredreference.com/api/health
```

- [ ] HTTPS padlock works on apex and www  
- [ ] Preferred host redirects correctly  
- [ ] `/api/health` returns `"status":"ready"` with real env vars  
- [ ] Login and booking complete without auth redirect errors  
