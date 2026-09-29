import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AuthCard } from "@/components/auth-card";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { authClient, unwrap } from "@/lib/auth-client";
import { organizationsQuery, resetSession } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { useAction } from "@/lib/use-action";

const invitationsQuery = queryOptions({
  queryKey: ["invitations"],
  queryFn: () => unwrap(authClient.organization.listUserInvitations()),
});

export const Route = createFileRoute("/app/_authed/welcome")({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(invitationsQuery),
      queryClient.ensureQueryData(organizationsQuery()),
    ]),
  component: Welcome,
});

function Welcome() {
  const { session } = Route.useRouteContext();
  const { data: invitations } = useSuspenseQuery(invitationsQuery);
  const { data: organizations } = useSuspenseQuery(organizationsQuery());
  const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();

  async function enter(action: Promise<{ error: { message?: string } | null }>) {
    const { error } = await action;
    if (error) throw new Error(error.message ?? "Request failed");
    resetSession(queryClient);
    await navigate({ to: "/app" });
  }

  return (
    <AuthCard
      title={`Welcome, ${session.user.name}`}
      description="Create an organization to get started, or join one you were invited to."
      error={error}
      pending={pending}
      submitLabel="Create organization"
      onSubmit={(form) =>
        run(async () => {
          const name = String(form.get("name")).trim();
          await enter(authClient.organization.create({ name, slug: slugify(name) }));
        })
      }
      footer={
        <button type="button" onClick={() => run(() => signOut())} className="underline">
          Sign out of {session.user.email}
        </button>
      }
    >
      {pendingInvitations.map((invitation) => (
        <div
          key={invitation.id}
          className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
        >
          <span>
            Join <strong>{invitation.organizationName}</strong> as {invitation.role}
          </span>
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() =>
              run(() =>
                enter(authClient.organization.acceptInvitation({ invitationId: invitation.id })),
              )
            }
          >
            Accept
          </Button>
        </div>
      ))}
      {organizations.map((organization) => (
        <div
          key={organization.id}
          className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
        >
          <strong>{organization.name}</strong>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(() =>
                enter(authClient.organization.setActive({ organizationId: organization.id })),
              )
            }
          >
            Open
          </Button>
        </div>
      ))}
      <Field label="Organization name" name="name" placeholder="Acme Inc." required />
    </AuthCard>
  );

  async function signOut() {
    await authClient.signOut();
    resetSession(queryClient);
    await navigate({ to: "/app/sign-in" });
  }
}
