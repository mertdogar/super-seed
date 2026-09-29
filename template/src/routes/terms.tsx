import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/marketing/legal-page";
import { site } from "@/site";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: `Terms · ${site.name}` }] }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Terms of service">
      <p>Replace this placeholder with your terms of service before you launch.</p>
      <h2>Your account</h2>
      <p>You are responsible for your account and everything done with it.</p>
      <h2>Payment</h2>
      <p>Paid plans renew monthly until you cancel them from the billing page.</p>
      <h2>Contact</h2>
      <p>Email {site.email} with any questions.</p>
    </LegalPage>
  );
}
