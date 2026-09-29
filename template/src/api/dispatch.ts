import { type Auth, createAuth } from "@/lib/auth";
import { createDb, type Db } from "@/lib/db";

import { resolveCaller } from "./caller";
import { errorResponse, json, match, parseInput } from "./route";
import { routes } from "./routes";

export async function dispatch(request: Request, env: Env, ctx: ExecutionContext) {
  const url = new URL(request.url);
  for (const route of routes) {
    const params = match(route, request.method, url.pathname);
    if (!params) continue;
    try {
      // a Better Auth instance left unawaited when its request ends hangs later requests
      let auth: Auth | undefined;
      let db: Db | undefined;
      const getAuth = () => (auth ??= createAuth(env, request.url));
      const caller = await resolveCaller(route.auth, request, env, getAuth);
      const input = await parseInput(route, params, url, request);
      const responseHeaders = new Headers();
      const result = await route.handler({
        ...input,
        caller,
        request,
        responseHeaders,
        get auth() {
          return getAuth();
        },
        get db() {
          return (db ??= createDb(env));
        },
        env,
        ctx,
      } as never);
      if (route.raw) return result as Response;
      const response = json(result, route.status);
      responseHeaders.forEach((value, name) => response.headers.set(name, value));
      return response;
    } catch (error) {
      return errorResponse(error);
    }
  }
  return null;
}
