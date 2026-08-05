import { cn } from "@/lib/utils";

/**
 * A titled section inside a review panel.
 *
 * Sections are hairline-separated rows within one bordered container rather than
 * a card each — the Summary tab is one continuous call review, and a stack of
 * separate cards fragments it into unrelated boxes.
 */
export function ReviewSection({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("p-4 sm:p-5", className)}>
      <h3 className="flex items-center gap-2 text-section-label text-muted-foreground">
        {icon}
        {title}
      </h3>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

/** The container sections sit in. */
export function ReviewPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "divide-y divide-border rounded-xl border border-border bg-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
