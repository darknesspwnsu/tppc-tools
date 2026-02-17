import type { ComponentType } from "react";

import { normalizeEvolutionDb, lookupEvolution } from "@/features/evolution-viewer/core";
import { exp2Level, level2Exp, levelDifference } from "@/features/exp-utilities/core";
import { computeSellGuide, parseMoneyToDollars } from "@/features/sell-guide/core";
import { preprocessEntries, runUngenderedDiff } from "@/features/ungendered-diff/core";
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
