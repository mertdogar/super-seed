import { queryOptions, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { apiQuery } from "@/api/client";
import { Brand } from "@/components/brand";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient, unwrap } from "@/lib/auth-client";
import { resetSession } from "@/lib/session";
import { useAction } from "@/lib/use-action";

const organizationsQuery = apiQuery("GET /api/v1/operator/organizations");

function usersQuery(search: string) {
  return queryOptions({
    queryKey: ["operator", "users", search],
    queryFn: () =>
      unwrap(
        authClient.admin.listUsers({
          query: {
            limit: 50,
            sortBy: "createdAt",
            sortDirection: "desc",
            ...(search ? { searchValue: search, searchField: "email" as const } : {}),
          },
        }),
      ),
  });
}

export const Route = createFileRoute("/app/_authed/operator")({
  beforeLoad: ({ context }) => {
    if (context.session.user.role !== "admin") throw redirect({ to: "/app" });
  },
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(organizationsQuery),
  component: Operator,
});

function Operator() {
  const { session } = Route.useRouteContext();
  const { data: organizations } = useSuspenseQuery(organizationsQuery);
  const [search, setSearch] = useState("");
  const users = useQuery(usersQuery(search));
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pending, error, run } = useAction();

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-10">
      <div className="flex items-center justify-between">
        <Brand />
        <Link to="/app" className="text-sm text-muted-foreground">
          Back to the dashboard
        </Link>
      </div>
      <PageHeader title="Operator" description="Every organization and user on the platform." />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <section className="space-y-3">
        <h2 className="font-semibold">Organizations</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((organization) => (
              <TableRow key={organization.id}>
                <TableCell className="font-medium">{organization.name}</TableCell>
                <TableCell>{organization.ownerEmail}</TableCell>
                <TableCell>{organization.memberCount}</TableCell>
                <TableCell>{new Date(organization.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">Users</h2>
          <Input
            placeholder="Search by email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-64"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.data?.users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.name} {user.role === "admin" && <Badge variant="secondary">operator</Badge>}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending || user.id === session.user.id}
                    onClick={() =>
                      run(async () => {
                        await unwrap(authClient.admin.impersonateUser({ userId: user.id }));
                        resetSession(queryClient);
                        await navigate({ to: "/app" });
                      })
                    }
                  >
                    Impersonate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
