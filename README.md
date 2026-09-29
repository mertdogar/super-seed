# @super-seed/create

Scaffold a SaaS app on Cloudflare Workers: TanStack Start, a typed API with an OpenAPI spec, Better
Auth accounts and organizations, email invitations, a dashboard and a landing page.

```sh
pnpm create @super-seed my-app
```

`npm create @super-seed@latest my-app` works too, but the app itself uses pnpm. Needs Node 22.18 or
later.

## What you get

Every app has:

- A typed router: each route is defined once with Zod, then served by the Worker, typed on the
  client and published as OpenAPI
- Email and password sign-up with verification and password reset
- Organizations with owner, admin and member roles, and email invitations
- A dashboard at `/app` and a prerendered landing page with privacy and terms pages
- `pnpm check`: types, lint, format, build and tests against a real Worker and D1

Optional features, all on by default:

| Feature          | Name            | Adds                                                        |
| ---------------- | --------------- | ----------------------------------------------------------- |
| Projects demo    | `projects`      | An example tenant resource with routes, pages and tests     |
| Billing          | `billing`       | Stripe subscriptions per organization, pricing, plan limits |
| API keys         | `api-keys`      | Organization keys for calling the API from other backends   |
| Operator console | `operator`      | Platform admins, the organization list and impersonation    |
| API reference    | `api-reference` | Scalar docs for the OpenAPI spec at `/docs/api`             |

## Options

```
create-super-seed [directory] [options]

  --name <name>        Display name, e.g. "Acme Cloud"
  --domain <domain>    Production domain, e.g. app.acme.com
  --features <list>    Comma-separated feature names, or "none"
  --yes                Accept the defaults for anything not given
  --no-install         Skip pnpm install and local setup
  --no-git             Skip git init and the first commit
```

Anything you don't pass is asked for. For example, without prompts:

```sh
pnpm create @super-seed my-app --yes --features billing,api-keys
```

## How it works

`template/` is a complete app with every feature. The CLI:

1. Copies it and deletes the files of the features you leave out, as listed in `src/features.ts`
2. Removes the lines between `@feature <name>` and `@end <name>` markers for those features
3. Renames `super-seed`, `Super Seed`, the domain and the API key prefix
4. Writes `.dev.vars` with a fresh auth secret
5. Installs, sets up the local database, formats and makes the first commit

## Working on the template

```sh
pnpm install
cd template && pnpm install && pnpm setup:local && pnpm dev
```

A marker is a comment on its own line. Markers can nest.

```ts
// @feature billing
import { billingRoutes } from "@/features/billing/api";
// @end billing
```

Use `#` in `.dev.vars` and YAML, `{/* @feature billing */}` in JSX and `<!-- @feature billing -->`
in Markdown.

To add a feature:

1. Keep its own files in feature folders and list them in `src/features.ts` with any dependencies
   and scripts
2. Wrap its lines in shared files with markers
3. Add an "every feature but this one" row to the matrix in `.github/workflows/ci.yml`

To check a change:

1. `pnpm check` here: typecheck, lint, format, unit tests and build of the CLI
2. `pnpm check` in `template/`
3. `node src/cli.ts ../try --yes --features none`, then `pnpm check` in `../try`

CI runs all three, scaffolding seven feature combinations: all, none, and each feature left out.

## Publishing

```sh
pnpm publish --access public
```

`prepack` builds the CLI and ships `template/.gitignore` as `_gitignore`, because npm leaves
`.gitignore` files out of packages.
