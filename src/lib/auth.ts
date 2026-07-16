import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";
import { redirect } from "next/navigation";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireProfile() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    // Ensure profile row exists (fallback if trigger missed)
    const { data: created } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email ?? "",
        full_name:
          (user.user_metadata?.full_name as string | undefined) ?? null,
      })
      .select()
      .single();
    return { user, profile: created! };
  }

  return { user, profile };
}
