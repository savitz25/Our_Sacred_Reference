import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "gold" | "teal" | "outline";
  className?: string;
}

const variants = {
  default: "bg-forest/10 text-forest",
  gold: "bg-gold/15 text-gold-muted",
  teal: "bg-teal/10 text-teal-muted",
  outline: "bg-transparent border border-forest/20 text-ink-soft",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
