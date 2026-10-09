import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  type LinkOptions,
  Outlet,
  redirect,
  useLocation,
  useMatches,
  useNavigate,
} from "@tanstack/react-router";
import {
  // @feature api-reference
  BookOpen,
  // @end api-reference
  Check,
  ChevronsUpDown,
  Copy,
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
import { toast } from "sonner";

import { BrandMark } from "@/components/brand";
import {
  AppBreadcrumbs,
  AppHeader,
  AppNav,
  getInitials,
  type NavItem,
  type NavSection,
} from "@/components/dashboardblocks/app-shell";
import { type LinkComponent, LinkProvider } from "@/components/dashboardblocks/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";
import { activeMemberQuery, isAdmin, organizationsQuery, resetSession } from "@/lib/session";
import { site } from "@/site";

export const Route = createFileRoute("/app/_authed/_org")({
  beforeLoad: async ({ context }) => {
    const organizationId = context.session.session.activeOrganizationId;
    if (!organizationId) throw redirect({ to: "/app/welcome", replace: true });
    const member = await context.queryClient.ensureQueryData(activeMemberQuery(organizationId));
    return { organizationId, role: member.role };
  },
  component: OrgLayout,
});

type Page = { title: string; icon: LucideIcon; to: LinkOptions["to"]; adminOnly?: boolean };

const main: Page[] = [
  { title: "Dashboard", icon: LayoutDashboard, to: "/app" },
  // @feature projects
  { title: "Projects", icon: FolderKanban, to: "/app/projects" },
  // @end projects
];

const organization: Page[] = [
  { title: "Members", icon: Users, to: "/app/members" },
  // @feature billing
  { title: "Billing", icon: CreditCard, to: "/app/billing" },
  // @end billing
  // @feature api-keys
  { title: "API keys", icon: KeyRound, to: "/app/keys", adminOnly: true },
  // @end api-keys
  { title: "Settings", icon: Settings, to: "/app/settings" },
];

const toNav = ({ title, icon: Icon, to }: Page): NavItem => ({
  title,
  href: to as string,
  exact: to === "/app",
  icon: <Icon />,
});

const RouterLink: LinkComponent = ({ href, ...props }) =>
  href.startsWith("/app") ? (
    <Link to={href as LinkOptions["to"]} {...props} />
  ) : (
    <a href={href} {...props} />
  );

function OrgLayout() {
  const { role, organizationId, session } = Route.useRouteContext();
  const { pathname } = useLocation();
  // A detail route's loader returns its row, so the last crumb reads the name instead of the id
  const leaf = useMatches().at(-1)?.loaderData as { id?: unknown; name?: unknown } | undefined;
  const leafName = typeof leaf?.name === "string" ? leaf.name : undefined;
  const leafId = typeof leaf?.id === "string" && pathname.endsWith(leaf.id) ? leaf.id : undefined;
  const { data: organizations = [] } = useQuery(organizationsQuery());
  const switchTo = useSwitch();

  const menu = {
    organizations,
    organizationId,
    user: { name: session.user.name, email: session.user.email },
    onSwitchOrg: (id: string) =>
      void switchTo(() => authClient.organization.setActive({ organizationId: id })),
    onCreateOrg: () =>
      void switchTo(
        () => authClient.organization.setActive({ organizationId: null }),
        "/app/welcome",
      ),
    onSignOut: () => void switchTo(() => authClient.signOut(), "/app/sign-in"),
  };

  const org = organization.filter((page) => !page.adminOnly || isAdmin(role)).map(toNav);
  // @feature operator
  if (session.user.role === "admin")
    org.push({ title: "Operator", href: "/app/operator", icon: <ShieldCheck /> });
  // @end operator
  const sections: NavSection[] = [
    { items: main.map(toNav) },
    { label: "Organization", items: org },
    // @feature api-reference
    {
      label: "Developers",
      items: [{ title: "API reference", href: "/docs/api", icon: <BookOpen /> }],
    },
    // @end api-reference
  ];

  return (
    <LinkProvider component={RouterLink}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link to="/app" className="font-semibold tracking-tight">
                    <BrandMark className="size-8 rounded-lg" />
                    <span className="truncate">{site.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <AppNav pathname={pathname} sections={sections} />
          </SidebarContent>
          <SidebarFooter>
            <AccountMenu {...menu} />
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          {/* @feature operator */}
          <ImpersonationBanner />
          {/* @end operator */}
          <AppHeader>
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <AppBreadcrumbs items={crumbs(pathname, sections, leafName)} />
            {leafId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground"
                    aria-label="Copy ID"
                    onClick={() =>
                      navigator.clipboard.writeText(leafId).then(() => toast("ID copied"))
                    }
                  >
                    <Copy />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Click to copy</TooltipContent>
              </Tooltip>
            )}
          </AppHeader>
          <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </LinkProvider>
  );
}

function crumbs(pathname: string, sections: NavSection[], leafName?: string) {
  const [, , first, ...rest] = pathname.split("/");
  const href = first ? `/app/${first}` : "/app";
  const page = sections.flatMap((section) => section.items).find((item) => item.href === href);
  return [
    { label: page?.title ?? first ?? "Dashboard", href: rest.length ? href : undefined },
    ...rest.map((segment, i) => ({ label: (i === rest.length - 1 && leafName) || segment })),
  ];
}

type AccountMenuProps = {
  organizations: { id: string; name: string }[];
  organizationId: string;
  user: { name: string; email: string };
  onSwitchOrg: (id: string) => void;
  onCreateOrg: () => void;
  onSignOut: () => void;
};

function AccountMenu(props: AccountMenuProps) {
  const { isMobile } = useSidebar();
  const active = props.organizations.find((o) => o.id === props.organizationId);
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="aria-expanded:bg-muted">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {getInitials(props.user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{props.user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {active?.name ?? "Organization"}
                </span>
              </span>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            align="end"
            side={isMobile ? "bottom" : "right"}
          >
            <DropdownMenuLabel className="font-normal">
              <span className="grid text-sm leading-tight">
                <span className="truncate font-medium">{props.user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{props.user.email}</span>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Organizations</DropdownMenuLabel>
              {props.organizations.map((organization) => (
                <DropdownMenuItem
                  key={organization.id}
                  onSelect={() => props.onSwitchOrg(organization.id)}
                  disabled={organization.id === props.organizationId}
                >
                  <span
                    aria-hidden
                    className="grid size-6 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold"
                  >
                    {getInitials(organization.name)}
                  </span>
                  {organization.name}
                  {organization.id === props.organizationId && <Check className="ml-auto" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onSelect={props.onCreateOrg}>
                <Plus />
                New organization
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={props.onSignOut}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
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

// @feature operator
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
