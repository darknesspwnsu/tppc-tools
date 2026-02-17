import { describe, expect, it } from "vitest";

import { organizeBox, parseBoxInput } from "@/features/box-organizer/core";
import type { BoxOrganizerOptions } from "@/features/box-organizer/types";

function defaultOptions(overrides: Partial<BoxOrganizerOptions> = {}): BoxOrganizerOptions {
  return {
    combine: false,
    dupeDesc: false,
    plainLevel: false,
    combineSD: false,
    dedicatedUnknown: false,
    dedicatedLegends: false,
    keepGoldsInGolden: false,
    filterJunk: false,
    colors: {
      golden: "",
      shiny: "",
      dark: "",
      normal: ""
    },
    ...overrides
  };
}

describe("box-organizer core", () => {
  it("parses compact (Level: X) entries", () => {
    const parsed = parseBoxInput("GoldenAbra♂ (Level: 5) DarkEevee♀ (Level: 10)");
    expect(parsed).toEqual([
      { name: "GoldenAbra♂", levelNum: 5 },
      { name: "DarkEevee♀", levelNum: 10 }
    ]);
  });

  it("builds sectioned BBCode output", () => {
    const parsed = parseBoxInput(
      [
        "GoldenAbra♂ (Level: 5)",
        "GoldenAbra♀ (Level: 3)",
        "DarkEevee♀ (Level: 10)",
        "ShinyPikachu♂ (Level: 4)",
        "Bulbasaur (Level: 2)"
      ].join("\n")
    );
    const out = organizeBox(parsed, defaultOptions({ combine: true }));
    expect(out.output).toContain("[b]Golden[/b]");
    expect(out.output).toContain("GoldenAbra♀ (Level: 3)");
    expect(out.output).toContain("[b]Normal[/b]");
  });
});
