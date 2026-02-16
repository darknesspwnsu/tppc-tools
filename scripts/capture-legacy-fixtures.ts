import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

import { PARITY_SCENARIOS, installDeterministicNetwork, waitForToolRuntime } from "../tests/parity/scenarios";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const legacyRoot = path.join(root, "legacy", "runtime");
const publicRoot = path.join(root, "public");
const outRoot = path.join(root, "tests", "parity", "golden");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".tsv": "text/tab-separated-values; charset=utf-8",
  ".csv": "text/csv; charset=utf-8"
};

function contentTypeFor(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] || "application/octet-stream";
}

function safeJoin(rootDir: string, relPath: string) {
  const abs = path.resolve(rootDir, relPath);
  if (!abs.startsWith(rootDir)) return null;
  return abs;
}

async function tryRead(filePath: string) {
  try {
    const data = await fs.readFile(filePath);
    return data;
  } catch {
    return null;
  }
}

async function resolveFileFromRoots(urlPath: string) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0] || "/");
  const normalized = cleanPath === "/" ? "/index-legacy.html" : cleanPath;
  const rel = normalized.replace(/^\/+/, "");

  const candidates = [
    safeJoin(legacyRoot, rel),
    safeJoin(publicRoot, rel),
    rel.endsWith("/") ? safeJoin(legacyRoot, `${rel}index.html`) : null,
    rel.endsWith("/") ? safeJoin(publicRoot, `${rel}index.html`) : null
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const data = await tryRead(candidate);
    if (data) return { filePath: candidate, data };
  }

  return null;
}

async function startLegacyServer(port = 4179) {
  const server = http.createServer(async (req, res) => {
    const urlPath = req.url || "/";
    const resolved = await resolveFileFromRoots(urlPath);
    if (!resolved) {
      res.statusCode = 404;
      res.setHeader("content-type", "text/plain; charset=utf-8");
      res.end("Not found");
      return;
    }

    res.statusCode = 200;
    res.setHeader("content-type", contentTypeFor(resolved.filePath));
    res.end(resolved.data);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

  return {
    port,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      })
  };
}

async function ensureOutDir() {
  await fs.mkdir(outRoot, { recursive: true });
}

async function main() {
  await ensureOutDir();

  const server = await startLegacyServer(4179);
  const browser = await chromium.launch();

  try {
    for (const scenario of PARITY_SCENARIOS) {
      const page = await browser.newPage();
      await installDeterministicNetwork(page);

      const url = `http://127.0.0.1:${server.port}${scenario.legacyPath}`;
      console.log(`Capturing ${scenario.id} from ${url}`);

      await page.goto(url, { waitUntil: "domcontentloaded" });
      await waitForToolRuntime(page);
      await scenario.run(page);
      const snapshot = await scenario.extract(page);

      const outFile = path.join(outRoot, `${scenario.id}.json`);
      await fs.writeFile(
        outFile,
        JSON.stringify(
          {
            id: scenario.id,
            slug: scenario.slug,
            source: scenario.legacyPath,
            snapshot
          },
          null,
          2
        ) + "\n",
        "utf8"
      );

      await page.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log(`Captured ${PARITY_SCENARIOS.length} fixture(s) into tests/parity/golden/.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
