import { describe, expect, it } from "vitest";

import { call, json } from "./helpers";

type Document = {
  openapi: string;
  paths: Record<string, Record<string, { security: unknown[] }>>;
  components: { securitySchemes: Record<string, unknown> };
};

describe("API reference", () => {
  it("serves an OpenAPI document of the public routes", async () => {
    const document = await json<Document>(call("/docs/openapi.json"));
    expect(document.openapi).toBe("3.1.0");
    expect(Object.keys(document.paths)).toContain("/api/health");
    // @feature projects
    expect(Object.keys(document.paths["/api/v1/projects"]!)).toEqual(["get", "post"]);
    // @end projects
    expect(Object.keys(document.paths).some((path) => path.startsWith("/api/auth"))).toBe(false);
    expect(Object.keys(document.components.securitySchemes)).toContain("session");
    // @feature api-keys
    expect(Object.keys(document.components.securitySchemes)).toContain("organizationKey");
    // @end api-keys
  });

  it("serves the reference page", async () => {
    const response = await call("/docs/api");
    expect(response.headers.get("Content-Type")).toContain("text/html");
    expect(await response.text()).toContain("/docs/openapi.json");
  });
});
