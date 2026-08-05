<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# This is a demo build

No backend, no auth, no environment variables, no secrets. All data is
hardcoded in `lib/demo/`. Do not add Supabase, API routes, or `.env` files.

`lib/*/actions.ts` deliberately mirror production's Server Action signatures so
the copied components need no edits — keep it that way.

`lib/demo/content.ts` is kept byte-identical with the copy in
`sideline-mobile-demo`. Edit both.
