import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/portal";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If no explicit next, send practitioners to admin
      if (!searchParams.get("next") && data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        if (
          profile?.role === "practitioner" ||
          profile?.role === "admin"
        ) {
          next = "/admin";
        }
      }
      const dest =
        next.startsWith("/") && !next.startsWith("//") ? next : "/portal";
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
