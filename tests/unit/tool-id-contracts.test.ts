import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const COMPONENT_PATHS: Record<string, string> = {
  "box-organizer": "src/components/tools/BoxOrganizerTool.tsx",
  "evolution-viewer": "src/components/tools/EvolutionViewerTool.tsx",
  "exp-utilities": "src/components/tools/ExpUtilitiesTool.tsx",
  "gold-organizer": "src/components/GoldOrganizer.tsx",
  "pokesprite-generator": "src/components/tools/PokespriteGeneratorTool.tsx",
  "perfect-exp": "src/components/tools/PerfectExpTool.tsx",
  "rainbow-dex": "src/components/tools/RainbowDexTool.tsx",
  "sell-guide": "src/components/tools/SellGuideTool.tsx",
  "ungendered-diff": "src/components/tools/UngenderedDiffTool.tsx",
  "ungendered-sorter": "src/components/tools/UngenderedSorterTool.tsx",
  "ungendered-families": "src/components/tools/UngenderedFamiliesTool.tsx"
};

async function loadContracts() {
  const file = path.join(ROOT, "tests", "parity", "contracts", "tool-id-contracts.json");
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as Record<string, string[]>;
}

describe("tool ID contracts", () => {
  it("keeps required parity control IDs in native tool components", async () => {
    const contracts = await loadContracts();

    for (const [slug, ids] of Object.entries(contracts)) {
      const relPath = COMPONENT_PATHS[slug];
      expect(relPath, `Missing component mapping for ${slug}`).toBeTruthy();

      const filePath = path.join(ROOT, relPath);
      const source = await fs.readFile(filePath, "utf8");

      for (const id of ids) {
        expect(
          source.includes(`id=\"${id}\"`) || source.includes(`id='${id}'`),
          `${slug} is missing required id=\"${id}\" in ${relPath}`
        ).toBe(true);
      }
    }
  });
});
