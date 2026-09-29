-- Example tenant resource
create table "project" ("id" text not null primary key, "organizationId" text not null references "organization" ("id") on delete cascade, "name" text not null, "description" text, "createdBy" text references "user" ("id") on delete set null, "createdAt" text not null, "updatedAt" text not null);
create index "project_organizationId_createdAt_idx" on "project" ("organizationId", "createdAt");
