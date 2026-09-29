import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { AuthCard } from "@/components/auth-card";
import { Field } from "@/components/field";
import { authClient } from "@/lib/auth-client";
import { useAction } from "@/lib/use-action";

export const Route = createFileRoute("/app/forgot-password")({ component: ForgotPassword });

function ForgotPassword() {
  const { pending, error, run } = useAction();
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (sentTo)
    return (
      <AuthCard
        title="Check your email"
        description={`If ${sentTo} has an account, we sent it a link to choose a new password.`}
      />
    );

  return (
    <AuthCard
      title="Reset your password"
      description="We'll email you a link to choose a new one."
      error={error}
      pending={pending}
      submitLabel="Send link"
      onSubmit={(form) =>
        run(async () => {
          const email = String(form.get("email"));
          const { error } = await authClient.requestPasswordReset({
            email,
            redirectTo: "/app/reset-password",
          });
          if (error) throw new Error(error.message ?? "Request failed");
          setSentTo(email);
        })
      }
      footer={
        <Link to="/app/sign-in" className="font-medium text-foreground">
          Back to sign in
        </Link>
      }
    >
      <Field label="Email" name="email" type="email" autoComplete="email" required />
    </AuthCard>
  );
}
