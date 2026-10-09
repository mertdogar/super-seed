-- A plan an operator gave an organization for free. It wins over the organization's Stripe
-- subscription until the operator removes it.
create table "planGrant" ("organizationId" text not null primary key references "organization" ("id") on delete cascade, "plan" text not null, "grantedBy" text not null references "user" ("id"), "note" text, "createdAt" text not null);
