"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Leaf } from "lucide-react";
import { navigation, siteConfig } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isPortal = pathname.startsWith("/portal");
  const isAdmin = pathname.startsWith("/admin");
  if (isPortal || isAdmin) return null;

  const mainNav = navigation.filter((item) => !item.cta);
  const cta = navigation.find((item) => item.cta);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 shrink-0"
          aria-label={`${siteConfig.name} home`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-gold transition-transform group-hover:scale-105">
            <Leaf className="h-4 w-4" aria-hidden />
          </span>
          <span className="font-serif text-lg sm:text-xl text-forest tracking-tight">
            {siteConfig.name}
          </span>
        </Link>

        <nav
          className="hidden lg:flex items-center gap-1"
          aria-label="Main navigation"
        >
          {mainNav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm rounded-full transition-colors",
                  active
                    ? "text-forest font-medium bg-forest/8"
                    : "text-ink-soft hover:text-forest hover:bg-forest/5"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-ink-soft hover:text-forest transition-colors px-2"
          >
            Login
          </Link>
          {cta && (
            <Button href={cta.href} variant="gold" size="sm">
              {cta.name}
            </Button>
          )}
        </div>

        <button
          type="button"
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full text-forest hover:bg-forest/5"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="lg:hidden border-t border-border bg-cream px-5 py-4 sm:px-8"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-ink-soft hover:bg-forest/5 hover:text-forest"
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-ink-soft hover:bg-forest/5 hover:text-forest"
            >
              Login
            </Link>
            {cta && (
              <div className="pt-2" onClick={() => setOpen(false)}>
                <Button href={cta.href} variant="gold" className="w-full">
                  {cta.name}
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
