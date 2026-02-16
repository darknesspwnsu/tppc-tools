export type GoldEntry = {
  name: string;
  levelNum: number;
};

export type GoldOrganizerOpts = {
  combine: boolean;
  dupeDesc: boolean;
  plainLevel: boolean;
  missingRows: boolean;
  includeStruckMissing: boolean;
  dropDupes: boolean;
  preferredGender: "M" | "F" | "U";
  goldColor: string;
};

export type GoldenTimelineItemRaw = {
  name: string;
  release_date?: string;
  event?: string;
  date_text?: string;
};

export type GoldenTimelineItem = {
  index: number;
  name: string;
  releaseDate: string;
  event: string;
  dateText: string;
};

export type GoldenRarity = {
  timeline_by_key?: Record<string, { total?: number }>;
};

export type GoldOrganizerResult = {
  output: string;
  droppedOutput: string;
  missingOutput: string;

  parsedCount: number;
  keptGoldCount: number;
  matchedCount: number;
  ignoredCount: number;

  missingRowsCount: number;
  missingPanelCount: number;
  missingTotalCount: number;
  missingFeasibleCount: number;

  droppedCount: number;

  completionCaught: number;
  completionTotal: number;
  completionPercent: string;
};

const MISSING_COLOR = "gray";
const MISSING_COLOR_NON_STRUCK = "red";
const RARITY_STRIKE_THRESHOLD = 22;

const FORCE_STRIKE_MISSING = new Set([
  "goldenhoundour",
  "goldenheracross",
  "goldengloom",
  "goldeneevee",
  "goldensandshrewalola"
]);

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

function stripGender(name: string) {
  return String(name || "")
    .replace(/\s*[♂♀]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractGender(name: string) {
  if (name.includes("♀")) return "♀";
  if (name.includes("♂")) return "♂";
  return "";
}

function canonicalForMatch(name: string) {
  return stripGender(name)
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function stripTrailingForm(name: string) {
  return String(name || "").replace(/\s*\([^)]*\)\s*$/g, "").trim();
}

function stripLeadingShinyDark(name: string) {
  if (RE_SHINY_PREFIX.test(name)) return name.replace(RE_SHINY_PREFIX, "").trim();
  if (RE_DARK_PREFIX.test(name)) return name.replace(RE_DARK_PREFIX, "").trim();
  return name;
}

function looksGold(name: string) {
  const noGender = stripGender(name);
  const stripped = stripLeadingShinyDark(noGender);
  return RE_GOLD_PREFIX.test(stripped);
}

export function normalizeTimeline(raw: readonly GoldenTimelineItemRaw[]): GoldenTimelineItem[] {
  return (Array.isArray(raw) ? raw : [])
    .map((x, i) => ({
      index: i,
      name: String((x && x.name) || "").trim(),
      releaseDate: String((x && x.release_date) || "").trim(),
      event: String((x && x.event) || "").trim(),
      dateText: String((x && x.date_text) || "").trim()
    }))
    .filter((x) => x.name);
}

export function parseInput(raw: string): GoldEntry[] {
  raw = (raw || "").trim();
  if (!raw) return [];

  const entries: GoldEntry[] = [];

  // 1) blob text containing repeated "(Level: X)" entries
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

  // 2) line-by-line formats
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    // tab-separated: "Name<TAB>Level"
    const parts = line.split("\t").map((p) => p.trim());
    if (parts.length >= 2 && parts[1]) {
      const name = parts[0];
      const levelNum = parseIntLoose(parts[1]);
      if (name && levelNum !== null) {
        entries.push({ name, levelNum });
        continue;
      }
    }

    // fallback: line ending in a number
    const m = line.match(/^(.*?)(\d[\d,]*)\s*$/);
    if (m) {
      const name = (m[1] || "").trim();
      const levelNum = parseIntLoose(m[2]);
      if (name && levelNum !== null) entries.push({ name, levelNum });
    }
  }

  return entries;
}

function combineEntries<T extends GoldEntry & { count?: number }>(entries: T[]) {
  const map = new Map<string, T & { count: number }>();
  for (const e of entries) {
    const key = `${e.name}|||${e.levelNum}`;
    const inc =
      typeof e.count === "number" && Number.isFinite(e.count) && e.count > 0
        ? e.count
        : 1;
    const prev = map.get(key);
    if (!prev) map.set(key, { ...e, count: inc });
    else prev.count += inc;
  }
  return Array.from(map.values());
}

function rankGender(g: string) {
  if (g === "♀") return 0;
  if (g === "♂") return 1;
  return 2;
}

function compareWithinSpecies(
  a: GoldEntry,
  b: GoldEntry,
  dupeDesc: boolean
) {
  const al = a.levelNum ?? 0;
  const bl = b.levelNum ?? 0;
  if (al !== bl) return dupeDesc ? bl - al : al - bl;

  const ag = rankGender(extractGender(a.name));
  const bg = rankGender(extractGender(b.name));
  if (ag !== bg) return ag - bg;

  const an = a.name.toLowerCase();
  const bn = b.name.toLowerCase();
  if (an < bn) return -1;
  if (an > bn) return 1;
  return 0;
}

function colorizeName(name: string, color: string) {
  const c = (color || "").trim();
  if (!c) return name;
  return `[color=${c}]${name}[/color]`;
}

function formatLine(
  entry: GoldEntry & { count?: number },
  opts: Pick<GoldOrganizerOpts, "plainLevel" | "combine">,
  goldColor: string
) {
  const nm = colorizeName(entry.name, goldColor);
  const lvl = fmtLevel(entry.levelNum);
  const base = opts.plainLevel ? `${nm} ${lvl}` : `${nm} (Level: ${lvl})`;
  if (opts.combine && entry.count && entry.count > 1) return `${base} x${entry.count}`;
  return base;
}

function wrapCodeBlock(lines: string[]) {
  const body = lines.length ? lines.join("\n") : "";
  return `[code]\n${body}\n[/code]`;
}

function buildTimelineMap(list: GoldenTimelineItem[]) {
  const m = new Map<string, GoldenTimelineItem>();
  for (const item of list) m.set(canonicalForMatch(item.name), item);
  return m;
}

function resolveTimelineMatch(baseName: string, tlMap: Map<string, GoldenTimelineItem>) {
  const fullKey = canonicalForMatch(baseName);
  const exact = tlMap.get(fullKey);
  if (exact) return { timelineItem: exact, speciesKey: fullKey };

  const baseNoForm = stripTrailingForm(baseName);
  const baseKey = canonicalForMatch(baseNoForm);
  const fallback = tlMap.get(baseKey);
  if (fallback) return { timelineItem: fallback, speciesKey: fullKey };

  return { timelineItem: null as GoldenTimelineItem | null, speciesKey: fullKey };
}

function genderBucket(name: string) {
  const g = extractGender(name);
  if (g === "♂") return "M";
  if (g === "♀") return "F";
  return "U";
}

function chooseKeptAndDropped<T extends GoldEntry>(list: T[], preferredGender: "M" | "F" | "U") {
  if (!list.length) return { kept: null as T | null, dropped: [] as T[] };

  const gendersPresent = new Set(list.map((x) => genderBucket(x.name)));
  let candidates = list.slice();
  if (gendersPresent.size > 1 && gendersPresent.has(preferredGender)) {
    candidates = candidates.filter((x) => genderBucket(x.name) === preferredGender);
  }

  candidates.sort((a, b) => compareWithinSpecies(a, b, false));
  const kept = candidates[0];
  const dropped: T[] = [];
  let usedKept = false;
  for (const e of list) {
    if (!usedKept && e === kept) usedKept = true;
    else dropped.push(e);
  }
  return { kept: kept as T, dropped };
}

export function organizeGold(
  entries: GoldEntry[],
  opts: GoldOrganizerOpts,
  timelineRaw: readonly GoldenTimelineItemRaw[],
  rarityRaw: GoldenRarity
): GoldOrganizerResult {
  const timeline = normalizeTimeline(timelineRaw);
  const rarityTimelineByKey = (rarityRaw && rarityRaw.timeline_by_key) || {};

  if (!timeline.length) {
    return {
      output: "",
      droppedOutput: "",
      missingOutput: "",
      parsedCount: entries.length,
      keptGoldCount: 0,
      matchedCount: 0,
      ignoredCount: 0,
      missingRowsCount: 0,
      missingPanelCount: 0,
      missingTotalCount: 0,
      missingFeasibleCount: 0,
      droppedCount: 0,
      completionCaught: 0,
      completionTotal: 0,
      completionPercent: "0.00"
    };
  }

  const rarityTotalForTimelineName = (timelineName: string) => {
    const rec = rarityTimelineByKey[canonicalForMatch(timelineName)];
    const totalRaw = rec?.total;
    const total = Number.isFinite(Number(totalRaw)) ? Number(totalRaw) : 0;
    return total;
  };

  const missingMeta = (timelineName: string) => {
    const total = rarityTotalForTimelineName(timelineName);
    const key = canonicalForMatch(timelineName);
    const shouldStrike = FORCE_STRIKE_MISSING.has(key) || total <= RARITY_STRIKE_THRESHOLD;
    const label = shouldStrike ? `[s]${timelineName}[/s]` : timelineName;
    const c = shouldStrike ? MISSING_COLOR : MISSING_COLOR_NON_STRUCK;
    return {
      shouldStrike,
      total,
      rowLine: `[color=${c}]${label}[/color]`,
      panelLine: shouldStrike ? `[s]${timelineName}[/s]` : timelineName
    };
  };

  const tlMap = buildTimelineMap(timeline);

  type GoldMatchedEntry = GoldEntry & {
    timelineIndex: number;
    timelineName: string;
    matched: boolean;
    speciesKey: string;
  };

  const goldOnly: GoldMatchedEntry[] = [];

  for (const e of entries) {
    if (!looksGold(e.name)) continue;

    const baseName = stripLeadingShinyDark(stripGender(e.name));
    const match = resolveTimelineMatch(baseName, tlMap);
    const timelineItem = match.timelineItem;

    goldOnly.push({
      ...e,
      timelineIndex: timelineItem ? timelineItem.index : Number.POSITIVE_INFINITY,
      timelineName: timelineItem ? timelineItem.name : baseName,
      matched: Boolean(timelineItem),
      speciesKey: match.speciesKey
    });
  }

  const completionCaughtSet = new Set<number>();
  for (const e of goldOnly) {
    if (e.matched) completionCaughtSet.add(e.timelineIndex);
  }

  const matchedOnly = goldOnly.filter((e) => e.matched);
  const ignoredCount = goldOnly.length - matchedOnly.length;

  let keptGold = matchedOnly.slice();
  let droppedEntries: GoldMatchedEntry[] = [];

  if (opts.dropDupes) {
    const bySpecies = new Map<string, GoldMatchedEntry[]>();
    for (const e of matchedOnly) {
      const sk = e.speciesKey;
      const arr = bySpecies.get(sk);
      if (arr) arr.push(e);
      else bySpecies.set(sk, [e]);
    }

    keptGold = [];
    droppedEntries = [];
    for (const arr of bySpecies.values()) {
      const { kept, dropped } = chooseKeptAndDropped(arr, opts.preferredGender);
      if (kept) keptGold.push(kept);
      if (dropped.length) droppedEntries.push(...dropped);
    }
  }

  const matchedGroups = new Map<number, GoldMatchedEntry[]>();
  for (const e of keptGold) {
    const arr = matchedGroups.get(e.timelineIndex);
    if (arr) arr.push(e);
    else matchedGroups.set(e.timelineIndex, [e]);
  }

  const lines: string[] = [];
  const missingPanelLines: string[] = [];
  let missingTotalCount = 0;
  let missingFeasibleCount = 0;
  let missingRowsCount = 0;

  for (const item of timeline) {
    let group = matchedGroups.get(item.index) || [];
    if (!group.length) {
      const miss = missingMeta(item.name);
      missingTotalCount += 1;
      if (!miss.shouldStrike) missingFeasibleCount += 1;
      if (!miss.shouldStrike || opts.includeStruckMissing) {
        missingPanelLines.push(miss.panelLine);
      }
      if (opts.missingRows) {
        lines.push(miss.rowLine);
        missingRowsCount += 1;
      }
      continue;
    }

    group = group.slice().sort((a, b) => compareWithinSpecies(a, b, opts.dupeDesc));
    if (opts.combine && !opts.dropDupes) group = combineEntries(group);
    for (const e of group) lines.push(formatLine(e, opts, opts.goldColor));
  }

  let droppedBucket = droppedEntries
    .slice()
    .sort((a, b) => {
      const ak = stripGender(stripLeadingShinyDark(a.name)).toLowerCase();
      const bk = stripGender(stripLeadingShinyDark(b.name)).toLowerCase();
      if (ak < bk) return -1;
      if (ak > bk) return 1;
      return compareWithinSpecies(a, b, opts.dupeDesc);
    }) as Array<GoldEntry & { count?: number }>;

  if (opts.combine) droppedBucket = combineEntries(droppedBucket);

  const droppedLines = droppedBucket.map((e) => {
    const singleOpts = { plainLevel: opts.plainLevel, combine: opts.combine };
    return formatLine(e, singleOpts, "");
  });

  const completionTotal = timeline.length;
  const completionCaught = completionCaughtSet.size;
  const completionPercent = completionTotal
    ? ((completionCaught * 100) / completionTotal).toFixed(2)
    : "0.00";
  const statsLine =
    `Completion: ${completionPercent}% (${completionCaught} / ${completionTotal} species caught)` +
    ` | Missing feasible: ${missingFeasibleCount}`;

  return {
    output: `${statsLine}\n${wrapCodeBlock(lines)}`,
    droppedOutput: opts.dropDupes ? wrapCodeBlock(droppedLines.length ? droppedLines : ["(none)"]) : "",
    missingOutput: wrapCodeBlock(missingPanelLines.length ? missingPanelLines : ["(none)"]),
    parsedCount: entries.length,
    keptGoldCount: keptGold.length,
    matchedCount: keptGold.length,
    ignoredCount,
    missingRowsCount,
    missingPanelCount: missingPanelLines.length,
    missingTotalCount,
    missingFeasibleCount,
    droppedCount: droppedEntries.length,
    completionCaught,
    completionTotal,
    completionPercent
  };
}
