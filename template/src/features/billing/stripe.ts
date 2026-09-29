import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";

import type { Db } from "@/lib/db";

import { plans } from "./plans";

export function stripePlugin(env: Env, db: Db) {
  return stripe({
    // the SDK throws on an empty key; a placeholder keeps sign-in working and makes Stripe reject billing calls
    stripeClient: new Stripe(env.STRIPE_SECRET_KEY || "sk_test_unconfigured", {
      httpClient: Stripe.createFetchHttpClient(),
    }),
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
    organization: { enabled: true },
    subscription: {
      enabled: true,
      plans: plans
        .filter((plan) => plan.lookupKey)
        .map(({ name, lookupKey, limits }) => ({ name, lookupKey, limits })),
      authorizeReference: async ({ user, referenceId }) => {
        const member = await db
          .selectFrom("member")
          .select("role")
          .where("organizationId", "=", referenceId)
          .where("userId", "=", user.id)
          .executeTakeFirst();
        return member?.role === "owner" || member?.role === "admin";
      },
    },
  });
}
