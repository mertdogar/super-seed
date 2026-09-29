import type { ReactElement } from "react";
import { render, toPlainText } from "react-email";

import { site } from "@/site";

export async function sendEmail(env: Env, to: string, subject: string, email: ReactElement) {
  const html = await render(email);
  await env.EMAIL.send({
    from: { email: site.email, name: site.name },
    to,
    subject,
    html,
    text: toPlainText(html),
  });
}
