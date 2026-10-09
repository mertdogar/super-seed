import { useQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi, notFound } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useImpersonate } from "@/features/operator/impersonate";
import {
  membersQuery,
  type OperatorOrganization,
  organizationsQuery,
  shortDate,
} from "@/features/operator/queries";
import { useAction } from "@/lib/use-action";

const authed = getRouteApi("/app/_authed");

export const Route = createFileRoute("/app/_authed/operator/organizations/$organizationId")({
  loader: async ({ context: { queryClient }, params }) => {
    const organizations = await queryClient.ensureQueryData(organizationsQuery);
    const organization = organizations.find((o) => o.id === params.organizationId);
    if (!organization) throw notFound();
    return organization;
  },
  component: OrganizationPage,
});

function OrganizationPage() {
  const organization = Route.useLoaderData();
  const { pending, error, run } = useAction();
  const impersonate = useImpersonate();

  return (
    <>
      <PageHeader
        title={organization.name}
        description={`/${organization.slug} · created ${shortDate(organization.createdAt)} · ${organization.memberCount} ${organization.memberCount === 1 ? "member" : "members"}`}
        actions={
          organization.ownerId && (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => run(() => impersonate(organization.ownerId!))}
            >
              Impersonate owner
            </Button>
          )
        }
      />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Members organization={organization} />
      </div>
    </>
  );
}

function Members({ organization }: { organization: OperatorOrganization }) {
  const { session } = authed.useRouteContext();
  const members = useQuery(membersQuery(organization.id));
  const impersonate = useImpersonate();
  const { pending, error, run } = useAction();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>Owned by {organization.ownerEmail ?? "nobody"}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.data?.map((member) => (
              <TableRow key={member.userId}>
                <TableCell>
                  <span className="block font-medium">{member.name}</span>
                  <span className="block text-xs text-muted-foreground">{member.email}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{member.role}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {shortDate(member.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending || member.userId === session.user.id}
                    onClick={() => run(() => impersonate(member.userId))}
                  >
                    Impersonate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
