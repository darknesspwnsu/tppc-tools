import { runDexSorter } from "./sorter.js";

import type { FamiliesRunOptions, FamiliesRunResult } from "./types";

export async function runUngenderedFamilies(options: FamiliesRunOptions): Promise<FamiliesRunResult> {
  let statusText = "";
  const statusEl = {
    get textContent() {
      return statusText;
    },
    set textContent(value: string) {
      statusText = String(value || "");
      if (options.onStatus) options.onStatus(statusText);
    }
  };

  const result = await runDexSorter({
    inputText: options.inputText,
    minUngendered: options.minUngendered,
    maxMissing: options.maxMissing,
    flags: options.flags,
    colors: options.colors,
    statusEl,
    partitionOutput: options.partitionOutput,
    missingOnlyFamilyNeeded: options.missingOnlyFamilyNeeded,
    showLevelLabel: options.showLevelLabel,
    dropDuplicates: options.dropDuplicates,
    addMissingInline: options.addMissingInline,
    noGroupSpacing: options.noGroupSpacing,
    highlightRarity: options.highlightRarity,
    annotateRarity: options.annotateRarity,
    omitSummaryStats: options.omitSummaryStats
  });

  return {
    mainText: result.mainText || "",
    missingText: result.missingText || "",
    secondaryText: result.secondaryText || "",
    cloudItems: result.cloudItems || []
  };
}
