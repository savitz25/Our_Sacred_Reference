import Link from "next/link";
import type { ReactNode } from "react";
import { Section } from "@/components/ui/Section";
import { LEGAL_EFFECTIVE_DATE, legalNav } from "@/lib/legal";
import { cn } from "@/lib/utils";

interface LegalPageShellProps {
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  currentPath: string;
}

export function LegalPageShell({
  title,
  eyebrow = "Legal",
  description,
  children,
  currentPath,
}: LegalPageShellProps) {
  return (
    <>
      <section className="relative bg-sacred-gradient py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-gold-soft text-sm font-medium tracking-[0.15em] uppercase mb-4">
            {eyebrow}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-cream leading-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-4 text-cream/80 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
          <p className="mt-4 text-sm text-cream/55">
            Effective date: {LEGAL_EFFECTIVE_DATE}
          </p>
        </div>
      </section>

      <Section className="bg-cream" narrow>
        <nav
          className="mb-10 flex flex-wrap gap-2"
          aria-label="Legal documents"
        >
          {legalNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm border transition-colors",
                currentPath === item.href
                  ? "bg-forest text-cream border-forest"
                  : "border-border text-ink-soft hover:border-teal/40 hover:text-forest"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <article className="legal-prose space-y-8 text-ink-soft leading-relaxed">
          {children}
        </article>
      </Section>
    </>
  );
}

export function LegalH2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-serif text-2xl text-forest mt-2 mb-3">{children}</h2>
  );
}

export function LegalH3({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-serif text-xl text-forest mt-6 mb-2">{children}</h3>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-2 marker:text-teal">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
