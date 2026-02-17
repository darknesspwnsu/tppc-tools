import type { BoxEntry, BoxOrganizerOptions, BoxOrganizerResult } from "./types";

const RE_GOLD_PREFIX = /^Golden(?=[A-Z(])/;
const RE_SHINY_PREFIX = /^Shiny(?=[A-Z(])/;
const RE_DARK_PREFIX = /^Dark(?=[A-Z(])/;

function parseIntLoose(n: unknown) {
  const cleaned = String(n ?? "").replace(/[^\d]/g, "");
  return cleaned ? parseInt(cleaned, 10) : null;
}

function fmtLevel(n: number) {
  return Number(n).toLocaleString("en-US");
}

function extractGender(name: string) {
  if (name.includes("♀")) return "♀";
  if (name.includes("♂")) return "♂";
  return "";
}

function genderRank(name: string) {
  const g = extractGender(name);
  if (g === "♀") return 0;
  if (g === "♂") return 1;
  return 2;
}

function stripColorPrefix(name: string) {
  if (RE_GOLD_PREFIX.test(name)) return name.replace(RE_GOLD_PREFIX, "").trim();
  if (RE_SHINY_PREFIX.test(name)) return name.replace(RE_SHINY_PREFIX, "").trim();
  if (RE_DARK_PREFIX.test(name)) return name.replace(RE_DARK_PREFIX, "").trim();
  return name.trim();
}

function colorCategory(name: string) {
  if (RE_GOLD_PREFIX.test(name)) return "golden" as const;
  if (RE_SHINY_PREFIX.test(name)) return "shiny" as const;
  if (RE_DARK_PREFIX.test(name)) return "dark" as const;
  return "normal" as const;
}

function compareEntries(a: BoxEntry, b: BoxEntry) {
  const aSpecies = stripColorPrefix(a.name).toLowerCase();
  const bSpecies = stripColorPrefix(b.name).toLowerCase();
  if (aSpecies < bSpecies) return -1;
  if (aSpecies > bSpecies) return 1;
  if (a.levelNum !== b.levelNum) return a.levelNum - b.levelNum;
  return genderRank(a.name) - genderRank(b.name);
}

function formatLine(entry: BoxEntry & { count?: number }, combine: boolean) {
  const base = `${entry.name} (Level: ${fmtLevel(entry.levelNum)})`;
  if (combine && entry.count && entry.count > 1) return `${base} x${entry.count}`;
  return base;
}

function section(title: string, lines: string[]) {
  return `[b]${title}[/b]\n[code]\n${lines.join("\n")}\n[/code]`;
}

function combineEntries(entries: BoxEntry[]) {
  const map = new Map<string, BoxEntry & { count: number }>();
  for (const entry of entries) {
    const key = `${entry.name}|||${entry.levelNum}`;
    const prev = map.get(key);
    if (!prev) map.set(key, { ...entry, count: 1 });
    else prev.count += 1;
  }
  return Array.from(map.values());
}

export function parseBoxInput(raw: string): BoxEntry[] {
  raw = (raw || "").trim();
  if (!raw) return [];

  const entries: BoxEntry[] = [];

  if (/\(Level:\s*[\d,]+\)/i.test(raw)) {
    const text = raw.replace(/\r?\n/g, " ");
    const re = /(.+?)\s*\(Level:\s*([\d,]+)\)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const name = (m[1] || "").trim();
      const levelNum = parseIntLoose((m[2] || "").trim());
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
    const parts = line.split("\t").map((p) => p.trim());
    if (parts.length >= 2 && parts[1]) {
      const levelNum = parseIntLoose(parts[1]);
      if (parts[0] && levelNum !== null) {
        entries.push({ name: parts[0], levelNum });
        continue;
      }
    }

    const m = line.match(/^(.*?)(\d[\d,]*)\s*$/);
    if (m) {
      const name = (m[1] || "").trim();
      const levelNum = parseIntLoose(m[2]);
      if (name && levelNum !== null) entries.push({ name, levelNum });
    }
  }

  return entries;
}

export function organizeBox(entries: BoxEntry[], opts: BoxOrganizerOptions): BoxOrganizerResult {
  const grouped = {
    golden: [] as BoxEntry[],
    shiny: [] as BoxEntry[],
    dark: [] as BoxEntry[],
    normal: [] as BoxEntry[]
  };

  for (const entry of entries) {
    grouped[colorCategory(entry.name)].push(entry);
  }

  const formatGroup = (list: BoxEntry[]) => {
    const sorted = [...list].sort(compareEntries);
    const final = opts.combine ? combineEntries(sorted) : sorted;
    return final.map((entry) => formatLine(entry, opts.combine));
  };

  const parts: string[] = [];
  if (grouped.golden.length) parts.push(section("Golden", formatGroup(grouped.golden)));
  if (grouped.shiny.length) parts.push(section("Shiny", formatGroup(grouped.shiny)));
  if (grouped.dark.length) parts.push(section("Dark", formatGroup(grouped.dark)));
  if (grouped.normal.length) parts.push(section("Normal", formatGroup(grouped.normal)));

  return {
    output: parts.join("\n")
  };
}
