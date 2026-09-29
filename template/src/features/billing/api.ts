import * as z from "zod";

import { defineRoute } from "@/api/route";

import { activeStatuses } from "./limits";
import { planNamed } from "./plans";

const Billing = z
  .object({
    plan: z.string(),
    label: z.string(),
    limits: z.record(z.string(), z.number()),
    subscription: z
      .object({
        status: z.string(),
        periodEnd: z.string().nullable(),
        cancelAtPeriodEnd: z.boolean(),
      })
      .nullable(),
  })
  .meta({ id: "Billing" });

export const billingRoutes = [
  defineRoute({
    method: "GET",
    path: "/api/v1/billing",
    tag: "Billing",
    summary: "Get the organization's plan",
    auth: "tenant",
    response: Billing,
    async handler({ caller, db }) {
      const subscription = await db
        .selectFrom("subscription")
        .select(["plan", "status", "periodEnd", "cancelAtPeriodEnd"])
        .where("referenceId", "=", caller.organizationId)
        .where("status", "in", activeStatuses)
        .executeTakeFirst();
      const plan = planNamed(subscription?.plan);
      return {
        plan: plan.name,
        label: plan.label,
        limits: plan.limits,
        subscription: subscription
          ? {
              status: subscription.status,
              periodEnd: subscription.periodEnd,
              cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd),
            }
          : null,
      };
    },
  }),
];
