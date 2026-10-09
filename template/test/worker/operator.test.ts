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

// @feature billing
describe("plan grants", () => {
  it("give an organization a plan for free until the operator takes it back", async () => {
    const operator = await owner("grant-operator@example.com");
    await env.DB.prepare('UPDATE "user" SET "role" = \'admin\' WHERE "id" = ?')
      .bind(operator.userId)
      .run();
    const org = await owner("grant-owner@example.com");
    const path = `/api/v1/operator/organizations/${org.organizationId}/plan`;
    const billing = () => json(call("/api/v1/billing", { cookie: org.cookie }));

    expect(
      (await call(path, { method: "PUT", cookie: org.cookie, json: { plan: "pro" } })).status,
    ).toBe(403);
    expect(await billing()).toMatchObject({ plan: "free", complimentary: false });

    await json(
      call(path, { method: "PUT", cookie: operator.cookie, json: { plan: "pro", note: "friend" } }),
    );
    expect(await billing()).toMatchObject({ plan: "pro", complimentary: true, subscription: null });
    const listed = await json<
      { id: string; grantedPlan: string | null; grantNote: string | null }[]
    >(call("/api/v1/operator/organizations", { cookie: operator.cookie }));
    expect(listed.find((one) => one.id === org.organizationId)).toMatchObject({
      grantedPlan: "pro",
      grantNote: "friend",
    });

    await json(call(path, { method: "DELETE", cookie: operator.cookie }));
    expect(await billing()).toMatchObject({ plan: "free", complimentary: false });
    expect((await call(path, { method: "DELETE", cookie: operator.cookie })).status).toBe(404);
    expect(
      (
        await call("/api/v1/operator/organizations/missing/plan", {
          method: "PUT",
          cookie: operator.cookie,
          json: { plan: "pro" },
        })
      ).status,
    ).toBe(404);
    expect(
      (await call(path, { method: "PUT", cookie: operator.cookie, json: { plan: "gold" } })).status,
    ).toBe(400);
  });

  it("win over the organization's subscription", async () => {
    const operator = await owner("grant-operator-2@example.com");
    await env.DB.prepare('UPDATE "user" SET "role" = \'admin\' WHERE "id" = ?')
      .bind(operator.userId)
      .run();
    const org = await owner("grant-subscriber@example.com");
    await env.DB.prepare(
      'INSERT INTO "subscription" ("id", "plan", "referenceId", "status") VALUES (?, ?, ?, ?)',
    )
      .bind(crypto.randomUUID(), "pro", org.organizationId, "active")
      .run();
    await json(
      call(`/api/v1/operator/organizations/${org.organizationId}/plan`, {
        method: "PUT",
        cookie: operator.cookie,
        json: { plan: "free" },
      }),
    );
    expect(await json(call("/api/v1/billing", { cookie: org.cookie }))).toMatchObject({
      plan: "free",
      complimentary: true,
      subscription: { status: "active" },
    });
  });
});
// @end billing
