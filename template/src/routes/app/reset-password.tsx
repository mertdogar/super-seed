import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as z from "zod";

import { AuthCard } from "@/components/auth-card";
import { Field } from "@/components/field";
import { authClient } from "@/lib/auth-client";
import { useAction } from "@/lib/use-action";

export const Route = createFileRoute("/app/reset-password")({
  validateSearch: z.object({
    token: z.string().optional().catch(undefined),
    error: z.string().optional().catch(undefined),
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { token, error: linkError } = Route.useSearch();
  const navigate = useNavigate();
  const { pending, error, run } = useAction();

  if (!token || linkError)
    return (
      <AuthCard
        title="This link has expired"
        description="Request a new password reset link."
        footer={
          <Link to="/app/forgot-password" className="font-medium text-foreground">
            Send a new link
          </Link>
        }
      />
    );

  return (
    <AuthCard
      title="Choose a new password"
      error={error}
      pending={pending}
      submitLabel="Save password"
      onSubmit={(form) =>
        run(async () => {
          const { error } = await authClient.resetPassword({
            token,
            newPassword: String(form.get("password")),
          });
          if (error) throw new Error(error.message ?? "Reset failed");
          await navigate({ to: "/app/sign-in" });
        })
      }
    >
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
    </AuthCard>
  );
}
