import * as z from "zod";

import { defineRawRoute, defineRoute, methods } from "./route";

export const authRoutes = methods.map((method) =>
  defineRawRoute({
    internal: true,
    method,
    path: "/api/auth/{path}",
    rest: true,
    auth: "none",
    handler: ({ auth, request }) => auth.handler(request),
  }),
);

export const healthRoutes = [
  defineRoute({
    method: "GET",
    path: "/api/health",
    tag: "Health",
    summary: "Check the service",
    auth: "none",
    response: z.object({ status: z.literal("ok") }),
    handler: async () => ({ status: "ok" as const }),
  }),
];
