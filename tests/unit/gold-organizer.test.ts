import { describe, expect, it } from "vitest";

import { organizeGold, parseInput, type GoldOrganizerOpts } from "@/lib/gold-organizer";

const DEFAULT_OPTS: GoldOrganizerOpts = {
  combine: false,
  dupeDesc: false,
  plainLevel: false,
  missingRows: true,
  includeStruckMissing: false,
  dropDupes: false,
  preferredGender: "U",
  goldColor: ""
};

describe("parseInput", () => {
  it("parses blob text with (Level: X) chunks", () => {
    const parsed = parseInput("GoldenAbra (Level: 4) DarkPikachu (Level: 12)");
    expect(parsed).toEqual([
      { name: "GoldenAbra", levelNum: 4 },
      { name: "DarkPikachu", levelNum: 12 }
    ]);
  });

  it("parses tab-separated and fallback line formats", () => {
    const parsed = parseInput(["GoldenMew\t5", "ShinyMew 7"].join("\n"));
    expect(parsed).toEqual([
      { name: "GoldenMew", levelNum: 5 },
      { name: "ShinyMew", levelNum: 7 }
    ]);
  });
});

describe("organizeGold", () => {
  it("keeps only golden entries and inserts missing rows", () => {
    const timeline = [{ name: "GoldenBulbasaur" }, { name: "GoldenIvysaur" }];
    const rarity = {
      timeline_by_key: {
        goldenbulbasaur: { total: 100 },
        goldenivysaur: { total: 10 }
      }
    };

    const entries = parseInput(["GoldenBulbasaur (Level: 5)", "DarkPikachu (Level: 2)"].join("\n"));
    const result = organizeGold(entries, DEFAULT_OPTS, timeline, rarity);

    expect(result.parsedCount).toBe(2);
    expect(result.keptGoldCount).toBe(1);
    expect(result.completionCaught).toBe(1);
    expect(result.completionTotal).toBe(2);
    expect(result.completionPercent).toBe("50.00");

    expect(result.output).toContain("Completion: 50.00%");
    expect(result.output).toContain("GoldenBulbasaur (Level: 5)");
    expect(result.output).toContain("GoldenIvysaur");
    expect(result.missingOutput).toContain("(none)");
  });
});
