import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { cn } from "@/lib/utils";

export type Crumb = { name: string; path: string };

export function Breadcrumbs({
  items,
  className,
  light = false,
}: {
  items: Crumb[];
  className?: string;
  light?: boolean;
}) {
  const all: Crumb[] = [{ name: "Home", path: "/" }, ...items];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(all)} />
      <nav
        aria-label="Breadcrumb"
        className={cn("text-sm", className)}
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((item, i) => {
            const isLast = i === all.length - 1;
            return (
              <li key={item.path + item.name} className="inline-flex items-center gap-1.5">
                {i > 0 && (
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      light ? "text-cream/40" : "text-muted"
                    )}
                    aria-hidden
                  />
                )}
                {isLast ? (
                  <span
                    className={cn(
                      "font-medium",
                      light ? "text-cream/90" : "text-forest"
                    )}
                    aria-current="page"
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.path}
                    className={cn(
                      "hover:underline",
                      light
                        ? "text-cream/65 hover:text-cream"
                        : "text-muted hover:text-teal"
                    )}
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
