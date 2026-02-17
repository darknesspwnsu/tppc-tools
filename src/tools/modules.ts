import type { ComponentType } from "react";

import { normalizeEvolutionDb, lookupEvolution } from "@/features/evolution-viewer/core";
import { exp2Level, level2Exp, levelDifference } from "@/features/exp-utilities/core";
import { findOptimalTrainers } from "@/features/perfect-exp/core";
import { imageDataToBbcode, resolvePokemonByName } from "@/features/pokesprite-generator/core";
import { parseInputList, runRainbowDexChecklist } from "@/features/rainbow-dex/core";
import { computeSellGuide, parseMoneyToDollars } from "@/features/sell-guide/core";
import { preprocessEntries, runUngenderedDiff } from "@/features/ungendered-diff/core";
import { organizeBox, parseBoxInput } from "@/features/box-organizer/core";
import { TOOLS, type Tool } from "@/tools/registry";

export type ToolModule = {
  id: string;
  slug: Tool["slug"];
  Component: ComponentType<Record<string, never>>;
  parse?: (...args: any[]) => unknown;
  compute?: (...args: any[]) => unknown;
  serialize?: (output: unknown) => string;
  initialState: Record<string, unknown>;
};

function LegacyPlaceholder() {
  return null;
}

export const TOOL_MODULES: readonly ToolModule[] = TOOLS.map((tool) => {
  if (tool.slug === "sell-guide") {
    return {
      id: tool.slug,
      slug: tool.slug,
      Component: LegacyPlaceholder,
      parse: parseMoneyToDollars,
      compute: computeSellGuide,
      initialState: {
        moneyInput: "",
        levelInput: "",
        moneyMeaning: "buyer",
        ppControlled: false,
        exactAmount: false
      }
    };
  }

  if (tool.slug === "ungendered-diff") {
    return {
      id: tool.slug,
      slug: tool.slug,
      Component: LegacyPlaceholder,
      parse: preprocessEntries,
      compute: runUngenderedDiff,
      initialState: {
        input1: "",
        input2: ""
      }
    };
  }

  if (tool.slug === "exp-utilities") {
    return {
      id: tool.slug,
      slug: tool.slug,
      Component: LegacyPlaceholder,
      parse: (rawLevel: unknown) => Number(rawLevel),
      compute: (a: unknown, b: unknown) => ({
        levelToExp: level2Exp(Number(a)),
        expToLevel: exp2Level(Number(a)),
        levelDiff: levelDifference(Number(a), Number(b))
      }),
      initialState: {
        levelInput: "",
        expInput: "",
        levelInput1: "",
        levelInput2: ""
      }
    };
  }

  if (tool.slug === "evolution-viewer") {
    return {
      id: tool.slug,
      slug: tool.slug,
      Component: LegacyPlaceholder,
      parse: normalizeEvolutionDb,
      compute: lookupEvolution,
      initialState: {
        selectedName: ""
      }
    };
  }

  if (tool.slug === "perfect-exp") {
    return {
      id: tool.slug,
      slug: tool.slug,
      Component: LegacyPlaceholder,
      parse: (value: unknown) => Number(value),
      compute: (current: unknown, desired: unknown, table: unknown, isNight: unknown, highestGym: unknown) =>
        findOptimalTrainers(Number(current), Number(desired), table as any, Boolean(isNight), true, Number(highestGym)),
      initialState: {
        currentExp: "",
        desiredExp: "",
        useExpNight: false,
        highestGym: ""
      }
    };
  }

  if (tool.slug === "box-organizer") {
    return {
      id: tool.slug,
      slug: tool.slug,
      Component: LegacyPlaceholder,
      parse: parseBoxInput,
      compute: organizeBox,
      initialState: {
        input: "",
        combine: false
      }
    };
  }

  if (tool.slug === "rainbow-dex") {
    return {
      id: tool.slug,
      slug: tool.slug,
      Component: LegacyPlaceholder,
      parse: parseInputList,
      compute: runRainbowDexChecklist,
      initialState: {
        inputText: "",
        minRarity: 10,
        maxMissing: 20,
        includeGolds: true
      }
    };
  }

  if (tool.slug === "pokesprite-generator") {
    return {
      id: tool.slug,
      slug: tool.slug,
      Component: LegacyPlaceholder,
      parse: resolvePokemonByName,
      compute: imageDataToBbcode,
      initialState: {
        pokeInput: "",
        sizePreset: 2
      }
    };
  }

  return {
    id: tool.slug,
    slug: tool.slug,
    Component: LegacyPlaceholder,
    initialState: {}
  };
});

export function getToolModule(slug: string): ToolModule | undefined {
  return TOOL_MODULES.find((mod) => mod.slug === slug);
}
