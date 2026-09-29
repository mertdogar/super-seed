import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { SectionTitle } from "@/components/marketing/section-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { plans } from "./plans";

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl space-y-10 px-4 py-20 sm:px-6">
      <SectionTitle title="Simple pricing" body="Start free. Upgrade when you need more." />
      <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle>{plan.label}</CardTitle>
              <p className="text-3xl font-semibold">
                ${plan.monthlyPrice}
                <span className="text-sm font-normal text-muted-foreground"> / month</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-2 text-sm">
                {plan.highlights.map((line) => (
                  <li key={line} className="flex items-center gap-2">
                    <Check className="size-4 text-muted-foreground" />
                    {line}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.monthlyPrice ? "default" : "outline"}
                asChild
              >
                <Link to="/app/sign-up">
                  {plan.monthlyPrice ? `Choose ${plan.label}` : "Start free"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
