import fs from "node:fs";
import path from "node:path";
import { cache } from "react";

export type LegacyToolScript = {
  attrs: Record<string, string | true>;
  code: string;
};

export type LegacyToolPage = {
  styles: string[];
  html: string;
  scripts: LegacyToolScript[];
  fetchShim: string;
};

const BASE_PATH = String(process.env.NEXT_PUBLIC_BASE_PATH || "")
  .trim()
  .replace(/\/+$/, "");

function extractSection(source: string, tag: "head" | "body") {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = source.match(re);
  return m ? m[1] : "";
}

function isAbsoluteUrl(url: string) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url);
}

function ensureTrailingSlash(p: string) {
  if (!p) return "/";
  return p.endsWith("/") ? p : `${p}/`;
}

function withBasePath(pathname: string) {
  const clean = String(pathname || "").trim() || "/";
  if (!BASE_PATH) return clean;
  if (clean === BASE_PATH || clean.startsWith(`${BASE_PATH}/`)) return clean;
  if (clean.startsWith("/")) return `${BASE_PATH}${clean}`;
  return `${BASE_PATH}/${clean}`;
}

function resolveLegacyUrl(legacyPath: string, rel: string) {
  if (isAbsoluteUrl(rel)) return rel;
  if (rel.startsWith("/")) return withBasePath(rel);
  const base = new URL(legacyPath, "https://example.invalid");
  return withBasePath(new URL(rel, base).pathname);
}

function rewriteTagAttrUrls(html: string, legacyPath: string) {
  return html.replace(
    /\b(src|href)=["']([^"']+)["']/gi,
    (_all, attr: string, value: string) => {
      const rewritten = resolveLegacyUrl(legacyPath, value);
      return `${attr}="${rewritten}"`;
    }
  );
}

function stripLegacyNavScripts(html: string) {
  return html
    .replace(/<script[^>]*src=["'][^"']*assets\/tools\.js[^"']*["'][^>]*>\s*<\/script>/gi, "")
    .replace(/<script[^>]*src=["'][^"']*assets\/site\.js[^"']*["'][^>]*>\s*<\/script>/gi, "");
}

function parseScriptAttrs(attrsSource: string) {
  const attrs: Record<string, string | true> = {};
  const re = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrsSource))) {
    const key = (m[1] || "").trim().toLowerCase();
    if (!key) continue;
    const value = m[2] ?? m[3] ?? m[4];
    attrs[key] = value == null ? true : value;
  }
  return attrs;
}

function isStrippedRuntimeScript(attrs: Record<string, string | true>) {
  const src = attrs.src;
  if (typeof src !== "string") return false;
  return /(?:^|\/)assets\/(?:site|tools)\.js(?:[?#].*)?$/i.test(src);
}

function extractScripts(html: string) {
  const scripts: LegacyToolScript[] = [];
  const htmlWithoutScripts = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (_all, rawAttrs: string, code: string) => {
    const attrs = parseScriptAttrs(rawAttrs || "");
    if (isStrippedRuntimeScript(attrs)) return "";
    scripts.push({
      attrs,
      code: code || ""
    });
    return "";
  });

  return { htmlWithoutScripts, scripts };
}

function getLegacyPathDir(legacyPath: string) {
  const dir = path.posix.dirname(legacyPath || "/");
  return ensureTrailingSlash(dir === "." ? "/" : dir);
}

function makeFetchShim(dirPath: string) {
  const safeDir = JSON.stringify(withBasePath(dirPath));
  const safeBasePath = JSON.stringify(BASE_PATH);
  return `
    (function () {
      var BASE_DIR = ${safeDir};
      var BASE_PATH = ${safeBasePath};
      if (!window.fetch) return;
      var orig = window.fetch.bind(window);
      function resolve(input) {
        if (typeof input !== "string") return input;
        if (/^(?:[a-z][a-z0-9+.-]*:|\\/\\/|data:|blob:|#)/i.test(input)) return input;
        if (input.charAt(0) === "/") {
          if (!BASE_PATH) return input;
          return input.indexOf(BASE_PATH + "/") === 0 || input === BASE_PATH ? input : (BASE_PATH + input);
        }
        return new URL(input, window.location.origin + BASE_DIR).toString();
      }
      window.fetch = function (input, init) {
        return orig(resolve(input), init);
      };
    })();
  `.trim();
}

export const loadLegacyToolPage = cache(function loadLegacyToolPage(legacyPath: string): LegacyToolPage {
  const normalized = legacyPath.startsWith("/") ? legacyPath.slice(1) : legacyPath;
  const filePath = path.join(process.cwd(), "legacy", "runtime", normalized);
  const raw = fs.readFileSync(filePath, "utf8");

  const head = extractSection(raw, "head");
  let body = extractSection(raw, "body");

  const styles = Array.from(head.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)).map((m) => m[1] || "");
  const headScripts = Array.from(head.matchAll(/<script\b[\s\S]*?<\/script>/gi)).map((m) => m[0] || "");

  const filteredHeadScripts = stripLegacyNavScripts(headScripts.join("\n"));
  body = stripLegacyNavScripts(body);

  const rewrittenBody = rewriteTagAttrUrls(body, legacyPath);
  const rewrittenHeadScripts = rewriteTagAttrUrls(filteredHeadScripts, legacyPath);
  const combined = `${rewrittenHeadScripts}\n${rewrittenBody}`.trim();
  const { htmlWithoutScripts, scripts } = extractScripts(combined);
  const legacyDir = getLegacyPathDir(legacyPath);
  const fetchShim = makeFetchShim(legacyDir);

  const html = htmlWithoutScripts.trim();

  return { styles, html, scripts, fetchShim };
});
