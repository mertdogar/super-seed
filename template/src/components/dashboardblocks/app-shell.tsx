"use client";

import { Link } from "@/components/dashboardblocks/link";
import { Fragment, type ReactNode, useState } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "lucide-react";

/*
 * Links are plain anchors, so the shell works with any router. For client-side
 * navigation, wrap your app in `LinkProvider` with your router's link.
 */

interface NavLink {
  /** A count or short label after the title, such as unread items. */
  badge?: ReactNode;
  href: string;
  title: string;
}

interface NavItem {
  badge?: ReactNode;
  /** Only active on an exact match, for index pages whose path prefixes the others. */
  exact?: boolean;
  /** Leave out when the item only groups `items`. */
  href?: string;
  icon: ReactNode;
  /** Child links, shown in a collapsible list under the item. */
  items?: NavLink[];
  title: string;
}

interface NavSection {
  items: NavItem[];
  label?: string;
}

function useCloseMobileSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  return () => {
    if (isMobile) setOpenMobile(false);
  };
}

/** Whether `href` is the current page or one of its parents. */
function isActiveHref(href: string, pathname: string) {
  if (href === pathname) return true;
  return href !== "/" && pathname.startsWith(`${href.replace(/\/$/, "")}/`);
}

/** The first two initials of a name, for avatar fallbacks. */
function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

interface AppNavProps {
  className?: string;
  /** The current path, used to mark the active item. */
  pathname: string;
  sections: NavSection[];
}

/** Sidebar navigation in labelled sections, with badges and collapsible child links. */
function AppNav({ className, pathname, sections }: AppNavProps) {
  return (
    <>
      {sections.map((section, index) => (
        <SidebarGroup key={section.label ?? index} className={className}>
          {section.label && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
          <SidebarMenu>
            {section.items.map((item) => (
              <AppNavItem key={item.title} item={item} pathname={pathname} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}

function AppNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const { setOpen, state } = useSidebar();
  const closeMobile = useCloseMobileSidebar();
  const childActive = item.items?.some((child) => isActiveHref(child.href, pathname)) ?? false;
  const [expanded, setExpanded] = useState(childActive);
  const [wasChildActive, setWasChildActive] = useState(childActive);
  if (childActive !== wasChildActive) {
    setWasChildActive(childActive);
    if (childActive) setExpanded(true);
  }

  if (!item.items?.length) {
    const active =
      item.href !== undefined &&
      (item.exact ? item.href === pathname : isActiveHref(item.href, pathname));
    return (
      <SidebarMenuItem>
        <SidebarMenuButton isActive={active} tooltip={item.title} asChild>
          <Link
            href={item.href}
            aria-current={item.href === pathname ? "page" : undefined}
            onClick={closeMobile}
          >
            {item.icon}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
        {item.badge !== undefined && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded} className="group/collapsible" asChild>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            onClick={() => state === "collapsed" && setOpen(true)}
          >
            {item.icon}
            <span>{item.title}</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((child) => (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton
                  isActive={isActiveHref(child.href, pathname)}
                  aria-current={child.href === pathname ? "page" : undefined}
                  asChild
                >
                  <Link href={child.href} onClick={closeMobile}>
                    <span>{child.title}</span>
                    {child.badge !== undefined && (
                      <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                        {child.badge}
                      </span>
                    )}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

interface AppHeaderProps {
  children: ReactNode;
  className?: string;
}

/** The bar above the page: put the sidebar trigger, breadcrumbs and actions in it. */
function AppHeader({ children, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4",
        className,
      )}
    >
      {children}
    </header>
  );
}

interface Crumb {
  /** Leave out for the current page. */
  href?: string;
  label: string;
}

/** Where the page sits. Only the current page shows on small screens. */
function AppBreadcrumbs({ className, items }: { className?: string; items: Crumb[] }) {
  return (
    <Breadcrumb className={cn("min-w-0", className)}>
      <BreadcrumbList className="flex-nowrap">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem className={cn(!last && "hidden md:inline-flex", "min-w-0")}>
                {last || !item.href ? (
                  <BreadcrumbPage className="truncate">{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!last && <BreadcrumbSeparator className="hidden md:inline-flex" />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export { AppBreadcrumbs, AppHeader, AppNav, getInitials, isActiveHref };

export type { AppHeaderProps, AppNavProps, Crumb, NavItem, NavLink, NavSection };
