import { describe, expect, it } from "vitest";
import * as z from "zod";

import { ApiError, defineRawRoute, defineRoute, errorResponse, match, parse } from "@/api/route";

const item = defineRoute({
  method: "GET",
  path: "/api/v1/items/{id}",
  tag: "Items",
  summary: "Get an item",
  auth: "none",
  params: z.object({ id: z.string() }),
  response: z.object({ id: z.string() }),
  handler: async ({ params }) => params,
});

const files = defineRawRoute({
  internal: true,
  method: "GET",
  path: "/files/{path}",
  rest: true,
  auth: "none",
  handler: async () => new Response(),
});

describe("match", () => {
  it("extracts and decodes path parameters", () => {
    expect(match(item, "GET", "/api/v1/items/a%20b")).toEqual({ id: "a b" });
  });

  it("rejects a different method, length or literal segment", () => {
    expect(match(item, "POST", "/api/v1/items/1")).toBeNull();
    expect(match(item, "GET", "/api/v1/items/1/extra")).toBeNull();
    expect(match(item, "GET", "/api/v2/items/1")).toBeNull();
    expect(match(item, "GET", "/api/v1/items/")).toBeNull();
  });

  it("rejects malformed percent-encoding", () => {
    expect(match(item, "GET", "/api/v1/items/%E0%A4%A")).toBeNull();
  });

  it("gives a rest route the remainder of the path", () => {
    expect(match(files, "GET", "/files/a/b/c.txt")).toEqual({ path: "a/b/c.txt" });
  });
});

describe("errors", () => {
  it("turns a failed parse into invalid_request with every issue", () => {
    const schema = z.object({ name: z.string().min(1) });
    expect(() => parse(schema, { name: "" })).toThrow(ApiError);
    try {
      parse(schema, { name: "" });
    } catch (error) {
      expect(error).toMatchObject({
        status: 400,
        code: "invalid_request",
        details: { issues: [{ path: ["name"] }] },
      });
    }
  });

  it("answers an ApiError with the envelope and anything else with a bare 500", async () => {
    const known = errorResponse(new ApiError(409, "conflict", "Already exists", { id: "1" }));
    expect(known.status).toBe(409);
    expect(await known.json()).toEqual({
      error: { code: "conflict", message: "Already exists", details: { id: "1" } },
    });
    const bug = errorResponse(new Error("database password is hunter2"));
    expect(bug.status).toBe(500);
    expect(await bug.json()).toEqual({ error: { code: "internal", message: "Request failed" } });
  });
});
