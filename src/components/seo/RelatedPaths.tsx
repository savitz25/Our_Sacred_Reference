import Link from "next/link";
import { ArrowRight } from "lucide-react";

const CLUSTER = [
  {
    href: "/approach",
    title: "Mytho-Shamanic Approach",
    blurb: "Seven pillars — felt sense to Divine Mother.",
  },
  {
    href: "/about",
    title: "About Michele",
    blurb: "Lineage, underworld journey, and devotion.",
  },
  {
    href: "/offerings",
    title: "Offerings & Sessions",
    blurb: "Discovery, individual, and ongoing path.",
  },
  {
    href: "/blog",
    title: "Blog & Essays",
    blurb: "Reflections for the Path of Remembering.",
  },
  {
    href: "/book-session",
    title: "Book Free Session",
    blurb: "Begin with a complimentary discovery call.",
  },
] as const;

/** Internal linking cluster for topical authority */
export function RelatedPaths({
  excludeHref,
  title = "Continue exploring",
}: {
  excludeHref?: string;
  title?: string;
}) {
  const items = CLUSTER.filter((c) => c.href !== excludeHref);

  return (
    <section className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-soft">
      <h2 className="font-serif text-xl sm:text-2xl text-forest mb-4">
        {title}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group flex items-start justify-between gap-3 rounded-xl border border-border/80 bg-cream/40 px-4 py-3 hover:border-teal/30 hover:bg-teal/5 transition-colors"
            >
              <span>
                <span className="font-medium text-forest group-hover:text-teal transition-colors">
                  {item.title}
                </span>
                <span className="block text-sm text-ink-soft mt-0.5">
                  {item.blurb}
                </span>
              </span>
              <ArrowRight
                className="h-4 w-4 text-teal shrink-0 mt-1 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
