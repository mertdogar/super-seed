# Agent guide

This is a pnpm workspace. The app lives in `apps/app`, and its conventions are in
[apps/app/AGENTS.md](apps/app/AGENTS.md). Read it before changing the app. Its paths are relative
to `apps/app`.

## Before you call it done

```sh
pnpm check
```

Run it from the root. It runs `pnpm check` in every package. Fix formatting with `pnpm format`.

## Packages

- Packages live in `apps/` and `packages/`. Each has its own `check` and `format` scripts and its
  own oxlint and oxfmt configs; nothing is shared at the root
- Run a package's other scripts in its folder, or from the root with
  `pnpm --filter <name> <script>`
- Depend on another package with `"workspace:*"`
- pnpm settings such as `minimumReleaseAge` and `allowBuilds` live in the root
  `pnpm-workspace.yaml`. Don't add one inside a package: pnpm would treat that folder as a separate
  workspace
