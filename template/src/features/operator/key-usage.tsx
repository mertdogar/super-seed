import { toast } from "sonner";

import { api } from "@/api/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAction } from "@/lib/use-action";

/** Clears the hourly request window on every key of the organization. */
export function KeyUsageCard({ organizationId }: { organizationId: string }) {
  const { pending, error, run } = useAction();
  const reset = () =>
    run(async () => {
      const { keys } = await api("POST /api/v1/operator/organizations/{id}/reset-api-key-usage", {
        params: { id: organizationId },
      });
      toast(`Reset usage on ${keys} ${keys === 1 ? "key" : "keys"}`);
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>API keys</CardTitle>
        <CardDescription>
          Clears the hourly request window on every key of the organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button variant="outline" size="sm" disabled={pending} onClick={reset}>
          Reset key usage
        </Button>
      </CardContent>
    </Card>
  );
}
