import { describe, expect, it } from "vitest";

import { call, join, json, owner } from "./helpers";

type FullOrganization = { members: { user: { email: string }; role: string }[] };

describe("invitations", () => {
  it("adds an invited user to the organization with the invited role", async () => {
    const founder = await owner("inviter@example.com");
    const member = await join(founder, "invitee@example.com");
    const organization = await json<FullOrganization>(
      call("/api/auth/organization/get-full-organization", { cookie: member.cookie }),
    );
    expect(organization.members.map((one) => [one.user.email, one.role]).sort()).toEqual([
      ["invitee@example.com", "member"],
      ["inviter@example.com", "owner"],
    ]);
  });

  it("does not let a member invite others", async () => {
    const founder = await owner("strict-owner@example.com");
    const member = await join(founder, "strict-member@example.com");
    const response = await call("/api/auth/organization/invite-member", {
      method: "POST",
      cookie: member.cookie,
      json: { email: "friend@example.com", role: "member", organizationId: founder.organizationId },
    });
    expect(response.status).toBe(403);
  });
});
