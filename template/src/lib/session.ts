import { type QueryClient, queryOptions } from "@tanstack/react-query";

import { authClient, unwrap } from "./auth-client";

export const sessionQuery = queryOptions({
  queryKey: ["session"],
  queryFn: async () => (await authClient.getSession()).data ?? null,
  staleTime: 60_000,
});

export function activeMemberQuery(organizationId: string) {
  return queryOptions({
    queryKey: ["organizations", organizationId, "member"],
    queryFn: () => unwrap(authClient.organization.getActiveMember()),
  });
}

export function organizationsQuery() {
  return queryOptions({
    queryKey: ["organizations"],
    queryFn: () => unwrap(authClient.organization.list()),
  });
}

/** Drops every cached query after the signed-in user or active organization changes. */
export function resetSession(queryClient: QueryClient) {
  queryClient.clear();
}

export function isAdmin(role: string | undefined) {
  return role === "owner" || role === "admin";
}
