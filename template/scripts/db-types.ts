import Database from "better-sqlite3";
import { Cli } from "kysely-codegen";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const dir = mkdtempSync(path.join(tmpdir(), "db-types-"));
const file = path.join(dir, "schema.sqlite");
try {
  const db = new Database(file);
  for (const name of readdirSync("migrations")
    .filter((name) => name.endsWith(".sql"))
    .sort())
    db.exec(readFileSync(path.join("migrations", name), "utf8"));
  db.close();
  await new Cli().generate({
    dialect: "sqlite",
    url: file,
    outFile: "src/db/schema.generated.ts",
    excludePattern: "_cf_*",
    verify: process.argv.includes("--verify"),
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
