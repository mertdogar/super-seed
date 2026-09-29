import { describe, expect, it } from "vitest";

import { call, json, owner, password, signIn, signUp } from "./helpers";

describe("core routes", () => {
  it("answers the health check", async () => {
    expect(await json(call("/api/health"))).toEqual({ status: "ok" });
  });

  it("answers unknown API paths with the error envelope", async () => {
    const response = await call("/api/v1/nothing-here");
    expect(response.status).toBe(404);
  });
});

describe("accounts", () => {
  it("refuses to sign in before the email is verified", async () => {
    await json(
      call("/api/auth/sign-up/email", {
        method: "POST",
        json: { email: "unverified@example.com", password, name: "Unverified" },
      }),
    );
    const response = await call("/api/auth/sign-in/email", {
      method: "POST",
      json: { email: "unverified@example.com", password },
    });
    expect(response.status).toBe(403);
  });

  it("makes a new organization active on the session", async () => {
    const { cookie, organizationId } = await owner("founder@example.com");
    const session = await json<{ session: { activeOrganizationId: string } }>(
      call("/api/auth/get-session", { cookie }),
    );
    expect(session.session.activeOrganizationId).toBe(organizationId);
  });

  it("activates the first membership when a member signs in again", async () => {
    const { organizationId } = await owner("returning@example.com");
    const { cookie } = await signIn("returning@example.com");
    const session = await json<{ session: { activeOrganizationId: string | null } }>(
      call("/api/auth/get-session", { cookie }),
    );
    expect(session.session.activeOrganizationId).toBe(organizationId);
  });

  it("starts a user without memberships on no organization", async () => {
    const { cookie } = await signUp("loner@example.com");
    const session = await json<{ session: { activeOrganizationId: string | null } }>(
      call("/api/auth/get-session", { cookie }),
    );
    expect(session.session.activeOrganizationId).toBeNull();
  });
});
