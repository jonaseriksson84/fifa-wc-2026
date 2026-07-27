# FIFA WC 2026 Prediction Pool

A small social prediction app: pick the winner of every match of the FIFA World Cup 2026 and compete on a leaderboard. Sticker-album aesthetic, one pool per deployment.

## Stack

- SvelteKit on **Cloudflare Workers**
- **D1** (SQLite) via Drizzle ORM
- **Better Auth** with magic-link email (Resend)
- **api-football** for fixtures + results, synced via cron

See [`CONTEXT.md`](CONTEXT.md) for domain language and [`docs/adr/`](docs/adr/) for architecture decisions.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars      # fill in secrets
npm run db:migrate                  # apply migrations to local D1
npm run seed:fixtures                # seed real WC 2026 fixtures
npm run dev
```

Open <http://localhost:5173>.

### Dev tooling

```bash
npm run dev:reset           # wipe users/picks, seed 12 pickable demo fixtures
npm run dev:fastforward     # resolve some demo fixtures so points appear
npm run test                # vitest unit tests
npm run test:e2e            # playwright (requires E2E_TEST=1 in .dev.vars)
npm run typecheck
```

## Deployments

Each pool is a separate Cloudflare Worker environment in [`wrangler.toml`](wrangler.toml). One pool per deployment ([ADR 0001](docs/adr/0001-deployment-per-pool.md)).

| Env | URL | Pool |
|-----|-----|------|
| `friends` | wc26.mynameisjonas.dev | WC26 Jobbiga Bets |
| `work` | wc26-embark.mynameisjonas.dev | WC26 Office Picks (restricted to `@embark-studios.com`) |

### Per-env secrets

Set once per env before first deploy:

```bash
npx wrangler secret put RESEND_API_KEY      --env <env>
npx wrangler secret put BETTER_AUTH_SECRET  --env <env>   # openssl rand -base64 32
npx wrangler secret put API_FOOTBALL_KEY    --env <env>
npx wrangler secret put RECAP_PREVIEW_PASSWORD --env <env>
```

The unlinked `/recap-preview-7f3k9` route uses `RECAP_PREVIEW_PASSWORD` and renders
the Recap from current tournament data before the Final gate opens. If the secret
is unset, the route returns 404. The normal `/recap` availability gate is unchanged.

### Deploy

```bash
npx wrangler deploy --env friends
npx wrangler deploy --env work
```

Custom domains auto-provision via Wrangler as long as the parent zone (`mynameisjonas.dev`) lives in the same Cloudflare account.

### Freezing a pool

Set `POOL_FROZEN = "true"` in `[env.<env>.vars]` and redeploy to close a pool once
its tournament is over. A frozen pool accepts **no writes**: no new users (magic
link or Google), no picks, no winner bets, no display-name edits, and the cron
jobs skip both the result poller and the fixture refresher. Existing members can
still sign in and read everything, including the Recap.

The cron triggers are also commented out in [`wrangler.toml`](wrangler.toml) for
frozen deployments, so the Workers are never invoked on a schedule and make no
api-football calls at all. The `POOL_FROZEN` check in the scheduled handler stays
as a backstop.

To thaw: set `POOL_FROZEN = "false"` (or remove it), uncomment the env's
`[triggers]` block, and redeploy.

### Email domain restriction

Set `ALLOWED_EMAIL_DOMAINS` (comma-separated, e.g. `embark-studios.com`) in `[env.<env>.vars]` to restrict sign-ups. Unset = anything goes.
