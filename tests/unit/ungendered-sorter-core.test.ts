import { describe, expect, it } from "vitest";

import {
  buildGoldenizedKeySet,
  canonicalKey,
  isEffectivelyUeugNormal,
  speciesFromFullName,
  stripPrefixes
} from "@/features/ungendered-sorter/core";

describe("ungendered-sorter core", () => {
  it("normalizes keys with unown collapsing", () => {
    expect(canonicalKey("Unown A")).toBe("unown");
    expect(canonicalKey("Nidoran♀")).toBe("nidoranf");
  });

  it("normalizes species labels", () => {
    expect(stripPrefixes("GoldenMew (?)")).toBe("Mew (?)");
    expect(speciesFromFullName("ShinyMew (?)")).toBe("Mew");
  });

  it("demotes UE/UG entries once a golden variant exists", () => {
    const ueugSet = new Set(["kangaskhan", "mew"]);
    const goldenizedKeySet = buildGoldenizedKeySet([
      { pokemon: "GoldenKangaskhan" },
      { pokemon: "GoldenPikachu" }
    ]);

    expect(isEffectivelyUeugNormal("Kangaskhan (?)", ueugSet, goldenizedKeySet)).toBe(false);
    expect(isEffectivelyUeugNormal("Mew (?)", ueugSet, goldenizedKeySet)).toBe(true);
  });
});
