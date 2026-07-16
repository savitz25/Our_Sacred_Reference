"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/content";
import {
  signInWithMagicLink,
  signInWithPassword,
  signUpWithPassword,
} from "@/app/actions/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const authError = searchParams.get("error");
  const wantsAdmin = nextParam === "/admin" || nextParam?.startsWith("/admin");

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [magicLink, setMagicLink] = useState(false);
  const [email, setEmail] = useState(
    wantsAdmin ? "michele@oursacredreference.com" : ""
  );
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (authError === "config") {
      return "Supabase is not configured on this deployment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables (Production), then Redeploy.";
    }
    if (authError === "not_authorized") {
      return "That account does not have admin access.";
    }
    if (authError) return "Authentication failed. Please try again.";
    return null;
  });
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (magicLink) {
        const result = await signInWithMagicLink(email);
        if (!result.success) {
          setError(result.error ?? "Failed to send magic link");
        } else {
          setMessage(result.message ?? "Check your email.");
        }
        return;
      }

      if (mode === "signup") {
        const result = await signUpWithPassword({
          email,
          password,
          fullName,
          nextPath: nextParam,
        });
        if (!result.success) {
          setError(result.error ?? "Sign up failed");
          return;
        }
        if (result.message?.includes("Check your email")) {
          setMessage(result.message);
          return;
        }
        router.push(result.redirectTo || nextParam || "/portal");
        router.refresh();
        return;
      }

      const result = await signInWithPassword(email, password, nextParam);
      if (!result.success) {
        setError(result.error ?? "Sign in failed");
        return;
      }
      // Practitioners land on /admin; clients on /portal (or ?next=)
      router.push(result.redirectTo || nextParam || "/portal");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-cream-gradient px-5 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-forest mb-6"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-gold">
              <Leaf className="h-4 w-4" aria-hidden />
            </span>
            <span className="font-serif text-xl">{siteConfig.name}</span>
          </Link>
          <h1 className="font-serif text-3xl text-forest">
            {wantsAdmin ? "Admin sign in" : "Sign in"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {wantsAdmin
              ? "Practitioner access to appointments and recordings."
              : "Clients open the portal; practitioners open Admin after sign-in."}
          </p>
        </div>

        {wantsAdmin && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-teal/25 bg-teal/5 px-4 py-3 text-sm text-teal-muted">
            <Shield className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
            <p>
              Use Michele&apos;s practitioner account. After login you will be
              taken to the admin dashboard.
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-elevated space-y-5"
        >
          {!wantsAdmin && (
            <div className="flex rounded-full bg-cream p-1" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signin"}
                onClick={() => setMode("signin")}
                className={`flex-1 rounded-full py-2 text-sm transition-colors ${
                  mode === "signin"
                    ? "bg-forest text-cream"
                    : "text-ink-soft hover:text-forest"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signup"}
                onClick={() => {
                  setMode("signup");
                  setMagicLink(false);
                }}
                className={`flex-1 rounded-full py-2 text-sm transition-colors ${
                  mode === "signup"
                    ? "bg-forest text-cream"
                    : "text-ink-soft hover:text-forest"
                }`}
              >
                Create account
              </button>
            </div>
          )}

          {mode === "signup" && !wantsAdmin && (
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-border bg-cream/40 px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-ink mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-cream/40 px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
              placeholder="you@example.com"
            />
          </div>

          {!magicLink && (
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-cream/40 px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
              />
            </div>
          )}

          {error && (
            <p
              className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}
          {message && (
            <p
              className="rounded-xl bg-teal/10 border border-teal/20 px-4 py-3 text-sm text-teal-muted"
              role="status"
            >
              {message}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading
              ? "Please wait…"
              : magicLink
                ? "Send magic link"
                : mode === "signup"
                  ? "Create account"
                  : wantsAdmin
                    ? "Sign in to admin"
                    : "Sign in"}
          </Button>

          {mode === "signin" && !wantsAdmin && (
            <button
              type="button"
              onClick={() => setMagicLink((v) => !v)}
              className="w-full text-sm text-teal hover:text-teal-muted"
            >
              {magicLink
                ? "Use password instead"
                : "Use magic link (passwordless)"}
            </button>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft space-y-2">
          {!wantsAdmin && (
            <>
              New client?{" "}
              <Link
                href="/book-session"
                className="text-teal font-medium hover:underline"
              >
                Book a free discovery session
              </Link>
              <br />
            </>
          )}
          <Link
            href={wantsAdmin ? "/login" : "/login?next=/admin"}
            className="text-teal font-medium hover:underline inline-flex items-center gap-1 mt-2"
          >
            <Shield className="h-3.5 w-3.5" aria-hidden />
            {wantsAdmin ? "Client sign in" : "Practitioner / admin sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center text-muted">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
