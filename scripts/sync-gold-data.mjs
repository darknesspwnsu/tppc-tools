import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function extractAssignedJson(text, varName) {
  const re = new RegExp(`window\\.${varName}\\s*=\\s*([\\s\\S]*?)\\s*;\\s*$`, "m");
  const m = text.match(re);
  if (!m) {
    throw new Error(`Could not find window.${varName} assignment in file`);
  }
  return m[1].trim();
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const inDir = process.env.GOLD_DATA_DIR || "/Users/shivadeviah/Desktop/tppc/data";
  const outDir = path.join(root, "src", "data", "gold");
  await mkdir(outDir, { recursive: true });

  const timelineJs = path.join(inDir, "golden_timeline.js");
  const rarityJs = path.join(inDir, "golden_rarity.js");

  const timelineText = await readFile(timelineJs, "utf8");
  const rarityText = await readFile(rarityJs, "utf8");

  const timelineJsonText = extractAssignedJson(timelineText, "GOLDEN_RELEASE_TIMELINE");
  const rarityJsonText = extractAssignedJson(rarityText, "GOLDEN_RARITY");

  const timeline = JSON.parse(timelineJsonText);
  const rarity = JSON.parse(rarityJsonText);

  const timelineOut = path.join(outDir, "golden_timeline.json");
  const rarityOut = path.join(outDir, "golden_rarity.json");

  await writeFile(timelineOut, JSON.stringify(timeline, null, 2) + "\n", "utf8");
  await writeFile(rarityOut, JSON.stringify(rarity, null, 2) + "\n", "utf8");

  // eslint-disable-next-line no-console
  console.log(`Wrote ${timelineOut}`);
  // eslint-disable-next-line no-console
  console.log(`Wrote ${rarityOut}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
