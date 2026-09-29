import { afterEach, describe, expect, it, vi } from "vitest";

import { api, ApiRequestError } from "@/api/client";

function stubFetch(status: number, body: unknown) {
  const fetch = vi.fn(async (_url: string, _init: RequestInit) => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => vi.unstubAllGlobals());

describe("typed client", () => {
  it("fills path parameters, encodes the query and returns the body", async () => {
    const fetch = stubFetch(200, { status: "ok" });
    expect(await api("GET /api/health")).toEqual({ status: "ok" });
    expect(fetch.mock.calls[0]![0]).toBe("/api/health");
  });

  // @feature projects
  it("sends path, query and JSON body", async () => {
    const fetch = stubFetch(200, {});
    await api("GET /api/v1/projects/{id}", { params: { id: "a/b" } });
    await api("GET /api/v1/projects", { query: { limit: 5, cursor: undefined } });
    await api("POST /api/v1/projects", { body: { name: "Launch" } });
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      "/api/v1/projects/a%2Fb",
      "/api/v1/projects?limit=5",
      "/api/v1/projects",
    ]);
    expect(fetch.mock.calls[2]![1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ name: "Launch" }),
    });
  });
  // @end projects

  it("throws the error envelope as an ApiRequestError", async () => {
    stubFetch(402, {
      error: { code: "plan_limit_reached", message: "Upgrade", details: { limit: 3 } },
    });
    await expect(api("GET /api/health")).rejects.toEqual(
      new ApiRequestError(402, "plan_limit_reached", "Upgrade", { limit: 3 }),
    );
  });
});
