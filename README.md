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
```

### Deploy

```bash
npx wrangler deploy --env friends
npx wrangler deploy --env work
```

Custom domains auto-provision via Wrangler as long as the parent zone (`mynameisjonas.dev`) lives in the same Cloudflare account.

### Email domain restriction

Set `ALLOWED_EMAIL_DOMAINS` (comma-separated, e.g. `embark-studios.com`) in `[env.<env>.vars]` to restrict sign-ups. Unset = anything goes.
