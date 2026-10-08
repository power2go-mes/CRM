import { describe, expect, it } from "vitest";

import { canCreateLead } from "./permissions";

describe("lead creation permissions", () => {
  it("allows global administrators and regional managers to create leads", () => {
    expect(canCreateLead("super_admin")).toBe(true);
    expect(canCreateLead("head_of_sales")).toBe(true);
    expect(canCreateLead("rsm")).toBe(true);
  });

  it("does not allow BDO users to create leads", () => {
    expect(canCreateLead("bdo")).toBe(false);
  });
});
