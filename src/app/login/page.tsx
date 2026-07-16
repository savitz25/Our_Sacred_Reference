"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/content";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicLink, setMagicLink] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Design mock — navigates to portal UI
    router.push("/portal");
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
                required={!magicLink}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-cream/40 px-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
              />
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full">
            {magicLink ? "Send magic link" : "Sign in"}
          </Button>

          <button
            type="button"
            onClick={() => setMagicLink((v) => !v)}
            className="w-full text-sm text-teal hover:text-teal-muted"
          >
            {magicLink
              ? "Use password instead"
              : "Use magic link (passwordless)"}
          </button>

          <p className="text-xs text-center text-muted pt-2">
            Design mock — any credentials open the portal UI. Real auth via
            Supabase in a later phase.
          </p>
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
