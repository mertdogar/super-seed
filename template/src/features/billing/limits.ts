import { ApiError } from "@/api/route";
import type { Db } from "@/lib/db";

import { type Limits, planNamed } from "./plans";

export const activeStatuses = ["active", "trialing"];

export async function currentPlan(db: Db, organizationId: string) {
  const subscription = await db
    .selectFrom("subscription")
    .select("plan")
    .where("referenceId", "=", organizationId)
    .where("status", "in", activeStatuses)
    .executeTakeFirst();
  return planNamed(subscription?.plan);
}

export async function assertWithinPlan(
  db: Db,
  organizationId: string,
  resource: keyof Limits,
  used: number,
) {
  const plan = await currentPlan(db, organizationId);
  const limit = plan.limits[resource];
  if (used < limit) return;
  throw new ApiError(
    402,
    "plan_limit_reached",
    `The ${plan.label} plan includes ${limit} ${resource}. Upgrade to add more.`,
    { resource, limit },
  );
}
