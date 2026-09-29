import { Action, Layout, Paragraph, previewBaseUrl } from "./_components/layout";

export type MemberJoinedEmailProps = {
  baseUrl: string;
  memberName: string;
  memberEmail: string;
  organizationName: string;
};

export default function MemberJoinedEmail({
  baseUrl,
  memberName,
  memberEmail,
  organizationName,
}: MemberJoinedEmailProps) {
  return (
    <Layout
      baseUrl={baseUrl}
      preview={`${memberName} joined ${organizationName}`}
      heading={`${memberName} joined ${organizationName}`}
      footer="You're receiving this because you sent the invitation."
    >
      <Paragraph>
        {memberName} ({memberEmail}) accepted your invitation and is now a member of{" "}
        {organizationName}.
      </Paragraph>
      <Action href={`${baseUrl}/app/members`}>View members</Action>
    </Layout>
  );
}

MemberJoinedEmail.PreviewProps = {
  baseUrl: previewBaseUrl,
  memberName: "Ada Lovelace",
  memberEmail: "ada@example.com",
  organizationName: "Acme",
} satisfies MemberJoinedEmailProps;
