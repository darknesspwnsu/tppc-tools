import { describe, expect, it } from "vitest";

import {
  formatBbcode,
  imageDataToBbcode,
  resolvePokemonByName,
  spriteUrlForPokemon
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
    expect(out?.generationLabel).toBe("Gen 1-8");
  });

  it("resolves gen9 pokemon to the gen9 sprite base", () => {
    const data = {
      "906": {
        idx: 906,
        slug: { eng: "sprigatito" },
        name: { eng: "Sprigatito" }
      }
    };
    const out = resolvePokemonByName("sprigatito", data);
    expect(out?.generationLabel).toBe("Gen 9");
    expect(out ? spriteUrlForPokemon(out) : "").toContain("pokemon-sprites/main/pokemon/regular/sprigatito.png");
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
