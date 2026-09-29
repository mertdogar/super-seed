import { site } from "../site";
import { Action, FallbackLink, Layout, Paragraph, previewBaseUrl } from "./_components/layout";

export type InvitationEmailProps = {
  baseUrl: string;
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  role: string;
  email: string;
  url: string;
};

export default function InvitationEmail({
  baseUrl,
  inviterName,
  inviterEmail,
  organizationName,
  role,
  email,
  url,
}: InvitationEmailProps) {
  return (
    <Layout
      baseUrl={baseUrl}
      preview={`${inviterName} invited you to ${organizationName}`}
      heading={`Join ${organizationName} on ${site.name}`}
      footer="If you weren't expecting this invitation, you can ignore this email."
    >
      <Paragraph>
        {inviterName} ({inviterEmail}) invited you to join {organizationName} as {role}. Sign in or
        create an account with {email} to accept.
      </Paragraph>
      <Action href={url}>Accept invitation</Action>
      <FallbackLink href={url} />
    </Layout>
  );
}

InvitationEmail.PreviewProps = {
  baseUrl: previewBaseUrl,
  inviterName: "Grace Hopper",
  inviterEmail: "grace@example.com",
  organizationName: "Acme",
  role: "member",
  email: "ada@example.com",
  url: `${previewBaseUrl}/app/accept-invitation?id=inv_123`,
} satisfies InvitationEmailProps;
