import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { TOOLS } from "../src/tools/registry";

type RedirectMapping = {
  fromPath: string;
  toPath: string;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function stripLeadingSlash(p: string) {
  return String(p || "").replace(/^\/+/, "");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toRelativeTarget(fromPath: string, toPath: string) {
  const from = stripLeadingSlash(fromPath);
  const canonical = stripLeadingSlash(toPath);

  if (!canonical) return "./";

  const fromDir = path.posix.dirname(from);
  const rel = path.posix.relative(fromDir === "." ? "" : fromDir, canonical);
  const normalized = rel || "./";
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

function makeRedirectHtml(targetHref: string) {
  const escapedHref = escapeHtml(targetHref);
  const serializedTarget = JSON.stringify(targetHref);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Redirecting…</title>
  <link rel="canonical" href="${escapedHref}">
  <meta http-equiv="refresh" content="0;url=${escapedHref}">
  <script>
    (function () {
      var target = ${serializedTarget};
      var search = window.location.search || "";
      var hash = window.location.hash || "";
      window.location.replace(target + search + hash);
    })();
  </script>
</head>
<body>
  <p>Redirecting… <a href="${escapedHref}">Continue</a></p>
</body>
</html>
`;
}

function buildMappings(): RedirectMapping[] {
  const mappings: RedirectMapping[] = [];

  for (const tool of TOOLS) {
    for (const aliasPath of tool.routeAliases || []) {
      mappings.push({
        fromPath: aliasPath,
        toPath: tool.route
      });
    }
  }

  return mappings;
}

async function main() {
  const mappings = buildMappings();

  for (const mapping of mappings) {
    const relFromPath = stripLeadingSlash(mapping.fromPath);
    const outFile = path.join(root, "public", relFromPath);
    const targetHref = toRelativeTarget(mapping.fromPath, mapping.toPath);

    await mkdir(path.dirname(outFile), { recursive: true });
    await writeFile(outFile, makeRedirectHtml(targetHref), "utf8");
  }

  console.log(`Generated ${mappings.length} redirect alias stub(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
