import type { ComponentType } from "react";

import { BoxOrganizerTool } from "@/components/tools/BoxOrganizerTool";
import { EvolutionViewerTool } from "@/components/tools/EvolutionViewerTool";
import { ExpUtilitiesTool } from "@/components/tools/ExpUtilitiesTool";
import { GoldOrganizerModuleTool } from "@/components/tools/GoldOrganizerModuleTool";
import { PerfectExpTool } from "@/components/tools/PerfectExpTool";
import { PokespriteGeneratorTool } from "@/components/tools/PokespriteGeneratorTool";
import { RainbowDexTool } from "@/components/tools/RainbowDexTool";
import { SellGuideTool } from "@/components/tools/SellGuideTool";
import { UngenderedDiffTool } from "@/components/tools/UngenderedDiffTool";
import { UngenderedFamiliesTool } from "@/components/tools/UngenderedFamiliesTool";
import { UngenderedSorterTool } from "@/components/tools/UngenderedSorterTool";
import { normalizeEvolutionDb, lookupEvolution } from "@/features/evolution-viewer/core";
import { exp2Level, level2Exp, levelDifference } from "@/features/exp-utilities/core";
import { findOptimalTrainers } from "@/features/perfect-exp/core";
import { imageDataToBbcode, resolvePokemonByName } from "@/features/pokesprite-generator/core";
import { parseInputList, runRainbowDexChecklist } from "@/features/rainbow-dex/core";
import { computeSellGuide, parseMoneyToDollars } from "@/features/sell-guide/core";
import { runUngenderedSorter } from "@/features/ungendered-sorter/core";
import { preprocessEntries, runUngenderedDiff } from "@/features/ungendered-diff/core";
import { runUngenderedFamilies } from "@/features/ungendered-families/core";
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

export const TOOL_MODULES: readonly ToolModule[] = TOOLS.map((tool) => {
  if (tool.slug === "sell-guide") {
    return {
      id: tool.slug,
      slug: tool.slug,
      Component: SellGuideTool as ComponentType<Record<string, never>>,
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
      Component: UngenderedDiffTool as ComponentType<Record<string, never>>,
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
      Component: ExpUtilitiesTool as ComponentType<Record<string, never>>,
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
      Component: EvolutionViewerTool as ComponentType<Record<string, never>>,
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
      Component: PerfectExpTool as ComponentType<Record<string, never>>,
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
      Component: BoxOrganizerTool as ComponentType<Record<string, never>>,
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
      Component: RainbowDexTool as ComponentType<Record<string, never>>,
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
      Component: PokespriteGeneratorTool as ComponentType<Record<string, never>>,
      parse: resolvePokemonByName,
      compute: imageDataToBbcode,
      initialState: {
        pokeInput: "",
        sizePreset: 2
      }
    };
  }

  if (tool.slug === "ungendered-sorter") {
    return {
      id: tool.slug,
      slug: tool.slug,
      Component: UngenderedSorterTool as ComponentType<Record<string, never>>,
      parse: (input: unknown) => String(input || ""),
      compute: runUngenderedSorter,
      initialState: {
        inputText: "",
        minUngendered: 10,
        maxMissing: 20,
        includeGolds: false
      }
    };
  }

  if (tool.slug === "ungendered-families") {
    return {
      id: tool.slug,
      slug: tool.slug,
      Component: UngenderedFamiliesTool as ComponentType<Record<string, never>>,
      compute: runUngenderedFamilies,
      initialState: {
        inputText: "",
        minUngendered: 10,
        maxMissing: 20,
        partitionOutput: false
      }
    };
  }

  if (tool.slug === "gold-organizer") {
    return {
      id: tool.slug,
      slug: tool.slug,
      Component: GoldOrganizerModuleTool as ComponentType<Record<string, never>>,
      initialState: {}
    };
  }

  throw new Error(`No native tool module configured for slug: ${tool.slug}`);
});

export function getToolModule(slug: string): ToolModule | undefined {
  return TOOL_MODULES.find((mod) => mod.slug === slug);
}
