import * as z from "zod";

import { defineRoute } from "@/api/route";

import {
  activeStatuses,
  currentPlan,
  // @feature operator
  planGrant,
  // @end operator
} from "./limits";

const Billing = z
  .object({
    plan: z.string(),
    label: z.string(),
    // @feature operator
    complimentary: z.boolean().meta({
      description: "Whether an operator granted the plan for free, instead of a subscription.",
    }),
    // @end operator
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
      const [plan, subscription] = await Promise.all([
        currentPlan(db, caller.organizationId),
        db
          .selectFrom("subscription")
          .select(["status", "periodEnd", "cancelAtPeriodEnd"])
          .where("referenceId", "=", caller.organizationId)
          .where("status", "in", activeStatuses)
          .executeTakeFirst(),
      ]);
      return {
        plan: plan.name,
        label: plan.label,
        // @feature operator
        complimentary: (await planGrant(db, caller.organizationId)) !== undefined,
        // @end operator
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
