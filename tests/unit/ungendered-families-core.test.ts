import { describe, expect, it } from "vitest";

import {
  buildGoldenizedKeySet,
  canonicalKey,
  colorCategory,
  isEffectivelyUeugNormal,
  speciesFromFullName
} from "@/features/ungendered-families/utils";

describe("ungendered-families utilities", () => {
  it("normalizes canonical keys", () => {
    expect(canonicalKey("Unown A")).toBe("unown");
    expect(canonicalKey("Nidoran♀")).toBe("nidoranf");
  });

  it("extracts species and variant category", () => {
    expect(speciesFromFullName("GoldenMew (?)")).toBe("Mew");
    expect(colorCategory("ShinyMew (?)")).toBe("shiny");
  });

  it("treats goldenized (?) species as non-UE/UG", () => {
    const ueugSet = new Set(["kangaskhan", "mew"]);
    const goldenizedKeySet = buildGoldenizedKeySet([
      { pokemon: "GoldenKangaskhan" }
    ]);

    expect(isEffectivelyUeugNormal("Kangaskhan (?)", ueugSet, goldenizedKeySet)).toBe(false);
    expect(isEffectivelyUeugNormal("Mew (?)", ueugSet, goldenizedKeySet)).toBe(true);
  });
});
