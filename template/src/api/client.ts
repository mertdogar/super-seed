import { queryOptions } from "@tanstack/react-query";
import type * as z from "zod";

import type { routes } from "./routes";

type Callable = Exclude<(typeof routes)[number], { raw: true }>;

type Endpoints = { [R in Callable as `${R["method"]} ${R["path"]}`]: R };

export type Endpoint = keyof Endpoints;

type Field<S, K extends string> = [S] extends [z.ZodUndefined]
  ? {}
  : S extends z.ZodType
    ? undefined extends z.input<S>
      ? { [P in K]?: z.input<S> }
      : {} extends z.input<S>
        ? { [P in K]?: z.input<S> }
        : { [P in K]: z.input<S> }
    : {};

export type EndpointInput<K extends Endpoint> = Field<
  NonNullable<Endpoints[K]["params"]>,
  "params"
> &
  Field<NonNullable<Endpoints[K]["query"]>, "query"> &
  Field<NonNullable<Endpoints[K]["body"]>, "body">;

export type EndpointOutput<K extends Endpoint> = z.output<NonNullable<Endpoints[K]["response"]>>;

type Args<K extends Endpoint> =
  {} extends EndpointInput<K> ? [input?: EndpointInput<K>] : [input: EndpointInput<K>];

type LooseInput = {
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
};

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

function url(template: string, { params, query }: LooseInput) {
  const path = template.replace(/\{(\w+)\}/g, (_, name: string) =>
    encodeURIComponent(String(params?.[name])),
  );
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {}))
    if (value !== undefined) search.set(key, String(value));
  return search.size ? `${path}?${search}` : path;
}

export async function api<K extends Endpoint>(
  endpoint: K,
  ...[input]: Args<K>
): Promise<EndpointOutput<K>> {
  const [method, template] = endpoint.split(" ") as [string, string];
  const loose = (input ?? {}) as LooseInput;
  const hasBody = loose.body !== undefined;
  const response = await fetch(url(template, loose), {
    method,
    credentials: "same-origin",
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(loose.body) : undefined,
  });
  const data: unknown = await response.json().catch(() => null);
  if (response.ok) return data as EndpointOutput<K>;
  const error = (
    data as { error?: { code: string; message: string; details?: Record<string, unknown> } } | null
  )?.error;
  throw new ApiRequestError(
    response.status,
    error?.code ?? "request_failed",
    error?.message ?? `Request failed (${response.status})`,
    error?.details,
  );
}

type GetEndpoint = Extract<Endpoint, `GET ${string}`>;

export function apiQuery<K extends GetEndpoint>(endpoint: K, ...args: Args<K>) {
  return queryOptions({
    queryKey: [endpoint, args[0] ?? {}] as const,
    queryFn: () => api<K>(endpoint, ...args),
  });
}
