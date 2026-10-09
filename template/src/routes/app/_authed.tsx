import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  type LinkOptions,
  Outlet,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { type LinkComponent, LinkProvider } from "@/components/dashboardblocks/link";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/utils";
import { sessionQuery } from "@/lib/session";

export const Route = createFileRoute("/app/_authed")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery);
    if (!session)
      throw redirect({ to: "/app/sign-in", search: { redirect: location.href }, replace: true });
    return { session };
  },
  component: AuthedLayout,
  errorComponent: AuthedError,
});

const RouterLink: LinkComponent = ({ href, ...props }) =>
  href.startsWith("/app") ? (
    <Link to={href as LinkOptions["to"]} {...props} />
  ) : (
    <a href={href} {...props} />
  );

function AuthedLayout() {
  return (
    <LinkProvider component={RouterLink}>
      <Outlet />
    </LinkProvider>
  );
}

function AuthedError({ error }: ErrorComponentProps) {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();
  useEffect(() => queryErrorResetBoundary.reset(), [queryErrorResetBoundary]);

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="max-w-sm space-y-3 text-center">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">{errorMessage(error)}</p>
        <Button size="sm" onClick={() => void router.invalidate()}>
          Try again
        </Button>
      </div>
    </main>
  );
}
