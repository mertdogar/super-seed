import * as z from "zod";

import { ApiError, defineRoute } from "@/api/route";
import type { Db } from "@/lib/db";

const OperatorOrganization = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  ownerId: z.string().nullable(),
  ownerEmail: z.string().nullable(),
  memberCount: z.number(),
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
        .select((eb) => [
          "o.id",
          "o.name",
          "o.slug",
          "o.createdAt",
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
];

async function organizationOf(db: Db, id: string) {
  const organization = await db
    .selectFrom("organization")
    .select("id")
    .where("id", "=", id)
    .executeTakeFirst();
  if (!organization) throw new ApiError(404, "organization_not_found", "No such organization.");
}
