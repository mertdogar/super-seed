import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient, unwrap } from "@/lib/auth-client";
import { isAdmin } from "@/lib/session";
import { useAction } from "@/lib/use-action";

const roles = ["member", "admin", "owner"] as const;
type Role = (typeof roles)[number];

function organizationQuery(organizationId: string) {
  return queryOptions({
    queryKey: ["organizations", organizationId, "full"],
    queryFn: () =>
      unwrap(authClient.organization.getFullOrganization({ query: { organizationId } })),
  });
}

export const Route = createFileRoute("/app/_authed/_org/members")({
  loader: ({ context: { queryClient, organizationId } }) =>
    queryClient.ensureQueryData(organizationQuery(organizationId)),
  component: Members,
});

function Members() {
  const { organizationId, role, session } = Route.useRouteContext();
  const { data: organization } = useSuspenseQuery(organizationQuery(organizationId));
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const canManage = isAdmin(role);
  const invitations = organization?.invitations.filter((item) => item.status === "pending") ?? [];

  function act(action: () => Promise<{ error: { message?: string } | null }>) {
    return run(async () => {
      const { error } = await action();
      if (error) throw new Error(error.message ?? "Request failed");
      await queryClient.invalidateQueries({ queryKey: ["organizations", organizationId] });
    });
  }

  return (
    <>
      <PageHeader title="Members" description="Everyone who can sign in to this organization." />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Invite a teammate</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-wrap gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const email = String(new FormData(form).get("email"));
                void act(() =>
                  authClient.organization.inviteMember({ email, role: inviteRole, organizationId }),
                ).then(() => form.reset());
              }}
            >
              <Input
                name="email"
                type="email"
                placeholder="teammate@example.com"
                required
                className="min-w-60 flex-1"
              />
              <RoleSelect value={inviteRole} onChange={setInviteRole} />
              <Button type="submit" disabled={pending}>
                Send invitation
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            {canManage && <TableHead className="w-0" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {organization?.members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">{member.user.name}</TableCell>
              <TableCell>{member.user.email}</TableCell>
              <TableCell>
                {canManage && member.userId !== session.user.id ? (
                  <RoleSelect
                    value={member.role as Role}
                    onChange={(next) =>
                      act(() =>
                        authClient.organization.updateMemberRole({
                          memberId: member.id,
                          role: next,
                          organizationId,
                        }),
                      )
                    }
                  />
                ) : (
                  <Badge variant="secondary">{member.role}</Badge>
                )}
              </TableCell>
              {canManage && (
                <TableCell>
                  {member.userId !== session.user.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        act(() =>
                          authClient.organization.removeMember({
                            memberIdOrEmail: member.id,
                            organizationId,
                          }),
                        )
                      }
                    >
                      Remove
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
          {invitations.map((invitation) => (
            <TableRow key={invitation.id} className="text-muted-foreground">
              <TableCell>Invited</TableCell>
              <TableCell>{invitation.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{invitation.role}</Badge>
              </TableCell>
              {canManage && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      act(() =>
                        authClient.organization.cancelInvitation({ invitationId: invitation.id }),
                      )
                    }
                  >
                    Cancel
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

function RoleSelect({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as Role)}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role} value={role}>
            {role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
