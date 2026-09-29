export type Limits = { projects: number };

export type Plan = {
  name: string;
  label: string;
  monthlyPrice: number;
  lookupKey?: string;
  limits: Limits;
  highlights: string[];
};

export const plans: Plan[] = [
  {
    name: "free",
    label: "Free",
    monthlyPrice: 0,
    limits: { projects: 3 },
    highlights: ["3 projects", "Unlimited members", "Community support"],
  },
  {
    name: "pro",
    label: "Pro",
    monthlyPrice: 29,
    lookupKey: "super-seed-pro-monthly",
    limits: { projects: 100 },
    highlights: ["100 projects", "Unlimited members", "Email support"],
  },
];

export const freePlan = plans[0]!;

export function planNamed(name: string | null | undefined) {
  return plans.find((plan) => plan.name === name) ?? freePlan;
}
