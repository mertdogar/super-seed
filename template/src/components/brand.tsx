import { Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";

import { cn } from "@/lib/utils";
import { site } from "@/site";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground",
        className,
      )}
    >
      <Sprout className="size-4" />
    </span>
  );
}

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <BrandMark />
      {site.name}
    </Link>
  );
}
