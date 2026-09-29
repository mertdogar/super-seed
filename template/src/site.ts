export const site = {
  name: "Super Seed",
  url: "https://super-seed.example.com",
  email: "noreply@super-seed.example.com",
  tagline: "Ship the product, not the plumbing",
  description: "Accounts, organizations, invitations, billing and a typed API, ready on day one.",
  features: [
    {
      title: "Typed API",
      body: "Zod-validated routes with an OpenAPI spec generated from the same definitions.",
    },
    {
      title: "Teams built in",
      body: "Organizations, roles and email invitations from the first sign-up.",
    },
    // @feature billing
    {
      title: "Billing that fits",
      body: "Stripe subscriptions per organization, with plan limits enforced on the server.",
    },
    // @end billing
    // @feature api-keys
    {
      title: "API keys",
      body: "Organization keys let your customers call the same API your dashboard uses.",
    },
    // @end api-keys
    {
      title: "Runs on the edge",
      body: "One Cloudflare Worker serves the site, the dashboard and the API from D1.",
    },
    {
      title: "Checked end to end",
      body: "Typecheck, lint, format and tests against a real Worker in one command.",
    },
  ],
  faq: [
    // @feature billing
    {
      question: "Can I try it for free?",
      answer: "Yes. The free plan has no time limit. Upgrade when you outgrow its limits.",
    },
    // @end billing
    {
      question: "Can I invite my team?",
      answer: "Invite teammates by email and choose whether they are members or admins.",
    },
    // @feature billing
    {
      question: "Can I cancel any time?",
      answer: "Yes. Manage or cancel your subscription from the billing page in one click.",
    },
    // @end billing
  ],
};
