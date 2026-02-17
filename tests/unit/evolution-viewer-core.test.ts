import { describe, expect, it } from "vitest";

import {
  evolutionKeys,
  lookupEvolution,
  normalizeEvolutionDb,
  renderVariantLevels,
  sentenceCaseKey
} from "@/features/evolution-viewer/core";

describe("evolution-viewer core", () => {
  it("normalizes keys for case-insensitive lookups", () => {
    const db = normalizeEvolutionDb({
      Bulbasaur: { evolves_from: null, lowest_level_possible: { normal: 5 } }
    });

    expect(lookupEvolution("bulbasaur", db)).toBeTruthy();
    expect(lookupEvolution("BULBASAUR", db)).toBeTruthy();
    expect(evolutionKeys(db)).toEqual(["bulbasaur"]);
  });

  it("renders expected variant level shape", () => {
    const levels = renderVariantLevels({
      lowest_level_possible: { normal: 5, shiny: 10 }
    });

    expect(levels).toEqual({
      normal: 5,
      shiny: 10,
      dark: null,
      golden: null
    });
  });

  it("formats display names in sentence case", () => {
    expect(sentenceCaseKey("mr mime")).toBe("Mr Mime");
  });
});

