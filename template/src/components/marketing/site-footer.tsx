import { Link } from "@tanstack/react-router";

import { site } from "@/site";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <nav className="flex gap-4">
          <Link to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-foreground">
            Terms
          </Link>
          {/* @feature api-reference */}
          <a href="/docs/api" className="hover:text-foreground">
            API
          </a>
          {/* @end api-reference */}
        </nav>
      </div>
    </footer>
  );
}
