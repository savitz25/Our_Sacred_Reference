import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    console.warn(
      "[middleware] Supabase public env missing — auth gates skipped"
    );
    // Still block /admin and /portal without a session cookie when misconfigured
    // so we don't render half-broken pages anonymously.
    const path = request.nextUrl.pathname;
    if (path.startsWith("/portal") || path.startsWith("/admin")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", path);
      redirectUrl.searchParams.set("error", "config");
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPortal = path.startsWith("/portal");
  const isAdmin = path.startsWith("/admin");

  if ((isPortal || isAdmin) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  // Soft role gate for /admin in middleware (layout re-checks)
  if (isAdmin && user) {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.warn("[middleware] admin profile lookup:", error.message);
      }

      const role = profile?.role;
      if (role && role !== "practitioner" && role !== "admin") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/portal";
        redirectUrl.searchParams.set("error", "not_authorized");
        return NextResponse.redirect(redirectUrl);
      }
      // If profile missing or role null, allow through — layout will create/handle
    } catch (e) {
      console.error("[middleware] admin role check failed:", e);
    }
  }

  if (path === "/login" && user) {
    const next = request.nextUrl.searchParams.get("next");
    const redirectUrl = request.nextUrl.clone();
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      redirectUrl.pathname = next;
      redirectUrl.search = "";
    } else {
      redirectUrl.pathname = "/portal";
      redirectUrl.searchParams.delete("next");
    }
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
