"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonProps["variant"];
  /** Runs when the user confirms. Errors are surfaced inline. */
  onConfirm: () => Promise<void> | void;
  /** The element that opens the dialog. */
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}

/**
 * Accessible confirmation modal for destructive / irreversible actions.
 * Wrap any clickable trigger; `onConfirm` typically calls a Server Action.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const trigger = React.cloneElement(children, {
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      children.props.onClick?.(e as React.MouseEvent<HTMLElement>);
      setError(null);
      setOpen(true);
    },
  });

  async function handleConfirm() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (err) {
      setError((err as Error).message || "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {trigger}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-scrim-strong p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            // Mobile's dialog: `radius["3xl"]` (32px) card with a hairline
            // border, plus elevation so it lifts off the light page.
            className={cn(
              "w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-lg",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {description}
              </p>
            )}
            {error && (
              <p className="mt-3 rounded-xl bg-danger/15 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={confirmVariant}
                onClick={handleConfirm}
                disabled={pending}
              >
                {pending && <Spinner />}
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
