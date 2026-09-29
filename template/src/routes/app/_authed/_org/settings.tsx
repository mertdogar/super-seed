import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { FormEvent, ReactNode } from "react";
import { toast } from "sonner";

import { Field } from "@/components/field";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { isAdmin, organizationsQuery, sessionQuery } from "@/lib/session";
import { useAction } from "@/lib/use-action";

export const Route = createFileRoute("/app/_authed/_org/settings")({ component: Settings });

function Settings() {
  const { organizationId, role, session } = Route.useRouteContext();
  const { data: organizations = [] } = useQuery(organizationsQuery());
  const organization = organizations.find((item) => item.id === organizationId);
  const queryClient = useQueryClient();

  return (
    <>
      <PageHeader title="Settings" />
      {isAdmin(role) && organization && (
        <SettingsCard
          key={organization.id}
          title="Organization"
          description="The name your teammates see."
          onSave={async (form) => {
            const { error } = await authClient.organization.update({
              organizationId,
              data: { name: String(form.get("name")) },
            });
            if (error) throw new Error(error.message ?? "Save failed");
            await queryClient.invalidateQueries({ queryKey: organizationsQuery().queryKey });
          }}
        >
          <Field label="Name" name="name" defaultValue={organization.name} required />
        </SettingsCard>
      )}
      <SettingsCard
        title="Profile"
        onSave={async (form) => {
          const { error } = await authClient.updateUser({ name: String(form.get("name")) });
          if (error) throw new Error(error.message ?? "Save failed");
          await queryClient.invalidateQueries({ queryKey: sessionQuery.queryKey });
        }}
      >
        <Field label="Name" name="name" defaultValue={session.user.name} required />
        <Field label="Email" name="email" defaultValue={session.user.email} disabled />
      </SettingsCard>
      <SettingsCard
        title="Password"
        onSave={async (form) => {
          const { error } = await authClient.changePassword({
            currentPassword: String(form.get("currentPassword")),
            newPassword: String(form.get("newPassword")),
            revokeOtherSessions: true,
          });
          if (error) throw new Error(error.message ?? "Save failed");
        }}
      >
        <Field
          label="Current password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
        <Field
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </SettingsCard>
    </>
  );
}

function SettingsCard({
  title,
  description,
  onSave,
  children,
}: {
  title: string;
  description?: string;
  onSave: (form: FormData) => Promise<void>;
  children: ReactNode;
}) {
  const { pending, error, run } = useAction();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void run(async () => {
      await onSave(form);
      toast.success(`${title} saved`);
    });
  }

  return (
    <Card>
      <form onSubmit={submit}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="mt-4 grid max-w-md gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {children}
        </CardContent>
        <CardFooter className="mt-4">
          <Button type="submit" disabled={pending}>
            Save
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
