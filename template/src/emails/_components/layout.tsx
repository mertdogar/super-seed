import type { ReactNode } from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  pixelBasedPreset,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";

import { site } from "../../site";

export const previewBaseUrl = site.url;

export function Layout({
  baseUrl,
  preview,
  heading,
  footer,
  children,
}: {
  baseUrl: string;
  preview: string;
  heading: string;
  footer: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Head />
        <Body className="m-0 bg-zinc-50 px-4 py-10 font-sans text-zinc-900">
          <Preview>{preview}</Preview>
          <Container className="mx-auto max-w-[480px]">
            <Link href={baseUrl} className="text-[16px] font-semibold text-zinc-900 no-underline">
              {site.name}
            </Link>
            <Section className="mt-6 rounded-[12px] border border-solid border-zinc-200 bg-white px-6 py-6">
              <Heading as="h1" className="m-0 text-[20px] font-semibold leading-7">
                {heading}
              </Heading>
              {children}
            </Section>
            <Text className="mx-6 mb-0 mt-4 text-[12px] leading-5 text-zinc-500">{footer}</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export function Paragraph({ children }: { children: ReactNode }) {
  return <Text className="mb-0 mt-3 text-[14px] leading-[22px] text-zinc-600">{children}</Text>;
}

export function Action({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section className="mt-6">
      <Button
        href={href}
        className="box-border rounded-[8px] bg-zinc-900 px-4 py-[10px] text-[14px] font-medium leading-4 text-white no-underline"
      >
        {children}
      </Button>
    </Section>
  );
}

export function FallbackLink({ href }: { href: string }) {
  return (
    <Text className="mb-0 mt-6 border-0 border-t border-solid border-zinc-100 pt-4 text-[12px] leading-5 text-zinc-500">
      If the button doesn't work, paste this link into your browser:{" "}
      <Link href={href} className="break-all text-zinc-900">
        {href}
      </Link>
    </Text>
  );
}
