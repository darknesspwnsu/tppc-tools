import { describe, expect, it } from "vitest";

import { exp2Level, level2Exp, levelDifference } from "@/features/exp-utilities/core";

describe("exp-utilities core", () => {
  it("converts level to exp and back", () => {
    expect(level2Exp(100)).toBe(1_000_001);
    expect(exp2Level(1_000_001)).toBeCloseTo(100, 3);
  });

  it("computes level difference from exp gap", () => {
    const diff = levelDifference(5, 10);
    expect(Number.isFinite(diff)).toBe(true);
    expect(diff).toBeGreaterThan(0);
  });
});
