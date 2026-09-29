import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/marketing/legal-page";
import { site } from "@/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: `Privacy · ${site.name}` }] }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Privacy policy">
      <p>Replace this placeholder with your privacy policy before you launch.</p>
      <h2>What we collect</h2>
      <p>Your name, email address and the content you add to {site.name}.</p>
      <h2>How we use it</h2>
      <p>To run the service, send account emails and bill your subscription.</p>
      <h2>Contact</h2>
      <p>Email {site.email} with any questions.</p>
    </LegalPage>
  );
}
