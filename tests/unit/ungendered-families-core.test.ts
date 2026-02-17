import { describe, expect, it } from "vitest";

import { canonicalKey, colorCategory, speciesFromFullName } from "@/features/ungendered-families/utils.js";

describe("ungendered-families utilities", () => {
  it("normalizes canonical keys", () => {
    expect(canonicalKey("Unown A")).toBe("unown");
    expect(canonicalKey("Nidoran♀")).toBe("nidoranf");
  });

  it("extracts species and variant category", () => {
    expect(speciesFromFullName("GoldenMew (?)")).toBe("Mew");
    expect(colorCategory("ShinyMew (?)")).toBe("shiny");
  });
});
