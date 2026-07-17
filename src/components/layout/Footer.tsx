"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navigation, siteConfig } from "@/lib/content";
import { DisclaimerBanner } from "@/components/legal/DisclaimerBanner";
import { legalNav } from "@/lib/legal";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/portal") || pathname.startsWith("/admin"))
    return null;

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-forest text-cream">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <Image
                src="/logo.svg"
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 rounded-full"
              />
              <span className="font-serif text-xl">{siteConfig.name}</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/70">
              {siteConfig.tagline} Beneath every wound there is Wholeness —
              something sacred waiting to be remembered. This is a Path of
              Remembering.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium tracking-wide text-gold-soft uppercase mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5">
              {navigation
                .filter((n) => !n.cta)
                .map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-cream/70 hover:text-cream transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium tracking-wide text-gold-soft uppercase mb-4">
              Connect & legal
            </h3>
            <ul className="space-y-2.5 text-sm text-cream/70">
              <li>
                <Link
                  href="/book-session"
                  className="hover:text-cream transition-colors"
                >
                  Book Free Discovery Session
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-cream transition-colors"
                >
                  Client Portal Login
                </Link>
              </li>
              {legalNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:text-cream transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="hover:text-cream transition-colors"
                >
                  {siteConfig.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Site-wide disclaimer in footer */}
        <DisclaimerBanner variant="footer" className="mt-10" />

        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-cream/10 pt-8 text-xs text-cream/50">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/privacy-policy"
              className="hover:text-cream/80 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-cream/80 transition-colors">
              Terms of Service
            </Link>
            <Link
              href="/consent"
              className="hover:text-cream/80 transition-colors"
            >
              Informed Consent
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
