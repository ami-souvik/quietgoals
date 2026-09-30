<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Quiet Goals Web Specification

You are building "Quiet Goals Web": a single-list, keyboard-first, unapologetically minimal goals app, inspired in *feel* by rows.gg. Follow this specification in every phase.

## PRODUCT
- One screen: one list of goals. No dashboard, no analytics, no charts, no streaks, no notifications, no AI features.
- Data model: a goal has a title, a status (active | completed | killed), an optional priority (none | low | medium | high), and a position.
- "Complete" and "Kill" move a goal to the Archive (recoverable). Nothing is ever hard-deleted from the UI except via an explicit "delete forever" inside the Archive.
- Interactions must feel physical: instant (optimistic) updates, spring-based motion, optional sound.

## TECH
- Next.js App Router + TypeScript (strict), Tailwind, Framer Motion, Drizzle ORM with @libsql/client (Turso), Auth.js v5, deployed on Vercel.
- Mutations via Server Actions. UI uses useOptimistic so nothing shows a loading spinner.
- Use the fractional-indexing package for goal ordering (TEXT position) so reordering never rewrites other rows.

## MULTI-PLATFORM (WEB & MOBILE)
- The codebase at the root is for **Quiet Goals Web** (Next.js App Router).
- The code inside the `native/` directory is for **Quiet Goals Mobile** (React Native / Expo).
- Both represent the **same system** across two platforms. Functionality, data models, behavior, keyboard/gesture paradigms, and UI design aesthetic must always be kept strictly in sync between Web and Native.

## COMMIT POLICY
- **Do not commit directly.** Only make git commits when the user has explicitly requested to commit.

## RULES
- Original implementation only. Do not copy rows.gg code, assets, sounds, or copy text. Take inspiration from the interaction ideas only.
- Every server action must verify the session and scope queries by user_id.
- Respect prefers-reduced-motion and a user-controlled sound toggle (default sound: off).
- Small, targeted diffs. No unrelated refactors. No new dependencies without stating why.
- After each phase: run typecheck, lint, and build; summarize what changed and what to verify manually.
- Explicit non-goals: teams/sharing, comments, tags, due dates, subtasks, dashboards, notifications.

