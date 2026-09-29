import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { type Mode, resolveCaller } from "@/api/caller";
import { createAuth } from "@/lib/auth";

import { join, origin, owner, signUp } from "./helpers";

function resolve(mode: Mode, headers: Record<string, string> = {}) {
  const request = new Request(origin, { headers });
  return resolveCaller(mode, request, env, () => createAuth(env, origin));
}

describe("auth modes", () => {
  it("lets anyone through `none`", async () => {
    expect(await resolve("none")).toBeUndefined();
  });

  it("requires a session for every other mode", async () => {
    for (const mode of ["user", "tenant", "orgAdmin"] as const)
      await expect(resolve(mode)).rejects.toMatchObject({ status: 401, code: "unauthorized" });
  });

  it("gives `user` routes a signed-in user without an organization", async () => {
    const { cookie, userId } = await signUp("no-org@example.com");
    expect(await resolve("user", { Cookie: cookie })).toEqual({ userId });
    await expect(resolve("tenant", { Cookie: cookie })).rejects.toMatchObject({
      status: 403,
      code: "no_active_organization",
    });
  });

  it("resolves the active organization and role for `tenant`", async () => {
    const founder = await owner("modes-owner@example.com");
    expect(await resolve("tenant", { Cookie: founder.cookie })).toEqual({
      organizationId: founder.organizationId,
      actor: { kind: "user", userId: founder.userId, role: "owner" },
    });
  });

  it("keeps members out of `orgAdmin` and lets admins in", async () => {
    const founder = await owner("modes-admin-owner@example.com");
    const member = await join(founder, "modes-member@example.com");
    const admin = await join(founder, "modes-admin@example.com", "admin");
    await expect(resolve("orgAdmin", { Cookie: member.cookie })).rejects.toMatchObject({
      status: 403,
      code: "forbidden",
    });
    expect(await resolve("orgAdmin", { Cookie: admin.cookie })).toMatchObject({
      organizationId: founder.organizationId,
      actor: { role: "admin" },
    });
  });

  // @feature operator
  it("admits only platform admins to `operator`", async () => {
    const user = await signUp("modes-operator@example.com");
    await expect(resolve("operator", { Cookie: user.cookie })).rejects.toMatchObject({
      status: 403,
    });
    await env.DB.prepare('UPDATE "user" SET "role" = \'admin\' WHERE "id" = ?')
      .bind(user.userId)
      .run();
    expect(await resolve("operator", { Cookie: user.cookie })).toEqual({ userId: user.userId });
  });
  // @end operator
});
