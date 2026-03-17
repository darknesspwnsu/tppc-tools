import { describe, expect, it } from "vitest";

import { buildGoldOrganizerReferenceData, organizeGold, parseInput, type GoldOrganizerOpts } from "@/lib/gold-organizer";

const DEFAULT_OPTS: GoldOrganizerOpts = {
  sortMode: "timeline",
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
    expect(result.missingOutput).toContain("GoldenIvysaur");
  });

  it("supports alphabetical sort mode for output rows", () => {
    const timeline = [{ name: "GoldenBulbasaur" }, { name: "GoldenAbra" }];
    const rarity = {
      timeline_by_key: {
        goldenbulbasaur: { total: 100 },
        goldenabra: { total: 100 }
      }
    };

    const entries = parseInput(["GoldenBulbasaur (Level: 5)", "GoldenAbra (Level: 5)"].join("\n"));
    const result = organizeGold(entries, { ...DEFAULT_OPTS, sortMode: "alphabetical", missingRows: false }, timeline, rarity);

    expect(result.output.indexOf("GoldenAbra (Level: 5)")).toBeLessThan(
      result.output.indexOf("GoldenBulbasaur (Level: 5)")
    );
  });

  it("styles missing rows by the gray, strike, and exception thresholds", () => {
    const timeline = [
      { name: "GoldenBulbasaur" },
      { name: "GoldenIvysaur" },
      { name: "GoldenEevee" },
      { name: "GoldenSandshrew (Alola)" }
    ];
    const rarity = {
      timeline_by_key: {
        goldenbulbasaur: { name: "GoldenBulbasaur", total: 9 },
        goldenivysaur: { name: "GoldenIvysaur", total: 10 },
        goldeneevee: { name: "GoldenEevee", total: 200 },
        goldensandshrewalola: { name: "GoldenSandshrew (Alola)", total: 200 }
      }
    };

    const result = organizeGold([], DEFAULT_OPTS, timeline, rarity);

    expect(result.output).toContain('[color=gray][s]GoldenBulbasaur[/s][/color]');
    expect(result.output).toContain('[color=gray]GoldenIvysaur[/color]');
    expect(result.output).toContain('[color=gray]GoldenEevee[/color]');
    expect(result.output).toContain('[color=red]GoldenSandshrew (Alola)[/color]');

    expect(result.missingOutput).not.toContain("GoldenBulbasaur");
    expect(result.missingOutput).toContain("GoldenIvysaur");
    expect(result.missingOutput).toContain("GoldenEevee");
    expect(result.missingOutput).toContain("GoldenSandshrew (Alola)");
    expect(result.missingFeasibleCount).toBe(3);
  });

  it("treats total=0 rarity entries as impossible (ignored/struck, not feasible missing)", () => {
    const timeline = [{ name: "GoldenGolett" }, { name: "GoldenDruddigon" }, { name: "GoldenBulbasaur" }];
    const rarity = {
      timeline_by_key: {
        goldengolett: { name: "GoldenGolett", total: 0 },
        goldendruddigon: { name: "GoldenDruddigon", total: 0 },
        goldenbulbasaur: { name: "GoldenBulbasaur", total: 100 }
      }
    };

    const result = organizeGold([], DEFAULT_OPTS, timeline, rarity);

    expect(result.output).toContain('[color=gray][s]GoldenGolett[/s][/color]');
    expect(result.output).toContain('[color=gray][s]GoldenDruddigon[/s][/color]');
    expect(result.output).toContain('[color=red]GoldenBulbasaur[/color]');

    expect(result.missingOutput).not.toContain("GoldenGolett");
    expect(result.missingOutput).not.toContain("GoldenDruddigon");
    expect(result.missingOutput).toContain("GoldenBulbasaur");

    expect(result.missingFeasibleCount).toBe(1);
    expect(result.completionTotal).toBe(3);
    expect(result.completionPercent).toBe("0.00");
  });

  it("appends an uncolored legend to the main output when no custom gold color is set", () => {
    const timeline = [{ name: "GoldenBulbasaur" }];
    const rarity = {
      timeline_by_key: {
        goldenbulbasaur: { name: "GoldenBulbasaur", total: 100 }
      }
    };

    const result = organizeGold(parseInput("GoldenBulbasaur 5"), DEFAULT_OPTS, timeline, rarity);

    expect(result.output).toContain(
      'key: done, [color="Red"]missing[/color], [color="grey"]unlikely[/color], [s][color="Gray"]ignore[/color][/s]'
    );
  });

  it("appends a legend that reuses the custom gold color for done rows", () => {
    const timeline = [{ name: "GoldenBulbasaur" }];
    const rarity = {
      timeline_by_key: {
        goldenbulbasaur: { name: "GoldenBulbasaur", total: 100 }
      }
    };

    const result = organizeGold(
      parseInput("GoldenBulbasaur 5"),
      { ...DEFAULT_OPTS, goldColor: "#DAA520" },
      timeline,
      rarity
    );

    expect(result.output).toContain(
      'key: [color="#DAA520"]done[/color], [color="Red"]missing[/color], [color="grey"]unlikely[/color], [s][color="Gray"]ignore[/color][/s]'
    );
  });

  it("keeps distinct gold forms when dropping duplicates", () => {
    const timeline = [
      { name: "GoldenPumpkaboo (Small)" },
      { name: "GoldenPumpkaboo (Average)" },
      { name: "GoldenPumpkaboo (Large)" },
      { name: "GoldenPumpkaboo (Super)" }
    ];
    const rarity = {
      timeline_by_key: {
        goldenpumpkaboosmall: { name: "GoldenPumpkaboo (Small)", male: 10, female: 8, ungendered: 0, total: 18 },
        goldenpumpkabooaverage: {
          name: "GoldenPumpkaboo (Average)",
          male: 12,
          female: 9,
          ungendered: 0,
          total: 21
        },
        goldenpumpkaboolarge: { name: "GoldenPumpkaboo (Large)", male: 14, female: 11, ungendered: 0, total: 25 },
        goldenpumpkaboosuper: { name: "GoldenPumpkaboo (Super)", male: 16, female: 13, ungendered: 0, total: 29 }
      }
    };

    const result = organizeGold(
      parseInput(
        [
          "GoldenPumpkaboo (Small) ♂ 5",
          "GoldenPumpkaboo (Average) ♂ 5",
          "GoldenPumpkaboo (Large) ♂ 5",
          "GoldenPumpkaboo (Super) ♂ 5"
        ].join("\n")
      ),
      { ...DEFAULT_OPTS, dropDupes: true, missingRows: false },
      timeline,
      rarity
    );

    expect(result.keptGoldCount).toBe(4);
    expect(result.droppedCount).toBe(0);
    expect(result.output).toContain("GoldenPumpkaboo (Small) ♂ (Level: 5)");
    expect(result.output).toContain("GoldenPumpkaboo (Average) ♂ (Level: 5)");
    expect(result.output).toContain("GoldenPumpkaboo (Large) ♂ (Level: 5)");
    expect(result.output).toContain("GoldenPumpkaboo (Super) ♂ (Level: 5)");
    expect(result.droppedOutput).toContain("(none)");
  });

  it("keeps deerling forms distinct when they fall back to the base timeline row", () => {
    const timeline = [{ name: "GoldenDeerling" }];
    const rarity = {
      timeline_by_key: {
        goldendeerling: {
          name: "GoldenDeerling",
          male: 40,
          female: 36,
          ungendered: 0,
          total: 76,
          forms: [
            { name: "GoldenDeerling (Autumn)", male: 11, female: 9, ungendered: 0, total: 20 },
            { name: "GoldenDeerling (Winter)", male: 13, female: 10, ungendered: 0, total: 23 }
          ]
        }
      }
    };

    const result = organizeGold(
      parseInput(["GoldenDeerling (Autumn) ♂ 5", "GoldenDeerling (Winter) ♂ 5"].join("\n")),
      { ...DEFAULT_OPTS, dropDupes: true, missingRows: false },
      timeline,
      rarity
    );

    expect(result.keptGoldCount).toBe(2);
    expect(result.droppedCount).toBe(0);
    expect(result.output).toContain("GoldenDeerling (Autumn) ♂ (Level: 5)");
    expect(result.output).toContain("GoldenDeerling (Winter) ♂ (Level: 5)");
    expect(result.droppedOutput).toContain("(none)");
  });

  it("keeps rotom appliance forms distinct when they fall back to the base timeline row", () => {
    const timeline = [{ name: "GoldenRotom" }];
    const rarity = {
      timeline_by_key: {
        goldenrotom: {
          name: "GoldenRotom",
          genderless: 55,
          ungendered: 0,
          total: 55,
          forms: [
            { name: "GoldenRotom (Fan)", genderless: 7, ungendered: 0, total: 7 },
            { name: "GoldenRotom (Heat)", genderless: 8, ungendered: 0, total: 8 },
            { name: "GoldenRotom (Wash)", genderless: 9, ungendered: 0, total: 9 }
          ]
        }
      }
    };

    const result = organizeGold(
      parseInput(["GoldenRotom (Fan) 5", "GoldenRotom (Heat) 5", "GoldenRotom (Wash) 5"].join("\n")),
      { ...DEFAULT_OPTS, dropDupes: true, missingRows: false },
      timeline,
      rarity
    );

    expect(result.keptGoldCount).toBe(3);
    expect(result.droppedCount).toBe(0);
    expect(result.output).toContain("GoldenRotom (Fan) (Level: 5)");
    expect(result.output).toContain("GoldenRotom (Heat) (Level: 5)");
    expect(result.output).toContain("GoldenRotom (Wash) (Level: 5)");
    expect(result.droppedOutput).toContain("(none)");
  });

  it("uses the base gold rarity for item-switchable rotom forms", () => {
    const timeline = [{ name: "GoldenRotom" }];
    const rarity = {
      timeline_by_key: {
        goldenrotom: {
          name: "GoldenRotom",
          genderless: 32,
          ungendered: 0,
          total: 32,
          forms: [
            { name: "GoldenRotom (Fan)", genderless: 7, ungendered: 0, total: 7 },
            { name: "GoldenRotom (Heat)", genderless: 8, ungendered: 0, total: 8 }
          ]
        }
      }
    };

    const result = organizeGold(
      parseInput("GoldenRotom (Fan) 5"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity
    );

    expect(result.output).toContain('[b]GoldenRotom (Fan)[/b] (Level: 5)');
    expect(result.output).toContain("32 ig");
    expect(result.output).not.toContain("7 ig");
  });

  it("uses the base lv4 rarity for item-switchable deoxys forms", () => {
    const timeline = [{ name: "GoldenDeoxys" }];
    const rarity = {
      timeline_by_key: {
        goldendeoxys: {
          name: "GoldenDeoxys",
          genderless: 33,
          ungendered: 0,
          total: 33,
          forms: [
            { name: "GoldenDeoxys (Attack)", genderless: 6, ungendered: 0, total: 6 },
            { name: "GoldenDeoxys (Speed)", genderless: 5, ungendered: 0, total: 5 }
          ]
        }
      }
    };
    const referenceData = buildGoldOrganizerReferenceData(
      { pokemon_name: {}, evolutions: {} },
      {
        data: {
          GoldenDeoxys: { genderless: 18, ungendered: 0, total: 18 },
          "GoldenDeoxys (Attack)": { genderless: 4, ungendered: 0, total: 4 }
        }
      }
    );

    const result = organizeGold(
      parseInput("GoldenDeoxys (Attack) 4"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity,
      referenceData
    );

    expect(result.output).toContain('[b][size="4"]GoldenDeoxys (Attack)[/size][/b] (Level: 4)');
    expect(result.output).toContain("18 ig (at this level; 33 overall)");
    expect(result.output).not.toContain("4 ig");
    expect(result.output).not.toContain("6 ig");
  });

  it("bolds and annotates exact level 4 male gold rarity within the lv4 threshold", () => {
    const timeline = [{ name: "GoldenElectrike" }];
    const rarity = {
      timeline_by_key: {
        goldenelectrike: { name: "GoldenElectrike", male: 61, female: 55, ungendered: 0, total: 116 }
      }
    };
    const referenceData = buildGoldOrganizerReferenceData(
      {
        pokemon_name: {},
        evolutions: {}
      },
      {
        data: {
          GoldenElectrike: { male: 27, female: 29, genderless: 0, ungendered: 0, total: 56 }
        }
      }
    );

    const result = organizeGold(
      parseInput("GoldenElectrike ♂ 4"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity,
      referenceData
    );

    expect(result.output).toContain('[b]GoldenElectrike ♂[/b] (Level: 4)');
    expect(result.output).toContain("27 ig (at this level; 61 overall)");
    expect(result.output).not.toContain('[b][size="4"]GoldenElectrike ♂[/size][/b]');
    expect(result.output).not.toContain("116 ig");
  });

  it("uses size 4 emphasis for exact level 4 female rarity between 10 and 19", () => {
    const timeline = [{ name: "GoldenMantine" }];
    const rarity = {
      timeline_by_key: {
        goldenmantine: { name: "GoldenMantine", male: 109, female: 87, genderless: 1, ungendered: 34, total: 231 }
      }
    };
    const referenceData = buildGoldOrganizerReferenceData(
      { pokemon_name: {}, evolutions: {} },
      {
        data: {
          GoldenMantine: { male: 16, female: 17, genderless: 1, ungendered: 19, total: 53 }
        }
      }
    );

    const result = organizeGold(
      parseInput("GoldenMantine ♀ 4"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity,
      referenceData
    );

    expect(result.output).toContain('[b][size="4"]GoldenMantine ♀[/size][/b] (Level: 4)');
    expect(result.output).toContain("17 ig (at this level; 87 overall)");
    expect(result.output).not.toContain("87 ig");
    expect(result.output).not.toContain("231 ig");
  });

  it("uses size 4 emphasis for exact ungendered level 4 rarity between 10 and 19", () => {
    const timeline = [{ name: "GoldenMantine" }];
    const rarity = {
      timeline_by_key: {
        goldenmantine: { name: "GoldenMantine", male: 109, female: 87, genderless: 1, ungendered: 34, total: 231 }
      }
    };
    const referenceData = buildGoldOrganizerReferenceData(
      { pokemon_name: {}, evolutions: {} },
      {
        data: {
          GoldenMantine: { male: 16, female: 17, genderless: 1, ungendered: 19, total: 53 }
        }
      }
    );

    const result = organizeGold(
      parseInput("GoldenMantine 4"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity,
      referenceData
    );

    expect(result.output).toContain('[b][size="4"]GoldenMantine[/size][/b] (Level: 4)');
    expect(result.output).toContain("19 ig (at this level; 34 overall)");
    expect(result.output).not.toContain("34 ig");
    expect(result.output).not.toContain("231 ig");
  });

  it("uses size 5 emphasis for exact level 4 rarity of 9 or below", () => {
    const timeline = [{ name: "GoldenElectrike" }];
    const rarity = {
      timeline_by_key: {
        goldenelectrike: { name: "GoldenElectrike", male: 61, female: 55, ungendered: 0, total: 116 }
      }
    };
    const referenceData = buildGoldOrganizerReferenceData(
      {
        pokemon_name: {},
        evolutions: {}
      },
      {
        data: {
          GoldenElectrike: { male: 9, female: 29, genderless: 0, ungendered: 0, total: 38 }
        }
      }
    );

    const result = organizeGold(
      parseInput("GoldenElectrike ♂ 4"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity,
      referenceData
    );

    expect(result.output).toContain('[b][size="5"]GoldenElectrike ♂[/size][/b] (Level: 4)');
    expect(result.output).toContain("9 ig (at this level; 61 overall)");
  });

  it("uses size 4 emphasis for exact level 4 rarity between 10 and 19", () => {
    const timeline = [{ name: "GoldenElectrike" }];
    const rarity = {
      timeline_by_key: {
        goldenelectrike: { name: "GoldenElectrike", male: 61, female: 55, ungendered: 0, total: 116 }
      }
    };
    const referenceData = buildGoldOrganizerReferenceData(
      {
        pokemon_name: {},
        evolutions: {}
      },
      {
        data: {
          GoldenElectrike: { male: 10, female: 29, genderless: 0, ungendered: 0, total: 39 }
        }
      }
    );

    const result = organizeGold(
      parseInput("GoldenElectrike ♂ 4"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity,
      referenceData
    );

    expect(result.output).toContain('[b][size="4"]GoldenElectrike ♂[/size][/b] (Level: 4)');
    expect(result.output).toContain("10 ig (at this level; 61 overall)");
  });

  it("keeps exact level 4 annotation in sync with bold emphasis", () => {
    const timeline = [{ name: "GoldenTorchic" }];
    const rarity = {
      timeline_by_key: {
        goldentorchic: { name: "GoldenTorchic", male: 220, female: 135, genderless: 0, ungendered: 16, total: 371 }
      }
    };
    const referenceData = buildGoldOrganizerReferenceData(
      {
        pokemon_name: {},
        evolutions: {}
      },
      {
        data: {
          GoldenTorchic: { male: 90, female: 32, genderless: 0, ungendered: 0, total: 122 }
        }
      }
    );

    const result = organizeGold(
      parseInput("GoldenTorchic ♀ 4"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity,
      referenceData
    );

    expect(result.output).toContain('[b]GoldenTorchic ♀[/b] (Level: 4)');
    expect(result.output).not.toContain('[b][size="4"]GoldenTorchic ♀[/size][/b]');
    expect(result.output).not.toContain('[b][size="5"]GoldenTorchic ♀[/size][/b]');
    expect(result.output).toContain("32 ig (at this level; 135 overall)");
    expect(result.output).not.toContain("371 ig");
  });

  it("still requires an exact level 4 gold match and otherwise falls back to overall gender rarity thresholds", () => {
    const timeline = [{ name: "GoldenTorchic" }];
    const rarity = {
      timeline_by_key: {
        goldentorchic: { name: "GoldenTorchic", male: 220, female: 135, genderless: 0, ungendered: 16, total: 371 }
      }
    };
    const referenceData = buildGoldOrganizerReferenceData(
      {
        pokemon_name: {},
        evolutions: {}
      },
      {
        data: {
          Torchic: { male: 11, female: 9, genderless: 0, ungendered: 0, total: 20 }
        }
      }
    );

    const result = organizeGold(
      parseInput("GoldenTorchic ♀ 4"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity,
      referenceData
    );

    expect(result.output).toContain("GoldenTorchic ♀ (Level: 4)");
    expect(result.output).not.toContain("135 ig");
    expect(result.output).not.toContain("9 ig");
    expect(result.output).not.toContain("(at this level)");
  });

  it("uses size 4 emphasis for exact level 4 female rarity between 10 and 19 with overall context", () => {
    const timeline = [{ name: "GoldenLarvitar" }];
    const rarity = {
      timeline_by_key: {
        goldenlarvitar: { name: "GoldenLarvitar", male: 24, female: 14, genderless: 0, ungendered: 0, total: 38 }
      }
    };
    const referenceData = buildGoldOrganizerReferenceData(
      {
        pokemon_name: {},
        evolutions: {}
      },
      {
        data: {
          GoldenLarvitar: { male: 13, female: 11, genderless: 0, ungendered: 0, total: 24 }
        }
      }
    );

    const result = organizeGold(
      parseInput("GoldenLarvitar ♀ 4"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity,
      referenceData
    );

    expect(result.output).toContain('[b][size="4"]GoldenLarvitar ♀[/size][/b] (Level: 4)');
    expect(result.output).toContain("11 ig (at this level; 14 overall)");
    expect(result.output).not.toContain("38 ig");
  });

  it("requires an exact form-inclusive level 4 gold match before using lv4 rarity", () => {
    const timeline = [{ name: "GoldenRaichu (Alola)" }];
    const rarity = {
      timeline_by_key: {
        goldenraichualola: {
          name: "GoldenRaichu (Alola)",
          male: 44,
          female: 36,
          genderless: 0,
          ungendered: 8,
          total: 88
        },
        goldenraichu: {
          name: "GoldenRaichu",
          male: 70,
          female: 65,
          genderless: 0,
          ungendered: 12,
          total: 147
        }
      }
    };
    const referenceData = buildGoldOrganizerReferenceData(
      {
        pokemon_name: {},
        evolutions: {}
      },
      {
        data: {
          GoldenRaichu: { male: 12, female: 10, genderless: 0, ungendered: 4, total: 26 }
        }
      }
    );

    const result = organizeGold(
      parseInput("GoldenRaichu (Alola) ♀ 4"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity,
      referenceData
    );

    expect(result.output).toContain('[b]GoldenRaichu (Alola) ♀[/b] (Level: 4)');
    expect(result.output).toContain("36 ig");
    expect(result.output).not.toContain("10 ig");
    expect(result.output).not.toContain("(at this level)");
  });

  it("does not annotate no-symbol genderless golds above the overall threshold", () => {
    const timeline = [{ name: "GoldenMewtwo" }];
    const rarity = {
      timeline_by_key: {
        goldenmewtwo: { name: "GoldenMewtwo", male: 0, female: 0, genderless: 346, ungendered: 30, total: 376 }
      }
    };

    const result = organizeGold(
      parseInput("GoldenMewtwo 5"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity
    );

    expect(result.output).toContain("GoldenMewtwo (Level: 5)");
    expect(result.output).not.toContain("346 ig");
    expect(result.output).not.toContain("30 ig");
    expect(result.output).not.toContain('[b][size="4"]GoldenMewtwo[/size][/b]');
  });

  it("uses size 4 emphasis for overall rarity between 10 and 29", () => {
    const timeline = [{ name: "GoldenMewtwo" }];
    const rarity = {
      timeline_by_key: {
        goldenmewtwo: { name: "GoldenMewtwo", male: 0, female: 0, genderless: 12, ungendered: 30, total: 42 }
      }
    };

    const result = organizeGold(
      parseInput("GoldenMewtwo 5"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity
    );

    expect(result.output).toContain('[b][size="4"]GoldenMewtwo[/size][/b] (Level: 5)');
    expect(result.output).toContain("12 ig");
    expect(result.output).not.toContain("30 ig");
  });

  it("uses size 5 emphasis for overall rarity of 9 or below", () => {
    const timeline = [{ name: "GoldenMewtwo" }];
    const rarity = {
      timeline_by_key: {
        goldenmewtwo: { name: "GoldenMewtwo", male: 0, female: 0, genderless: 9, ungendered: 30, total: 39 }
      }
    };

    const result = organizeGold(
      parseInput("GoldenMewtwo 5"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity
    );

    expect(result.output).toContain('[b][size="5"]GoldenMewtwo[/size][/b] (Level: 5)');
    expect(result.output).toContain("9 ig");
    expect(result.output).not.toContain("30 ig");
  });

  it("uses bold emphasis for overall rarity between 30 and 49", () => {
    const timeline = [{ name: "GoldenMewtwo" }];
    const rarity = {
      timeline_by_key: {
        goldenmewtwo: { name: "GoldenMewtwo", male: 0, female: 0, genderless: 32, ungendered: 30, total: 62 }
      }
    };

    const result = organizeGold(
      parseInput("GoldenMewtwo 5"),
      { ...DEFAULT_OPTS, highlightRarity: true, annotateRarity: true, missingRows: false },
      timeline,
      rarity
    );

    expect(result.output).toContain('[b]GoldenMewtwo[/b] (Level: 5)');
    expect(result.output).toContain("32 ig");
    expect(result.output).not.toContain("30 ig");
  });
});
