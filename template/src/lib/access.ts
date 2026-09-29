import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
  // @feature api-keys
  apiKey: ["create", "read", "update", "delete"],
  // @end api-keys
} as const;

export const ac = createAccessControl(statement);

export const roles = {
  owner: ac.newRole({
    ...ownerAc.statements,
    // @feature api-keys
    apiKey: ["create", "read", "update", "delete"],
    // @end api-keys
  }),
  admin: ac.newRole({
    ...adminAc.statements,
    // @feature api-keys
    apiKey: ["create", "read", "update", "delete"],
    // @end api-keys
  }),
  member: ac.newRole({ ...memberAc.statements }),
};
