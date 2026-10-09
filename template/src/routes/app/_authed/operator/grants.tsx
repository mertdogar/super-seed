import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { api } from "@/api/client";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { planNamed } from "@/features/billing/plans";
import { organizationsQuery, planOf } from "@/features/operator/queries";
import { useAction } from "@/lib/use-action";

export const Route = createFileRoute("/app/_authed/operator/grants")({ component: Grants });

function Grants() {
  const { data: organizations } = useSuspenseQuery(organizationsQuery);
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();
  const rows = organizations.filter((o) => o.grantedPlan);
  const revoke = (id: string) =>
    run(async () => {
      await api("DELETE /api/v1/operator/organizations/{id}/plan", { params: { id } });
      await queryClient.invalidateQueries({ queryKey: organizationsQuery.queryKey });
    });
  return (
    <>
      <PageHeader
        title="Plan grants"
        description="Organizations whose plan an operator set by hand."
      />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Granted</TableHead>
            <TableHead>Would pay for</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                <Link
                  to="/app/operator/organizations/$organizationId"
                  params={{ organizationId: o.id }}
                  className="font-medium hover:underline"
                >
                  {o.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge>{planOf(o).label}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {o.subscribedPlan ? planNamed(o.subscribedPlan).label : "Nothing"}
              </TableCell>
              <TableCell className="whitespace-normal text-muted-foreground">
                {o.grantNote}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" disabled={pending} onClick={() => revoke(o.id)}>
                  Revoke
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
