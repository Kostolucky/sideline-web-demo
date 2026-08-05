import { Smartphone, Apple, Play, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * Shown on /app/record when browser recording is disabled — recording has moved
 * to the native app. Store links are placeholders until the apps ship.
 */
export function RecordOnMobile() {
  return (
    <div className="mx-auto max-w-md py-6 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-tint text-brand-text">
        <Smartphone className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-semibold">Record on the Sideline app</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Recording now happens on your phone so it keeps going when the screen
        locks, survives poor signal, and reliably uploads a long appointment.
        Review, transcripts, coaching, and dashboards stay here on the web.
      </p>

      <div className="mt-6 grid gap-3">
        <StoreButton
          icon={<Apple className="h-5 w-5" />}
          label="Download on the App Store"
          hint="TestFlight link coming for internal testing"
        />
        <StoreButton
          icon={<Play className="h-5 w-5" />}
          label="Get it on Google Play"
          hint="Internal testing track coming soon"
        />
      </div>

      <Card className="mt-6 flex items-start gap-3 p-4 text-left">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <p className="text-xs text-muted-foreground">
          Recordings are private to your workspace. Everyone in the conversation
          must consent before you record — follow your local consent
          requirements.
        </p>
      </Card>
    </div>
  );
}

function StoreButton({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div
      aria-disabled
      className="flex cursor-not-allowed items-center gap-3 rounded-2xl border border-border bg-secondary px-4 py-3 text-left opacity-80"
    >
      <span className="text-foreground">{icon}</span>
      <span className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
    </div>
  );
}
