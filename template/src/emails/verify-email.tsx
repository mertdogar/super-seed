import { site } from "../site";
import { Action, FallbackLink, Layout, Paragraph, previewBaseUrl } from "./_components/layout";

export type VerifyEmailProps = { baseUrl: string; email: string; url: string };

export default function VerifyEmail({ baseUrl, email, url }: VerifyEmailProps) {
  return (
    <Layout
      baseUrl={baseUrl}
      preview={`Verify your email for ${site.name}`}
      heading="Verify your email"
      footer="If you didn't create an account, you can ignore this email."
    >
      <Paragraph>Confirm that {email} is your address to finish creating your account.</Paragraph>
      <Action href={url}>Verify email</Action>
      <FallbackLink href={url} />
    </Layout>
  );
}

VerifyEmail.PreviewProps = {
  baseUrl: previewBaseUrl,
  email: "ada@example.com",
  url: `${previewBaseUrl}/api/auth/verify-email?token=example`,
} satisfies VerifyEmailProps;
