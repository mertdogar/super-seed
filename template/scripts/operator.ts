import { execFileSync } from "node:child_process";

const [email, target = "--local"] = process.argv.slice(2);
if (!email || !["--local", "--remote"].includes(target)) {
  console.error("Usage: pnpm operator:add <email> [--local | --remote]");
  process.exit(1);
}

const sql = `UPDATE "user" SET "role" = 'admin' WHERE "email" = '${email.replaceAll("'", "''")}'`;
execFileSync(
  "pnpm",
  ["exec", "wrangler", "d1", "execute", "super-seed", target, "--command", sql],
  {
    stdio: "inherit",
  },
);
