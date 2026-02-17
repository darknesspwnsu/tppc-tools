import { describe, expect, it } from "vitest";

import { preprocessEntries, runUngenderedDiff } from "@/features/ungendered-diff/core";

describe("ungendered-diff core", () => {
  it("parses compact (Level: N) text entries", () => {
    const entries = preprocessEntries("GoldenMew (?) (Level: 5) ShinyMew (?) (Level: 6)");
    expect(entries.map((e) => e.fullName)).toEqual(["GoldenMew (?)", "ShinyMew (?)"]);
  });

  it("builds output blocks with unique and duplicate sections", () => {
    const result = runUngenderedDiff(
      ["ShinyAbra (?) (Level: 5)", "ShinyAbra (?) (Level: 6)", "DarkEevee (?) (Level: 10)"].join("\n"),
      ["DarkEevee (?) (Level: 9)", "GoldenAbra (?) (Level: 1)"].join("\n")
    );

    expect(result.output1).toContain("ShinyAbra (?)");
    expect(result.output2).toContain("GoldenAbra (?)");
    expect(result.output1).toContain("Duplicates within this box");
  });
});

