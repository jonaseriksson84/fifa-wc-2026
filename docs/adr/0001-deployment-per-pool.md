# Deployment per pool

Each prediction pool is its own independent deployment. There is no multi-tenancy in the app — no `League` or `Pool` entity, no membership table, no per-user-per-pool join logic. A user account exists only within one deployment; running both a friends pool and a work pool means two deployments and (for the operator) two accounts.

## Why

The predecessor (Euro 2020) modelled leagues as a first-class many-to-many entity with shared join codes, a "current league" cookie hack, and per-league scoring. In practice almost every user was in exactly one league, the multi-league code paths were never exercised, and admin tasks ended up being executed as raw FaunaDB writes. Multi-tenancy paid for itself in complexity (every query needed a league filter, every URL needed a league segment, every admin action needed a tenant-scope check) and returned essentially nothing.

Single-tenant per deployment removes the entire concept: no membership table, no tenant-scoped queries, no league switcher, no leaked-code recovery. The mental model collapses to "this app *is* the pool." Spinning up a third pool is a deploy, not a feature.

## Trade-off

Re-introducing multi-tenancy later would be invasive — schema, auth, and routing all bake the assumption in. We accept that cost in exchange for a smaller, more obvious system today.
