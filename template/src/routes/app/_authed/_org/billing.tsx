import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { apiQuery } from "@/api/client";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { plans } from "@/features/billing/plans";
import { authClient } from "@/lib/auth-client";
import { isAdmin } from "@/lib/session";
import { useAction } from "@/lib/use-action";

const billingQuery = apiQuery("GET /api/v1/billing");

export const Route = createFileRoute("/app/_authed/_org/billing")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(billingQuery),
  component: Billing,
});

function Billing() {
  const { organizationId, role } = Route.useRouteContext();
  const { data: billing } = useSuspenseQuery(billingQuery);
  const { pending, error, run } = useAction();
  const canManage = isAdmin(role);
  const returnUrl = `${window.location.origin}/app/billing`;

  function redirectTo(action: Promise<{ error: { message?: string } | null }>) {
    return run(async () => {
      const { error } = await action;
      if (error) throw new Error(error.message ?? "Billing is unavailable");
    });
  }

  return (
    <>
      <PageHeader
        title="Billing"
        description={
          billing.subscription?.cancelAtPeriodEnd && billing.subscription.periodEnd
            ? `Your subscription ends on ${new Date(billing.subscription.periodEnd).toLocaleDateString()}.`
            : `You're on the ${billing.label} plan.`
        }
        actions={
          billing.subscription &&
          canManage && (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                redirectTo(
                  authClient.subscription.billingPortal({
                    referenceId: organizationId,
                    customerType: "organization",
                    returnUrl,
                  }),
                )
              }
            >
              Manage subscription
            </Button>
          )
        }
      />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => {
          const current = plan.name === billing.plan;
          return (
            <Card key={plan.name} className={current ? "border-primary" : undefined}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.label}
                  {current && <Badge>Current</Badge>}
                </CardTitle>
                <CardDescription>
                  {plan.monthlyPrice ? `$${plan.monthlyPrice} per month` : "Free forever"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                  {plan.highlights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </CardContent>
              {canManage && !current && plan.lookupKey && (
                <CardFooter>
                  <Button
                    disabled={pending}
                    onClick={() =>
                      redirectTo(
                        authClient.subscription.upgrade({
                          plan: plan.name,
                          referenceId: organizationId,
                          customerType: "organization",
                          successUrl: returnUrl,
                          cancelUrl: returnUrl,
                        }),
                      )
                    }
                  >
                    Upgrade to {plan.label}
                  </Button>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
