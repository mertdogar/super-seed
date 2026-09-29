import { Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";

import { site } from "@/site";

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
        <Sprout className="size-4" />
      </span>
      {site.name}
    </Link>
  );
}
