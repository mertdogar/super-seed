import * as z from "zod";

import { ApiError, Deleted, defineRoute } from "@/api/route";
import type { Db } from "@/lib/db";
// @feature billing
import { assertWithinPlan } from "@/features/billing/limits";
// @end billing

const tag = "Projects";
const params = z.object({ id: z.string() });

export const Project = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    createdBy: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ id: "Project" });

const ProjectInput = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).nullable().optional(),
  })
  .meta({ id: "ProjectInput" });

const ProjectPage = z
  .object({ data: z.array(Project), nextCursor: z.string().nullable() })
  .meta({ id: "ProjectPage" });

const PageQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const columns = ["id", "name", "description", "createdBy", "createdAt", "updatedAt"] as const;

const notFound = () => new ApiError(404, "project_not_found", "Project not found");

function encodeCursor(row: { createdAt: string; id: string }) {
  return btoa(JSON.stringify([row.createdAt, row.id]));
}

function decodeCursor(cursor: string) {
  try {
    const [createdAt, id] = JSON.parse(atob(cursor)) as [string, string];
    if (typeof createdAt === "string" && typeof id === "string") return { createdAt, id };
  } catch {}
  throw new ApiError(400, "invalid_request", "Invalid cursor");
}

async function loadProject(db: Db, organizationId: string, id: string) {
  const row = await db
    .selectFrom("project")
    .select(columns)
    .where("organizationId", "=", organizationId)
    .where("id", "=", id)
    .executeTakeFirst();
  if (!row) throw notFound();
  return row;
}

export const projectRoutes = [
  defineRoute({
    method: "GET",
    path: "/api/v1/projects",
    tag,
    summary: "List projects",
    description: "Newest first. Page until `nextCursor` is null.",
    auth: "tenant",
    query: PageQuery,
    response: ProjectPage,
    async handler({ caller, query, db }) {
      let select = db
        .selectFrom("project")
        .select(columns)
        .where("organizationId", "=", caller.organizationId);
      if (query.cursor) {
        const after = decodeCursor(query.cursor);
        select = select.where((eb) =>
          eb.or([
            eb("createdAt", "<", after.createdAt),
            eb.and([eb("createdAt", "=", after.createdAt), eb("id", "<", after.id)]),
          ]),
        );
      }
      const rows = await select
        .orderBy("createdAt", "desc")
        .orderBy("id", "desc")
        .limit(query.limit + 1)
        .execute();
      const data = rows.slice(0, query.limit);
      return {
        data,
        nextCursor: rows.length > query.limit ? encodeCursor(data.at(-1)!) : null,
      };
    },
  }),
  defineRoute({
    method: "POST",
    path: "/api/v1/projects",
    tag,
    summary: "Create a project",
    auth: "tenant",
    body: ProjectInput,
    response: Project,
    status: 201,
    // @feature billing
    errors: { plan_limit_reached: 402 },
    // @end billing
    async handler({ caller, body, db }) {
      // @feature billing
      const { count } = await db
        .selectFrom("project")
        .select((eb) => eb.fn.countAll<number>().as("count"))
        .where("organizationId", "=", caller.organizationId)
        .executeTakeFirstOrThrow();
      await assertWithinPlan(db, caller.organizationId, "projects", count);
      // @end billing
      const now = new Date().toISOString();
      const project = {
        id: crypto.randomUUID(),
        name: body.name,
        description: body.description ?? null,
        createdBy: caller.actor.kind === "user" ? caller.actor.userId : null,
        createdAt: now,
        updatedAt: now,
      };
      await db
        .insertInto("project")
        .values({ ...project, organizationId: caller.organizationId })
        .execute();
      return project;
    },
  }),
  defineRoute({
    method: "GET",
    path: "/api/v1/projects/{id}",
    tag,
    summary: "Get a project",
    auth: "tenant",
    params,
    response: Project,
    errors: { project_not_found: 404 },
    handler: async ({ caller, params, db }) => loadProject(db, caller.organizationId, params.id),
  }),
  defineRoute({
    method: "PATCH",
    path: "/api/v1/projects/{id}",
    tag,
    summary: "Update a project",
    auth: "tenant",
    params,
    body: ProjectInput.partial(),
    response: Project,
    errors: { project_not_found: 404 },
    async handler({ caller, params, body, db }) {
      const result = await db
        .updateTable("project")
        .set({ ...body, updatedAt: new Date().toISOString() })
        .where("organizationId", "=", caller.organizationId)
        .where("id", "=", params.id)
        .executeTakeFirst();
      if (!result.numUpdatedRows) throw notFound();
      return loadProject(db, caller.organizationId, params.id);
    },
  }),
  defineRoute({
    method: "DELETE",
    path: "/api/v1/projects/{id}",
    tag,
    summary: "Delete a project",
    auth: "tenant",
    params,
    response: Deleted,
    errors: { project_not_found: 404 },
    async handler({ caller, params, db }) {
      const result = await db
        .deleteFrom("project")
        .where("organizationId", "=", caller.organizationId)
        .where("id", "=", params.id)
        .executeTakeFirst();
      if (!result.numDeletedRows) throw notFound();
      return { deleted: true as const };
    },
  }),
];
