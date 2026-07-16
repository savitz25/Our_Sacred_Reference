"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/content";
import {
  signInWithMagicLink,
  signInWithPassword,
  signUpWithPassword,
} from "@/app/actions/auth";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/portal";
  const authError = searchParams.get("error");

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [magicLink, setMagicLink] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (authError === "config") {
      return "Server configuration error: Supabase environment variables may be missing on Vercel.";
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
        });
        if (!result.success) {
          setError(result.error ?? "Sign up failed");
          return;
        }
        if (result.message?.includes("Check your email")) {
          setMessage(result.message);
          return;
        }
        router.push(next);
        router.refresh();
        return;
      }

      const result = await signInWithPassword(email, password);
      if (!result.success) {
        setError(result.error ?? "Sign in failed");
        return;
      }
      router.push(next);
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
          <h1 className="font-serif text-3xl text-forest">Client portal</h1>
          <p className="mt-2 text-sm text-muted">
            Sign in to view sessions, join video, and access your library.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-elevated space-y-5"
        >
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

          {mode === "signup" && (
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
                  : "Sign in"}
          </Button>

          {mode === "signin" && (
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

        <p className="mt-6 text-center text-sm text-ink-soft">
          New client?{" "}
          <Link
            href="/book-session"
            className="text-teal font-medium hover:underline"
          >
            Book a free discovery session
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
