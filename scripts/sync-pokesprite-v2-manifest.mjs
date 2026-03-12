import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const configPath = path.join(root, "src", "features", "pokesprite-generator", "source-config.json");
  const config = JSON.parse(await readFile(configPath, "utf8"));

  if (!config?.manifestRawUrl || !config?.manifestPath) {
    throw new Error("Missing manifestRawUrl or manifestPath in pokesprite source config.");
  }

  const response = await fetch(config.manifestRawUrl, {
    headers: {
      "user-agent": "tppc-tools/pokesprite-sync"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${config.manifestRawUrl} (${response.status})`);
  }

  const manifest = await response.json();
  if (!manifest?.metadata || !Array.isArray(manifest?.pokemon)) {
    throw new Error("Downloaded manifest does not match the expected pokesprite-v2 schema.");
  }

  const outPath = path.join(root, "public", config.manifestPath.replace(/^\/+/, ""));
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  // eslint-disable-next-line no-console
  console.log(`Wrote ${outPath}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
