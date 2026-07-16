"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Leaf,
  LayoutDashboard,
  Film,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { portalNav, siteConfig } from "@/lib/content";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";

const icons = {
  "/portal": LayoutDashboard,
  "/portal/library": Film,
  "/portal/profile": User,
} as const;

interface PortalNavProps {
  userName?: string;
  userRole?: string;
}

export function PortalNav({ userName, userRole }: PortalNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-6">
          <Link href="/portal" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-gold">
              <Leaf className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="font-serif text-lg text-forest hidden sm:inline">
              {siteConfig.name}
            </span>
            <span className="text-xs text-muted border-l border-border pl-3 ml-1 hidden md:inline">
              {userRole === "practitioner" || userRole === "admin"
                ? "Practitioner"
                : "Client Portal"}
            </span>
          </Link>

          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Portal"
          >
            {portalNav.map((item) => {
              const Icon = icons[item.href as keyof typeof icons];
              const active =
                item.href === "/portal"
                  ? pathname === "/portal"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-forest/10 text-forest font-medium"
                      : "text-ink-soft hover:bg-forest/5 hover:text-forest"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" aria-hidden />}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {userName && (
            <span className="hidden lg:inline text-sm text-muted truncate max-w-[140px]">
              {userName}
            </span>
          )}
          <Link
            href="/"
            className="hidden sm:inline text-sm text-muted hover:text-forest"
          >
            Public site
          </Link>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => signOut())}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-ink-soft hover:bg-forest/5"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">
              {pending ? "Signing out…" : "Sign out"}
            </span>
          </button>
          <button
            type="button"
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full hover:bg-forest/5"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-border px-5 py-3 space-y-1">
          {portalNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-ink-soft hover:bg-forest/5"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
