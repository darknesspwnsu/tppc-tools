import { runDexSorter } from "./core-legacy";

import type { UngenderedSorterRunOptions, UngenderedSorterRunResult } from "./types";

export {
  stripPrefixes,
  speciesFromFullName,
  canonicalKey
} from "./core-legacy";

export async function runUngenderedSorter(options: UngenderedSorterRunOptions): Promise<UngenderedSorterRunResult> {
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
    includeGolds: options.includeGolds,
    colors: options.colors,
    statusEl
  });

  return {
    mainText: result.mainText || "",
    missingText: result.missingText || ""
  };
}
