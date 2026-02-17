import { describe, expect, it } from "vitest";

import {
  formatBbcode,
  imageDataToBbcode,
  resolvePokemonByName
} from "@/features/pokesprite-generator/core";

describe("pokesprite-generator core", () => {
  it("resolves a pokemon by name", () => {
    const data = {
      "25": {
        idx: 25,
        slug: { eng: "pikachu" },
        name: { eng: "Pikachu" }
      }
    };
    const out = resolvePokemonByName("pikachu", data);
    expect(out?.slug).toBe("pikachu");
  });

  it("renders 2x2 red pixels into bbcode rows", () => {
    const rgba = new Uint8ClampedArray([
      255, 0, 0, 255, 255, 0, 0, 255,
      255, 0, 0, 255, 255, 0, 0, 255
    ]);
    const lines = imageDataToBbcode(rgba, 2, 2, { xScale: 2, alphaThreshold: 30 });
    const out = formatBbcode(lines, "https://example.com/tools/pokesprite-generator/");
    expect(out).toContain("[color=#FF0000]████[/color]");
  });
});
