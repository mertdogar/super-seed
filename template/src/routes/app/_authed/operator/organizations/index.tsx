import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { organizationsQuery, shortDate } from "@/features/operator/queries";

export const Route = createFileRoute("/app/_authed/operator/organizations/")({
  component: Organizations,
});

function Organizations() {
  const { data: organizations } = useSuspenseQuery(organizationsQuery);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const q = search.toLowerCase();
  const rows = organizations.filter(
    (o) => o.name.toLowerCase().includes(q) || (o.ownerEmail ?? "").toLowerCase().includes(q),
  );
  return (
    <>
      <PageHeader
        title="Organizations"
        description={`${organizations.length} on the platform.`}
        actions={
          <Input
            placeholder="Search name or owner"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-64"
          />
        }
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead className="text-right">Members</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((o) => (
            <TableRow
              key={o.id}
              className="cursor-pointer"
              onClick={() =>
                navigate({
                  to: "/app/operator/organizations/$organizationId",
                  params: { organizationId: o.id },
                })
              }
            >
              <TableCell className="font-medium">{o.name}</TableCell>
              <TableCell className="text-muted-foreground">{o.ownerEmail ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{o.memberCount}</TableCell>
              <TableCell className="text-muted-foreground">{shortDate(o.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
