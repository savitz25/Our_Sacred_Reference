"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";

/** Magic-link / email redirects — production public origin only */
function siteUrl() {
  return getSiteUrl();
}

export type AuthResult = {
  success: boolean;
  error?: string;
  message?: string;
  /** Where the client should navigate after success */
  redirectTo?: string;
};

async function postLoginDestination(userId: string): Promise<string> {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.role === "practitioner" || profile?.role === "admin") {
      return "/admin";
    }
  } catch (e) {
    console.warn("[auth] postLoginDestination:", e);
  }
  return "/portal";
}

export async function signInWithPassword(
  email: string,
  password: string,
  nextPath?: string | null
): Promise<AuthResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");

  const safeNext =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : null;

  const redirectTo =
    safeNext ||
    (data.user
      ? await postLoginDestination(data.user.id)
      : "/portal");

  return { success: true, redirectTo };
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  fullName: string;
  nextPath?: string | null;
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

  if (data.session && data.user) {
    revalidatePath("/", "layout");
    const safeNext =
      input.nextPath &&
      input.nextPath.startsWith("/") &&
      !input.nextPath.startsWith("//")
        ? input.nextPath
        : null;
    return {
      success: true,
      message: "Account created. Welcome!",
      redirectTo: safeNext || (await postLoginDestination(data.user.id)),
    };
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
 * Always returns a result object — never throws to the client.
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
  try {
    const email = input.email.trim().toLowerCase();
    if (!email || !input.password || input.password.length < 8) {
      return {
        success: false,
        error: "Valid email and password (8+ characters) are required.",
      };
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch (e) {
      console.error("[auth] createAdminClient:", e);
      return {
        success: false,
        error:
          "Account service is temporarily unavailable. Please try again later.",
      };
    }

    const meta = {
      full_name: input.fullName,
      phone: input.phone,
      intention: input.intention,
    };

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
        msg.includes("exists") ||
        msg.includes("duplicate");

      if (!isDuplicate) {
        console.error("[auth] createUser:", createError.message);
        return { success: false, error: createError.message };
      }

      alreadyExisted = true;

      // Prefer profiles lookup (fast) over listing all auth users
      const { data: existingProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingProfile?.id) {
        userId = existingProfile.id;
      } else {
        // Paginate auth users (avoid huge single page)
        let foundId: string | undefined;
        for (let page = 1; page <= 10 && !foundId; page++) {
          const { data: listed, error: listErr } =
            await admin.auth.admin.listUsers({
              page,
              perPage: 200,
            });
          if (listErr) {
            console.error("[auth] listUsers:", listErr.message);
            break;
          }
          const found = listed.users.find(
            (u) => u.email?.toLowerCase() === email
          );
          if (found) foundId = found.id;
          if (listed.users.length < 200) break;
        }
        if (!foundId) {
          return {
            success: false,
            error:
              "An account with this email already exists. Please sign in with your password, then book from the portal.",
          };
        }
        userId = foundId;
      }

      const { error: updateErr } = await admin.auth.admin.updateUserById(
        userId!,
        {
          password: input.password,
          email_confirm: true,
          user_metadata: meta,
        }
      );
      if (updateErr) {
        console.warn("[auth] updateUserById:", updateErr.message);
        // Continue — user may still sign in with old password
      }
    }

    if (!userId) {
      return { success: false, error: "Failed to provision user account." };
    }

    const { error: profileErr } = await admin.from("profiles").upsert({
      id: userId,
      email,
      full_name: input.fullName,
      phone: input.phone ?? null,
      intention: input.intention ?? null,
      role: "client",
    });
    if (profileErr) {
      console.warn("[auth] profile upsert:", profileErr.message);
      // Profile trigger may have created the row; continue
    }

    try {
      const supabase = await createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: input.password,
      });

      if (signInError) {
        console.warn("[auth] signIn after booking:", signInError.message);
        return {
          success: true,
          userId,
          alreadyExisted,
          message:
            "Account ready. Please sign in with your email and password to open the portal.",
        };
      }
    } catch (e) {
      console.warn("[auth] signIn threw:", e);
      return {
        success: true,
        userId,
        alreadyExisted,
        message:
          "Account ready. Please sign in with your email and password to open the portal.",
      };
    }

    try {
      revalidatePath("/", "layout");
    } catch {
      /* ignore */
    }

    return {
      success: true,
      userId,
      alreadyExisted,
      message: alreadyExisted
        ? "Welcome back — you're signed in."
        : "Account created and signed in.",
    };
  } catch (e) {
    console.error("[auth] createUserForBooking unhandled:", e);
    return {
      success: false,
      error:
        e instanceof Error
          ? e.message
          : "Could not create your account. Please try again.",
    };
  }
}
