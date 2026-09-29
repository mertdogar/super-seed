# Super Seed

One Cloudflare Worker serves the prerendered landing page, the dashboard at `/app` and the typed API
at `/api/v1`, all backed by D1.

## Start

```sh
pnpm install
pnpm setup:local
pnpm dev
```

The create CLI already ran the first two. Open http://localhost:4300 and sign up at `/app/sign-up`.

Email never leaves your machine in development. Each message is written to a file under
`.wrangler/tmp/` and the dev server logs its path. Open the verification link from there.

<!-- @feature operator -->

To reach the operator console at `/app/operator`, make your account a platform admin:

```sh
pnpm operator:add you@example.com            # local database
pnpm operator:add you@example.com --remote   # production
```

<!-- @end operator -->

## Commands

| Command                  | Does                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| `pnpm dev`               | Dev server on port 4300                                             |
| `pnpm check`             | Everything CI runs: types, typecheck, lint, format, build and tests |
| `pnpm test`              | Node and Worker tests                                               |
| `pnpm format`            | Format with oxfmt                                                   |
| `pnpm email`             | Preview the emails in `src/emails` on port 3030                     |
| `pnpm db:migrate:local`  | Apply new migrations to the local database                          |
| `pnpm db:migrate:remote` | Apply new migrations to production                                  |
| `pnpm db:types`          | Regenerate `src/db/schema.generated.ts` from `migrations/`          |
| `pnpm types`             | Regenerate `worker-configuration.d.ts` from `wrangler.jsonc`        |
| `pnpm setup:remote`      | First deploy: D1, migrations, secrets and the Worker                |
| `pnpm run deploy`        | Every deploy after the first                                        |

## Layout

```
src/
  server.ts     Worker entry: the typed API first, then TanStack Start
  api/          Router, auth modes, OpenAPI and the typed client
  features/     One folder per feature: routes, helpers, UI sections
  routes/       Pages. /, /privacy and /terms are prerendered; /app runs in the browser
  lib/          Better Auth, Kysely, email
  emails/       react-email templates
  site.ts       Name, copy, features and FAQ for the landing page
migrations/     D1 schema, camelCase columns
test/           Node tests, and Worker tests against a real D1
```

Conventions for changing the code are in [AGENTS.md](AGENTS.md).

## Deploy

You need a Cloudflare account with the domain from `wrangler.jsonc` on it. Onboard the domain to
Cloudflare Email Service so the `EMAIL` binding can send from `noreply@super-seed.example.com`.

1. `pnpm exec wrangler login`
2. `pnpm setup:remote`
3. Commit `wrangler.jsonc`

`setup:remote` creates the D1 database and saves its id, applies the migrations, generates
`BETTER_AUTH_SECRET`, asks for any other secret, then builds and deploys.

Later: `pnpm db:migrate:remote` when you add a migration, then `pnpm run deploy`.

<!-- @feature billing -->

## Billing

Plans live in `src/features/billing/plans.ts`. The pricing section and the limits the API enforces
both read from it.

To test locally with Stripe test mode:

1. Create a product with a monthly price whose lookup key is `super-seed-pro-monthly`
2. Put the test secret key in `.dev.vars` as `STRIPE_SECRET_KEY`
3. Run `stripe listen --forward-to localhost:4300/api/auth/stripe/webhook --print-secret` and put
   the secret in `.dev.vars` as `STRIPE_WEBHOOK_SECRET`
4. Keep `stripe listen` running and restart `pnpm dev`

For production, create a webhook endpoint at
`https://super-seed.example.com/api/auth/stripe/webhook` with the events
`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` and
`customer.subscription.deleted`. Do it before `pnpm setup:remote`, which asks for both keys. To
change one later: `pnpm exec wrangler secret put STRIPE_WEBHOOK_SECRET`.

<!-- @end billing -->
<!-- @feature api-keys -->

## API keys

Owners and admins create organization keys at `/app/keys`. A key calls any `tenant` route:

```sh
curl https://super-seed.example.com/api/v1/... -H "Authorization: Bearer ss_..."
```

<!-- @end api-keys -->
<!-- @feature api-reference -->

## API reference

`/docs/api` renders the OpenAPI spec served at `/docs/openapi.json`. Both come from the route
definitions, so they are never out of date.

<!-- @end api-reference -->
