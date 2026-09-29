import { env, exports } from "cloudflare:workers";
import { expect } from "vitest";

export const origin = "https://example.com";
export const password = "correct-horse-battery";

export type Client = { cookie: string; userId: string };

export function call(path: string, init: RequestInit & { json?: unknown; cookie?: string } = {}) {
  const headers = new Headers(init.headers);
  headers.set("Origin", origin);
  if (init.cookie) headers.set("Cookie", init.cookie);
  if (init.json !== undefined) headers.set("Content-Type", "application/json");
  return exports.default.fetch(
    new Request(`${origin}${path}`, {
      ...init,
      headers,
      body: init.json === undefined ? init.body : JSON.stringify(init.json),
    }),
  );
}

export async function json<T = any>(response: Response | Promise<Response>, status = 200) {
  const resolved = await response;
  const body = (await resolved.json()) as T;
  expect(resolved.status, JSON.stringify(body)).toBe(status);
  return body;
}

function cookies(response: Response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

export async function signUp(email: string, name = email.split("@")[0]!): Promise<Client> {
  const created = await json<{ user: { id: string } }>(
    call("/api/auth/sign-up/email", { method: "POST", json: { email, password, name } }),
  );
  await env.DB.prepare('UPDATE "user" SET "emailVerified" = 1 WHERE "id" = ?')
    .bind(created.user.id)
    .run();
  return signIn(email);
}

export async function signIn(email: string): Promise<Client> {
  const response = await call("/api/auth/sign-in/email", {
    method: "POST",
    json: { email, password },
  });
  const body = await json<{ user: { id: string } }>(response);
  return { cookie: cookies(response), userId: body.user.id };
}

/** Signs up a verified user who owns a new organization, which is active on the returned session. */
export async function owner(email: string) {
  const client = await signUp(email);
  const organization = await json<{ id: string }>(
    call("/api/auth/organization/create", {
      method: "POST",
      cookie: client.cookie,
      json: { name: `${email} org`, slug: crypto.randomUUID() },
    }),
  );
  return { ...client, organizationId: organization.id };
}

/** Invites `email` into the owner's organization and returns the new member, signed in with it active. */
export async function join(
  inviter: { cookie: string; organizationId: string },
  email: string,
  role: "member" | "admin" = "member",
) {
  const invitation = await json<{ id: string }>(
    call("/api/auth/organization/invite-member", {
      method: "POST",
      cookie: inviter.cookie,
      json: { email, role, organizationId: inviter.organizationId },
    }),
  );
  const member = await signUp(email);
  await json(
    call("/api/auth/organization/accept-invitation", {
      method: "POST",
      cookie: member.cookie,
      json: { invitationId: invitation.id },
    }),
  );
  return { ...member, organizationId: inviter.organizationId };
}
