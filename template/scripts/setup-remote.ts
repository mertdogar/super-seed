import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";

const configPath = "wrangler.jsonc";
const database = "super-seed";
const placeholderId = "00000000-0000-0000-0000-000000000000";

function wrangler(args: string[]) {
  const result = spawnSync("pnpm", ["exec", "wrangler", ...args], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`wrangler ${args.join(" ")} failed`);
}

function wranglerOutput(args: string[]) {
  return execFileSync("pnpm", ["exec", "wrangler", ...args], {
    encoding: "utf8",
    stdio: ["inherit", "pipe", "inherit"],
  });
}

function createDatabase(config: string) {
  if (!config.includes(placeholderId)) return config;
  const output = wranglerOutput(["d1", "create", database, "--update-config=false"]);
  const id = /"database_id":\s*"([0-9a-f-]{36})"/.exec(output)?.[1];
  if (!id) throw new Error(`Could not find the database id in wrangler's output:\n${output}`);
  writeFileSync(configPath, config.replace(placeholderId, id));
  console.log(`Created D1 database ${database} (${id}) and saved its id to ${configPath}`);
  return readFileSync(configPath, "utf8");
}

function existingSecrets() {
  try {
    const listed = JSON.parse(wranglerOutput(["secret", "list", "--format", "json"])) as {
      name: string;
    }[];
    return new Set(listed.map((secret) => secret.name));
  } catch {
    return new Set<string>();
  }
}

async function missingSecrets(config: string) {
  const required = [
    ...(/"required":\s*\[([^\]]*)\]/.exec(config)?.[1] ?? "").matchAll(/"([A-Z0-9_]+)"/g),
  ].map((match) => match[1]!);
  const existing = existingSecrets();
  const values: Record<string, string> = {};
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  for (const name of required.filter((name) => !existing.has(name)))
    values[name] =
      name === "BETTER_AUTH_SECRET"
        ? randomBytes(32).toString("hex")
        : (await prompt.question(`${name}: `)).trim();
  prompt.close();
  return values;
}

let config = readFileSync(configPath, "utf8");
config = createDatabase(config);
wrangler(["d1", "migrations", "apply", database, "--remote"]);
const secrets = await missingSecrets(config);
const dir = mkdtempSync(path.join(tmpdir(), "secrets-"));
const secretsFile = path.join(dir, "secrets.json");
try {
  writeFileSync(secretsFile, JSON.stringify(secrets), { mode: 0o600 });
  execFileSync("pnpm", ["run", "build"], { stdio: "inherit" });
  wrangler(["deploy", "--secrets-file", secretsFile]);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log("Deployed. Later deploys only need: pnpm run deploy");
