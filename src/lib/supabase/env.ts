/**
 * Shared env validation for Supabase clients (server + browser).
 * Strips wrapping quotes (common when pasting into Vercel).
 */

function cleanEnv(value: string | undefined): string {
  if (!value) return "";
  let v = value.trim();
  // Remove surrounding single/double quotes
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  // Strip accidental "Bearer " prefix if someone pasted a full header
  if (v.toLowerCase().startsWith("bearer ")) {
    v = v.slice(7).trim();
  }
  return v;
}

export function getSupabasePublicEnv(): {
  url: string;
  anonKey: string;
} {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    const missing = [
      !url && "NEXT_PUBLIC_SUPABASE_URL",
      !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `[supabase] Missing env: ${missing}. Set them in Vercel → Project Settings → Environment Variables for Production + Preview, then Redeploy.`
    );
  }

  // Placeholder values that mean "not configured"
  if (
    url.includes("your-project-ref") ||
    anonKey === "your-anon-public-key" ||
    anonKey.length < 20
  ) {
    throw new Error(
      "[supabase] Placeholder Supabase credentials detected. Replace with real values from Supabase → Project Settings → API."
    );
  }

  return { url, anonKey };
}

export function hasSupabasePublicEnv(): boolean {
  try {
    getSupabasePublicEnv();
    return true;
  } catch {
    return false;
  }
}

export function getSupabaseServiceRoleKey(): string | null {
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key || key === "your-service-role-key" || key.length < 20) return null;
  return key;
}
