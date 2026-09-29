import { createFileRoute, Link } from "@tanstack/react-router";

import { SectionTitle } from "@/components/marketing/section-title";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// @feature billing
import { Pricing } from "@/features/billing/pricing";
// @end billing
import { site } from "@/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${site.name} · ${site.tagline}` },
      { property: "og:title", content: site.name },
      { property: "og:description", content: site.description },
      { property: "og:url", content: site.url },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: site.url }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        {/* @feature billing */}
        <Pricing />
        {/* @end billing */}
        <Faq />
        <CallToAction />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-20 pb-16 sm:px-6 lg:grid-cols-2 lg:items-center">
      <div className="space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {site.tagline}
        </h1>
        <p className="max-w-prose text-lg text-muted-foreground">{site.description}</p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link to="/app/sign-up">Start free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#features">See what's included</a>
          </Button>
        </div>
      </div>
      <ProductShot />
    </section>
  );
}

function ProductShot() {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-xl border bg-card shadow-sm ring-8 ring-muted/60"
    >
      <div className="flex items-center gap-1.5 border-b px-4 py-3">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="size-2.5 rounded-full bg-muted-foreground/25" />
        ))}
      </div>
      <div className="grid grid-cols-[120px_1fr]">
        <div className="space-y-2 border-r bg-muted/40 p-4">
          {[70, 55, 80, 60].map((width) => (
            <div
              key={width}
              className="h-2.5 rounded bg-muted-foreground/20"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
        <div className="space-y-4 p-5">
          <div className="h-4 w-1/3 rounded bg-foreground/80" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((tile) => (
              <div key={tile} className="h-16 rounded-md border bg-muted/40" />
            ))}
          </div>
          {[90, 75, 85, 60].map((width) => (
            <div
              key={width}
              className="h-3 rounded bg-muted-foreground/15"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-20 sm:px-6">
        <SectionTitle title="Everything a SaaS needs on day one" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {site.features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="border-t bg-muted/30">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-20 sm:px-6">
        <SectionTitle title="Questions" />
        <dl className="divide-y rounded-lg border bg-card">
          {site.faq.map((item) => (
            <div key={item.question} className="space-y-1 p-5">
              <dt className="font-medium">{item.question}</dt>
              <dd className="text-sm text-muted-foreground">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
      <div className="space-y-6 rounded-2xl bg-primary px-6 py-14 text-primary-foreground">
        <h2 className="text-3xl font-semibold tracking-tight">Ready when you are</h2>
        <p className="mx-auto max-w-prose opacity-80">{site.description}</p>
        <Button size="lg" variant="secondary" asChild>
          <Link to="/app/sign-up">Create your account</Link>
        </Button>
      </div>
    </section>
  );
}
