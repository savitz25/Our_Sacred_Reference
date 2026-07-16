import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

const paddings = {
  sm: "p-4",
  md: "p-6 sm:p-8",
  lg: "p-8 sm:p-10",
};

export function Card({
  children,
  className,
  hover = false,
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white border border-border shadow-soft",
        paddings[padding],
        hover &&
          "transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5 hover:border-teal/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
