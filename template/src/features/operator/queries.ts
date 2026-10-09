import { queryOptions } from "@tanstack/react-query";

import { type api, apiQuery } from "@/api/client";
import { authClient, unwrap } from "@/lib/auth-client";

export const organizationsQuery = apiQuery("GET /api/v1/operator/organizations");

export type OperatorOrganization = Awaited<
  ReturnType<typeof api<"GET /api/v1/operator/organizations">>
>[number];

export const membersQuery = (id: string) =>
  apiQuery("GET /api/v1/operator/organizations/{id}/members", { params: { id } });

export const usersQuery = (search = "") =>
  queryOptions({
    queryKey: ["operator", "users", search],
    queryFn: () =>
      unwrap(
        authClient.admin.listUsers({
          query: {
            limit: 100,
            sortBy: "createdAt",
            sortDirection: "desc",
            ...(search ? { searchValue: search, searchField: "email" as const } : {}),
          },
        }),
      ),
  });

export const shortDate = (iso: string | Date) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
