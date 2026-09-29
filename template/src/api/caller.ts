import type { Auth } from "@/lib/auth";
import { createDb } from "@/lib/db";

import { ApiError } from "./route";

export type Role = "owner" | "admin" | "member";

export type Actor =
  | { kind: "user"; userId: string; role: Role }
  // @feature api-keys
  | { kind: "apiKey"; keyId: string }
  // @end api-keys
  | never;

export type Tenant = { organizationId: string; actor: Actor };

export type Mode =
  | "none"
  | "user"
  | "tenant"
  | "orgAdmin"
  // @feature operator
  | "operator"
  // @end operator
  | never;

export type CallerFor<M extends Mode> = M extends "none"
  ? undefined
  : M extends "user" | "operator"
    ? { userId: string }
    : M extends "orgAdmin"
      ? { organizationId: string; actor: Extract<Actor, { kind: "user" }> }
      : Tenant;

// @feature api-keys
function bearer(request: Request) {
  const header = request.headers.get("Authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

async function resolveApiKey(key: string, auth: Auth): Promise<Tenant> {
  const verified = await auth.api.verifyApiKey({ body: { key } });
  if (!verified.valid || !verified.key) {
    // the plugin types message as either the string or the raw error carrying it
    const raw = verified.error?.message;
    const message = typeof raw === "string" ? raw : raw?.message;
    throw new ApiError(401, "unauthorized", message ?? "Invalid organization key");
  }
  return {
    organizationId: verified.key.referenceId,
    actor: { kind: "apiKey", keyId: verified.key.id },
  };
}
// @end api-keys

export async function resolveCaller<M extends Mode>(
  mode: M,
  request: Request,
  env: Env,
  auth: () => Auth,
): Promise<CallerFor<M>> {
  if (mode === "none") return undefined as CallerFor<M>;
  // @feature api-keys
  const key = bearer(request);
  if (key !== null) {
    if (mode !== "tenant")
      throw new ApiError(403, "forbidden", "Organization keys cannot use this route");
    return (await resolveApiKey(key, auth())) as CallerFor<M>;
  }
  // @end api-keys
  const session = await auth().api.getSession({ headers: request.headers });
  if (!session) throw new ApiError(401, "unauthorized", "Sign in to continue");
  const userId = session.user.id;
  if (mode === "user") return { userId } as CallerFor<M>;
  // @feature operator
  if (mode === "operator") {
    if (session.user.role !== "admin") throw new ApiError(403, "forbidden", "Operators only");
    return { userId } as CallerFor<M>;
  }
  // @end operator
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) throw new ApiError(403, "no_active_organization", "No active organization");
  const member = await createDb(env)
    .selectFrom("member")
    .select("role")
    .where("organizationId", "=", organizationId)
    .where("userId", "=", userId)
    .executeTakeFirst();
  if (!member) throw new ApiError(403, "no_active_organization", "No active organization");
  const role = member.role as Role;
  if (mode === "orgAdmin" && role === "member")
    throw new ApiError(403, "forbidden", "Only an owner or admin can use this route");
  return { organizationId, actor: { kind: "user", userId, role } } as CallerFor<M>;
}
