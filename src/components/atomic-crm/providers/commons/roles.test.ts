import { describe, expect, it } from "vitest";

import { canAccess } from "./canAccess";
import { CRM_ROLES, PARENT_ROLES, ROLE, ROLE_LABELS } from "./roles";

describe("CRM roles", () => {
  it("defines exactly the supported role hierarchy", () => {
    expect(CRM_ROLES).toEqual([
      ROLE.SUPER_ADMIN,
      ROLE.HEAD_OF_SALES,
      ROLE.RSM,
      ROLE.SSM,
      ROLE.ASM,
      ROLE.BDO,
    ]);
    expect(PARENT_ROLES[ROLE.BDO]).toBe(ROLE.SSM);
    expect(PARENT_ROLES[ROLE.RSM]).toBeNull();
    expect(PARENT_ROLES[ROLE.SUPER_ADMIN]).toBeNull();
    expect(ROLE_LABELS[ROLE.SUPER_ADMIN]).toBe("Super Admin");
  });

  it("allows only Super Admin to access users and global settings", () => {
    expect(canAccess(ROLE.SUPER_ADMIN, { resource: "users", action: "list" })).toBe(true);
    expect(canAccess(ROLE.BDO, { resource: "users", action: "list" })).toBe(false);
    expect(canAccess(ROLE.HEAD_OF_SALES, { resource: "configuration", action: "edit" })).toBe(false);
    expect(canAccess(ROLE.RSM, { resource: "contacts", action: "list" })).toBe(true);
  });
});
