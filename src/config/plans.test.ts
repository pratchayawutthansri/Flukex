import { describe, expect, it } from "vitest";
import { canUseFeature, getEntitlements, isWithinLimit } from "./plans";

describe("centralized plan entitlements", () => {
  it("gates advanced reports from the centralized config", () => {
    expect(canUseFeature("free", "advancedReportsEnabled")).toBe(false);
    expect(canUseFeature("professional", "advancedReportsEnabled")).toBe(true);
  });

  it("evaluates limits consistently", () => {
    expect(isWithinLimit("free", "maxTables", 4)).toBe(true);
    expect(isWithinLimit("free", "maxTables", getEntitlements("free").maxTables)).toBe(false);
  });
});
