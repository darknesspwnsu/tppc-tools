import { describe, expect, it } from "vitest";

import { lookupSwapStatus, normalizeSwapLookupKey, sanitizeSwapInput } from "@/features/swap-status/core";
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
    entryCount: 3
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
});
