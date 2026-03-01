import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SOURCE_DIRS = ["app", "src", "scripts"] as const;
const IGNORED_DIRS = new Set([".git", ".next", "node_modules", "out", "coverage", "test-results", "playwright-report"]);
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".json", ".md"]);

type SourceFile = {
  file: string;
  contents: string;
};

async function collectFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (IGNORED_DIRS.has(entry.name)) continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await collectFiles(full)));
      continue;
    }

    if (!EXTENSIONS.has(path.extname(entry.name))) continue;
    out.push(full);
  }

  return out;
}

async function loadSources(): Promise<SourceFile[]> {
  const files = (
    await Promise.all(SOURCE_DIRS.map((dir) => collectFiles(path.join(ROOT, dir))))
  ).flat();

  return Promise.all(
    files.map(async (file) => ({
      file,
      contents: await fs.readFile(file, "utf8")
    }))
  );
}

describe("runtime decommission assertions", () => {
  it("removes runtime injection references from app code", async () => {
    const sources = await loadSources();
    const forbidden = ["EmbeddedToolContent", "src/lib/tool-runtime", "app/tools/[slug]/page", "runtime/embed"];

    const hits = sources
      .flatMap(({ file, contents }) =>
        forbidden
          .filter((token) => contents.includes(token))
          .map((token) => `${path.relative(ROOT, file)} -> ${token}`)
      );

    expect(hits).toEqual([]);
  });

  it("contains no iframe markup in app/source components", async () => {
    const sources = await loadSources();
    const hits = sources
      .filter(({ contents }) => /<iframe\b/i.test(contents))
      .map(({ file }) => path.relative(ROOT, file));

    expect(hits).toEqual([]);
  });

  it("app shell has no bootstrap CDN or old site.css include", async () => {
    const layoutFile = path.join(ROOT, "app", "layout.tsx");
    const layout = await fs.readFile(layoutFile, "utf8");

    expect(layout).not.toContain("bootstrap");
    expect(layout).not.toContain("site.css");
    expect(layout).not.toContain("cdn.jsdelivr.net/npm/bootstrap");
  });
});
