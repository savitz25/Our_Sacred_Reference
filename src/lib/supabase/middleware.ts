import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function cleanEnv(value: string | undefined): string {
  if (!value) return "";
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const path = request.nextUrl.pathname;
  const isPortal = path.startsWith("/portal");
  const isAdmin = path.startsWith("/admin");

  const envOk =
    Boolean(url && anonKey) &&
    !url.includes("your-project-ref") &&
    anonKey !== "your-anon-public-key" &&
    anonKey.length >= 20;

  if (!envOk) {
    console.warn(
      "[middleware] Supabase public env missing or placeholder. " +
        `url=${Boolean(url)} anon=${Boolean(anonKey)} path=${path}`
    );
    if (isPortal || isAdmin) {
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

  if ((isPortal || isAdmin) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

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
      return NextResponse.redirect(redirectUrl);
    }

    // Role-aware default destination after login
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const role = profile?.role;
      redirectUrl.pathname =
        role === "practitioner" || role === "admin" ? "/admin" : "/portal";
    } catch {
      redirectUrl.pathname = "/portal";
    }
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
