import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

import type { DB } from "@/db/schema.generated";

export type Db = Kysely<DB>;

export function createDb(env: Env): Db {
  return new Kysely<DB>({ dialect: new D1Dialect({ database: env.DB }) });
}
