/**
 * One-time / ops script: ensure Michele exists as practitioner with a known password.
 * Usage (from project root, with .env.local loaded):
 *   node --env-file=.env.local scripts/ensure-michele-admin.mjs
 *
 * Never commit real passwords. Pass via env:
 *   MICHELE_EMAIL=michele@oursacredreference.com
 *   MICHELE_PASSWORD=...
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const email = (
  process.env.MICHELE_EMAIL || "michele@oursacredreference.com"
)
  .trim()
  .toLowerCase();
const password = process.env.MICHELE_PASSWORD;
const fullName = process.env.MICHELE_NAME || "Michele";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!password || password.length < 8) {
  console.error("Set MICHELE_PASSWORD (min 8 chars) in the environment");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserIdByEmail(target) {
  // Prefer profiles table
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", target)
    .maybeSingle();
  if (profile?.id) return profile.id;

  // Fallback: page through auth users
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  console.log(`Ensuring practitioner account: ${email}`);

  let userId = await findUserIdByEmail(email);

  if (!userId) {
    console.log("Creating auth user…");
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) {
      console.error("createUser failed:", error.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log("Created user", userId);
  } else {
    console.log("Updating existing user", userId);
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) {
      console.error("updateUser failed:", error.message);
      process.exit(1);
    }
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    email,
    full_name: fullName,
    role: "practitioner",
  });

  if (profileError) {
    console.error("profile upsert failed:", profileError.message);
    process.exit(1);
  }

  console.log("OK — practitioner profile ready.");
  console.log("Sign in at /login?next=/admin then open /admin");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
