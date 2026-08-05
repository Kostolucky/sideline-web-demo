# Sideline Web Demo

A front-end-only recreation of the Sideline AI web app, for sales demos.

It looks and behaves like the real thing. It is not the real thing.

**No sign-in. No backend. No database. No environment variables. No API keys.**
Everything on screen comes from `lib/demo/`. Recording, transcription and AI
analysis are all simulated.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

It opens straight into `/app/calls`. Nothing redirects to a login.

Checks:

```bash
npm run typecheck  # tsc --noEmit
npm run lint
npm run build
```

---

## What's real and what's simulated

| Area | Behaviour |
|---|---|
| Calls list, filters, search, date ranges | Real, URL-driven. Back button works. |
| Admin / User roles | Real. Switch personas in the sidebar or on /app/account. |
| Call review workspace | Real layout: Summary / Recording / Scorecard + coaching rail. |
| Playback | **Simulated.** A clock drives the scrubber and transcript highlighting. |
| Recording | **Simulated.** No microphone; the phases and progress bar are scripted. |
| Upload → processing → ready | **Simulated.** ~12s after you finish a recording. |
| Transcript, summary, insights, scorecards | Real content, hardcoded. Nothing is generated. |
| Coaching, notes, renames, team edits | Real, stored in memory for the session. |
| Unread coaching | Real, per-persona watermarks. One message arrives ~20s in. |

State lives in memory. **Reload and the sample data is pristine again** — which
is what you want between demos. There's also a *Reset demo data* button on
`/app/account`.

### Routes

`/app/calls`, `/app/calls/[callId]`, `/app/dashboard` (Admin only),
`/app/team`, `/app/account`, `/app/record`, `/app/coaching`,
`/internal/organizations`, plus `/login` and `/unauthorized` — reachable for
demonstration, but they never gate anything.

`/app/coaching` and the Scorecard tab are **flag-gated off in production** and
switched on here. Worth remembering if you're demoing to someone who will then
go looking for them.

---

## Where things live

```
lib/demo/content.ts   ← THE SAMPLE DATA. Edit this to change the demo.
lib/demo/store.ts     ← state + actions (replaces Supabase)
lib/queries.ts        ← view models + selectors (was the Supabase query layer)
lib/demo/timings.ts   ← every simulated delay, in one place
lib/*/actions.ts      ← same names/signatures as production's Server Actions
app/globals.css       ← the entire design system
```

`lib/demo/content.ts` is **byte-identical to the same file in
`sideline-mobile-demo`**, so the same call opens on the web and on the phone
with the same rep, title and transcript. If you edit one, copy it to the other.

### Why the action modules kept their names

Production's components call Server Actions by name (`renameCallAction`,
`createCommentAction`, …). Because `lib/*/actions.ts` here export the same
signatures and return the same shapes, almost every component was copied across
with **no edits at all** — the store is swapped in underneath them.

### Why pages are client components

The fixtures compute their timestamps from `Date.now()` at module load, so a
server render and the client render that follows would disagree about every date
on the page. Each route is a thin server shell (for `metadata` and Suspense)
around a client screen, and `DemoGate` holds content back until mount — which is
also where the loading skeletons get to be visible.

### Changing the pacing

`lib/demo/timings.ts`. Nothing else hardcodes a delay.

---

## Relationship to production

Copied unchanged from `sideline-ai-mvp`: `app/globals.css`, all of
`components/ui/`, all of `components/app-shell/`, most of `components/calls/`
and `components/coaching/`, and the pure logic in `lib/format.ts`,
`lib/constants.ts`, `lib/calls/date-range.ts`, `lib/coaching/unread.ts`.

Deliberately **not** copied: `proxy.ts`, every API route, every Supabase client,
the auth layer, the AssemblyAI/OpenAI pipeline, database migrations, and every
`.env`.

Two things worth preserving if you touch the styling:

- **The green is split three ways by purpose.** `--brand` (#49F860) is for fills
  and logos only — it is 1.41:1 on white and must never carry text.
  `--brand-text` (#10702B) carries all text and icons. `--brand-tint` (#D5F4DD)
  is for selected states and badges.
- **The dark sidebar is not a second palette.** `.sidebar-surface` re-scopes the
  generic tokens for its subtree. Keep it that way.

The web app is light-only by design; the mobile app is dark-only. Both share one
green brand and one radius scale. That's deliberate — don't "fix" it.
