import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  type LinkOptions,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import {
  // @feature api-reference
  BookOpen,
  // @end api-reference
  ChevronsUpDown,
  // @feature billing
  CreditCard,
  // @end billing
  // @feature projects
  FolderKanban,
  // @end projects
  // @feature api-keys
  KeyRound,
  // @end api-keys
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  // @feature operator
  ShieldCheck,
  // @end operator
  Users,
  type LucideIcon,
} from "lucide-react";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { activeMemberQuery, isAdmin, organizationsQuery, resetSession } from "@/lib/session";

export const Route = createFileRoute("/app/_authed/_org")({
  beforeLoad: async ({ context }) => {
    const organizationId = context.session.session.activeOrganizationId;
    if (!organizationId) throw redirect({ to: "/app/welcome", replace: true });
    const member = await context.queryClient.ensureQueryData(activeMemberQuery(organizationId));
    return { organizationId, role: member.role };
  },
  component: OrgLayout,
});

type NavItem = { label: string; icon: LucideIcon; link: LinkOptions; adminOnly?: boolean };

const nav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, link: { to: "/app" } },
  // @feature projects
  { label: "Projects", icon: FolderKanban, link: { to: "/app/projects" } },
  // @end projects
  { label: "Members", icon: Users, link: { to: "/app/members" } },
  // @feature billing
  { label: "Billing", icon: CreditCard, link: { to: "/app/billing" } },
  // @end billing
  // @feature api-keys
  { label: "API keys", icon: KeyRound, link: { to: "/app/keys" }, adminOnly: true },
  // @end api-keys
  { label: "Settings", icon: Settings, link: { to: "/app/settings" } },
];

function OrgLayout() {
  const { role } = Route.useRouteContext();
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-4 border-b bg-muted/40 p-4 md:sticky md:top-0 md:h-dvh md:border-r md:border-b-0">
        <Brand />
        <OrgSwitcher />
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {nav
            .filter((item) => !item.adminOnly || isAdmin(role))
            .map((item) => (
              <NavLink key={item.label} {...item} />
            ))}
          {/* @feature operator */}
          <OperatorLink />
          {/* @end operator */}
          {/* @feature api-reference */}
          <a
            href="/docs/api"
            className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <BookOpen className="size-4" />
            API reference
          </a>
          {/* @end api-reference */}
        </nav>
        <UserMenu />
      </aside>
      <div className="min-w-0">
        {/* @feature operator */}
        <ImpersonationBanner />
        {/* @end operator */}
        <main className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavLink({ label, icon: Icon, link }: NavItem) {
  return (
    <Link
      {...link}
      activeOptions={{ exact: link.to === "/app" }}
      className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[status=active]:bg-accent data-[status=active]:font-medium data-[status=active]:text-foreground"
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

function useSwitch() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return async (action: () => Promise<unknown>, to: LinkOptions["to"] = "/app") => {
    await action();
    resetSession(queryClient);
    await navigate({ to });
  };
}

function OrgSwitcher() {
  const { organizationId } = Route.useRouteContext();
  const { data: organizations = [] } = useQuery(organizationsQuery());
  const switchTo = useSwitch();
  const active = organizations.find((organization) => organization.id === organizationId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between">
          <span className="truncate">{active?.name ?? "Organization"}</span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        {organizations.map((organization) => (
          <DropdownMenuItem
            key={organization.id}
            disabled={organization.id === organizationId}
            onSelect={() =>
              void switchTo(() =>
                authClient.organization.setActive({ organizationId: organization.id }),
              )
            }
          >
            {organization.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            void switchTo(
              () => authClient.organization.setActive({ organizationId: null }),
              "/app/welcome",
            )
          }
        >
          <Plus className="size-4" />
          New organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const { session } = Route.useRouteContext();
  const switchTo = useSwitch();

  return (
    <div className="mt-auto flex items-center justify-between gap-2 border-t pt-4 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{session.user.name}</p>
        <p className="truncate text-muted-foreground">{session.user.email}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Sign out"
        onClick={() => void switchTo(() => authClient.signOut(), "/app/sign-in")}
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}

// @feature operator
function OperatorLink() {
  const { session } = Route.useRouteContext();
  if (session.user.role !== "admin") return null;
  return <NavLink label="Operator" icon={ShieldCheck} link={{ to: "/app/operator" }} />;
}

function ImpersonationBanner() {
  const { session } = Route.useRouteContext();
  const switchTo = useSwitch();
  if (!session.session.impersonatedBy) return null;
  return (
    <div className="flex items-center justify-between gap-4 bg-amber-100 px-6 py-2 text-sm text-amber-950">
      <span>You are signed in as {session.user.email}.</span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => void switchTo(() => authClient.admin.stopImpersonating(), "/app/operator")}
      >
        Stop impersonating
      </Button>
    </div>
  );
}
// @end operator
