# Super Seed

A pnpm workspace. The app, one Cloudflare Worker with D1, lives in `apps/app`. Its
[README](apps/app/README.md) covers setup, deploys and every command.

## Start

```sh
pnpm install
pnpm setup:local
pnpm dev
```

The create CLI already ran the first two. Open http://localhost:4300 and sign up at `/app/sign-up`.

## Commands

Run these from the root. Run the app's other scripts in `apps/app`, or from here with
`pnpm --filter @super-seed/app <script>`.

| Command             | Does                                                 |
| ------------------- | ---------------------------------------------------- |
| `pnpm dev`          | The app's dev server on port 4300                    |
| `pnpm check`        | `pnpm check` in every package. This is what CI runs  |
| `pnpm format`       | `pnpm format` in every package                       |
| `pnpm setup:local`  | Generate types and migrate the local database        |
| `pnpm setup:remote` | First deploy: D1, migrations, secrets and the Worker |
| `pnpm run deploy`   | Every deploy after the first                         |

## Layout

```
apps/app/     The app: Worker, pages, API, migrations and tests
packages/     Shared packages, once you add one
```

A new package goes in `packages/<name>` with its own `check` and `format` scripts, so the root
commands and CI pick it up. The app depends on it with `"@super-seed/<name>": "workspace:*"`.
