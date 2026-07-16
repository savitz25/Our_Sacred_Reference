"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";
import { navigation, siteConfig } from "@/lib/content";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/portal")) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-forest text-cream">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/20 text-gold">
                <Leaf className="h-4 w-4" aria-hidden />
              </span>
              <span className="font-serif text-xl">{siteConfig.name}</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/70">
              {siteConfig.tagline}. An embodied path of healing through
              sensation, myth, and relationship with the Sacred.
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
              Connect
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

        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-cream/10 pt-8 text-xs text-cream/50">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-cream/80 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-cream/80 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
