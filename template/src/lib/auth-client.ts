// @feature api-keys
import { apiKeyClient } from "@better-auth/api-key/client";
// @end api-keys
// @feature billing
import { stripeClient } from "@better-auth/stripe/client";
// @end billing
import { organizationClient } from "better-auth/client/plugins";
// @feature operator
import { adminClient } from "better-auth/client/plugins";
// @end operator
import { createAuthClient } from "better-auth/react";

import { ac, roles } from "./access";

export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [
    organizationClient({ ac, roles }),
    // @feature operator
    adminClient(),
    // @end operator
    // @feature api-keys
    apiKeyClient(),
    // @end api-keys
    // @feature billing
    stripeClient({ subscription: true }),
    // @end billing
  ],
});

export type Session = typeof authClient.$Infer.Session;

type Result<T> = { data: T | null; error: { message?: string; status: number } | null };

export async function unwrap<T>(call: Promise<Result<T>>): Promise<T> {
  const { data, error } = await call;
  if (error) throw new Error(error.message ?? `Request failed (${error.status})`);
  return data as T;
}
