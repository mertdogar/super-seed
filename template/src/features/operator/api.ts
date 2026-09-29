import * as z from "zod";

import { defineRoute } from "@/api/route";

const OperatorOrganization = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  ownerEmail: z.string().nullable(),
  memberCount: z.number(),
});

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
];
