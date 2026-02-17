import { describe, expect, it } from "vitest";

import { canonicalKey, speciesFromFullName, stripPrefixes } from "@/features/ungendered-sorter/core";

describe("ungendered-sorter core", () => {
  it("normalizes keys with unown collapsing", () => {
    expect(canonicalKey("Unown A")).toBe("unown");
    expect(canonicalKey("Nidoran♀")).toBe("nidoranf");
  });

  it("normalizes species labels", () => {
    expect(stripPrefixes("GoldenMew (?)")).toBe("Mew (?)");
    expect(speciesFromFullName("ShinyMew (?)")).toBe("Mew");
  });
});
