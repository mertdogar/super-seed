import {
  useQuery,
  // @feature billing
  useQueryClient,
  // @end billing
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, getRouteApi, notFound } from "@tanstack/react-router";

// @feature billing
import { api } from "@/api/client";
// @end billing
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// @feature billing
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// @end billing
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// @feature billing
import { planNamed, plans } from "@/features/billing/plans";
// @end billing
import { useImpersonate } from "@/features/operator/impersonate";
import {
  membersQuery,
  type OperatorOrganization,
  organizationsQuery,
  // @feature billing
  planOf,
  // @end billing
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
  const loaded = Route.useLoaderData();
  const { data: organizations } = useSuspenseQuery(organizationsQuery);
  const organization = organizations.find((o) => o.id === loaded.id) ?? loaded;
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
        {/* @feature billing */}
        <PlanCard organization={organization} />
        {/* @end billing */}
        <Members organization={organization} />
      </div>
    </>
  );
}

// @feature billing
/** The select value for "no grant: whatever the organization subscribes to". */
const subscribed = "subscribed";

function PlanCard({ organization }: { organization: OperatorOrganization }) {
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();
  const plan = planOf(organization);

  const setGrant = (value: string) =>
    run(async () => {
      if (value === subscribed) {
        await api("DELETE /api/v1/operator/organizations/{id}/plan", {
          params: { id: organization.id },
        });
      } else {
        const note = window.prompt(`Why does this organization get ${planNamed(value).label}?`);
        if (note === null) return;
        await api("PUT /api/v1/operator/organizations/{id}/plan", {
          params: { id: organization.id },
          body: { plan: value, note },
        });
      }
      await queryClient.invalidateQueries({ queryKey: organizationsQuery.queryKey });
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan</CardTitle>
        <CardDescription>
          {plan.granted
            ? `Granted ${plan.label}${organization.grantNote ? `: ${organization.grantNote}` : ""}`
            : organization.subscribedPlan
              ? `Subscribed to ${plan.label}`
              : "No subscription, on Free"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Select
          value={organization.grantedPlan ?? subscribed}
          disabled={pending}
          onValueChange={setGrant}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={subscribed}>
              {planNamed(organization.subscribedPlan).label}
              {organization.subscribedPlan ? " (subscribed)" : ""}
            </SelectItem>
            {plans.map((p) => (
              <SelectItem key={p.name} value={p.name}>
                {p.label} (granted)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
// @end billing

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
