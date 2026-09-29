export type Feature = {
  label: string;
  hint: string;
  /** Files and folders, relative to the template, that belong only to this feature. */
  paths: string[];
  dependencies?: string[];
  scripts?: string[];
};

export const features = {
  projects: {
    label: "Projects demo",
    hint: "an example tenant resource: typed routes, pages and tests",
    paths: [
      "src/features/projects",
      "src/routes/app/_authed/_org/projects",
      "migrations/0005_projects.sql",
      "test/worker/projects.test.ts",
    ],
  },
  billing: {
    label: "Billing",
    hint: "Stripe subscriptions per organization with plan limits",
    paths: [
      "src/features/billing",
      "src/routes/app/_authed/_org/billing.tsx",
      "migrations/0004_billing.sql",
      "test/worker/billing.test.ts",
    ],
    dependencies: ["stripe", "@better-auth/stripe"],
  },
  "api-keys": {
    label: "API keys",
    hint: "organization keys for your customers' backends",
    paths: [
      "src/routes/app/_authed/_org/keys.tsx",
      "migrations/0003_api_keys.sql",
      "test/worker/api-keys.test.ts",
    ],
    dependencies: ["@better-auth/api-key"],
  },
  operator: {
    label: "Operator console",
    hint: "platform admins, the organization list and impersonation",
    paths: [
      "src/features/operator",
      "src/routes/app/_authed/operator.tsx",
      "migrations/0002_operator.sql",
      "test/worker/operator.test.ts",
      "scripts/operator.ts",
    ],
    scripts: ["operator:add"],
  },
  "api-reference": {
    label: "API reference",
    hint: "Scalar docs for the OpenAPI spec at /docs/api",
    paths: ["src/features/api-reference", "test/worker/api-reference.test.ts"],
  },
} satisfies Record<string, Feature>;

export type FeatureName = keyof typeof features;

export const featureNames = Object.keys(features) as FeatureName[];

export function isFeatureName(name: string): name is FeatureName {
  return name in features;
}
