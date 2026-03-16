import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const MIME = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8"
};

function parseArgs(argv) {
  const out = {
    port: 3100,
    dir: "out"
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--port") {
      out.port = Number.parseInt(argv[i + 1] || "", 10);
      i += 1;
      continue;
    }
    if (arg === "--dir") {
      out.dir = argv[i + 1] || out.dir;
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isFinite(out.port) || out.port <= 0) {
    throw new Error(`Invalid --port value: ${out.port}`);
  }

  return out;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolvePath(rootDir, urlPath) {
  const decoded = decodeURIComponent(urlPath || "/");
  const cleanPath = decoded.split("?")[0].split("#")[0];
  const normalized = path.posix.normalize(cleanPath).replace(/^\.\.(\/|$)/, "");
  const relative = normalized.startsWith("/") ? normalized.slice(1) : normalized;

  const baseCandidate = path.resolve(rootDir, relative);
  if (!baseCandidate.startsWith(rootDir)) {
    return null;
  }

  const candidates = [];
  if (cleanPath.endsWith("/")) {
    candidates.push(path.join(baseCandidate, "index.html"));
  } else {
    candidates.push(baseCandidate);
    if (!path.extname(baseCandidate)) {
      candidates.push(`${baseCandidate}.html`);
      candidates.push(path.join(baseCandidate, "index.html"));
    }
  }

  for (const candidate of candidates) {
    if (!candidate.startsWith(rootDir)) continue;
    if (!(await exists(candidate))) continue;

    const s = await stat(candidate);
    if (!s.isFile()) continue;
    return candidate;
  }

  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = path.resolve(process.cwd(), args.dir);

  const server = createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || "/", `http://${req.headers.host || `127.0.0.1:${args.port}`}`);
      const filePath = await resolvePath(rootDir, requestUrl.pathname);

      if (!filePath) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Not Found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.statusCode = 200;
      res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
      res.setHeader("Cache-Control", "no-cache");

      if (req.method === "HEAD") {
        res.end();
        return;
      }

      createReadStream(filePath).pipe(res);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Internal Server Error");
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(args.port, "127.0.0.1", resolve);
  });

  // eslint-disable-next-line no-console
  console.log(`Serving ${rootDir} on http://127.0.0.1:${args.port}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
