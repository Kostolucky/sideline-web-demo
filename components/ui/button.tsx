import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Radius stays mobile's `radius.xl` (20px) — rounded, not pills; pills remain
 * reserved for the recording control bar and icon buttons.
 *
 * On light, filled green buttons carry a `--brand-text` hairline. The electric
 * green is only 1.41:1 against white, so without it the button's edge would be
 * invisible on a white card; the dark-green rule is 6.22:1 and satisfies WCAG
 * 1.4.11 for the control boundary. The label itself is 13.77:1.
 *
 * `primary` and `brand` are intentionally the same green on web: a "primary
 * action" here IS the Sideline action. (On mobile, `primary` is a neutral
 * off-white — a near-white button would disappear on a light page.) Both names
 * are kept so no call site had to change.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground border border-brand-text hover:brightness-95 active:brightness-90",
        brand:
          "bg-brand text-brand-foreground border border-brand-text hover:brightness-95 active:brightness-90",
        /** Outlined: white fill with a 3:1 border, so the edge is identifiable. */
        secondary:
          "bg-card text-foreground border border-input hover:border-muted-foreground hover:bg-secondary",
        ghost: "text-foreground hover:bg-secondary",
        danger: "bg-danger-solid text-danger-foreground hover:opacity-90",
        /** Soft destructive, mirroring mobile's tinted sheet action. */
        dangerSoft: "bg-danger/12 text-danger hover:bg-danger/20",
        /** Recording action — green on mobile, so green here too. */
        record:
          "bg-record text-record-foreground border border-brand-text hover:brightness-95 active:brightness-90",
      },
      size: {
        sm: "h-8 rounded-lg px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
