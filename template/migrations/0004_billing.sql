-- Better Auth stripe plugin: organization subscriptions
alter table "user" add column "stripeCustomerId" text;
alter table "organization" add column "stripeCustomerId" text;
create table "subscription" ("id" text not null primary key, "plan" text not null, "referenceId" text not null, "stripeCustomerId" text, "stripeSubscriptionId" text, "status" text not null, "periodStart" date, "periodEnd" date, "trialStart" date, "trialEnd" date, "cancelAtPeriodEnd" integer, "cancelAt" date, "canceledAt" date, "endedAt" date, "seats" integer, "billingInterval" text, "stripeScheduleId" text);
create index "subscription_referenceId_idx" on "subscription" ("referenceId");
