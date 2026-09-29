import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { call, json, owner } from "./helpers";

describe("billing", () => {
  it("reports the free plan until a subscription is active", async () => {
    const { cookie, organizationId } = await owner("billing@example.com");
    expect(await json(call("/api/v1/billing", { cookie }))).toMatchObject({
      plan: "free",
      subscription: null,
    });
    await env.DB.prepare(
      'INSERT INTO "subscription" ("id", "plan", "referenceId", "status", "cancelAtPeriodEnd") VALUES (?, ?, ?, ?, ?)',
    )
      .bind(crypto.randomUUID(), "pro", organizationId, "active", 1)
      .run();
    expect(await json(call("/api/v1/billing", { cookie }))).toMatchObject({
      plan: "pro",
      limits: { projects: 100 },
      subscription: { status: "active", cancelAtPeriodEnd: true },
    });
  });

  it("rejects Stripe webhooks without a valid signature", async () => {
    const response = await call("/api/auth/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=invalid" },
      json: { type: "customer.subscription.updated" },
    });
    expect(response.status).toBe(400);
  });
});
