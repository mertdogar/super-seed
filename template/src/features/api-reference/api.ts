import { openApiDocument } from "@/api/openapi";
import { routes } from "@/api/routes";
import { defineRawRoute } from "@/api/route";
import { site } from "@/site";

const scalarBundle = "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.72.1/esm.js";

const config = {
  url: "/docs/openapi.json",
  theme: "default",
  agent: { disabled: true },
  mcp: { disabled: true },
  showDeveloperTools: "never",
  persistAuth: false,
};

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>API reference · ${site.name}</title></head><body><div id="app"></div><script type="module">
import { createApiReference } from "${scalarBundle}";
createApiReference("#app", ${JSON.stringify(config)});
</script></body></html>`;

export const apiReferenceRoutes = [
  defineRawRoute({
    internal: true,
    method: "GET",
    path: "/docs/api",
    auth: "none",
    handler: async () =>
      new Response(page, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
  }),
  defineRawRoute({
    internal: true,
    method: "GET",
    path: "/docs/openapi.json",
    auth: "none",
    async handler(): Promise<Response> {
      return Response.json(openApiDocument(routes), {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    },
  }),
];
