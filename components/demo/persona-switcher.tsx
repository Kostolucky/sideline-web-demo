"use client";

import { useRouter } from "next/navigation";
import { RotateCcw, UserRoundCog } from "lucide-react";
import { useDemoState } from "@/lib/demo/use-demo";
import { setPersona, resetDemo } from "@/lib/demo/store";
import { ADMIN_PERSON_ID, REP_PERSON_ID } from "@/lib/demo/content";
import { roleLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Switch who you are looking at the product as.
 *
 * This is the one control in the demo that has no production equivalent, and it
 * is deliberately the most useful one: the permission model is a big part of
 * what Sideline sells, and flipping Admin ↔ User live is far more convincing
 * than describing it. Admin sees every call, the Dashboard and the coaching
 * composer; User sees only their own calls and can reply but not open a thread.
 *
 * It lives on the Account screen only. It was briefly in the sidebar too, which
 * put a demo control inside the product chrome — the thing a prospect looks at
 * for the whole meeting. One home, off the main path, is the right shape.
 *
 * Switching navigates back to the calls list, because half the routes an Admin
 * can reach do not exist for a User and stranding the viewer on a redirect is a
 * bad look mid-demo.
 */
export function PersonaSwitcher() {
  const router = useRouter();
  const state = useDemoState();

  const options = [
    { id: ADMIN_PERSON_ID, label: "Admin" },
    { id: REP_PERSON_ID, label: "User" },
  ];

  const current = state.members.find((m) => m.user_id === state.personaId);

  function choose(id: string) {
    if (id === state.personaId) return;
    setPersona(id);
    router.push("/app/calls");
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-section-label text-muted-foreground">
        <UserRoundCog className="h-3.5 w-3.5" />
        Viewing as
      </p>

      <div
        role="group"
        aria-label="Demo persona"
        className="flex rounded-full bg-secondary p-0.5"
      >
        {options.map((o) => {
          const selected = state.personaId === o.id;
          const person = state.members.find((m) => m.user_id === o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => choose(o.id)}
              aria-pressed={selected}
              title={person?.display_name ?? o.label}
              className={cn(
                "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                selected
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        You are {roleLabel(current?.role ?? "member")} — {current?.display_name}.
        An Admin sees every call in the workspace, the Dashboard, and can start
        coaching threads. A User sees only the calls they recorded and can reply
        to coaching, not open it.
      </p>

      <div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            resetDemo();
            router.push("/app/calls");
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Reset demo data
        </Button>
        <p className="mt-1.5 text-meta text-muted-foreground">
          Restores the original sample data. Everything is in memory, so a page
          reload does the same thing.
        </p>
      </div>
    </div>
  );
}
