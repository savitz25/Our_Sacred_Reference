/**
 * Prints instructions / optional helper for syncing .env.local → Vercel.
 * Does not print secret values.
 *
 * Required Production vars for Supabase (fixes "config" login error):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SITE_URL
 */

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

const recommended = [
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "NEXT_PUBLIC_LIVEKIT_URL",
  "SUPABASE_S3_ACCESS_KEY",
  "SUPABASE_S3_SECRET_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "PRACTITIONER_NOTIFY_EMAIL",
];

console.log(`
Vercel env checklist (Production + Preview + Development)
=========================================================

1. Open: https://vercel.com → your project → Settings → Environment Variables

2. Add or update these REQUIRED keys from your local .env.local:
${required.map((k) => `   - ${k}`).join("\n")}

3. Recommended for full features:
${recommended.map((k) => `   - ${k}`).join("\n")}

4. Important:
   - Select environment: Production (and Preview)
   - Do NOT wrap values in quotes in the Vercel UI
   - After saving, click Deployments → … → Redeploy (or push a commit)

5. CLI alternative (if logged in with vercel):
   npx vercel link
   npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
   # paste value when prompted; repeat for each key
   npx vercel --prod

6. Verify after deploy:
   https://YOUR-DOMAIN/api/health
   → should return "status":"ready" with supabaseUrl/supabaseAnon true

7. Michele admin login:
   /login?next=/admin
   email: michele@oursacredreference.com
`);
