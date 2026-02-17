import type {
  BoxEntry,
  BoxJunkLists,
  BoxOrganizerContext,
  BoxOrganizerOptions,
  BoxOrganizerResult
} from "./types";

// Use strict prefix matching so names like Darkrai are not treated as "Dark" prefixed variants.
const RE_GOLD_PREFIX = /^Golden(?=[A-Z(])/;
const RE_SHINY_PREFIX = /^Shiny(?=[A-Z(])/;
const RE_DARK_PREFIX = /^Dark(?=[A-Z(])/;

export const DEFAULT_LEGENDS_MYTHICALS_GEN7 = [
  "Articuno",
  "Zapdos",
  "Moltres",
  "Mewtwo",
  "Mew",
  "Raikou",
  "Entei",
  "Suicune",
  "Lugia",
  "Ho-oh",
  "Celebi",
  "Regirock",
  "Regice",
  "Registeel",
  "Latias",
  "Latios",
  "Kyogre",
  "Groudon",
  "Rayquaza",
  "Jirachi",
  "Deoxys",
  "Mesprit",
  "Uxie",
  "Azelf",
  "Dialga",
  "Palkia",
  "Heatran",
  "Regigigas",
  "Giratina",
  "Cresselia",
  "Phione",
  "Manaphy",
  "Darkrai",
  "Shaymin",
  "Arceus",
  "Victini",
  "Cobalion",
  "Terrakion",
  "Virizion",
  "Tornadus",
  "Thundurus",
  "Reshiram",
  "Zekrom",
  "Landorus",
  "Kyurem",
  "Keldeo",
  "Meloetta",
  "Genesect",
  "Xerneas",
  "Yveltal",
  "Zygarde",
  "Diancie",
  "Hoopa",
  "Volcanion",
  "Tapu Koko",
  "Tapu Lele",
  "Tapu Bulu",
  "Tapu Fini",
  "Cosmog",
  "Cosmoem",
  "Solgaleo",
  "Lunala",
  "Necrozma",
  "Magearna",
  "Marshadow",
  "Zeraora"
] as const;

type BoxCategory = "gold" | "shiny" | "dark" | "normal";
type NormalizedEntry = BoxEntry & { category: BoxCategory; count?: number };

type SplitBuckets = {
  gold: NormalizedEntry[];
  shiny: NormalizedEntry[];
  dark: NormalizedEntry[];
  normal: NormalizedEntry[];
};

function normalize(value: string) {
  return String(value || "").trim().toLowerCase();
}

function parseIntLoose(n: unknown) {
  const cleaned = String(n ?? "").replace(/[^\d]/g, "");
  return cleaned ? parseInt(cleaned, 10) : null;
}

function fmtLevel(n: number) {
  return Number(n).toLocaleString("en-US");
}

function hasGenderSymbol(name: string) {
  return name.includes("♂") || name.includes("♀");
}

function extractGender(name: string) {
  if (name.includes("♀")) return "♀";
  if (name.includes("♂")) return "♂";
  return "";
}

function isUnknown(name: string) {
  return /\(\s*\?\s*\)/.test(name);
}

function stripGender(name: string) {
  return name.replace(/\s*[♂♀]\s*/g, " ").replace(/\s+/g, " ").trim();
}

function stripPrefix(name: string) {
  return name
    .replace(/^Shiny(?=[A-Z(])/, "")
    .replace(/^Dark(?=[A-Z(])/, "")
    .replace(/^Golden(?=[A-Z(])/, "")
    .trim();
}

function baseSpeciesName(name: string) {
  const withoutPrefix = stripPrefix(name);
  const withoutGender = stripGender(withoutPrefix);
  return withoutGender.split(" (")[0].trim();
}

function normalizeUEUGCandidateName(name: string) {
  return String(name || "")
    .replace(/\(\s*\?\s*\)/g, "")
    .trim()
    .toLowerCase();
}

function canonicalNoGender(name: string) {
  return stripGender(name).trim().toLowerCase();
}

function dupeGroupKey(name: string) {
  return stripGender(name).toLowerCase();
}

function stripLeadingShinyDarkPrefixOnce(name: string) {
  if (/^Shiny(?=[A-Z(])/.test(name)) return name.replace(/^Shiny(?=[A-Z(])/, "");
  if (/^Dark(?=[A-Z(])/.test(name)) return name.replace(/^Dark(?=[A-Z(])/, "");
  return name;
}

function combinedSDKey(name: string) {
  return stripGender(stripLeadingShinyDarkPrefixOnce(name)).toLowerCase();
}

function shinyDarkRank(entry: NormalizedEntry) {
  if (entry.category === "shiny") return 0;
  if (entry.category === "dark") return 1;
  return 2;
}

function compareEntries(a: NormalizedEntry, b: NormalizedEntry, dupeDesc: boolean, useCombinedSD = false) {
  const aKey = useCombinedSD ? combinedSDKey(a.name) : dupeGroupKey(a.name);
  const bKey = useCombinedSD ? combinedSDKey(b.name) : dupeGroupKey(b.name);

  if (aKey < bKey) return -1;
  if (aKey > bKey) return 1;

  if (a.levelNum !== b.levelNum) {
    return dupeDesc ? b.levelNum - a.levelNum : a.levelNum - b.levelNum;
  }

  const rankGender = (g: string) => (g === "♀" ? 0 : g === "♂" ? 1 : 2);
  const aGender = rankGender(extractGender(a.name));
  const bGender = rankGender(extractGender(b.name));
  if (aGender !== bGender) return aGender - bGender;

  if (useCombinedSD) {
    const aRank = shinyDarkRank(a);
    const bRank = shinyDarkRank(b);
    if (aRank !== bRank) return aRank - bRank;
  }

  const an = a.name.toLowerCase();
  const bn = b.name.toLowerCase();
  if (an < bn) return -1;
  if (an > bn) return 1;
  return 0;
}

function combineEntries(entries: NormalizedEntry[]) {
  const map = new Map<string, NormalizedEntry>();
  for (const entry of entries) {
    const key = `${entry.name}|||${entry.levelNum}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...entry, count: 1 });
      continue;
    }
    prev.count = (prev.count || 1) + 1;
  }
  return Array.from(map.values());
}

function colorizeName(name: string, color: string) {
  const c = String(color || "").trim();
  if (!c) return name;
  return `[color=${c}]${name}[/color]`;
}

function formatLine(entry: NormalizedEntry, opts: BoxOrganizerOptions, color: string) {
  const name = colorizeName(entry.name, color);
  const level = fmtLevel(entry.levelNum);
  return opts.plainLevel ? `${name} ${level}` : `${name} (Level: ${level})`;
}

function formatCombinedLine(entry: NormalizedEntry, opts: BoxOrganizerOptions, color: string) {
  const base = formatLine(entry, opts, color);
  return entry.count && entry.count > 1 ? `${base} x${entry.count}` : base;
}

function makeSubheader(label: string) {
  return `[b]${label}[/b]\n`;
}

function makeSection(title: string, body: string) {
  const clean = String(body || "").trimEnd();
  if (!clean) return "";
  return `[b]${title}[/b]\n[code]\n${clean}\n[/code]\n`;
}

function splitUnknown(list: NormalizedEntry[]) {
  const unknown: NormalizedEntry[] = [];
  const rest: NormalizedEntry[] = [];
  for (const entry of list) {
    (isUnknown(entry.name) ? unknown : rest).push(entry);
  }
  return { unknown, rest };
}

function splitLegends(list: NormalizedEntry[], legendSet: Set<string>) {
  const legends: NormalizedEntry[] = [];
  const rest: NormalizedEntry[] = [];
  for (const entry of list) {
    const base = baseSpeciesName(entry.name);
    if (legendSet.has(normalize(base))) legends.push(entry);
    else rest.push(entry);
  }
  return { legends, rest };
}

function splitUEUG(list: NormalizedEntry[], ueugSet: Set<string>) {
  const ueug: NormalizedEntry[] = [];
  const non: NormalizedEntry[] = [];
  for (const entry of list) {
    const key = normalizeUEUGCandidateName(entry.name);
    if (ueugSet.has(key)) ueug.push(entry);
    else non.push(entry);
  }
  return { ueug, non };
}

function isTypicalGenderForFiltering(entry: BoxEntry, genderlessSet: Set<string>) {
  if (isUnknown(entry.name)) return false;

  const core = canonicalNoGender(entry.name);
  const isGenderlessSpecies = genderlessSet.has(core);

  if (isGenderlessSpecies) return !hasGenderSymbol(entry.name);
  return hasGenderSymbol(entry.name);
}

function shouldFilterAsJunk(entry: BoxEntry, opts: BoxOrganizerOptions, lists: BoxJunkLists) {
  if (!opts.filterJunk) return false;
  if (entry.levelNum === 4) return false;
  if (entry.levelNum >= 1000) return false;
  if (!isTypicalGenderForFiltering(entry, lists.genderlessSet)) return false;

  const core = canonicalNoGender(entry.name);
  return lists.mapsSet.has(core) || lists.swapsSet.has(core);
}

function maybeCombine(list: NormalizedEntry[], combine: boolean) {
  return combine ? combineEntries(list) : list;
}

function sortAndLines(
  list: NormalizedEntry[],
  opts: BoxOrganizerOptions,
  colorPicker: (entry: NormalizedEntry) => string,
  useCombinedSD = false
) {
  const sorted = list.slice().sort((a, b) => compareEntries(a, b, opts.dupeDesc, useCombinedSD));
  return sorted
    .map((entry) => {
      const color = colorPicker(entry);
      return opts.combine ? formatCombinedLine(entry, opts, color) : formatLine(entry, opts, color);
    })
    .join("\n");
}

function sectionForCategory(category: BoxCategory) {
  if (category === "gold") return "Golden";
  if (category === "shiny") return "Shiny";
  if (category === "dark") return "Dark";
  return "Normal";
}

function normalizeEntries(entries: BoxEntry[]) {
  const grouped: SplitBuckets = { gold: [], shiny: [], dark: [], normal: [] };

  for (const sourceEntry of entries) {
    const entry: NormalizedEntry = { ...sourceEntry, category: "normal" };
    if (RE_GOLD_PREFIX.test(entry.name)) entry.category = "gold";
    else if (RE_SHINY_PREFIX.test(entry.name)) entry.category = "shiny";
    else if (RE_DARK_PREFIX.test(entry.name)) entry.category = "dark";
    grouped[entry.category].push(entry);
  }

  return grouped;
}

function cloneBuckets(source: SplitBuckets): SplitBuckets {
  return {
    gold: source.gold.slice(),
    shiny: source.shiny.slice(),
    dark: source.dark.slice(),
    normal: source.normal.slice()
  };
}

function applyCombining(group: SplitBuckets, combine: boolean): SplitBuckets {
  return {
    gold: maybeCombine(group.gold, combine),
    shiny: maybeCombine(group.shiny, combine),
    dark: maybeCombine(group.dark, combine),
    normal: maybeCombine(group.normal, combine)
  };
}

function buildLegendSetFromContext(ctx: BoxOrganizerContext) {
  if (ctx.legendSet && ctx.legendSet.size) return new Set(ctx.legendSet);
  return new Set(DEFAULT_LEGENDS_MYTHICALS_GEN7.map((name) => normalize(name)));
}

export function defaultLegendText() {
  return [...DEFAULT_LEGENDS_MYTHICALS_GEN7].sort((a, b) => a.localeCompare(b)).join("\n");
}

export function buildLegendSet(legendsText: string) {
  const lines = String(legendsText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) {
    return new Set(DEFAULT_LEGENDS_MYTHICALS_GEN7.map((name) => normalize(name)));
  }
  return new Set(lines.map((line) => normalize(line)));
}

export function parseBoxInput(raw: string): BoxEntry[] {
  raw = String(raw || "").trim();
  if (!raw) return [];

  const entries: BoxEntry[] = [];

  if (/\(Level:\s*[\d,]+\)/i.test(raw)) {
    const text = raw.replace(/\r?\n/g, " ");
    const re = /(.+?)\s*\(Level:\s*([\d,]+)\)/gi;
    let match: RegExpExecArray | null;

    while ((match = re.exec(text)) !== null) {
      const name = String(match[1] || "").trim();
      const levelNum = parseIntLoose(match[2]);
      if (!name || levelNum === null) continue;
      entries.push({ name, levelNum });
    }

    if (entries.length) return entries;
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const parts = line.split("\t").map((part) => part.trim());
    if (parts.length >= 2 && parts[1]) {
      const levelNum = parseIntLoose(parts[1]);
      if (parts[0] && levelNum !== null) {
        entries.push({ name: parts[0], levelNum });
        continue;
      }
    }

    const match = line.match(/^(.*?)(\d[\d,]*)\s*$/);
    if (!match) continue;

    const name = String(match[1] || "").trim();
    const levelNum = parseIntLoose(match[2]);
    if (!name || levelNum === null) continue;
    entries.push({ name, levelNum });
  }

  return entries;
}

export async function loadTextSetFromPublic(pathname: string) {
  try {
    const response = await fetch(pathname, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    return new Set(
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.toLowerCase())
    );
  } catch {
    return new Set<string>();
  }
}

export async function loadJunkLists(basePath = "") {
  const cleanBase = String(basePath || "").replace(/\/+$/, "");
  const url = (file: string) => `${cleanBase}/data/${file}`;

  const [mapsSet, swapsSet, genderlessSet] = await Promise.all([
    loadTextSetFromPublic(url("maps.txt")),
    loadTextSetFromPublic(url("secret_swaps.txt")),
    loadTextSetFromPublic(url("genderless.txt"))
  ]);

  return { mapsSet, swapsSet, genderlessSet } satisfies BoxJunkLists;
}

export async function loadUeugList(basePath = "") {
  const cleanBase = String(basePath || "").replace(/\/+$/, "");
  return loadTextSetFromPublic(`${cleanBase}/data/ueug_list.txt`);
}

export function organizeBox(entriesIn: BoxEntry[], opts: BoxOrganizerOptions, ctx: BoxOrganizerContext = {}): BoxOrganizerResult {
  const legendSet = buildLegendSetFromContext(ctx);
  const ueugSet = ctx.ueugSet || new Set<string>();
  const junkLists = ctx.junkLists;

  const filteredEntries = opts.filterJunk && junkLists
    ? entriesIn.filter((entry) => !shouldFilterAsJunk(entry, opts, junkLists))
    : entriesIn.slice();

  const categoriesAll = normalizeEntries(filteredEntries);
  let categories = cloneBuckets(categoriesAll);

  const applyDedicatedUnknownFor = (category: BoxCategory) => {
    return (category !== "gold" || !opts.keepGoldsInGolden) && opts.dedicatedUnknown;
  };

  const applyDedicatedLegendsFor = (category: BoxCategory) => {
    return (category !== "gold" || !opts.keepGoldsInGolden) && opts.dedicatedLegends;
  };

  const dedicatedUnknown: SplitBuckets = { gold: [], shiny: [], dark: [], normal: [] };
  for (const category of ["gold", "shiny", "dark", "normal"] as const) {
    if (!applyDedicatedUnknownFor(category)) continue;
    const split = splitUnknown(categories[category]);
    dedicatedUnknown[category] = split.unknown;
    categories[category] = split.rest;
  }

  const dedicatedLegends: SplitBuckets = { gold: [], shiny: [], dark: [], normal: [] };
  for (const category of ["gold", "shiny", "dark", "normal"] as const) {
    if (!applyDedicatedLegendsFor(category)) continue;
    const split = splitLegends(categories[category], legendSet);
    dedicatedLegends[category] = split.legends;
    categories[category] = split.rest;
  }

  const localUnknown: SplitBuckets = { gold: [], shiny: [], dark: [], normal: [] };
  for (const category of ["gold", "shiny", "dark", "normal"] as const) {
    if (applyDedicatedUnknownFor(category)) continue;
    const split = splitUnknown(categories[category]);
    localUnknown[category] = split.unknown;
    categories[category] = split.rest;
  }

  const localLegends: SplitBuckets = { gold: [], shiny: [], dark: [], normal: [] };
  for (const category of ["gold", "shiny", "dark", "normal"] as const) {
    if (applyDedicatedLegendsFor(category)) continue;
    const split = splitLegends(categories[category], legendSet);
    localLegends[category] = split.legends;
    categories[category] = split.rest;
  }

  categories = applyCombining(categories, opts.combine);
  const localUnknownFinal = applyCombining(localUnknown, opts.combine);
  const localLegendsFinal = applyCombining(localLegends, opts.combine);
  const dedicatedUnknownFinal = applyCombining(dedicatedUnknown, opts.combine);
  const dedicatedLegendsFinal = applyCombining(dedicatedLegends, opts.combine);

  const colorPicker = (entry: NormalizedEntry) => {
    if (entry.category === "gold") return opts.colors.golden;
    if (entry.category === "shiny") return opts.colors.shiny;
    if (entry.category === "dark") return opts.colors.dark;
    return opts.colors.normal;
  };

  const renderNormalUngenderedBlock = (unknownNormalEntries: NormalizedEntry[]) => {
    if (!unknownNormalEntries.length) return { ueug: "", non: "" };

    const split = splitUEUG(unknownNormalEntries, ueugSet);
    const ueugLines = sortAndLines(split.ueug, opts, colorPicker);
    const nonLines = sortAndLines(split.non, opts, colorPicker);

    return {
      ueug: ueugLines ? `${makeSubheader("Unevolved / Ungoldenized")}${ueugLines}` : "",
      non: nonLines ? `${makeSubheader("Evolved / Goldenized")}${nonLines}` : ""
    };
  };

  const buildCategorySection = (category: BoxCategory) => {
    const title = sectionForCategory(category);
    let body = "";

    const mainLines = sortAndLines(categories[category], opts, colorPicker);
    if (mainLines) body += mainLines;

    const shouldShowLocalUnknown = !applyDedicatedUnknownFor(category) || (category === "gold" && opts.keepGoldsInGolden);
    const shouldShowLocalLegends = !applyDedicatedLegendsFor(category) || (category === "gold" && opts.keepGoldsInGolden);

    if (shouldShowLocalUnknown && localUnknownFinal[category].length) {
      if (body) body += "\n\n";
      if (category === "normal") {
        const blocks = renderNormalUngenderedBlock(localUnknownFinal.normal);
        if (blocks.ueug) body += `${blocks.ueug}\n\n`;
        if (blocks.non) body += blocks.non;
      } else {
        body += makeSubheader("Ungendered");
        body += sortAndLines(localUnknownFinal[category], opts, colorPicker);
      }
    }

    if (shouldShowLocalLegends && localLegendsFinal[category].length) {
      if (body) body += "\n\n";
      body += makeSubheader("Legends / Mythicals");
      body += sortAndLines(localLegendsFinal[category], opts, colorPicker);
    }

    return makeSection(title, body);
  };

  const buildDedicatedUnknownSection = () => {
    if (!opts.dedicatedUnknown) return "";
    let body = "";

    const addSub = (label: string, list: NormalizedEntry[], useCombinedSD = false) => {
      if (!list.length) return;
      body += makeSubheader(label);
      body += `${sortAndLines(list, opts, colorPicker, useCombinedSD)}\n\n`;
    };

    if (!opts.keepGoldsInGolden) addSub("Golden", dedicatedUnknownFinal.gold);

    let evolvedGoldenizedBlock = "";
    if (dedicatedUnknownFinal.normal.length) {
      const blocks = renderNormalUngenderedBlock(dedicatedUnknownFinal.normal);
      if (blocks.ueug) body += `${blocks.ueug}\n\n`;
      evolvedGoldenizedBlock = blocks.non;
    }

    if (opts.combineSD) {
      addSub("Shiny / Dark", dedicatedUnknownFinal.shiny.concat(dedicatedUnknownFinal.dark), true);
    } else {
      addSub("Shiny", dedicatedUnknownFinal.shiny);
      addSub("Dark", dedicatedUnknownFinal.dark);
    }

    if (evolvedGoldenizedBlock) body += `${evolvedGoldenizedBlock}\n\n`;

    return makeSection("Ungendered", body.trimEnd());
  };

  const buildDedicatedLegendsSection = () => {
    if (!opts.dedicatedLegends) return "";
    let body = "";

    const addSub = (label: string, list: NormalizedEntry[], useCombinedSD = false) => {
      if (!list.length) return;
      body += makeSubheader(label);
      body += `${sortAndLines(list, opts, colorPicker, useCombinedSD)}\n\n`;
    };

    if (!opts.keepGoldsInGolden) addSub("Golden", dedicatedLegendsFinal.gold);

    if (opts.combineSD) {
      addSub("Shiny / Dark", dedicatedLegendsFinal.shiny.concat(dedicatedLegendsFinal.dark), true);
    } else {
      addSub("Shiny", dedicatedLegendsFinal.shiny);
      addSub("Dark", dedicatedLegendsFinal.dark);
    }

    addSub("Normal", dedicatedLegendsFinal.normal);

    return makeSection("Legends / Mythicals", body.trimEnd());
  };

  let output = "";
  output += buildCategorySection("gold");
  output += buildDedicatedUnknownSection();
  output += buildDedicatedLegendsSection();

  if (opts.combineSD) {
    const mergedMain = categories.shiny.concat(categories.dark);
    const mergedUnknown = localUnknownFinal.shiny.concat(localUnknownFinal.dark);
    const mergedLegends = localLegendsFinal.shiny.concat(localLegendsFinal.dark);

    let body = "";

    const mainLines = sortAndLines(mergedMain, opts, colorPicker, true);
    if (mainLines) body += mainLines;

    if (!opts.dedicatedUnknown && mergedUnknown.length) {
      if (body) body += "\n\n";
      body += makeSubheader("Ungendered");
      body += sortAndLines(mergedUnknown, opts, colorPicker, true);
    }

    if (!opts.dedicatedLegends && mergedLegends.length) {
      if (body) body += "\n\n";
      body += makeSubheader("Legends / Mythicals");
      body += sortAndLines(mergedLegends, opts, colorPicker, true);
    }

    output += makeSection("Shiny / Dark", body);
  } else {
    output += buildCategorySection("shiny");
    output += buildCategorySection("dark");
  }

  output += buildCategorySection("normal");

  return {
    output: output.trimEnd(),
    filteredOutCount: entriesIn.length - filteredEntries.length,
    inputCount: entriesIn.length,
    outputCount: filteredEntries.length
  };
}
