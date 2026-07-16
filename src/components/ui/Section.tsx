import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  narrow?: boolean;
  as?: "section" | "div";
}

export function Section({
  children,
  className,
  id,
  narrow = false,
  as: Tag = "section",
}: SectionProps) {
  return (
    <Tag id={id} className={cn("py-16 sm:py-20 lg:py-24", className)}>
      <div
        className={cn(
          "mx-auto px-5 sm:px-8",
          narrow ? "max-w-3xl" : "max-w-6xl"
        )}
      >
        {children}
      </div>
    </Tag>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  light = false,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-12 sm:mb-16",
        align === "center" && "text-center mx-auto max-w-2xl",
        className
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "text-sm font-medium tracking-[0.15em] uppercase mb-3",
            light ? "text-gold-soft" : "text-teal"
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "font-serif text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight",
          light ? "text-cream" : "text-forest"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-base sm:text-lg leading-relaxed",
            light ? "text-cream/80" : "text-ink-soft"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
