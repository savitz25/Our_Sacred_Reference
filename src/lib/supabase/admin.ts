import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import {
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/env";

/**
 * Service-role client — server-only. Never import in client components.
 */
export function createAdminClient() {
  const { url } = getSupabasePublicEnv();
  const key = getSupabaseServiceRoleKey();

  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Set it in Vercel Environment Variables (Production)."
    );
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
