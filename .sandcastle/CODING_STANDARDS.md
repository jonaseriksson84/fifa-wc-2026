# Coding Standards

These standards apply to every Sandcastle agent working in this repo. They are deliberate and load-bearing — before deviating, read [`CONTEXT.md`](../CONTEXT.md), the relevant ADR in [`docs/adr/`](../docs/adr/), and the parent PRD.

## Domain language

Use the exact terms defined in [`CONTEXT.md`](../CONTEXT.md): `User`, `Fixture`, `Pick`, `Result`, `Stage`, `Lock time`, `Score weight`, `Admin`. The retired terms `League`, `UserBet`, `bet`, `match` must not appear in code, schemas, or tests.

The retired `League` entity is gone. There is no multi-tenancy, no membership table, no per-league scoring. If a feature seems to require these concepts, you are misreading the design — re-read [ADR-0001](../docs/adr/0001-deployment-per-pool.md).

## Tech stack — non-negotiable

- **SvelteKit** on **Cloudflare Workers**. Not Next.js, not Astro, not Pages.
- **D1** (Cloudflare SQLite) accessed via **Drizzle ORM**. No raw SQL strings outside Drizzle migrations.
- **Better Auth** with **magic-link** strategy via **Resend**. No passwords, no OAuth at MVP.
- **Tailwind v4**. No component library (no shadcn, no Radix, no DaisyUI). Hand-roll the small set of components we need.
- **Vitest** for unit tests, **Playwright** for the smoke E2E.

## Package manager

This project uses **npm**. The Sandcastle implement-prompt runs `npm run typecheck` and `npm run test` literally — `package.json` must define those scripts with those exact names.

## Module boundaries

Three modules are deep and pure — they get the most rigorous treatment. They are testable in isolation, have no I/O, and their interfaces should not change as the implementation grows:

- **Scoring** — given picks and fixtures-with-results, return a per-user point total. Stage-aware correctness, weights from `Score weight`. No DB, no fetch, no clock.
- **Pick validation** — given a fixture, candidate value, and `now`, return valid or an error. Stage-allowed values, lock-time check. No DB, no fetch.
- **api-football adapter** — given input fixture IDs (or none, for full refresh), return domain-typed `Fixture[]` / `Result[]`. Encapsulates HTTP, auth, response parsing, and the stage-aware result derivation. The rest of the app must never see api-football's response shape.

Repositories (fixture, pick) are thin Drizzle wrappers. Don't smuggle business logic into them.

## Persistence and data flow

- **Picks** are submitted via SvelteKit form actions. There is no JSON API, no client-side fetch for mutations.
- **Reads** are server-rendered. The leaderboard refreshes on page reload. Do not add SSE, WebSockets, polling, or live-updating without an ADR that supersedes [ADR-0003](../docs/adr/0003-api-football-no-admin-ui.md).
- **Pick history is not retained.** A pick is a single mutable row keyed `(user_id, fixture_id)` — `upsertPick` overwrites in place.
- **Stage-aware results.** A knockout fixture's `Result` is the team that *advanced*, not the 90-minute scoreline. Read api-football's winner indicator (or penalty/aggregate fields), never derive a knockout `Result` from `goals_home` vs `goals_away` alone.

## Admin surface

There is none. No admin role on `User`, no admin routes, no result-entry form, no user-management UI. Manual interventions go through `wrangler d1 execute`. Do not add an admin login flow or role-gated routes.

## Visibility rules

- A user's `Pick` is private until the fixture's `Lock time` (= kickoff).
- After lock, every user's pick on that fixture is visible to every user.
- The leaderboard is always public to authenticated users.

Server-side queries that return picks must enforce this. Don't rely on the UI to hide pre-lock picks.

## Scoring weights

Hardcoded in the scoring module, derived from `Stage`:

| Stage | Weight |
|---|---|
| Group | 1 |
| R32, R16, QF, SF | 2 |
| 3rd-place playoff | 3 |
| Final | 5 |

The 3rd-place bump above semi-finals is intentional — see `CONTEXT.md` and the PRD's "Further Notes". Do not "fix" it.

## Testing approach

Use **red-green-refactor** for the three deep modules above. Test external behavior (the leaderboard a set of inputs produces, the validation result for a candidate pick, the domain types the adapter returns from a recorded api-football payload), not internal helpers.

The repositories, auth setup, and cron handlers are not unit-tested — they are exercised by the smoke E2E. Don't add tests for them.

Test fixtures for the api-football adapter live in the repo as recorded JSON. Update them by re-recording, not by hand-editing.

## Environment and deployment

One repo, two deployments. All per-deployment differences (pool name, accent color, D1 binding name, Resend key, api-football key) live in `wrangler.toml` env sections + secrets. Never branch on a hostname or hardcode a pool name.

## Workers runtime constraints

- No `node:fs`, no `node:net`, no `node:child_process`. Reach for the runtime-native equivalent or skip the feature.
- Date/time arithmetic uses UTC server-side. Render in the user's timezone client-side via `Intl.DateTimeFormat` with the locale from the browser.
- Do not import npm packages that bundle large polyfills (e.g., heavy Node-only date libraries). Prefer `Intl` and small focused libraries.

## Out of scope at MVP

Do not build, even speculatively:
- Live in-match leaderboard updates
- Exact-score predictions
- Tie-breakers
- Admin UI
- OAuth / SSO
- Side games (golden boot, group standings predictor, etc.)
- Multi-language UI
- Pick history viewer

If a PRD child issue seems to require any of the above, stop and comment on the issue — don't extend scope.
