import { describe, expect, it } from "vitest";

import { canonicalKeyExact, parseInputList } from "@/features/rainbow-dex/core";

describe("rainbow-dex core", () => {
  it("keeps unown variants distinct for exact keys", () => {
    expect(canonicalKeyExact("Unown A")).not.toBe(canonicalKeyExact("Unown B"));
  });

  it("parses lines with gender and level", () => {
    const rows = parseInputList("GoldenBulbasaur ♂ 5\nDarkCharmander (Level: 7)");
    expect(rows.length).toBe(2);
    expect(rows[0].variantName).toContain("GoldenBulbasaur");
  });
});
