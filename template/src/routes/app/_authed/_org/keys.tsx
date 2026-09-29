import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { isAdmin } from "@/lib/session";
import { useAction } from "@/lib/use-action";

function keysQuery(organizationId: string) {
  return queryOptions({
    queryKey: ["organizations", organizationId, "api-keys"],
    queryFn: async () => {
      const result = await unwrap(authClient.apiKey.list({ query: { organizationId } }));
      return result.apiKeys;
    },
  });
}

export const Route = createFileRoute("/app/_authed/_org/keys")({
  beforeLoad: ({ context }) => {
    if (!isAdmin(context.role)) throw redirect({ to: "/app" });
  },
  loader: ({ context: { queryClient, organizationId } }) =>
    queryClient.ensureQueryData(keysQuery(organizationId)),
  component: Keys,
});

function Keys() {
  const { organizationId } = Route.useRouteContext();
  const { data: keys } = useSuspenseQuery(keysQuery(organizationId));
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();
  const [created, setCreated] = useState<string | null>(null);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: keysQuery(organizationId).queryKey });

  return (
    <>
      <PageHeader
        title="API keys"
        description={
          <>
            Organization keys call the API as this organization. Send one as{" "}
            <code>Authorization: Bearer &lt;key&gt;</code>.
          </>
        }
      />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {created && (
        <Alert>
          <AlertTitle>Copy your new key now. You won't see it again.</AlertTitle>
          <AlertDescription>
            <code className="break-all">{created}</code>
          </AlertDescription>
        </Alert>
      )}
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const name = String(new FormData(form).get("name"));
          void run(async () => {
            const key = await unwrap(authClient.apiKey.create({ name, organizationId }));
            setCreated(key.key);
            form.reset();
            await refresh();
          });
        }}
      >
        <Input name="name" placeholder="Key name, e.g. Production backend" required />
        <Button type="submit" disabled={pending}>
          Create key
        </Button>
      </form>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((key) => (
            <TableRow key={key.id}>
              <TableCell className="font-medium">{key.name}</TableCell>
              <TableCell className="font-mono text-muted-foreground">{key.start}…</TableCell>
              <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      await unwrap(authClient.apiKey.delete({ keyId: key.id }));
                      await refresh();
                    })
                  }
                >
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
