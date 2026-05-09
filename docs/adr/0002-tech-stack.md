# Tech stack: SvelteKit on Cloudflare Workers with D1

The app is built as a single SvelteKit project deployed to Cloudflare Workers, with Cloudflare D1 (SQLite) as the database, accessed via Drizzle ORM. Auth is Better Auth using magic-link sign-in (email delivery via Resend). Styling is Tailwind v4 with no UI component library.

## Why

The predecessor (Euro 2020) was Next.js 10 + FaunaDB, which paired a heavyweight framework with a non-relational store and ended up requiring raw FaunaDB writes for routine admin. For v2 we wanted "log in, pick, be done" simplicity end-to-end, including ops.

- **Cloudflare Workers** as the platform — free tier easily covers two deployments, edge-fast, no servers to operate, Cron Triggers built in for the result poller. Fits the "two pools, one operator" shape better than a per-app VM/container would.
- **SvelteKit** over Next.js or Remix — form-actions are a near-perfect match for the picks UI (server-side mutation, no API plumbing), bundles are smaller (matters on phones in stadium queues), DX is leaner. We accept the cost of learning Svelte coming from React; for a ~5-page app, that learning curve is amortised in days.
- **D1 + Drizzle** — SQLite is wildly over-spec for ~50 users × 104 fixtures, which is the point: zero ops, zero cost, native to the platform. Drizzle gives type-safe queries without an ORM heavyweight.
- **Better Auth + magic link** — Lucia is in maintenance, NextAuth is Next.js-flavoured and heavy, Clerk is paid. Better Auth is the modern TS-first option and works cleanly on Workers + D1. Magic link removes password-reset UX entirely.
- **Tailwind v4, no component library** — five screens don't justify the setup overhead of shadcn or similar; per-deployment branding (different name + accent colour for friends vs work) is handled with a couple of CSS variables wired to env config.

## Trade-off

We're locking ourselves into the Cloudflare runtime — Workers' V8 isolate model means some npm packages don't run, and migrating off Workers later is non-trivial. We accept that for the substantial DX/cost upside on a project this size. Drizzle and SvelteKit are both portable enough that the framework-and-DB pieces could move; the platform binding is the sticky part.
