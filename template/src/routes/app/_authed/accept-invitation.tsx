import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as z from "zod";

import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { authClient, unwrap } from "@/lib/auth-client";
import { resetSession } from "@/lib/session";
import { useAction } from "@/lib/use-action";
import { errorMessage } from "@/lib/utils";

function invitationQuery(id: string) {
  return queryOptions({
    queryKey: ["invitations", id],
    queryFn: () => unwrap(authClient.organization.getInvitation({ query: { id } })),
  });
}

export const Route = createFileRoute("/app/_authed/accept-invitation")({
  validateSearch: z.object({ id: z.string().catch("") }),
  loaderDeps: ({ search: { id } }) => ({ id }),
  loader: ({ context: { queryClient }, deps: { id } }) =>
    queryClient.ensureQueryData(invitationQuery(id)),
  component: AcceptInvitation,
  errorComponent: ({ error }) => (
    <AuthCard
      title="This invitation can't be used"
      description={errorMessage(error)}
      footer={
        <Link to="/app" className="font-medium text-foreground">
          Go to the dashboard
        </Link>
      }
    />
  ),
});

function AcceptInvitation() {
  const { id } = Route.useSearch();
  const { data: invitation } = useSuspenseQuery(invitationQuery(id));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();

  function respond(accept: boolean) {
    return run(async () => {
      const { error } = accept
        ? await authClient.organization.acceptInvitation({ invitationId: id })
        : await authClient.organization.rejectInvitation({ invitationId: id });
      if (error) throw new Error(error.message ?? "Request failed");
      resetSession(queryClient);
      await navigate({ to: "/app" });
    });
  }

  return (
    <AuthCard
      title={`Join ${invitation.organizationName}`}
      description={`${invitation.inviterEmail} invited you to join as ${invitation.role}.`}
      error={error}
    >
      <div className="flex gap-2">
        <Button type="button" className="flex-1" disabled={pending} onClick={() => respond(true)}>
          Accept
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={pending}
          onClick={() => respond(false)}
        >
          Decline
        </Button>
      </div>
    </AuthCard>
  );
}
