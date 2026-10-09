# Port the app shell and operator panel from super-flows

super-flows (`/Users/mertdogar/Workspace/personal/super-flows`) was created from this template at
its commit `61484b3` and has since gained a shadcn sidebar app shell and a multi-page operator
panel. This plan copies both back into `template/`, stripping super-flows product code. It is a
one-time port. Delete this file in the last commit.

## Rules for every slice

- **Copy and strip.** super-flows is the source of truth. Copy its files, then delete product code
  (workflows, agents, assistant, apps, skills, databases, AI credit, brand tokens). Rewrite only
  where this plan says so.
- **Any feature subset must compile.** Features never depend on each other. Wrap lines in shared
  files with `@feature <name>` / `@end <name>` comment markers (alone on their line, nestable;
  nested blocks are kept only when every enclosing feature is kept). List feature-owned files in
  `src/features.ts` `paths`. A path listed under two features is removed when either is left out.
- **Renames.** The CLI rewrites `super-seed`, `Super Seed`, `super-seed.example.com` and `ss_`.
  Replace every `Super Flows` / `super-flows` string with `site.name` or `Super Seed`.
- **Never copy** `client_secret_*.json`, `.env`, `.dev.vars`, `debug/`, `.impeccable/`,
  `.claude/`, `wrangler.jsonc` ids or domains.
- Follow `template/AGENTS.md`: typed routes via `defineRoute`, tenant queries filter by
  `organizationId`, shadcn components via `pnpm dlx shadcn@latest add <name>`, oxlint/oxfmt.
- Update the README and AGENTS.md lines a slice changes, in that slice.
- One commit per slice on branch `port-from-super-flows`. Ask before each commit.

## Verify every slice

1. Root: `pnpm check`
2. Template: `cd template && pnpm check`
3. Generated apps, from the repo root, for `--features none` and for every combination the slice
   touches:
   `node src/cli.ts "$TMPDIR/try" --yes --no-git --features <list>`, then `pnpm check` in it.
4. UI slices: `cd template && pnpm dev`, check desktop and a 375px-wide window.

CI runs all 7 combinations (all, none, each feature left out once) on the PR.

## Slice 1: App shell (1.5–2 h)

Source commits: `73a7fab`, `f06c044`, `8d5ea30`.

1. `cd template && pnpm dlx shadcn@latest add sidebar sheet tooltip avatar breadcrumb collapsible skeleton`.
   This adds `src/hooks/use-mobile.ts`. Compare against super-flows' `src/components/ui/` copies
   and keep the template's `cn` import convention. Do not add `kbd` or `progress`.
2. `src/styles.css`: add `--sidebar*` tokens (light and dark, inside the existing
   `prefers-color-scheme` setup) and the matching `--color-sidebar*` entries in `@theme inline`.
   Take the values from super-flows' `styles.css`, mapped onto the template's existing tokens. Skip
   the `data-theme` dark variant (theme picker), `brand-*`, `code-*` and `signal-*` tokens.
3. Copy `src/components/dashboardblocks/link.tsx` and `app-shell.tsx`. In `app-shell.tsx` keep
   only `AppNav`, `AppHeader`, `AppBreadcrumbs`, `isActiveHref` and the types they use; delete
   `WorkspaceSwitcher`, `SidebarUserMenu`, `UserMenu`, `AppBrand`, `BrandMark`, `SearchButton`,
   `NotificationsButton`, `PlanUsage`, `TopNav`. Fix the collapsible chevron: it uses
   `group-data-open/…` but Radix sets `data-state=open`. Do not add the `@dashboardblocks`
   registry to `components.json`.
4. `src/components/brand.tsx`: export the Sprout icon tile as `BrandMark` and use it inside
   `Brand`.
5. Rewrite `src/routes/app/_authed/_org.tsx` from super-flows' version:
   - Keep: `LinkProvider`, `SidebarProvider` with `collapsible="icon"`, brand header, `AppNav`
     sections, `AccountMenu` in the footer (replaces `OrgSwitcher` and `UserMenu`), `SidebarRail`,
     `SidebarInset` with `ImpersonationBanner`, `AppHeader` with breadcrumbs (leaf from
     `loaderData.name`) and the copy-ID button, `<main className="flex flex-1 flex-col gap-8 p-4 md:p-6">`.
   - Keep the template's `beforeLoad` (role in context, `/app/welcome` redirect without a
     `redirect` search param) and `useSwitch` / `resetSession` behaviour.
   - Strip: `AssistantProvider`, `AssistedTrigger`, the `build` nav (Apps, Skills, Databases,
     Agents), `fullBleed`, `bg-brand-soft text-brand-ink`, the Theme submenu.
   - Nav sections: unlabeled (Dashboard, Projects), "Organization" (Members, Settings, Billing,
     API keys), "Developers" (API reference). Operator entry is pushed when
     `session.user.role === "admin"`.
   - Markers: Projects `projects`, Billing `billing`, API keys `api-keys`, the operator entry and
     `ImpersonationBanner` `operator`, the Developers section `api-reference`, plus their icon
     imports.
6. Check: sidebar collapses to an icon rail with Cmd/Ctrl+B, becomes a sheet below 768px and
   closes on nav click; `/app/projects/$projectId` shows the project name as the last crumb;
   pages fill the width.

Known and accepted: the sidebar's open state is not restored on reload (super-flows writes the
cookie but never reads it).

## Slice 2: Operator core (1.5–2 h)

Source commit: `e227e6e` (plus `ownerId` and members from the same commit).

1. Add `src/routes/app/_authed/operator` to `operator.paths` in `src/features.ts`.
2. `src/routes/app/_authed/operator.tsx` becomes the layout. Rewrite it on the shell's components
   instead of copying super-flows' inline nav and hand-made breadcrumb: admin guard,
   `SidebarProvider`, `AppNav` with Overview, Organizations, Users and count badges,
   `AppHeader` breadcrumbs, a "Back to the app" footer link, `BrandMark` and `site.name`.
3. Copy the pages: `operator/index.tsx` (overview), `operator/organizations/index.tsx`,
   `operator/organizations/$organizationId.tsx` (header, Impersonate owner, Members card),
   `operator/users.tsx`. Strip all credit and plan parts for now; slice 3 adds plan parts.
4. Copy `src/features/operator/queries.ts` (without `planOf` and `dollars`) and `impersonate.ts`.
5. `src/features/operator/api.ts`: add `ownerId` to the organization list, add
   `GET /operator/organizations/{id}/members` and `organizationOf`.
6. `test/worker/operator.test.ts`: port the "operator" block (list with `ownerId`, members with
   403 and 404).
7. Update the operator rows in the root README feature table, `template/README.md` and
   `template/AGENTS.md`.

## Slice 3: Plan grants (about 1 h)

Source commit: `aebc588`. Grants exist only when both `billing` and `operator` are kept.

1. `migrations/0006_plan_grant.sql`: the `planGrant` table (organizationId PK, plan, grantedBy,
   note, createdAt), then `pnpm db:types`. List it under both `billing.paths` and `operator.paths`.
2. Billing: super-seed's billing has diverged (it uses `cancelAtPeriodEnd`), so write the grant
   logic onto the template's own `features/billing/limits.ts`, `features/billing/api.ts` and
   `_org/billing.tsx` rather than copying. A grant wins over the Stripe subscription;
   `GET /billing` returns `complimentary`; the Billing page says the plan is on the house. Wrap
   all of it in `@feature operator`.
3. Operator: PUT/DELETE `/operator/organizations/{id}/plan`, `subscribedPlan`, `grantedPlan`,
   `grantNote`, `planOf`, the Plan card, Plan column, granted-plans stat and Plan grants nav
   entry, all wrapped in `@feature billing`. Copy `operator/grants.tsx` and list it under both
   `billing.paths` and `operator.paths`.
4. Tests: port the "plan grants" block into `operator.test.ts` inside `@feature billing`.
5. Verify generated apps without `billing` and without `operator` as well as `none`.

## Slice 4: API key rate limit and usage reset (about 30 min)

Source commit: `7813932` (only these parts).

1. `src/lib/auth.ts`: set the `apiKey` plugin's `rateLimit` to 1,000 requests an hour. No
   back-fill migration is needed in a fresh app.
2. `POST /operator/organizations/{id}/reset-api-key-usage` (zeroes `apikey.requestCount` and
   `lastRequest`) and the organization page's "Reset key usage" card, wrapped in
   `@feature api-keys`.
3. Test inside `@feature api-keys`: set `requestCount` with SQL instead of calling
   `/api/v1/projects`, so it does not depend on `projects`.

## Slice 5: Release (about 20 min)

1. Bump the root `package.json` version to `0.2.0`.
2. Delete this file.
3. Open the PR. The maintainer publishes to npm.

## Later (not in this plan)

Generic super-flows improvements to consider next, best first:

1. Stripe `cancelAt` fix (`6f25a33`): Portal cancellations never show an end date today.
2. Paid plan carries through sign-up to Billing (pricing/welcome redirect part of `c24cf88`).
3. Theme picker: light, dark, system, saved per user (`5ea9a29`). Its submenu goes in
   `AccountMenu`.
4. Small: copy-invitation-link button (`7813932`), `db.batch` helper (`eca6757`), `.gitignore`
   entries for `.env`, `client_secret_*.json` and `debug/`.
5. Conventions: vendored agent skills (`48c7939`), `CONTEXT.md`, `docs/adr/`.
