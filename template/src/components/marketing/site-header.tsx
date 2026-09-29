import { Link } from "@tanstack/react-router";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand />
        <nav className="flex items-center gap-1 text-sm sm:gap-4">
          <a
            href="/#features"
            className="hidden text-muted-foreground hover:text-foreground sm:inline"
          >
            Features
          </a>
          {/* @feature billing */}
          <a
            href="/#pricing"
            className="hidden text-muted-foreground hover:text-foreground sm:inline"
          >
            Pricing
          </a>
          {/* @end billing */}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app/sign-in">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/app/sign-up">Get started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
