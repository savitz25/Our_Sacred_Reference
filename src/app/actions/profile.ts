"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(input: {
  full_name: string;
  phone?: string;
  timezone?: string;
  notifications_enabled?: boolean;
  recording_consent?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      phone: input.phone ?? null,
      timezone: input.timezone ?? null,
      notifications_enabled: input.notifications_enabled ?? true,
      recording_consent: input.recording_consent ?? true,
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/portal/profile");
  revalidatePath("/portal");
  return { success: true };
}
