import { describe, expect, it } from "vitest";

import {
  getPokemonForms,
  parsePokemonInput,
  formatBbcode,
  imageDataToBbcode,
  resolvePokemonByName,
  resolvePokemonVariant,
  spriteUrlForPokemon
} from "@/features/pokesprite-generator/core";
import type { PokespriteData } from "@/features/pokesprite-generator/types";

const FIXTURE_MANIFEST: PokespriteData = {
  metadata: {
    repo_owner: "darknesspwnsu",
    repo_name: "pokesprite-v2",
    default_branch: "main",
    version: "0.1.0",
    generated_at: "2026-03-12T00:00:00Z"
  },
  pokemon: [
    {
      species_id: "0025",
      dex: 25,
      species_name: "Pikachu",
      species_slug: "pikachu",
      species_aliases: ["Pikachu"],
      generation: 1,
      default_form: "base",
      forms: [
        {
          id: "base",
          label: "Base",
          aliases: ["default", "regular", "normal"],
          file_slug: "pikachu",
          canonical_form: null,
          has_regular: true,
          has_shiny: true,
          is_generated: false,
          source: "msikma/pokesprite"
        }
      ]
    },
    {
      species_id: "0006",
      dex: 6,
      species_name: "Charizard",
      species_slug: "charizard",
      species_aliases: ["Charizard"],
      generation: 1,
      default_form: "base",
      forms: [
        {
          id: "base",
          label: "Base",
          aliases: ["default", "regular", "normal"],
          file_slug: "charizard",
          canonical_form: null,
          has_regular: true,
          has_shiny: true,
          is_generated: false,
          source: "msikma/pokesprite"
        },
        {
          id: "mega-x",
          label: "Mega X",
          aliases: ["Mega X", "megax"],
          file_slug: "charizard-mega-x",
          canonical_form: null,
          has_regular: true,
          has_shiny: true,
          is_generated: false,
          source: "msikma/pokesprite"
        },
        {
          id: "mega-y",
          label: "Mega Y",
          aliases: ["Mega Y", "megay"],
          file_slug: "charizard-mega-y",
          canonical_form: null,
          has_regular: true,
          has_shiny: true,
          is_generated: false,
          source: "msikma/pokesprite"
        }
      ]
    },
    {
      species_id: "0026",
      dex: 26,
      species_name: "Raichu",
      species_slug: "raichu",
      species_aliases: ["Raichu"],
      generation: 1,
      default_form: "base",
      forms: [
        {
          id: "base",
          label: "Base",
          aliases: ["default", "regular", "normal"],
          file_slug: "raichu",
          canonical_form: null,
          has_regular: true,
          has_shiny: true,
          is_generated: false,
          source: "msikma/pokesprite"
        },
        {
          id: "alola",
          label: "Alolan",
          aliases: ["Alolan", "alola"],
          file_slug: "raichu-alola",
          canonical_form: null,
          has_regular: true,
          has_shiny: true,
          is_generated: false,
          source: "msikma/pokesprite"
        }
      ]
    },
    {
      species_id: "0906",
      dex: 906,
      species_name: "Sprigatito",
      species_slug: "sprigatito",
      species_aliases: ["Sprigatito"],
      generation: 9,
      default_form: "base",
      forms: [
        {
          id: "base",
          label: "Base",
          aliases: ["default", "regular", "normal"],
          file_slug: "sprigatito",
          canonical_form: null,
          has_regular: true,
          has_shiny: true,
          is_generated: false,
          source: "bamq/pokemon-sprites"
        }
      ]
    },
    {
      species_id: "0020",
      dex: 20,
      species_name: "Raticate",
      species_slug: "raticate",
      species_aliases: ["Raticate"],
      generation: 1,
      default_form: "base",
      forms: [
        {
          id: "base",
          label: "Base",
          aliases: ["default", "regular", "normal"],
          file_slug: "raticate",
          canonical_form: null,
          has_regular: true,
          has_shiny: true,
          is_generated: false,
          source: "msikma/pokesprite"
        },
        {
          id: "alola",
          label: "Alolan",
          aliases: ["Alolan", "alola"],
          file_slug: "raticate-alola",
          canonical_form: null,
          has_regular: true,
          has_shiny: true,
          is_generated: false,
          source: "msikma/pokesprite"
        },
        {
          id: "totem",
          label: "Totem",
          aliases: ["Totem", "totem alola"],
          file_slug: "raticate-alola",
          canonical_form: "alola",
          has_regular: true,
          has_shiny: true,
          is_generated: false,
          source: "msikma/pokesprite"
        }
      ]
    },
    {
      species_id: "0133",
      dex: 133,
      species_name: "Eevee",
      species_slug: "eevee",
      species_aliases: ["Eevee"],
      generation: 1,
      default_form: "base",
      forms: [
        {
          id: "base",
          label: "Base",
          aliases: ["default", "regular", "normal"],
          file_slug: "eevee",
          canonical_form: null,
          has_regular: true,
          has_shiny: true,
          is_generated: false,
          source: "msikma/pokesprite"
        },
        {
          id: "partner",
          label: "Partner",
          aliases: ["Partner"],
          file_slug: "eevee-partner",
          canonical_form: null,
          has_regular: true,
          has_shiny: false,
          is_generated: false,
          source: "msikma/pokesprite"
        }
      ]
    }
  ]
};

describe("pokesprite-generator core", () => {
  it("resolves a pokemon by name", () => {
    const out = resolvePokemonByName("pikachu", FIXTURE_MANIFEST);
    expect(out?.speciesSlug).toBe("pikachu");
    expect(out?.formId).toBe("base");
    expect(out?.generationLabel).toBe("Gen 1");
  });

  it("parses shiny mega variants from free text", () => {
    const out = resolvePokemonByName("Shiny Mega Charizard X", FIXTURE_MANIFEST);
    expect(out?.speciesSlug).toBe("charizard");
    expect(out?.formId).toBe("mega-x");
    expect(out?.isShiny).toBe(true);
    expect(out ? spriteUrlForPokemon(out) : "").toContain("pokesprite-v2/v0.1.0/pokemon/shiny/charizard-mega-x.png");
  });

  it("parses regional forms from free text", () => {
    const parsed = parsePokemonInput("Alolan Raichu", FIXTURE_MANIFEST);
    expect(parsed.species?.species_slug).toBe("raichu");
    expect(parsed.form?.id).toBe("alola");
  });

  it("resolves alias forms to their canonical form entry", () => {
    const parsed = parsePokemonInput("Totem Raticate", FIXTURE_MANIFEST);
    expect(parsed.species?.species_slug).toBe("raticate");
    expect(parsed.form?.id).toBe("alola");

    const forms = getPokemonForms(FIXTURE_MANIFEST.pokemon.find((entry) => entry.species_slug === "raticate")!);
    expect(forms.map((form) => form.id)).toEqual(["base", "alola"]);
  });

  it("resolves gen9 pokemon to the pinned v2 sprite base", () => {
    const out = resolvePokemonByName("sprigatito", FIXTURE_MANIFEST);
    expect(out?.generationLabel).toBe("Gen 9");
    expect(out ? spriteUrlForPokemon(out) : "").toContain("pokesprite-v2/v0.1.0/pokemon/regular/sprigatito.png");
  });

  it("reports unavailable shiny combinations instead of falling back", () => {
    const result = resolvePokemonVariant(FIXTURE_MANIFEST, {
      speciesSlug: "eevee",
      formId: "partner",
      isShiny: true
    });
    expect(result.pokemon).toBeNull();
    expect(result.error).toContain("Shiny is not available");
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
