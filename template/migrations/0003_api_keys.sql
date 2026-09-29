-- Better Auth api-key plugin: organization keys
create table "apikey" ("id" text not null primary key, "configId" text not null, "name" text, "start" text, "referenceId" text not null, "prefix" text, "key" text not null, "refillInterval" integer, "refillAmount" integer, "lastRefillAt" date, "enabled" integer, "rateLimitEnabled" integer, "rateLimitTimeWindow" integer, "rateLimitMax" integer, "requestCount" integer, "remaining" integer, "lastRequest" date, "expiresAt" date, "createdAt" date not null, "updatedAt" date not null, "permissions" text, "metadata" text);
create index "apikey_configId_idx" on "apikey" ("configId");
create index "apikey_referenceId_idx" on "apikey" ("referenceId");
create index "apikey_key_idx" on "apikey" ("key");
