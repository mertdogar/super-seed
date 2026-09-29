import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as z from "zod";

import { AuthCard } from "@/components/auth-card";
import { Field } from "@/components/field";
import { authClient } from "@/lib/auth-client";
import { safeRedirect } from "@/lib/safe-redirect";
import { resetSession } from "@/lib/session";
import { useAction } from "@/lib/use-action";

export const Route = createFileRoute("/app/sign-in")({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  component: SignIn,
});

function SignIn() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();
  const target = safeRedirect(redirect);

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back."
      error={error}
      pending={pending}
      submitLabel="Sign in"
      onSubmit={(form) =>
        run(async () => {
          const { error } = await authClient.signIn.email({
            email: String(form.get("email")),
            password: String(form.get("password")),
            callbackURL: target,
          });
          if (error?.status === 403)
            throw new Error("Verify your email first. We sent you a new link.");
          if (error) throw new Error(error.message ?? "Sign in failed");
          resetSession(queryClient);
          await navigate({ href: target });
        })
      }
      footer={
        <>
          No account?{" "}
          <Link to="/app/sign-up" search={{ redirect }} className="font-medium text-foreground">
            Sign up
          </Link>
        </>
      }
    >
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <Link to="/app/forgot-password" className="-mt-2 text-sm text-muted-foreground">
        Forgot your password?
      </Link>
    </AuthCard>
  );
}
