import { useLocation, useMatches } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { AppBreadcrumbs, AppHeader, type NavSection } from "@/components/dashboardblocks/app-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** The bar above a shell's pages: the sidebar trigger and breadcrumbs for pages under `base`. */
export function ShellHeader({ base, sections }: { base: string; sections: NavSection[] }) {
  const { pathname } = useLocation();
  // A detail route's loader returns its row, so the last crumb reads the name instead of the id
  const leaf = useMatches().at(-1)?.loaderData as { id?: unknown; name?: unknown } | undefined;
  const leafName = typeof leaf?.name === "string" ? leaf.name : undefined;
  const leafId = typeof leaf?.id === "string" && pathname.endsWith(leaf.id) ? leaf.id : undefined;

  return (
    <AppHeader>
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <AppBreadcrumbs items={crumbs(base, pathname, sections, leafName)} />
      {leafId && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              aria-label="Copy ID"
              onClick={() => navigator.clipboard.writeText(leafId).then(() => toast("ID copied"))}
            >
              <Copy />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Click to copy</TooltipContent>
        </Tooltip>
      )}
    </AppHeader>
  );
}

function crumbs(base: string, pathname: string, sections: NavSection[], leafName?: string) {
  const [first, ...rest] = pathname.slice(base.length).split("/").filter(Boolean);
  const href = first ? `${base}/${first}` : base;
  const page = sections.flatMap((section) => section.items).find((item) => item.href === href);
  return [
    { label: page?.title ?? first ?? "", href: rest.length ? href : undefined },
    ...rest.map((segment, i) => ({ label: (i === rest.length - 1 && leafName) || segment })),
  ];
}
