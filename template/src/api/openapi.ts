import * as z from "zod";
import { createDocument, type ZodOpenApiPathsObject } from "zod-openapi";

import { site } from "@/site";

import type { Mode } from "./caller";
import type { AnyRoute, PublicRoute } from "./route";

const ErrorBody = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.string(), z.unknown()).optional(),
    }),
  })
  .meta({ id: "Error" });

const security: Record<Mode, Record<string, string[]>[]> = {
  none: [],
  user: [{ session: [] }],
  tenant: [
    // @feature api-keys
    { organizationKey: [] },
    // @end api-keys
    { session: [] },
  ],
  orgAdmin: [{ session: [] }],
  // @feature operator
  operator: [{ session: [] }],
  // @end operator
};

const callerErrors: Record<Exclude<Mode, "none">, Record<string, number>> = {
  user: { unauthorized: 401 },
  tenant: { unauthorized: 401, no_active_organization: 403, forbidden: 403 },
  orgAdmin: { unauthorized: 401, no_active_organization: 403, forbidden: 403 },
  // @feature operator
  operator: { unauthorized: 401, forbidden: 403 },
  // @end operator
};

function errors(route: PublicRoute) {
  const codes = {
    ...(route.auth === "none" ? {} : callerErrors[route.auth]),
    ...(!route.raw && (route.params || route.query || route.body) ? { invalid_request: 400 } : {}),
    ...route.errors,
  };
  const byStatus: Record<number, string[]> = {};
  for (const [code, status] of Object.entries(codes)) (byStatus[status] ??= []).push(code);
  return Object.fromEntries(
    Object.entries(byStatus).map(([status, list]) => [
      status,
      {
        description: list.map((code) => "`" + code + "`").join(", "),
        content: { "application/json": { schema: ErrorBody } },
      },
    ]),
  );
}

function operation(route: PublicRoute) {
  const mediaType = (route.raw && route.mediaType) || "application/json";
  return {
    tags: [route.tag],
    summary: route.summary,
    description: route.description,
    security: security[route.auth],
    requestParams: {
      ...(route.params ? { path: route.params } : {}),
      ...(route.query ? { query: route.query } : {}),
    },
    ...(route.body ? { requestBody: { content: { [mediaType]: { schema: route.body } } } } : {}),
    responses: {
      [route.status ?? 200]: {
        description: route.status === 201 ? "Created" : "OK",
        content: { [mediaType]: { schema: route.response } },
      },
      ...errors(route),
    },
  };
}

export function openApiDocument(routes: readonly AnyRoute[]) {
  const paths: ZodOpenApiPathsObject = {};
  for (const route of routes.filter((route): route is PublicRoute => !route.internal))
    paths[route.path] = { ...paths[route.path], [route.method.toLowerCase()]: operation(route) };
  return createDocument({
    openapi: "3.1.0",
    info: { title: `${site.name} API`, version: "1", description: site.description },
    servers: [{ url: "/" }],
    paths,
    components: {
      securitySchemes: {
        // @feature api-keys
        organizationKey: {
          type: "http",
          scheme: "bearer",
          description: "An organization key, `ss_…`, created on the API keys page.",
        },
        // @end api-keys
        session: {
          type: "apiKey",
          in: "cookie",
          name: "__Secure-better-auth.session_token",
          description: "A signed-in dashboard session cookie.",
        },
      },
    },
  });
}
