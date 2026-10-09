import { useQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useState } from "react";

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
import { useImpersonate } from "@/features/operator/impersonate";
import { shortDate, usersQuery } from "@/features/operator/queries";
import { useAction } from "@/lib/use-action";

const authed = getRouteApi("/app/_authed");

export const Route = createFileRoute("/app/_authed/operator/users")({ component: UsersPage });

function UsersPage() {
  const { session } = authed.useRouteContext();
  const [search, setSearch] = useState("");
  const users = useQuery(usersQuery(search));
  const impersonate = useImpersonate();
  const { pending, error, run } = useAction();
  return (
    <>
      <PageHeader
        title="Users"
        description={`${users.data?.total ?? "…"} accounts.`}
        actions={
          <Input
            placeholder="Search by email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-64"
          />
        }
      />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.data?.users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                {user.role === "admin" ? <Badge variant="secondary">operator</Badge> : "member"}
              </TableCell>
              <TableCell className="text-muted-foreground">{shortDate(user.createdAt)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending || user.id === session.user.id}
                  onClick={() => run(() => impersonate(user.id))}
                >
                  Impersonate
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
