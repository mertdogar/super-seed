import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import * as z from "zod";

import { AuthCard } from "@/components/auth-card";
import { Field } from "@/components/field";
import { authClient } from "@/lib/auth-client";
import { safeRedirect } from "@/lib/safe-redirect";
import { useAction } from "@/lib/use-action";

export const Route = createFileRoute("/app/sign-up")({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  component: SignUp,
});

function SignUp() {
  const { redirect } = Route.useSearch();
  const { pending, error, run } = useAction();
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (sentTo)
    return (
      <AuthCard
        title="Check your email"
        description={`We sent a verification link to ${sentTo}. Open it to finish signing up.`}
      />
    );

  return (
    <AuthCard
      title="Create your account"
      error={error}
      pending={pending}
      submitLabel="Sign up"
      onSubmit={(form) =>
        run(async () => {
          const email = String(form.get("email"));
          const { error } = await authClient.signUp.email({
            name: String(form.get("name")),
            email,
            password: String(form.get("password")),
            callbackURL: safeRedirect(redirect),
          });
          if (error) throw new Error(error.message ?? "Sign up failed");
          setSentTo(email);
        })
      }
      footer={
        <>
          Already have an account?{" "}
          <Link to="/app/sign-in" search={{ redirect }} className="font-medium text-foreground">
            Sign in
          </Link>
        </>
      }
    >
      <Field label="Name" name="name" autoComplete="name" required />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
    </AuthCard>
  );
}
