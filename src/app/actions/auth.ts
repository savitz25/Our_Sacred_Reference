"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function siteUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export type AuthResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthResult> {
  const supabase = await createClient();
  const email = input.email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: { full_name: input.fullName },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/portal`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    return { success: true, message: "Account created. Welcome!" };
  }

  return {
    success: true,
    message:
      "Check your email to confirm your account, then sign in to the portal.",
  };
}

export async function signInWithMagicLink(email: string): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/portal`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: "Magic link sent — check your email to sign in.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Server-side account provisioning for booking flow.
 * Uses service role: creates user if needed, signs them in.
 */
export async function createUserForBooking(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  intention?: string;
}): Promise<
  AuthResult & { userId?: string; alreadyExisted?: boolean }
> {
  const email = input.email.trim().toLowerCase();
  const admin = createAdminClient();
  const meta = {
    full_name: input.fullName,
    phone: input.phone,
    intention: input.intention,
  };

  // Try create first
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: meta,
    });

  let userId: string | undefined = created.user?.id;
  let alreadyExisted = false;

  if (createError) {
    const msg = createError.message.toLowerCase();
    const isDuplicate =
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists");

    if (!isDuplicate) {
      return { success: false, error: createError.message };
    }

    alreadyExisted = true;

    // Lookup existing user via profiles table
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
      await admin.auth.admin.updateUserById(userId, {
        password: input.password,
        user_metadata: meta,
      });
    } else {
      // Fallback: page through users (small projects)
      const { data: listed } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const found = listed?.users?.find(
        (u) => u.email?.toLowerCase() === email
      );
      if (!found) {
        return {
          success: false,
          error:
            "An account with this email exists but could not be loaded. Please sign in first.",
        };
      }
      userId = found.id;
      await admin.auth.admin.updateUserById(userId, {
        password: input.password,
        user_metadata: meta,
      });
    }
  }

  if (!userId) {
    return { success: false, error: "Failed to provision user" };
  }

  await admin.from("profiles").upsert({
    id: userId,
    email,
    full_name: input.fullName,
    phone: input.phone ?? null,
    intention: input.intention ?? null,
    role: "client",
  });

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (signInError) {
    return {
      success: true,
      userId,
      alreadyExisted,
      message:
        "Account ready. Please sign in with your email and password to access the portal.",
    };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    userId,
    alreadyExisted,
    message: alreadyExisted
      ? "Welcome back — you're signed in."
      : "Account created and signed in.",
  };
}
