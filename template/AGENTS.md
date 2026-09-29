# Agent guide

Super Seed is a TanStack Start app on one Cloudflare Worker with D1. These are the conventions the
code relies on and the reasons behind them.

## Before you call it done

```sh
pnpm check
```

It regenerates the Worker and database types, then runs typecheck, lint, format check, build and
every test. Fix formatting with `pnpm format`. The tools are oxlint and oxfmt, not ESLint or
Prettier.

## How a request flows

`src/server.ts` hands each request to the typed router in `src/api/dispatch.ts`. Anything the route
table doesn't match goes to TanStack Start, which serves the prerendered landing pages and the
`/app` client. An unmatched `/api/*` path answers a JSON 404.

There are no server functions (`createServerFn`). All data goes through the typed API, so the
dashboard, outside callers and the OpenAPI spec share one surface.

## Adding an API route

1. Define it with `defineRoute` in `src/features/<feature>/api.ts`: method, path, `auth`, Zod
   `params`, `query`, `body` and `response`, a `tag` and `summary`, and `errors` for every code it
   throws
2. Spread the feature's array into `routes` in `src/api/routes.ts`
3. Call it from a page with `api("POST /api/v1/things", { body })` or
   `apiQuery("GET /api/v1/things/{id}", { params })` from `src/api/client.ts`

The client and the OpenAPI document are both derived from the route table, so there is nothing else
to update. If a route changes shape, every page that calls it fails typecheck.

Set `internal: true` to keep a route out of the spec. Use `defineRawRoute` when the handler must
build its own `Response`.

<!-- @feature projects -->

`src/features/projects/api.ts` is the complete example: CRUD, cursor pagination, and the tests in
`test/worker/projects.test.ts`.

<!-- @end projects -->

## Auth modes

Each route declares who may call it, and the handler receives a typed `caller`:

| Mode       | `caller`                                      | Rejects                                  |
| ---------- | --------------------------------------------- | ---------------------------------------- |
| `none`     | `undefined`                                   | nobody                                   |
| `user`     | `{ userId }`                                  | no session (401)                         |
| `tenant`   | `{ organizationId, actor }`                   | no session, no active organization (403) |
| `orgAdmin` | `{ organizationId, actor }` with a user actor | as `tenant`, plus members (403)          |

<!-- @feature operator -->

`operator` routes get `{ userId }` and reject anyone whose user role isn't `admin` (403). Grant it
with `pnpm operator:add <email>`.

<!-- @end operator -->
<!-- @feature api-keys -->

An organization key (`Authorization: Bearer ss_...`) works on `tenant` routes only. Its actor is
`{ kind: "apiKey", keyId }`, so don't assume a user is behind every tenant call.

<!-- @end api-keys -->

## Every tenant query filters by `organizationId`

Every statement on a tenant table carries `.where("organizationId", "=", caller.organizationId)`,
including lookups by id, updates and deletes. Put the filter in the statement itself rather than
loading a row and checking it afterwards, and write it even when the id is a UUID.

Give each tenant resource a test that creates two organizations and proves neither can read, update
or delete the other's rows.

<!-- @feature projects -->

The last test in `test/worker/projects.test.ts` is the one to copy.

<!-- @end projects -->

## Errors

Throw `new ApiError(status, code, message, details?)` for anything the caller can fix: bad input,
not found, permissions, limits. It answers `{ "error": { "code", "message", "details" } }`. Add the
code to the route's `errors` so the spec documents it. Invalid `params`, `query` or `body` already
answer 400 `invalid_request` with the Zod issues in `details.issues`.

Anything else that reaches the dispatcher is a bug. It is logged and answers 500. Don't catch errors
just to turn them into 400s.

## Database

- Migrations are plain SQL in `migrations/NNNN_name.sql` with camelCase columns, matching Better
  Auth's tables and the generated types
- After adding one, run `pnpm db:migrate:local` and `pnpm db:types`. `pnpm check` fails while
  `src/db/schema.generated.ts` is stale
- Query with Kysely. Handlers receive `db`; anywhere else, use `createDb(env)` from `src/lib/db.ts`
- Your own tables use `crypto.randomUUID()` ids and ISO string timestamps in `text` columns
- Better Auth owns `user`, `session`, `account`, `verification`, `organization`, `member`,
  `invitation` and its plugins' tables. Read them with Kysely, but write through `auth.api` so its
  hooks and emails run

## Derive, don't store

Compute values from stored facts when you read them. `nextCursor` comes from the last row of a page
and a caller's role from its `member` row. A stored status column needs every writer to keep it in
sync; a derived one can't drift.

## Feature folders

`src/features/<name>/` holds what one feature adds besides pages, migrations and tests: routes,
helpers and UI sections. Keeping it together makes a feature easy to find and to delete.

## Frontend

- Pages are TanStack Router file routes in `src/routes`
- `/`, `/privacy` and `/terms` are prerendered at build time. A new marketing page must be added to
  `marketingPages` in `vite.config.ts`, or it is neither prerendered nor in the sitemap
- `/app/*` has `ssr: false` and runs only in the browser. `_authed` requires a session; `_org`
  requires an active organization
- Server state lives in TanStack Query. Session queries are in `src/lib/session.ts`; call
  `resetSession(queryClient)` when the signed-in user or active organization changes
- UI components are shadcn/ui on Tailwind 4 in `src/components/ui`. Add one with
  `pnpm dlx shadcn@latest add <name>`
- Landing page copy lives in `src/site.ts`

## Emails

Templates are react-email components in `src/emails`. Send one with
`sendEmail(env, to, subject, <Template />)` from `src/lib/email.ts`, and preview them all with
`pnpm email`. In development each email is written to a file under `.wrangler/tmp/` and the dev
server logs its path.

## Generated files

Never edit these by hand:

| File                         | Regenerate with                |
| ---------------------------- | ------------------------------ |
| `src/db/schema.generated.ts` | `pnpm db:types`                |
| `src/routeTree.gen.ts`       | `pnpm dev` or `pnpm typecheck` |
| `worker-configuration.d.ts`  | `pnpm types`                   |

## Tests

`vitest.config.ts` defines two projects:

- **node**: `test/*.test.ts`. Pure functions, no Worker
- **workers**: `test/worker/*.test.ts`. The real Worker in workerd, against a D1 with every
  migration applied. `test/worker/helpers.ts` has `call`, `json`, `signUp`, `signIn`, `owner` (a
  user with an organization) and `join` (invited and accepted)

Use the workers project only when a test needs the database or routing. Run one project with
`pnpm exec vitest run --project node`.
