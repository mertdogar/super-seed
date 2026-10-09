import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { organizationsQuery, shortDate, usersQuery } from "@/features/operator/queries";

export const Route = createFileRoute("/app/_authed/operator/")({ component: Overview });

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="gap-1 py-4">
      <CardHeader className="px-4">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint && <CardContent className="px-4 text-xs text-muted-foreground">{hint}</CardContent>}
    </Card>
  );
}

function Overview() {
  const { data: organizations } = useSuspenseQuery(organizationsQuery);
  const users = useQuery(usersQuery());
  return (
    <>
      <PageHeader title="Overview" description="The platform at a glance." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Organizations" value={organizations.length} />
        <Stat label="Users" value={users.data?.total ?? "…"} />
        {/* @feature billing */}
        <Stat
          label="Granted plans"
          value={organizations.filter((o) => o.grantedPlan).length}
          hint="Plans an operator set by hand"
        />
        {/* @end billing */}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Newest organizations</CardTitle>
          </CardHeader>
          <CardContent className="divide-y text-sm">
            {organizations.slice(0, 6).map((o) => (
              <Link
                key={o.id}
                to="/app/operator/organizations/$organizationId"
                params={{ organizationId: o.id }}
                className="flex items-center justify-between gap-3 py-2 hover:text-foreground"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{o.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {o.ownerEmail ?? "no owner"}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">{shortDate(o.createdAt)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Newest users</CardTitle>
          </CardHeader>
          <CardContent className="divide-y text-sm">
            {users.data?.users.slice(0, 6).map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{u.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                </span>
                <span className="text-xs text-muted-foreground">{shortDate(u.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
