import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PINNED_COMMIT = "7788118432a23d2f436f7b895b46b6dc8c8a1ab8";
const OWNER = "Coldsp33d";
const REPO = "Coldsp33d.github.io";

const FILES = [
  "box_organizer.html",
  "exp_utils.html",
  "exp_utils.js",
  "pokesprite_generator.html",
  "perfect_exp.html",
  "perfect_exp.js",
  "sell_guide.html",
  "sort_ungendered.html",
  "rainbow_dex_sorter.html",
  "evolution_viewer.html",
  "diff_ungendered.html",
  "assets/site.css",
  "sort_ungendered_families/index.html",
  "sort_ungendered_families/app.js",
  "sort_ungendered_families/js/cloud.js",
  "sort_ungendered_families/js/darkmode.js",
  "sort_ungendered_families/js/dom.js",
  "sort_ungendered_families/js/fetchers.js",
  "sort_ungendered_families/js/main.js",
  "sort_ungendered_families/js/sorter.js",
  "sort_ungendered_families/js/utils.js"
] as const;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outRoot = path.join(root, "spec", "legacy-baseline", "coldsp33d-staging");

function rawUrl(filePath: string) {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${PINNED_COMMIT}/${filePath}`;
}

async function fetchText(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }
  return response.text();
}

async function main() {
  await mkdir(outRoot, { recursive: true });

  for (const filePath of FILES) {
    const url = rawUrl(filePath);
    const target = path.join(outRoot, filePath);
    const text = await fetchText(url);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, text, "utf8");
    console.log(`synced: ${filePath}`);
  }

  console.log(`\nSynced ${FILES.length} files from ${OWNER}/${REPO}@${PINNED_COMMIT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
