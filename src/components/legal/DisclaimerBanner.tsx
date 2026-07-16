import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { serviceNatureSummary } from "@/lib/legal";

type Variant = "banner" | "inline" | "footer" | "hero-below";

interface DisclaimerBannerProps {
  variant?: Variant;
  className?: string;
  /** Show links to full legal pages */
  showLinks?: boolean;
}

export function DisclaimerBanner({
  variant = "banner",
  className,
  showLinks = true,
}: DisclaimerBannerProps) {
  if (variant === "footer") {
    return (
      <div
        className={cn(
          "border-t border-cream/10 pt-6 mt-2 text-xs leading-relaxed text-cream/55",
          className
        )}
        role="note"
        aria-label="Service disclaimer"
      >
        <p>
          <strong className="text-cream/70 font-medium">Disclaimer: </strong>
          {serviceNatureSummary}
        </p>
        {showLinks && (
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <Link
              href="/consent"
              className="text-gold-soft/90 hover:text-gold-soft underline-offset-2 hover:underline"
            >
              Informed Consent
            </Link>
            <Link
              href="/terms"
              className="text-gold-soft/90 hover:text-gold-soft underline-offset-2 hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/privacy-policy"
              className="text-gold-soft/90 hover:text-gold-soft underline-offset-2 hover:underline"
            >
              Privacy
            </Link>
          </p>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <p
        className={cn("text-sm text-ink-soft leading-relaxed", className)}
        role="note"
      >
        <strong className="text-forest font-medium">Important: </strong>
        {serviceNatureSummary}{" "}
        {showLinks && (
          <Link
            href="/consent"
            className="text-teal font-medium underline-offset-2 hover:underline"
          >
            Read Informed Consent
          </Link>
        )}
      </p>
    );
  }

  // banner | hero-below
  return (
    <aside
      className={cn(
        "border-l-4 border-gold bg-cream-dark/80",
        variant === "hero-below"
          ? "mx-auto max-w-6xl px-5 sm:px-8 py-5 sm:py-6 -mt-0 relative z-10"
          : "rounded-2xl px-5 py-4 sm:px-6 sm:py-5",
        className
      )}
      role="note"
      aria-label="Service disclaimer"
    >
      <div className="flex gap-3 sm:gap-4">
        <AlertCircle
          className="h-5 w-5 sm:h-6 sm:w-6 text-gold-muted shrink-0 mt-0.5"
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium tracking-wide text-forest uppercase mb-1.5">
            Important disclaimer
          </p>
          <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
            {serviceNatureSummary}
          </p>
          {showLinks && (
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <Link
                href="/consent"
                className="text-teal font-medium hover:underline underline-offset-2"
              >
                Informed Consent
              </Link>
              <Link
                href="/terms"
                className="text-teal font-medium hover:underline underline-offset-2"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy-policy"
                className="text-teal font-medium hover:underline underline-offset-2"
              >
                Privacy Policy
              </Link>
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
