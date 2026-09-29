import { site } from "../site";
import { Action, FallbackLink, Layout, Paragraph, previewBaseUrl } from "./_components/layout";

export type PasswordResetEmailProps = { baseUrl: string; email: string; url: string };

export default function PasswordResetEmail({ baseUrl, email, url }: PasswordResetEmailProps) {
  return (
    <Layout
      baseUrl={baseUrl}
      preview={`Reset your ${site.name} password`}
      heading="Reset your password"
      footer="If you didn't ask to reset your password, you can ignore this email."
    >
      <Paragraph>
        Someone asked to reset the password for {email}. The link expires in one hour.
      </Paragraph>
      <Action href={url}>Choose a new password</Action>
      <FallbackLink href={url} />
    </Layout>
  );
}

PasswordResetEmail.PreviewProps = {
  baseUrl: previewBaseUrl,
  email: "ada@example.com",
  url: `${previewBaseUrl}/api/auth/reset-password/example?callbackURL=/app/reset-password`,
} satisfies PasswordResetEmailProps;
