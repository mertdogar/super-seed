import { randomBytes } from "node:crypto";
import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { type FeatureName, features, isFeatureName } from "./features.ts";

export type Names = { slug: string; displayName: string; domain: string; keyPrefix: string };

const skipped = new Set([
  "node_modules",
  ".wrangler",
  "dist",
  ".tanstack",
  ".dev.vars",
  ".DS_Store",
]);

const marker = /^\s*(?:\/\/|#|\{\/\*|<!--)\s*@(feature|end) ([a-z0-9-]+)\s*(?:\*\/\}|-->)?\s*$/;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCase(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ");
}

export function keyPrefix(slug: string) {
  const words = slug.split("-").filter(Boolean);
  const letters = words.length > 1 ? words.map((word) => word[0]).join("") : slug.slice(0, 2);
  return `${letters.slice(0, 4)}_`;
}

/** Drops the blocks of features that are not kept, and every marker line. */
export function stripMarkers(text: string, keep: ReadonlySet<string>, file = "file") {
  const open: string[] = [];
  const lines: string[] = [];
  for (const [index, line] of text.split("\n").entries()) {
    const found = marker.exec(line);
    if (!found) {
      if (open.every((name) => keep.has(name))) lines.push(line);
      continue;
    }
    const [, kind, name] = found as unknown as [string, "feature" | "end", string];
    if (!isFeatureName(name)) throw new Error(`${file}:${index + 1}: unknown feature "${name}"`);
    if (kind === "feature") open.push(name);
    else if (open.pop() !== name)
      throw new Error(`${file}:${index + 1}: "@end ${name}" does not close the open block`);
  }
  if (open.length) throw new Error(`${file}: "@feature ${open.at(-1)}" is never closed`);
  return lines.join("\n");
}

export function rename(text: string, names: Names) {
  return text
    .replaceAll("super-seed.example.com", names.domain)
    .replaceAll("Super Seed", names.displayName)
    .replaceAll("super-seed", names.slug)
    .replace(/\bss_/g, names.keyPrefix);
}

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  });
}

function isText(file: string) {
  const bytes = readFileSync(file);
  return !bytes.subarray(0, 8000).includes(0);
}

function removeEmptyDirs(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true }))
    if (entry.isDirectory()) removeEmptyDirs(path.join(dir, entry.name));
  if (readdirSync(dir).length === 0) rmdirSync(dir);
}

function editPackageJson(target: string, removed: FeatureName[], names: Names) {
  const file = path.join(target, "package.json");
  const pkg = JSON.parse(readFileSync(file, "utf8")) as {
    name: string;
    scripts: Record<string, string>;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  pkg.name = names.slug;
  for (const name of removed) {
    const feature = features[name] as { dependencies?: string[]; scripts?: string[] };
    for (const dependency of feature.dependencies ?? []) {
      delete pkg.dependencies[dependency];
      delete pkg.devDependencies[dependency];
    }
    for (const script of feature.scripts ?? []) delete pkg.scripts[script];
  }
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

function writeDevVars(target: string) {
  const example = readFileSync(path.join(target, ".dev.vars.example"), "utf8");
  const secret = randomBytes(32).toString("hex");
  writeFileSync(
    path.join(target, ".dev.vars"),
    example.replace("replace-with-at-least-32-random-characters", secret),
  );
}

export function scaffold(options: {
  templateDir: string;
  targetDir: string;
  features: FeatureName[];
  names: Names;
}) {
  const { templateDir, targetDir, names } = options;
  const keep = new Set<string>(options.features);
  const removed = (Object.keys(features) as FeatureName[]).filter((name) => !keep.has(name));

  cpSync(templateDir, targetDir, {
    recursive: true,
    filter: (source) => !skipped.has(path.basename(source)),
  });
  // npm drops .gitignore from published packages, so the package carries a copy
  const packedIgnore = path.join(targetDir, "_gitignore");
  if (existsSync(packedIgnore)) renameSync(packedIgnore, path.join(targetDir, ".gitignore"));

  for (const name of removed)
    for (const relative of features[name].paths)
      rmSync(path.join(targetDir, relative), { recursive: true, force: true });
  removeEmptyDirs(targetDir);

  for (const file of files(targetDir)) {
    if (path.basename(file) === "pnpm-lock.yaml" || statSync(file).size > 1_000_000) continue;
    if (!isText(file)) continue;
    const before = readFileSync(file, "utf8");
    const after = rename(stripMarkers(before, keep, path.relative(targetDir, file)), names);
    if (after !== before) writeFileSync(file, after);
  }

  editPackageJson(targetDir, removed, names);
  writeDevVars(targetDir);
}
