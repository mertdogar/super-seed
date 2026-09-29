import * as z from "zod";

import type { Auth } from "@/lib/auth";
import type { Db } from "@/lib/db";

import type { CallerFor, Mode } from "./caller";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}

export const Deleted = z.object({ deleted: z.literal(true) }).meta({ id: "Deleted" });

export const methods = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

export type Method = (typeof methods)[number];

type Input<M extends Mode, P, Q, B> = {
  caller: CallerFor<M>;
  params: z.output<P>;
  query: z.output<Q>;
  body: z.output<B>;
  request: Request;
  responseHeaders: Headers;
  auth: Auth;
  db: Db;
  env: Env;
  ctx: ExecutionContext;
};

type Spec<R> =
  | { internal?: undefined; tag: string; summary: string; description?: string; response: R }
  | {
      internal: true;
      tag?: undefined;
      summary?: undefined;
      description?: undefined;
      response?: R;
    };

type Entry<M extends Mode, V extends Method, T extends string, P, Q, B> = {
  method: V;
  path: T;
  auth: M;
  params?: P;
  query?: Q;
  body?: B;
  status?: 200 | 201;
  errors?: Record<string, number>;
};

export type Route<
  M extends Mode,
  V extends Method,
  T extends string,
  P extends z.ZodType,
  Q extends z.ZodType,
  B extends z.ZodType,
  R extends z.ZodType,
> = Entry<M, V, T, P, Q, B> &
  Spec<R> & {
    raw?: undefined;
    handler(input: Input<M, P, Q, B>): Promise<z.output<R>>;
  };

type RawEntry<
  M extends Mode,
  V extends Method,
  T extends string,
  P extends z.ZodType,
  Q extends z.ZodType,
> = Entry<M, V, T, P, Q, z.ZodType> &
  Spec<z.ZodType> & {
    rest?: true;
    mediaType?: string;
    handler(input: Input<M, P, Q, z.ZodUndefined>): Promise<Response>;
  };

export type RawRoute<
  M extends Mode,
  V extends Method,
  T extends string,
  P extends z.ZodType,
  Q extends z.ZodType,
> = RawEntry<M, V, T, P, Q> & { raw: true };

export type AnyRoute =
  | Route<Mode, Method, string, any, any, any, any>
  | RawRoute<Mode, Method, string, any, any>;

export type PublicRoute = Exclude<AnyRoute, { internal: true }>;

export function defineRoute<
  M extends Mode,
  const V extends Method,
  const T extends `/${string}`,
  R extends z.ZodType,
  P extends z.ZodType = z.ZodUndefined,
  Q extends z.ZodType = z.ZodUndefined,
  B extends z.ZodType = z.ZodUndefined,
>(route: Route<M, V, T, P, Q, B, R>) {
  return route;
}

export function defineRawRoute<
  M extends Mode,
  const V extends Method,
  const T extends `/${string}`,
  P extends z.ZodType = z.ZodUndefined,
  Q extends z.ZodType = z.ZodUndefined,
>(route: RawEntry<M, V, T, P, Q>): RawRoute<M, V, T, P, Q> {
  return { ...route, raw: true };
}

function segment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function match(route: AnyRoute, method: string, pathname: string) {
  const pattern = route.path.split("/");
  const parts = pathname.split("/");
  const rest = route.raw && route.rest;
  if (route.method !== method) return null;
  if (rest ? parts.length < pattern.length : parts.length !== pattern.length) return null;
  const params: Record<string, string> = {};
  for (const [index, expected] of pattern.entries()) {
    const part = parts[index]!;
    if (!expected.startsWith("{")) {
      if (part !== expected) return null;
      continue;
    }
    if (rest && index === pattern.length - 1) {
      params[expected.slice(1, -1)] = parts.slice(index).join("/");
      break;
    }
    const value = part ? segment(part) : null;
    if (!value) return null;
    params[expected.slice(1, -1)] = value;
  }
  return params;
}

export function parse<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const issues = result.error.issues.map(({ path, message }) => ({ path, message }));
  throw new ApiError(400, "invalid_request", issues[0]!.message, { issues });
}

export async function readJson(request: Request) {
  const text = await request.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(400, "invalid_request", "Request body must be JSON");
  }
}

export async function parseInput(
  route: AnyRoute,
  params: Record<string, string>,
  url: URL,
  request: Request,
) {
  return {
    params: route.params ? parse(route.params, params) : undefined,
    query: route.query ? parse(route.query, Object.fromEntries(url.searchParams)) : undefined,
    body: route.body && !route.raw ? parse(route.body, await readJson(request)) : undefined,
  };
}

export function errorBody({ code, message, details }: ApiError) {
  return { error: { code, message, ...(details ? { details } : {}) } };
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) return json(errorBody(error), error.status);
  console.error({ error: error instanceof Error ? error.message : String(error) });
  return json({ error: { code: "internal", message: "Request failed" } }, 500);
}
