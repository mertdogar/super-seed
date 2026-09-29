// @feature api-keys
import { apiKey } from "@better-auth/api-key";
// @end api-keys
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
// @feature operator
import { admin } from "better-auth/plugins";
// @end operator
import { createElement } from "react";

import InvitationEmail from "@/emails/invitation";
import MemberJoinedEmail from "@/emails/member-joined";
import PasswordResetEmail from "@/emails/password-reset";
import VerifyEmail from "@/emails/verify-email";
import WelcomeEmail from "@/emails/welcome";
// @feature billing
import { stripePlugin } from "@/features/billing/stripe";
// @end billing
import { site } from "@/site";

import { ac, roles } from "./access";
import { createDb } from "./db";
import { sendEmail } from "./email";

export function createAuth(env: Env, requestUrl: string) {
  const origin = new URL(requestUrl).origin;
  const db = createDb(env);
  return betterAuth({
    appName: site.name,
    baseURL: origin,
    basePath: "/api/auth",
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [origin],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: ({ user, url }) =>
        sendEmail(
          env,
          user.email,
          `Reset your ${site.name} password`,
          createElement(PasswordResetEmail, { baseUrl: origin, email: user.email, url }),
        ),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: ({ user, url }) =>
        sendEmail(
          env,
          user.email,
          `Verify your ${site.name} email`,
          createElement(VerifyEmail, { baseUrl: origin, email: user.email, url }),
        ),
      afterEmailVerification: (user) =>
        sendEmail(
          env,
          user.email,
          `Welcome to ${site.name}`,
          createElement(WelcomeEmail, { baseUrl: origin, name: user.name, email: user.email }),
        ),
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const member = await db
              .selectFrom("member")
              .select("organizationId")
              .where("userId", "=", session.userId)
              .orderBy("createdAt")
              .executeTakeFirst();
            return { data: { ...session, activeOrganizationId: member?.organizationId ?? null } };
          },
        },
      },
    },
    plugins: [
      organization({
        ac,
        roles,
        sendInvitationEmail: ({ id, email, role, organization, inviter }) =>
          sendEmail(
            env,
            email,
            `${inviter.user.name} invited you to ${organization.name} on ${site.name}`,
            createElement(InvitationEmail, {
              baseUrl: origin,
              inviterName: inviter.user.name,
              inviterEmail: inviter.user.email,
              organizationName: organization.name,
              role,
              email,
              url: `${origin}/app/accept-invitation?id=${id}`,
            }),
          ),
        organizationHooks: {
          afterAcceptInvitation: async ({ invitation, user, organization }) => {
            const inviter = await db
              .selectFrom("user")
              .select("email")
              .where("id", "=", invitation.inviterId)
              .executeTakeFirst();
            if (!inviter) return;
            await sendEmail(
              env,
              inviter.email,
              `${user.name} joined ${organization.name}`,
              createElement(MemberJoinedEmail, {
                baseUrl: origin,
                memberName: user.name,
                memberEmail: user.email,
                organizationName: organization.name,
              }),
            );
          },
        },
      }),
      // @feature operator
      admin(),
      // @end operator
      // @feature api-keys
      apiKey({ references: "organization", defaultPrefix: "ss_" }),
      // @end api-keys
      // @feature billing
      stripePlugin(env, db),
      // @end billing
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
