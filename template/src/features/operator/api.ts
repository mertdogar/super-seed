import * as z from "zod";

import {
  ApiError,
  // @feature billing
  Deleted,
  // @end billing
  defineRoute,
} from "@/api/route";
// @feature billing
import { activeStatuses } from "@/features/billing/limits";
import { plans } from "@/features/billing/plans";
// @end billing
import type { Db } from "@/lib/db";

const OperatorOrganization = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  ownerId: z.string().nullable(),
  ownerEmail: z.string().nullable(),
  memberCount: z.number(),
  // @feature billing
  subscribedPlan: z.string().nullable(),
  grantedPlan: z.string().nullable(),
  grantNote: z.string().nullable(),
  // @end billing
});

const params = z.object({ id: z.string() });

export const operatorRoutes = [
  defineRoute({
    internal: true,
    method: "GET",
    path: "/api/v1/operator/organizations",
    auth: "operator",
    response: z.array(OperatorOrganization),
    handler: ({ db }) =>
      db
        .selectFrom("organization as o")
        // @feature billing
        .leftJoin("planGrant as g", "g.organizationId", "o.id")
        // @end billing
        .select((eb) => [
          "o.id",
          "o.name",
          "o.slug",
          "o.createdAt",
          // @feature billing
          "g.plan as grantedPlan",
          "g.note as grantNote",
          eb
            .selectFrom("subscription as s")
            .select("s.plan")
            .whereRef("s.referenceId", "=", "o.id")
            .where("s.status", "in", activeStatuses)
            .limit(1)
            .as("subscribedPlan"),
          // @end billing
          eb
            .selectFrom("member as m")
            .select("m.userId")
            .whereRef("m.organizationId", "=", "o.id")
            .where("m.role", "=", "owner")
            .orderBy("m.createdAt")
            .limit(1)
            .as("ownerId"),
          eb
            .selectFrom("member as m")
            .innerJoin("user as u", "u.id", "m.userId")
            .select("u.email")
            .whereRef("m.organizationId", "=", "o.id")
            .where("m.role", "=", "owner")
            .orderBy("m.createdAt")
            .limit(1)
            .as("ownerEmail"),
          eb
            .selectFrom("member as m")
            .select((inner) => inner.fn.countAll<number>().as("count"))
            .whereRef("m.organizationId", "=", "o.id")
            .as("memberCount"),
        ])
        .orderBy("o.createdAt", "desc")
        .execute()
        .then((rows) => rows.map((row) => ({ ...row, memberCount: Number(row.memberCount ?? 0) }))),
  }),
  defineRoute({
    internal: true,
    method: "GET",
    path: "/api/v1/operator/organizations/{id}/members",
    auth: "operator",
    params,
    response: z.array(
      z.object({
        userId: z.string(),
        name: z.string(),
        email: z.string(),
        role: z.string(),
        createdAt: z.string(),
      }),
    ),
    errors: { organization_not_found: 404 },
    async handler({ params, db }) {
      await organizationOf(db, params.id);
      return db
        .selectFrom("member as m")
        .innerJoin("user as u", "u.id", "m.userId")
        .select(["m.userId", "u.name", "u.email", "m.role", "m.createdAt"])
        .where("m.organizationId", "=", params.id)
        .orderBy("m.createdAt")
        .execute();
    },
  }),
  // @feature api-keys
  defineRoute({
    internal: true,
    method: "POST",
    path: "/api/v1/operator/organizations/{id}/reset-api-key-usage",
    auth: "operator",
    params,
    response: z.object({ keys: z.number().int() }),
    async handler({ params, db }) {
      const result = await db
        .updateTable("apikey")
        .set({ requestCount: 0, lastRequest: null })
        .where("referenceId", "=", params.id)
        .executeTakeFirst();
      return { keys: Number(result.numUpdatedRows) };
    },
  }),
  // @end api-keys
  // @feature billing
  defineRoute({
    internal: true,
    method: "PUT",
    path: "/api/v1/operator/organizations/{id}/plan",
    auth: "operator",
    params,
    body: z.object({
      plan: z.enum(plans.map((plan) => plan.name)),
      note: z.string().trim().max(500).optional(),
    }),
    response: z.object({ plan: z.string() }),
    errors: { organization_not_found: 404 },
    async handler({ caller, params, body, db }) {
      await organizationOf(db, params.id);
      await db
        .insertInto("planGrant")
        .values({
          organizationId: params.id,
          plan: body.plan,
          grantedBy: caller.userId,
          note: body.note || null,
          createdAt: new Date().toISOString(),
        })
        .onConflict((oc) =>
          oc.column("organizationId").doUpdateSet({
            plan: body.plan,
            grantedBy: caller.userId,
            note: body.note || null,
            createdAt: new Date().toISOString(),
          }),
        )
        .execute();
      return { plan: body.plan };
    },
  }),
  defineRoute({
    internal: true,
    method: "DELETE",
    path: "/api/v1/operator/organizations/{id}/plan",
    auth: "operator",
    params,
    response: Deleted,
    errors: { grant_not_found: 404 },
    async handler({ params, db }) {
      const result = await db
        .deleteFrom("planGrant")
        .where("organizationId", "=", params.id)
        .executeTakeFirst();
      if (!result.numDeletedRows)
        throw new ApiError(404, "grant_not_found", "The organization has no granted plan.");
      return { deleted: true as const };
    },
  }),
  // @end billing
];

async function organizationOf(db: Db, id: string) {
  const organization = await db
    .selectFrom("organization")
    .select("id")
    .where("id", "=", id)
    .executeTakeFirst();
  if (!organization) throw new ApiError(404, "organization_not_found", "No such organization.");
}
