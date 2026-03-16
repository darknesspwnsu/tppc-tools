import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FORUM_THREAD_URL = "https://forums.tppc.info/showthread.php?t=642002";
const FORUM_FIRST_POST_URL = "https://forums.tppc.info/showpost.php?p=11515898&postcount=1";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const VARIANTS = ["normal", "shiny", "dark", "golden"];

function decodeHtmlEntities(value) {
  if (!value) return "";
  const named = value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  return named
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const n = Number.parseInt(hex, 16);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    })
    .replace(/&#([0-9]+);/g, (_, dec) => {
      const n = Number.parseInt(dec, 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    });
}

function stripHtmlTags(value) {
  return String(value || "").replace(/<[^>]*>/g, " ");
}

function sanitizeInput(raw) {
  let out = decodeHtmlEntities(String(raw || ""));
  out = out.replace(/\u2642|\u2640/g, " ");
  out = out.replace(/\((?:level|lvl)\s*:?\s*\d+\)/gi, " ");
  out = out.replace(/\((?:\?|m|f|male|female|♂|♀)\)/gi, " ");
  out = out.replace(/\blevel\s*:?\s*\d+\b/gi, " ");
  out = out.replace(/\blvl\s*:?\s*\d+\b/gi, " ");
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

function normalizePokemonKey(raw) {
  const sanitized = sanitizeInput(raw)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  return sanitized
    .replace(/[’'`".,_:\-\/\\()[\]{}]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9!?]/g, "");
}

function variantDisplayName(title, variant) {
  if (variant === "normal") return title;
  const prefix = `${variant.charAt(0).toUpperCase()}${variant.slice(1)}`;
  return title.includes(" ") ? `${prefix} ${title}` : `${prefix}${title}`;
}

function normalizeLineList(rawBlock) {
  const text = decodeHtmlEntities(stripHtmlTags(rawBlock).replace(/<br\s*\/?>/gi, "\n"));
  const out = [];
  const seen = new Set();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\t+/g, " ").replace(/\s+/g, " ").trim();
    if (!line) continue;
    if (!/^[0-9A-Za-z !?'().\-]+$/.test(line)) continue;
    const key = normalizePokemonKey(line);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }

  return out;
}

function parseForumFirstPostLists(html) {
  const messageMatch = html.match(
    /<div id="post_message_[0-9]+">([\s\S]*?)<\/div>\s*<!-- \/ message -->/i
  );
  if (!messageMatch) {
    throw new Error("Could not find forum first-post message block");
  }

  const messageHtml = messageMatch[1];
  const hiddenBlocks = [...messageHtml.matchAll(/<p class="hidden_msg">([\s\S]*?)<\/p>/gi)].map((m) => m[1]);
  if (hiddenBlocks.length < 2) {
    throw new Error("Could not find map/secret hidden list blocks in forum first post");
  }

  return {
    mapPokemon: normalizeLineList(hiddenBlocks[0]),
    secretSwapPokemon: normalizeLineList(hiddenBlocks[1])
  };
}

async function fetchForumPostHtml() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(FORUM_FIRST_POST_URL, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Forum request failed (${response.status})`);
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "";
    if (/charset\s*=\s*(?:iso-8859-1|latin1)/i.test(contentType)) {
      return bytes.toString("latin1");
    }

    const utf8Text = bytes.toString("utf8");
    if (/charset=ISO-8859-1/i.test(utf8Text)) {
      return bytes.toString("latin1");
    }

    return utf8Text;
  } finally {
    clearTimeout(timeout);
  }
}

async function tryReadText(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

function parsePlainLineList(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function loadForumLists({ forumHtmlPath, forumCachePath, disableFetch, root }) {
  const sourcesTried = [];

  if (forumHtmlPath) {
    const html = await readFile(forumHtmlPath, "utf8");
    const lists = parseForumFirstPostLists(html);
    return {
      ...lists,
      source: `forum-html:${path.relative(root, forumHtmlPath)}`
    };
  }

  if (!disableFetch) {
    try {
      const html = await fetchForumPostHtml();
      const lists = parseForumFirstPostLists(html);
      await mkdir(path.dirname(forumCachePath), { recursive: true });
      await writeFile(forumCachePath, html, "utf8");
      return {
        ...lists,
        source: `forum-remote:${FORUM_FIRST_POST_URL}`
      };
    } catch (error) {
      sourcesTried.push(`remote fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const cachedHtml = await tryReadText(forumCachePath);
  if (cachedHtml) {
    try {
      const lists = parseForumFirstPostLists(cachedHtml);
      return {
        ...lists,
        source: `forum-cache:${path.relative(root, forumCachePath)}`
      };
    } catch (error) {
      sourcesTried.push(`cache parse failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const mapTxtPath = path.join(root, "public", "data", "maps.txt");
  const secretTxtPath = path.join(root, "public", "data", "secret_swaps.txt");

  const [mapTxt, secretTxt] = await Promise.all([readFile(mapTxtPath, "utf8"), readFile(secretTxtPath, "utf8")]);

  const mapPokemon = parsePlainLineList(mapTxt);
  const secretSwapPokemon = parsePlainLineList(secretTxt);

  return {
    mapPokemon,
    secretSwapPokemon,
    source: `fallback-files:${path.relative(root, mapTxtPath)},${path.relative(root, secretTxtPath)}${
      sourcesTried.length ? ` (${sourcesTried.join(" | ")})` : ""
    }`
  };
}

function emptyVariantInfo() {
  return {
    currentSecretSwap: false,
    formerSecretSwap: false,
    mapSources: new Set()
  };
}

function headingToVariant(rawHeading) {
  const heading = String(rawHeading || "").trim().toLowerCase();
  if (heading.startsWith("normal")) return "normal";
  if (heading.startsWith("shiny")) return "shiny";
  if (heading.startsWith("dark")) return "dark";
  if (heading.startsWith("golden")) return "golden";
  return null;
}

function isNonMapObtainedLine(line) {
  return /breeding|evolv|promo|contest|silph|team\s+stats|mod\s+pok[eé]mon|tppc\s+staff|golden\s+day|secret\s+swap|quest|prize|event/i.test(
    line
  );
}

function isValidMapTarget(rawTarget) {
  const target = String(rawTarget || "").trim();
  if (!target) return false;

  const lower = target.toLowerCase();
  if (lower.startsWith("category:")) return false;
  if (lower.startsWith("file:")) return false;
  if (lower.startsWith("template:")) return false;
  if (lower.startsWith("help:")) return false;
  if (lower.includes("breeding guide")) return false;
  if (lower.includes("evolution gym")) return false;
  if (lower.includes("secret swap")) return false;

  return /^[0-9A-Za-z !?'().\-]+$/.test(target);
}

function parseWikiTypesForVariantInfo(wikitext) {
  const perVariant = {
    normal: emptyVariantInfo(),
    shiny: emptyVariantInfo(),
    dark: emptyVariantInfo(),
    golden: emptyVariantInfo()
  };

  const lines = wikitext.replace(/\r/g, "").split("\n");
  let inTypesSection = false;
  let activeVariant = null;

  const processLine = (variant, lineInput) => {
    if (!variant) return;
    const line = String(lineInput || "").trim();
    if (!line) return;

    if (/formerly obtained via\s+\[\[:category:secret swap\|secret swap\]\]/i.test(line)) {
      perVariant[variant].formerSecretSwap = true;
    }

    if (/\bobtained via\s+\[\[:category:secret swap\|secret swap\]\]/i.test(line)) {
      perVariant[variant].currentSecretSwap = true;
    }

    if (!/\bobtained via\b/i.test(line)) return;
    if (isNonMapObtainedLine(line)) return;

    const links = [...line.matchAll(/\[\[([^\]]+)\]\]/g)];
    for (const match of links) {
      const rawTarget = match[1].split("|")[0].replace(/^:/, "").split("#")[0].trim();
      if (!isValidMapTarget(rawTarget)) continue;
      perVariant[variant].mapSources.add(rawTarget);
    }
  };

  for (const rawLine of lines) {
    const line = decodeHtmlEntities(rawLine);

    if (/^==\s*types\s*==\s*$/i.test(line.trim())) {
      inTypesSection = true;
      activeVariant = null;
      continue;
    }

    if (inTypesSection && /^==[^=].*==\s*$/i.test(line.trim()) && !/^==\s*types\s*==\s*$/i.test(line.trim())) {
      inTypesSection = false;
      activeVariant = null;
      continue;
    }

    if (!inTypesSection) continue;

    const headingMatch = line.match(/^\*\s*'''([^']+):'''\s*(.*)$/);
    if (headingMatch) {
      activeVariant = headingToVariant(headingMatch[1]);
      processLine(activeVariant, headingMatch[2]);
      continue;
    }

    processLine(activeVariant, line);
  }

  return perVariant;
}

function parseWikiPokemonPages(xmlText) {
  const pages = [];

  const pagePattern = /<page>([\s\S]*?)<\/page>/g;
  let pageMatch;
  while ((pageMatch = pagePattern.exec(xmlText)) !== null) {
    const pageXml = pageMatch[1];
    const nsMatch = pageXml.match(/<ns>(\d+)<\/ns>/);
    if (!nsMatch || Number.parseInt(nsMatch[1], 10) !== 0) continue;

    const titleMatch = pageXml.match(/<title>([\s\S]*?)<\/title>/);
    if (!titleMatch) continue;

    const title = decodeHtmlEntities(titleMatch[1]).trim();
    if (!title || title.includes(":")) continue;

    const textMatch = pageXml.match(/<text[^>]*>([\s\S]*?)<\/text>/);
    if (!textMatch) continue;

    const wikitext = decodeHtmlEntities(textMatch[1]);
    if (!/==\s*types\s*==/i.test(wikitext)) continue;
    if (!/national\s+dex/i.test(wikitext)) continue;

    pages.push({
      title,
      perVariant: parseWikiTypesForVariantInfo(wikitext)
    });
  }

  return pages;
}

function parseVariantAndSpecies(name) {
  const cleaned = sanitizeInput(name);
  const prefixed = cleaned.match(/^(shiny|dark|golden)\s*(.+)$/i);
  if (prefixed) {
    return {
      variant: prefixed[1].toLowerCase(),
      species: prefixed[2].trim() || cleaned
    };
  }

  return {
    variant: "normal",
    species: cleaned
  };
}

function parseArgs(argv) {
  const out = {
    wikiPath: null,
    outPath: null,
    forumHtmlPath: null,
    forumCachePath: null,
    disableForumFetch: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--wiki") {
      out.wikiPath = argv[i + 1] || null;
      i += 1;
      continue;
    }
    if (arg === "--out") {
      out.outPath = argv[i + 1] || null;
      i += 1;
      continue;
    }
    if (arg === "--forum-html") {
      out.forumHtmlPath = argv[i + 1] || null;
      i += 1;
      continue;
    }
    if (arg === "--forum-cache") {
      out.forumCachePath = argv[i + 1] || null;
      i += 1;
      continue;
    }
    if (arg === "--no-forum-fetch") {
      out.disableForumFetch = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return out;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const args = parseArgs(process.argv.slice(2));

  const wikiPath = args.wikiPath ? path.resolve(root, args.wikiPath) : path.join(root, "data", "wiki.xml");
  const outPath = args.outPath ? path.resolve(root, args.outPath) : path.join(root, "public", "data", "swap_status.json");
  const forumCachePath = args.forumCachePath
    ? path.resolve(root, args.forumCachePath)
    : path.join(root, "data", "forum-post-11515898.html");
  const forumHtmlPath = args.forumHtmlPath ? path.resolve(root, args.forumHtmlPath) : null;

  const [wikiXml, forumLists] = await Promise.all([
    readFile(wikiPath, "utf8"),
    loadForumLists({
      forumHtmlPath,
      forumCachePath,
      disableFetch: args.disableForumFetch,
      root
    })
  ]);

  const wikiPages = parseWikiPokemonPages(wikiXml);

  const secretSet = new Set(forumLists.secretSwapPokemon.map((name) => normalizePokemonKey(name)).filter(Boolean));
  const mapSet = new Set(forumLists.mapPokemon.map((name) => normalizePokemonKey(name)).filter(Boolean));

  const entries = new Map();

  const ensureEntry = (displayName, priority) => {
    const key = normalizePokemonKey(displayName);
    if (!key) return null;

    const parsed = parseVariantAndSpecies(displayName);
    const existing = entries.get(key);
    if (!existing) {
      const next = {
        displayName,
        displayPriority: priority,
        species: parsed.species,
        variant: parsed.variant,
        currentSecretSwap: false,
        formerSecretSwap: false,
        currentMap: false,
        mapSources: new Set()
      };
      entries.set(key, next);
      return next;
    }

    if (priority > existing.displayPriority) {
      existing.displayName = displayName;
      existing.displayPriority = priority;
      existing.species = parsed.species;
      existing.variant = parsed.variant;
    }

    return existing;
  };

  for (const page of wikiPages) {
    for (const variant of VARIANTS) {
      const displayName = variantDisplayName(page.title, variant);
      const entry = ensureEntry(displayName, 2);
      if (!entry) continue;

      const variantInfo = page.perVariant[variant];
      if (!variantInfo) continue;

      if (variantInfo.formerSecretSwap) {
        entry.formerSecretSwap = true;
      }

      for (const mapSource of variantInfo.mapSources) {
        entry.mapSources.add(mapSource);
      }
    }
  }

  for (const name of forumLists.secretSwapPokemon) {
    const entry = ensureEntry(name, 3);
    if (entry) entry.currentSecretSwap = true;
  }

  for (const name of forumLists.mapPokemon) {
    const entry = ensureEntry(name, 3);
    if (entry) entry.currentMap = true;
  }

  const baseSpecies = new Set();
  for (const entry of entries.values()) {
    if (!entry.species) continue;
    baseSpecies.add(entry.species);
  }

  for (const species of baseSpecies) {
    for (const variant of VARIANTS) {
      ensureEntry(variantDisplayName(species, variant), 1);
    }
  }

  for (const [key, entry] of entries) {
    entry.currentSecretSwap = entry.currentSecretSwap || secretSet.has(key);
    entry.currentMap = entry.currentMap || mapSet.has(key);
  }

  const outputEntries = {};
  for (const key of [...entries.keys()].sort((a, b) => a.localeCompare(b))) {
    const entry = entries.get(key);
    const mapSources = [...entry.mapSources].sort((a, b) => a.localeCompare(b));

    outputEntries[key] = {
      displayName: entry.displayName,
      species: entry.species,
      variant: entry.variant,
      currentSecretSwap: Boolean(entry.currentSecretSwap),
      formerSecretSwap: Boolean(entry.formerSecretSwap && !entry.currentSecretSwap),
      currentMap: Boolean(entry.currentMap),
      mapSources
    };
  }

  const outJson = {
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceThreadUrl: FORUM_THREAD_URL,
      sourceFirstPostUrl: FORUM_FIRST_POST_URL,
      forumListSource: forumLists.source,
      wikiSourcePath: path.relative(root, wikiPath),
      mapPokemonCount: forumLists.mapPokemon.length,
      secretSwapPokemonCount: forumLists.secretSwapPokemon.length,
      wikiPokemonPagesParsed: wikiPages.length,
      entryCount: Object.keys(outputEntries).length
    },
    entries: outputEntries
  };

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(outJson, null, 2)}\n`, "utf8");

  // eslint-disable-next-line no-console
  console.log(`Wrote ${outPath}`);
  // eslint-disable-next-line no-console
  console.log(`Forum list source: ${forumLists.source}`);
  // eslint-disable-next-line no-console
  console.log(`Entries: ${Object.keys(outputEntries).length}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
