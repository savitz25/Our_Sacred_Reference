"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-5 py-16 text-center">
      <p className="text-sm font-medium tracking-[0.15em] uppercase text-gold-muted mb-3">
        Admin
      </p>
      <h1 className="font-serif text-3xl text-forest mb-3">
        Could not load the admin dashboard
      </h1>
      <p className="text-ink-soft max-w-md mb-2 text-sm leading-relaxed">
        Sign in as a practitioner and confirm Supabase environment variables are
        set on Vercel. If your role is not set, run the SQL below in Supabase.
      </p>
      {error.digest && (
        <p className="text-xs text-muted mb-4">Reference: {error.digest}</p>
      )}
      <pre className="text-left text-xs bg-cream-dark/60 border border-border rounded-xl p-4 mb-6 max-w-lg overflow-x-auto text-ink-soft">
        {`update public.profiles
set role = 'practitioner'
where email = 'michele@oursacredreference.com';`}
      </pre>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="button" variant="primary" onClick={() => reset()}>
          Try again
        </Button>
        <Button href="/login?next=/admin" variant="outline">
          Sign in
        </Button>
        <Button href="/portal" variant="ghost">
          Portal
        </Button>
      </div>
    </div>
  );
}
