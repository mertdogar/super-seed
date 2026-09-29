import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { call, json, owner } from "./helpers";

type Project = { id: string; name: string; description: string | null };
type Page = { data: Project[]; nextCursor: string | null };

function create(cookie: string, name: string) {
  return json<Project>(call("/api/v1/projects", { method: "POST", cookie, json: { name } }), 201);
}

describe("projects", () => {
  it("creates, reads, updates and deletes a project", async () => {
    const { cookie } = await owner("crud@example.com");
    const project = await create(cookie, "Launch");
    const path = `/api/v1/projects/${project.id}`;
    expect(await json<Project>(call(path, { cookie }))).toMatchObject({ name: "Launch" });
    const updated = await json<Project>(
      call(path, { method: "PATCH", cookie, json: { description: "Q4" } }),
    );
    expect(updated).toMatchObject({ name: "Launch", description: "Q4" });
    expect(await json(call(path, { method: "DELETE", cookie }))).toEqual({ deleted: true });
    expect(await json(call(path, { cookie }), 404)).toMatchObject({
      error: { code: "project_not_found" },
    });
  });

  it("rejects invalid input with the issues", async () => {
    const { cookie } = await owner("invalid@example.com");
    const body = await json(
      call("/api/v1/projects", { method: "POST", cookie, json: { name: "" } }),
      400,
    );
    expect(body.error.code).toBe("invalid_request");
    expect(body.error.details.issues[0].path).toEqual(["name"]);
  });

  it("pages newest first until nextCursor is null", async () => {
    const { cookie } = await owner("pages@example.com");
    for (const name of ["one", "two", "three"]) await create(cookie, name);
    const first = await json<Page>(call("/api/v1/projects?limit=2", { cookie }));
    expect(first.data.map((project) => project.name)).toEqual(["three", "two"]);
    const second = await json<Page>(
      call(`/api/v1/projects?limit=2&cursor=${encodeURIComponent(first.nextCursor!)}`, { cookie }),
    );
    expect(second).toMatchObject({ data: [{ name: "one" }], nextCursor: null });
    expect(await json(call("/api/v1/projects?cursor=nope", { cookie }), 400)).toMatchObject({
      error: { code: "invalid_request" },
    });
  });

  it("keeps each organization's projects invisible to the others", async () => {
    const alpha = await owner("alpha@example.com");
    const beta = await owner("beta@example.com");
    const project = await create(alpha.cookie, "Secret");
    const path = `/api/v1/projects/${project.id}`;
    for (const init of [
      { method: "GET" },
      { method: "PATCH", json: { name: "Taken" } },
      { method: "DELETE" },
    ])
      expect((await call(path, { ...init, cookie: beta.cookie })).status).toBe(404);
    expect(await json<Page>(call("/api/v1/projects", { cookie: beta.cookie }))).toEqual({
      data: [],
      nextCursor: null,
    });
    expect(await json<Project>(call(path, { cookie: alpha.cookie }))).toMatchObject({
      name: "Secret",
    });
  });

  // @feature billing
  it("stops at the free plan's limit until the organization subscribes", async () => {
    const { cookie, organizationId } = await owner("limits@example.com");
    for (const name of ["a", "b", "c"]) await create(cookie, name);
    expect(
      await json(call("/api/v1/projects", { method: "POST", cookie, json: { name: "d" } }), 402),
    ).toMatchObject({ error: { code: "plan_limit_reached", details: { limit: 3 } } });
    await env.DB.prepare(
      'INSERT INTO "subscription" ("id", "plan", "referenceId", "status") VALUES (?, ?, ?, ?)',
    )
      .bind(crypto.randomUUID(), "pro", organizationId, "active")
      .run();
    await create(cookie, "d");
  });
  // @end billing
});
