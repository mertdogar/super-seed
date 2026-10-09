import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  LayoutDashboard,
  ShieldCheck,
  // @feature billing
  Ticket,
  // @end billing
  Users,
} from "lucide-react";

import { AppNav, type NavSection } from "@/components/dashboardblocks/app-shell";
import { ShellHeader } from "@/components/shell-header";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { organizationsQuery } from "@/features/operator/queries";
import { site } from "@/site";

export const Route = createFileRoute("/app/_authed/operator")({
  beforeLoad: ({ context }) => {
    if (context.session.user.role !== "admin") throw redirect({ to: "/app" });
  },
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(organizationsQuery),
  component: OperatorLayout,
});

function OperatorLayout() {
  const { data: organizations } = useSuspenseQuery(organizationsQuery);
  const { pathname } = useLocation();
  const sections: NavSection[] = [
    {
      label: "Platform",
      items: [
        { title: "Overview", href: "/app/operator", exact: true, icon: <LayoutDashboard /> },
        {
          title: "Organizations",
          href: "/app/operator/organizations",
          icon: <Building2 />,
          badge: organizations.length || undefined,
        },
        { title: "Users", href: "/app/operator/users", icon: <Users /> },
        // @feature billing
        {
          title: "Plan grants",
          href: "/app/operator/grants",
          icon: <Ticket />,
          badge: organizations.filter((o) => o.grantedPlan).length || undefined,
        },
        // @end billing
      ],
    },
  ];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="font-semibold tracking-tight">
                <Link to="/app/operator">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                    <ShieldCheck className="size-4" />
                  </span>
                  <span className="grid leading-tight">
                    <span>Operator</span>
                    <span className="text-xs font-normal text-muted-foreground">{site.name}</span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <AppNav pathname={pathname} sections={sections} />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Back to the app">
                <Link to="/app">
                  <ArrowLeft />
                  <span>Back to the app</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <ShellHeader base="/app/operator" sections={sections} />
        <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
