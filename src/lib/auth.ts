import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/database.types";
import { redirect } from "next/navigation";

function rethrowIfDynamic(e: unknown): void {
  if (
    e &&
    typeof e === "object" &&
    "digest" in e &&
    (e as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
  ) {
    throw e;
  }
  if (
    e instanceof Error &&
    e.message.includes("Dynamic server usage")
  ) {
    throw e;
  }
}

export async function getUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.warn("[auth] getUser error:", error.message);
      return null;
    }
    return user ?? null;
  } catch (e) {
    rethrowIfDynamic(e);
    console.error("[auth] getUser failed:", e);
    return null;
  }
}

export async function getProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("[auth] getProfile error:", error.message);
      return null;
    }
    return data;
  } catch (e) {
    rethrowIfDynamic(e);
    console.error("[auth] getProfile failed:", e);
    return null;
  }
}

function loginRedirect(nextPath?: string): never {
  const q = nextPath
    ? `?next=${encodeURIComponent(nextPath)}`
    : "";
  redirect(`/login${q}`);
}

export async function requireUser(nextPath?: string) {
  const user = await getUser();
  if (!user) loginRedirect(nextPath);
  return user;
}

/**
 * Ensures an authenticated user has a profiles row.
 * Never returns a null profile — redirects or creates one.
 */
export async function requireProfile(nextPath?: string) {
  const user = await requireUser(nextPath);
  const supabase = await createClient();

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error("[auth] profile select failed:", selectError.message);
  }

  if (existing) {
    return { user, profile: existing };
  }

  // Auto-create profile if missing (trigger may have failed)
  const practitionerEmail = (
    process.env.PRACTITIONER_NOTIFY_EMAIL ||
    process.env.PRACTITIONER_EMAIL ||
    ""
  )
    .trim()
    .toLowerCase();
  const email = (user.email ?? "").toLowerCase();
  const role: UserRole =
    practitionerEmail && email === practitionerEmail
      ? "practitioner"
      : "client";

  const { data: created, error: upsertError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email ?? "",
      full_name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
      role,
    })
    .select("*")
    .maybeSingle();

  if (upsertError) {
    console.error("[auth] profile upsert failed:", upsertError.message);
  }

  if (created) {
    return { user, profile: created };
  }

  // Last resort: in-memory minimal profile so we don't crash
  // Still not practitioner unless email matches
  console.warn("[auth] using ephemeral profile fallback for", user.id);
  const fallback: Profile = {
    id: user.id,
    email: user.email ?? "",
    full_name:
      (user.user_metadata?.full_name as string | undefined) ?? null,
    phone: null,
    role,
    timezone: null,
    notifications_enabled: true,
    recording_consent: true,
    intention: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return { user, profile: fallback };
}

function isPractitionerRole(role: string | null | undefined): boolean {
  return role === "practitioner" || role === "admin";
}

/**
 * Practitioner or admin only.
 * - Unauthenticated → /login?next=/admin
 * - Authenticated non-practitioner → /portal
 */
export async function requirePractitioner(nextPath = "/admin") {
  const { user, profile } = await requireProfile(nextPath);

  const role = profile?.role;
  if (!isPractitionerRole(role)) {
    console.info(
      "[auth] requirePractitioner denied user",
      user.id,
      "role=",
      role ?? "null"
    );
    redirect("/portal?error=not_authorized");
  }

  return { user, profile };
}
