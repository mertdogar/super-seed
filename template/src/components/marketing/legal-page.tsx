import type { ReactNode } from "react";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-16 text-sm leading-6 text-muted-foreground sm:px-6 [&_h2]:pt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
