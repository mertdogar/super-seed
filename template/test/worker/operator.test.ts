import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { call, join, json, owner } from "./helpers";

describe("operator", () => {
  it("lists every organization for platform admins only", async () => {
    const founder = await owner("operator-owner@example.com");
    await join(founder, "operator-member@example.com");
    const path = "/api/v1/operator/organizations";
    expect((await call(path, { cookie: founder.cookie })).status).toBe(403);
    await env.DB.prepare('UPDATE "user" SET "role" = \'admin\' WHERE "id" = ?')
      .bind(founder.userId)
      .run();
    const organizations = await json<{ id: string; ownerEmail: string; memberCount: number }[]>(
      call(path, { cookie: founder.cookie }),
    );
    expect(organizations.find((one) => one.id === founder.organizationId)).toMatchObject({
      ownerId: founder.userId,
      ownerEmail: "operator-owner@example.com",
      memberCount: 2,
    });
  });

  it("lists an organization's members for platform admins only", async () => {
    const founder = await owner("members-owner@example.com");
    const member = await join(founder, "members-member@example.com");
    const path = `/api/v1/operator/organizations/${founder.organizationId}/members`;
    expect((await call(path, { cookie: founder.cookie })).status).toBe(403);
    await env.DB.prepare('UPDATE "user" SET "role" = \'admin\' WHERE "id" = ?')
      .bind(founder.userId)
      .run();
    expect(await json(call(path, { cookie: founder.cookie }))).toMatchObject([
      { userId: founder.userId, email: "members-owner@example.com", role: "owner" },
      { userId: member.userId, email: "members-member@example.com", role: "member" },
    ]);
    expect(
      (await call("/api/v1/operator/organizations/missing/members", { cookie: founder.cookie }))
        .status,
    ).toBe(404);
  });
});
