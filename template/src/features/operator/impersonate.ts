import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { authClient, unwrap } from "@/lib/auth-client";
import { resetSession } from "@/lib/session";

/** Signs the operator in as the user and opens their dashboard. */
export function useImpersonate() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async (userId: string) => {
    await unwrap(authClient.admin.impersonateUser({ userId }));
    resetSession(queryClient);
    await navigate({ to: "/app" });
  };
}
