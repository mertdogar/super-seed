import type { FormEvent, ReactNode } from "react";

import { Brand } from "@/components/brand";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  error,
  pending,
  submitLabel,
  onSubmit,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  error?: string | null;
  pending?: boolean;
  submitLabel?: string;
  onSubmit?: (form: FormData) => void | Promise<void>;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit?.(new FormData(event.currentTarget));
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Brand />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {children}
              {submitLabel && (
                <Button type="submit" disabled={pending}>
                  {pending ? "Please wait…" : submitLabel}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
        {footer && <p className="text-center text-sm text-muted-foreground">{footer}</p>}
      </div>
    </main>
  );
}
