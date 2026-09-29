import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { resolveCaller } from "@/api/caller";
import { createAuth } from "@/lib/auth";

import { call, json, origin, owner } from "./helpers";

function resolve(mode: "tenant" | "orgAdmin", headers: Record<string, string>) {
  return resolveCaller(mode, new Request(origin, { headers }), env, () => createAuth(env, origin));
}

describe("organization keys", () => {
  it("resolves an organization key to its organization for `tenant` only", async () => {
    const founder = await owner("modes-key@example.com");
    const key = await json<{ key: string; id: string }>(
      call("/api/auth/api-key/create", {
        method: "POST",
        cookie: founder.cookie,
        json: { name: "Backend", organizationId: founder.organizationId },
      }),
    );
    expect(key.key.startsWith("ss_")).toBe(true);
    const bearer = { Authorization: `Bearer ${key.key}` };
    expect(await resolve("tenant", bearer)).toEqual({
      organizationId: founder.organizationId,
      actor: { kind: "apiKey", keyId: key.id },
    });
    await expect(resolve("orgAdmin", bearer)).rejects.toMatchObject({ status: 403 });
    await expect(
      resolve("tenant", { Authorization: "Bearer ss_not-a-real-key" }),
    ).rejects.toMatchObject({ status: 401 });
  });
});
