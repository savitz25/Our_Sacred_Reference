"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-5 py-20 text-center bg-cream">
      <p className="text-sm font-medium tracking-[0.15em] uppercase text-gold-muted mb-3">
        Something went wrong
      </p>
      <h1 className="font-serif text-3xl sm:text-4xl text-forest mb-4">
        We could not load this page
      </h1>
      <p className="text-ink-soft max-w-md mb-2 leading-relaxed">
        Please try again. If the problem continues, return home or contact us.
      </p>
      {error.digest && (
        <p className="text-xs text-muted mb-6">Reference: {error.digest}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="button" variant="primary" onClick={() => reset()}>
          Try again
        </Button>
        <Button href="/" variant="outline">
          Home
        </Button>
      </div>
    </div>
  );
}
