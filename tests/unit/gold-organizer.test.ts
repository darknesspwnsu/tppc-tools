import { describe, expect, it } from "vitest";

import {
  buildGoldOrganizerReferenceData,
  organizeGold,
  parseInput,
  type GoldOrganizerOpts
} from "@/lib/gold-organizer";

const DEFAULT_OPTS: GoldOrganizerOpts = {
  combine: false,
  dupeDesc: false,
  plainLevel: false,
  missingRows: true,
  includeStruckMissing: false,
  dropDupes: false,
  highlightRarity: false,
  annotateRarity: false,
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

  it("highlights and annotates cumulative gold rarity including pre-evos", () => {
    const timeline = [{ name: "GoldenCharmander" }, { name: "GoldenCharmeleon" }];
    const rarity = {
      timeline_by_key: {
        goldencharmander: { name: "GoldenCharmander", total: 6 },
        goldencharmeleon: { name: "GoldenCharmeleon", total: 5 }
      }
    };
    const referenceData = buildGoldOrganizerReferenceData(
      {
        pokemon_name: {
          "0": "Charmander",
          "1": "Charmeleon"
        },
        evolutions: {
          "0": [{ pokemon_name: "Charmeleon" }],
          "1": []
        }
      },
      ""
    );

    const result = organizeGold(
      parseInput("GoldenCharmeleon (Level: 5)"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity,
      referenceData
    );

    expect(result.output).toContain('[b][size="5"]GoldenCharmeleon[/size][/b] (Level: 5)');
    expect(result.output).toContain('11 ig (including pre-evos)');
  });

  it("uses lv4 rarity for level 4 unevolved golds", () => {
    const timeline = [{ name: "GoldenAbra" }];
    const rarity = {
      timeline_by_key: {
        goldenabra: { name: "GoldenAbra", total: 500 }
      }
    };
    const referenceData = buildGoldOrganizerReferenceData(
      {
        pokemon_name: {
          "0": "Abra"
        },
        evolutions: {
          "0": []
        }
      },
      "GoldenAbra - 9"
    );

    const result = organizeGold(
      parseInput("GoldenAbra (Level: 4)"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity,
      referenceData
    );

    expect(result.output).toContain('[b][size="5"]GoldenAbra[/size][/b] (Level: 4)');
    expect(result.output).toContain("9 ig (at this level)");
    expect(result.output).not.toContain("500 ig");
  });
});
