#!/usr/bin/env node
import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  multiselect,
  note,
  outro,
  spinner,
  text,
} from "@clack/prompts";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { type FeatureName, featureNames, features, isFeatureName } from "./features.ts";
import { keyPrefix, scaffold, slugify, titleCase } from "./scaffold.ts";

const usage = `Usage: create-super-seed [directory] [options]

Options:
  --name <name>        Display name, e.g. "Acme Cloud"
  --domain <domain>    Production domain, e.g. app.acme.com
  --features <list>    Comma-separated: ${featureNames.join(", ")}, or "none"
  --yes                Accept the defaults for anything not given
  --no-install         Skip pnpm install and local setup
  --no-git             Skip git init and the first commit`;

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  allowNegative: true,
  options: {
    name: { type: "string" },
    domain: { type: "string" },
    features: { type: "string" },
    yes: { type: "boolean", short: "y" },
    install: { type: "boolean" },
    git: { type: "boolean" },
    help: { type: "boolean", short: "h" },
  },
});

if (flags.help) {
  console.log(usage);
  process.exit(0);
}

function answer<T>(value: T | symbol): Exclude<T, symbol> {
  if (isCancel(value)) {
    cancel("Cancelled.");
    process.exit(1);
  }
  return value as Exclude<T, symbol>;
}

function fail(message: string): never {
  cancel(message);
  process.exit(1);
}

function parseFeatures(list: string): FeatureName[] {
  if (list === "none") return [];
  const names = list.split(",").map((name) => name.trim());
  const unknown = names.filter((name) => !isFeatureName(name));
  if (unknown.length)
    fail(`Unknown features: ${unknown.join(", ")}. Choose from ${featureNames.join(", ")}.`);
  return names as FeatureName[];
}

function run(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.status !== 0)
    fail(`${command} ${args.join(" ")} failed. Fix the error above and rerun it in ${cwd}.`);
}

function succeeds(command: string, args: string[], cwd: string) {
  return spawnSync(command, args, { cwd, stdio: "ignore" }).status === 0;
}

intro("Create a super-seed app");

const directory =
  positionals[0] ??
  (flags.yes
    ? "my-app"
    : answer(
        await text({
          message: "Where should the project go?",
          placeholder: "my-app",
          defaultValue: "my-app",
        }),
      ));
const targetDir = path.resolve(directory);
if (existsSync(targetDir) && readdirSync(targetDir).length)
  fail(`${targetDir} already exists and is not empty.`);
const slug = slugify(path.basename(targetDir));
if (!slug) fail(`Can't derive a project name from "${directory}".`);

const displayName =
  flags.name ??
  (flags.yes
    ? titleCase(slug)
    : answer(
        await text({
          message: "Display name",
          defaultValue: titleCase(slug),
          placeholder: titleCase(slug),
        }),
      ));

const domain =
  flags.domain ??
  (flags.yes
    ? `${slug}.example.com`
    : answer(
        await text({
          message: "Production domain (on Cloudflare, also used to send email)",
          defaultValue: `${slug}.example.com`,
          placeholder: `${slug}.example.com`,
        }),
      ));

const chosen = flags.features
  ? parseFeatures(flags.features)
  : flags.yes
    ? featureNames
    : answer(
        await multiselect({
          message: "Features",
          options: featureNames.map((name) => ({
            value: name,
            label: features[name].label,
            hint: features[name].hint,
          })),
          initialValues: featureNames,
          required: false,
        }),
      );

const install =
  flags.install ??
  (flags.yes ||
    answer(await confirm({ message: "Install dependencies and set up the local database?" })));
const git =
  flags.git ?? (flags.yes || answer(await confirm({ message: "Initialize a git repository?" })));

const progress = spinner();
progress.start("Copying the template");
scaffold({
  templateDir: fileURLToPath(new URL("../template", import.meta.url)),
  targetDir,
  features: chosen,
  names: { slug, displayName, domain, keyPrefix: keyPrefix(slug) },
});
progress.stop(`Created ${displayName} in ${targetDir}`);

if (install) {
  if (!succeeds("pnpm", ["--version"], targetDir))
    fail(
      "pnpm is not installed. Run `corepack enable pnpm`, then `pnpm install && pnpm setup:local`.",
    );
  log.step("Installing dependencies");
  run("pnpm", ["install"], targetDir);
  log.step("Generating types and migrating the local database");
  run("pnpm", ["run", "setup:local"], targetDir);
  run("pnpm", ["exec", "oxfmt", "--write", "."], targetDir);
}

if (git) {
  run("git", ["init", "--quiet", "--initial-branch", "main"], targetDir);
  run("git", ["add", "--all"], targetDir);
  if (
    !succeeds(
      "git",
      ["commit", "--quiet", "--message", `Create ${displayName} from super-seed`],
      targetDir,
    )
  )
    log.warn("Created the repository, but the first commit failed. Commit the files yourself.");
}

const relative = path.relative(process.cwd(), targetDir) || ".";
note(
  [
    `cd ${relative}`,
    ...(install ? [] : ["pnpm install && pnpm setup:local"]),
    "pnpm dev              # http://localhost:4300",
    "pnpm setup:remote     # when you're ready to deploy",
  ].join("\n"),
  "Next steps",
);
outro("Happy building.");
