import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Tinted tones sit at `/15`: on white that lifts the background just enough to
 * read as a chip while keeping the (darkened) semantic text above 4.5:1 — every
 * pair is asserted in the contrast check. `progress` is deliberately neutral
 * rather than coloured, mirroring how mobile shows an in-flight call, so green
 * keeps meaning "ready".
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground [&>.dot]:bg-muted-foreground",
        progress: "bg-secondary text-foreground [&>.dot]:bg-foreground",
        success: "bg-success/15 text-success [&>.dot]:bg-success",
        danger: "bg-danger/15 text-danger [&>.dot]:bg-danger",
        warning: "bg-warning/15 text-warning [&>.dot]:bg-warning",
        brand: "bg-brand-tint text-brand-text [&>.dot]:bg-brand-text",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({
  className,
  tone,
  dot,
  pulse,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "dot h-1.5 w-1.5 rounded-full bg-current",
            pulse && "animate-pulse",
          )}
        />
      )}
      {children}
    </span>
  );
}
