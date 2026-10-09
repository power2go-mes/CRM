import { describe, expect, it } from "vitest";

import { canAssignLead, canCreateLead } from "./permissions";

describe("lead creation permissions", () => {
  it("allows global administrators and regional managers to create leads", () => {
    expect(canCreateLead("super_admin")).toBe(true);
    expect(canCreateLead("head_of_sales")).toBe(true);
    expect(canCreateLead("rsm")).toBe(true);
  });

  describe("lead assignment permissions", () => {
    it("allows only ASMs to assign leads to BDOs", () => {
      expect(canAssignLead("asm")).toBe(true);
      expect(canAssignLead("rsm")).toBe(false);
      expect(canAssignLead("ssm")).toBe(false);
      expect(canAssignLead("bdo")).toBe(false);
    });
  });

  it("does not allow BDO users to create leads", () => {
    expect(canCreateLead("bdo")).toBe(false);
  });
});
