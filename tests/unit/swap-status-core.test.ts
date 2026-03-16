import { describe, expect, it } from "vitest";

import { filterSwapList, lookupSwapStatus, normalizeSwapLookupKey, sanitizeSwapInput } from "@/features/swap-status/core";
import type { SwapStatusDb } from "@/features/swap-status/types";

const TEST_DB: SwapStatusDb = {
  metadata: {
    generatedAt: "2026-03-16T00:00:00.000Z",
    sourceThreadUrl: "https://forums.tppc.info/showthread.php?t=642002",
    sourceFirstPostUrl: "https://forums.tppc.info/showpost.php?p=11515898&postcount=1",
    forumListSource: "test",
    wikiSourcePath: "data/wiki.xml",
    mapPokemonCount: 0,
    secretSwapPokemonCount: 0,
    wikiPokemonPagesParsed: 0,
    entryCount: 7
  },
  entries: {
    pikachu: {
      displayName: "Pikachu",
      species: "Pikachu",
      variant: "normal",
      currentSecretSwap: true,
      formerSecretSwap: false,
      currentMap: true,
      mapSources: ["Victory Path"]
    },
    absol: {
      displayName: "Absol",
      species: "Absol",
      variant: "normal",
      currentSecretSwap: false,
      formerSecretSwap: true,
      currentMap: true,
      mapSources: []
    },
    goldenomanyte: {
      displayName: "GoldenOmanyte",
      species: "Omanyte",
      variant: "golden",
      currentSecretSwap: false,
      formerSecretSwap: false,
      currentMap: false,
      mapSources: []
    },
    darkzigzagoon: {
      displayName: "DarkZigzagoon",
      species: "Zigzagoon",
      variant: "dark",
      currentSecretSwap: true,
      formerSecretSwap: false,
      currentMap: false,
      mapSources: []
    },
    shinyzigzagoon: {
      displayName: "ShinyZigzagoon",
      species: "Zigzagoon",
      variant: "shiny",
      currentSecretSwap: true,
      formerSecretSwap: false,
      currentMap: false,
      mapSources: []
    },
    darkabra: {
      displayName: "DarkAbra",
      species: "Abra",
      variant: "dark",
      currentSecretSwap: true,
      formerSecretSwap: false,
      currentMap: false,
      mapSources: []
    },
    shinyabra: {
      displayName: "ShinyAbra",
      species: "Abra",
      variant: "shiny",
      currentSecretSwap: true,
      formerSecretSwap: false,
      currentMap: false,
      mapSources: []
    }
  }
};

describe("swap-status core", () => {
  it("normalizes level and gender suffixes", () => {
    expect(sanitizeSwapInput("ShinyPonyta (Galar) (?) (Level: 5) ♂")).toBe("ShinyPonyta (Galar)");
  });

  it("matches common spacing/punctuation variants", () => {
    expect(normalizeSwapLookupKey("Mr Mime")).toBe(normalizeSwapLookupKey("MrMime"));
    expect(normalizeSwapLookupKey("Farfetch'd")).toBe(normalizeSwapLookupKey("Farfetchd"));
  });

  it("returns secret swap + map status when both are active", () => {
    const result = lookupSwapStatus("Pikachu", TEST_DB);
    expect(result.status).toBe("found");
    if (result.status !== "found") return;

    expect(result.entry.currentSecretSwap).toBe(true);
    expect(result.entry.currentMap).toBe(true);
    expect(result.summary).toContain("currently obtainable via secret swap");
    expect(result.notes).toContain("this pokemon is obtainable via Victory Path map");
  });

  it("returns former-swap note when not currently swappable", () => {
    const result = lookupSwapStatus("Absol", TEST_DB);
    expect(result.status).toBe("found");
    if (result.status !== "found") return;

    expect(result.entry.currentSecretSwap).toBe(false);
    expect(result.entry.formerSecretSwap).toBe(true);
    expect(result.notes).toContain("pokemon was formerly obtained via secret swap");
  });

  it("returns not-found for unknown pokemon", () => {
    const result = lookupSwapStatus("DefinitelyNotRealmon", TEST_DB);
    expect(result.status).toBe("not-found");
  });

  it("filters out current swaps from a list", () => {
    const result = filterSwapList(["Pikachu", "Absol", "GoldenOmanyte", "DefinitelyNotRealmon"].join("\n"), "swaps", TEST_DB);

    expect(result.outputText).toBe(["Absol", "GoldenOmanyte", "DefinitelyNotRealmon"].join("\n"));
    expect(result.processedCount).toBe(4);
    expect(result.keptCount).toBe(3);
    expect(result.filteredCount).toBe(1);
    expect(result.filteredByModeCount).toBe(1);
    expect(result.filteredByMapCount).toBe(0);
    expect(result.filteredByJunkCount).toBe(0);
    expect(result.unknownCount).toBe(1);
  });

  it("filters out nonswaps from a list", () => {
    const result = filterSwapList(["Pikachu", "Absol", "GoldenOmanyte", "DefinitelyNotRealmon"].join("\n"), "nonswaps", TEST_DB);

    expect(result.outputText).toBe(["Pikachu", "DefinitelyNotRealmon"].join("\n"));
    expect(result.processedCount).toBe(4);
    expect(result.keptCount).toBe(2);
    expect(result.filteredCount).toBe(2);
    expect(result.filteredByModeCount).toBe(2);
    expect(result.filteredByMapCount).toBe(0);
    expect(result.filteredByJunkCount).toBe(0);
    expect(result.unknownCount).toBe(1);
  });

  it("filters tab-separated box-style lines that include plain level columns", () => {
    const input = ["DarkZigzagoon ♂\t5", "ShinyZigzagoon ♀\t5", "ShinyZigzagoon ♂\t5"].join("\n");
    const result = filterSwapList(input, "swaps", TEST_DB);

    expect(result.outputText).toBe("");
    expect(result.processedCount).toBe(3);
    expect(result.keptCount).toBe(0);
    expect(result.filteredCount).toBe(3);
    expect(result.filteredByModeCount).toBe(3);
    expect(result.filteredByMapCount).toBe(0);
    expect(result.filteredByJunkCount).toBe(0);
    expect(result.unknownCount).toBe(0);
  });

  it("can independently filter out map-obtainable entries", () => {
    const result = filterSwapList(["Absol", "GoldenOmanyte"].join("\n"), "swaps", TEST_DB, { filterOutMaps: true });

    expect(result.outputText).toBe("GoldenOmanyte");
    expect(result.processedCount).toBe(2);
    expect(result.keptCount).toBe(1);
    expect(result.filteredCount).toBe(1);
    expect(result.filteredByModeCount).toBe(0);
    expect(result.filteredByMapCount).toBe(1);
    expect(result.filteredByJunkCount).toBe(0);
    expect(result.unknownCount).toBe(0);
  });

  it("drops known TPPC junk heading lines", () => {
    const input = ["Trainer Information", "My Pokédex", "Pikachu", "DefinitelyNotRealmon"].join("\n");
    const result = filterSwapList(input, "swaps", TEST_DB);

    expect(result.outputText).toBe("DefinitelyNotRealmon");
    expect(result.processedCount).toBe(4);
    expect(result.keptCount).toBe(1);
    expect(result.filteredCount).toBe(3);
    expect(result.filteredByModeCount).toBe(1);
    expect(result.filteredByMapCount).toBe(0);
    expect(result.filteredByJunkCount).toBe(2);
    expect(result.unknownCount).toBe(1);
  });

  it("drops narrative/header lines automatically when structured box rows are present", () => {
    const input = [
      "my profilemy friendstppc trainer's cornerchat room",
      "I Want To Trade...",
      "Tired of people sending you private messages and trying to trade for Pokémon you'd never trade away in a million years?",
      "Would You Trade This Pokémon?",
      "Pokémon\tLevel\tYes\tNo\tUndecided",
      "DarkAbra ♂\t5",
      "ShinyAbra ♂\t5",
      "DarkAbra ♂\t5"
    ].join("\n");

    const result = filterSwapList(input, "swaps", TEST_DB);

    expect(result.outputText).toBe("");
    expect(result.processedCount).toBe(8);
    expect(result.keptCount).toBe(0);
    expect(result.filteredCount).toBe(8);
    expect(result.filteredByModeCount).toBe(3);
    expect(result.filteredByMapCount).toBe(0);
    expect(result.filteredByJunkCount).toBe(5);
    expect(result.unknownCount).toBe(0);
  });
});
