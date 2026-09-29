// @feature api-reference
import { apiReferenceRoutes } from "@/features/api-reference/api";
// @end api-reference
// @feature billing
import { billingRoutes } from "@/features/billing/api";
// @end billing
// @feature operator
import { operatorRoutes } from "@/features/operator/api";
// @end operator
// @feature projects
import { projectRoutes } from "@/features/projects/api";
// @end projects

import { authRoutes, healthRoutes } from "./core-routes";

export const routes = [
  ...authRoutes,
  ...healthRoutes,
  // @feature projects
  ...projectRoutes,
  // @end projects
  // @feature billing
  ...billingRoutes,
  // @end billing
  // @feature operator
  ...operatorRoutes,
  // @end operator
  // @feature api-reference
  ...apiReferenceRoutes,
  // @end api-reference
];
