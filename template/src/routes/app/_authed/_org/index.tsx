import { createFileRoute, Link, type LinkOptions } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/app/_authed/_org/")({ component: Dashboard });

const cards: { title: string; body: string; link: LinkOptions }[] = [
  // @feature projects
  {
    title: "Projects",
    body: "The example resource: a typed API, tenancy and forms end to end.",
    link: { to: "/app/projects" },
  },
  // @end projects
  {
    title: "Members",
    body: "Invite teammates and manage their roles.",
    link: { to: "/app/members" },
  },
  // @feature billing
  {
    title: "Billing",
    body: "See your plan and manage your subscription.",
    link: { to: "/app/billing" },
  },
  // @end billing
  {
    title: "Settings",
    body: "Rename the organization and update your profile.",
    link: { to: "/app/settings" },
  },
];

function Dashboard() {
  const { session } = Route.useRouteContext();
  return (
    <>
      <PageHeader title={`Hello, ${session.user.name}`} description="Here's where to start." />
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.title} {...card.link}>
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.body}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
