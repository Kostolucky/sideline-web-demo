"use client";

import Link from "next/link";
import { AudioLines } from "lucide-react";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { MobileNav } from "@/components/app-shell/mobile-nav";
import { ContentContainer } from "@/components/app-shell/content-container";
import { IncomingCoaching } from "@/components/demo/incoming-coaching";
import { Avatar } from "@/components/ui/misc";
import { roleLabel } from "@/lib/format";
import { useCurrentMember, useDemoState } from "@/lib/demo/use-demo";

/**
 * The authenticated shell.
 *
 * Production resolves the member and organization server-side via
 * `requireMembership()`. Here both come from the demo store, so the whole shell
 * is a client component — which also means the persona switcher can change who
 * "you" are without a round trip.
 *
 * The chrome itself renders identically on the server and the client (it only
 * ever prints stable strings), so it is not behind the hydration gate; only the
 * page content is. See `DemoGate`.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = useDemoState();
  const member = useCurrentMember();
  const organization = state.organization;
  const displayName = member.display_name || member.email;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Fires the scripted "a coaching message just arrived" moment. */}
      <IncomingCoaching />

      {/* Desktop sidebar */}
      {/* `sidebar-surface` re-scopes the colour tokens to their dark values for
          this subtree (see globals.css), so the charcoal rail keeps mobile's
          look while the workspace beside it stays light. */}
      <aside className="sidebar-surface sticky top-0 hidden h-dvh flex-col border-r border-border px-4 py-5 lg:flex">
        <Link href="/app/calls" className="mb-6 flex items-center gap-2.5 px-1">
          {/* Green logo mark + green wordmark, matching mobile's header. */}
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <AudioLines className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-brand-text">
              Sideline AI
            </span>
            <span className="max-w-[10rem] truncate text-xs text-muted-foreground">
              {organization.name}
            </span>
          </span>
        </Link>

        <SidebarNav />

        <Link
          href="/app/account"
          aria-label="Account"
          className="mt-auto flex items-center gap-3 rounded-xl border border-border p-2.5 transition-colors hover:border-border-strong hover:bg-secondary"
        >
          <Avatar name={member.display_name} email={member.email} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {roleLabel(member.role)}
            </p>
          </div>
        </Link>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/app/calls" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <AudioLines className="h-4 w-4" />
          </span>
          <span className="max-w-[9rem] truncate text-sm font-semibold">
            {organization.name}
          </span>
        </Link>
        <Link href="/app/account" aria-label="Account">
          <Avatar name={member.display_name} email={member.email} />
        </Link>
      </header>

      <main className="min-w-0 pb-28 lg:pb-0">
        {/* Width is per-route: Calls runs wide, every other page keeps the
            reading column it already had. See ContentContainer. */}
        <ContentContainer>{children}</ContentContainer>
      </main>

      <MobileNav />
    </div>
  );
}
