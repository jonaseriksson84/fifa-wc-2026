# Results sourced from api-football, no admin UI

Fixtures and results come from api-football's free tier, fetched by a Cloudflare Workers Cron Trigger. There is no admin UI in the app — no admin role, no admin routes, no result-entry form, no user management screen. The handful of edge cases that the API can't resolve are handled by direct `wrangler d1 execute` SQL.

## Why

The single biggest operational pain in the predecessor was that admin tasks (entering results, fixing data, managing users) all happened as raw FaunaDB writes through a third-party console. The v1 schema required this because there was no result-entry mechanism and no admin UI; the predecessor was effectively read-only from the operator's perspective.

In v2 the equation flips:
- **api-football handles 99% of the load.** A 5-minute cron polls for results once a fixture should have ended, and a daily 08:00-UTC pass refreshes fixtures (catching knockout team assignments, kickoff time changes, etc.). Final results land in D1 within a few minutes of the final whistle.
- **Magic-link auth removes the only recurring user-management task.** No password resets, no email changes-of-mind to handle.
- **What's left is genuinely rare.** Across a tournament we expect 0–3 manual interventions: an api-football data error (uncommon at WC scale), a post-match disciplinary overturn (very rare), or a user we need to disable (effectively never in a friends/work pool). For each, a single `wrangler d1 execute` is a few seconds of work.

Building an admin UI for 0–3 events would add: an admin role on `User`, role-gated routes, screens for fixtures and users, and a recurring temptation to grow the admin surface. Skipping it shrinks the schema, the route map, and the security review.

## Trade-off

If api-football becomes unreliable (degraded coverage, downtime during the tournament, vendor change) we have no fallback in-app for entering results — we'd need to ship a result-entry form mid-tournament. We mitigate by keeping the data model already result-shape-compatible with manual entry, so the addition would be additive code, not a schema change.
