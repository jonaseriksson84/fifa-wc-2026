# Runbook

## Database restore (D1 Time Travel)

Both production databases have Time Travel active — any point in the last 30 days is recoverable.

**Databases**

| Pool | Database name | Database ID |
|------|--------------|-------------|
| friends | `fifa-wc-2026-friends` | `ca9ac350-128e-4557-b520-eb8f813e2b05` |
| work | `fifa-wc-2026-work` | `28281aa7-de2e-4c8e-8dc3-a527615838b9` |

**Restore to a point in time**

```bash
wrangler d1 time-travel restore fifa-wc-2026-friends --timestamp=2026-06-11T07:59:00Z
wrangler d1 time-travel restore fifa-wc-2026-work    --timestamp=2026-06-11T07:59:00Z
```

Use an ISO 8601 UTC timestamp just before the bad write. The fixture refresher runs at **08:00 UTC** daily, so `T07:59:00Z` is a safe pre-refresh target on any given date.

**Restore to a specific bookmark**

```bash
# Get current bookmark (also works to check Time Travel is active)
wrangler d1 time-travel info fifa-wc-2026-friends
wrangler d1 time-travel info fifa-wc-2026-work

# Restore
wrangler d1 time-travel restore fifa-wc-2026-friends --bookmark=<bookmark>
wrangler d1 time-travel restore fifa-wc-2026-work    --bookmark=<bookmark>
```

**What the scheduled jobs can and cannot corrupt**

The `*/5 * * * *` result poller and `0 8 * * *` fixture refresher only write to the `fixture` table (team names, kickoffs, results). The `pick`, `user`, `session`, and `account` tables are never touched by scheduled jobs — picks are only at risk from migrations or pick-submission bugs, not API updates.
