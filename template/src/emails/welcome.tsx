import { site } from "../site";
import { Action, Layout, Paragraph, previewBaseUrl } from "./_components/layout";

export type WelcomeEmailProps = { baseUrl: string; name: string; email: string };

export default function WelcomeEmail({ baseUrl, name, email }: WelcomeEmailProps) {
  return (
    <Layout
      baseUrl={baseUrl}
      preview={`Welcome to ${site.name}`}
      heading={`Welcome, ${name}`}
      footer={`You're receiving this because ${email} signed up for ${site.name}.`}
    >
      <Paragraph>
        Your email is verified. Create an organization or accept an invitation to start.
      </Paragraph>
      <Action href={`${baseUrl}/app`}>Open {site.name}</Action>
    </Layout>
  );
}

WelcomeEmail.PreviewProps = {
  baseUrl: previewBaseUrl,
  name: "Ada",
  email: "ada@example.com",
} satisfies WelcomeEmailProps;
