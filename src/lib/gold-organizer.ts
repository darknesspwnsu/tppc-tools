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
  highlightRarity: boolean;
  annotateRarity: boolean;
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

export type GoldenRarityForm = {
  name?: string;
  male?: number;
  female?: number;
  genderless?: number;
  ungendered?: number;
  total?: number;
};

export type GoldenRarityRecord = {
  name?: string;
  male?: number;
  female?: number;
  genderless?: number;
  ungendered?: number;
  total?: number;
  forms?: GoldenRarityForm[];
};

export type GoldenRarity = {
  timeline_by_key?: Record<string, GoldenRarityRecord>;
};

export type Level4RarityJson = {
  meta?: {
    source?: string;
    generatedAt?: number;
    lastUpdatedText?: string | null;
    count?: number;
    warnings?: number;
  };
  data?: Record<string, GoldenRarityRecord | GoldenRarityForm>;
};

export type GoldOrganizerEvolutionRaw = {
  pokemon_name?: Record<string, string>;
  evolutions?: Record<string, Array<{ pokemon_name?: string }>>;
};

export type GoldOrganizerReferenceData = {
  parentsByKey: Map<string, Set<string>>;
  depthByKey: Record<string, number>;
  speciesDisplayByKey: Record<string, string>;
  nameToDexByKey: Record<string, number>;
  level4RarityByKey: Map<string, GoldenRarityRecord | GoldenRarityForm>;
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
const MISSING_COLOR_NON_GRAY = "red";
const MISSING_GRAY_THRESHOLD = 22;
const MISSING_STRIKE_THRESHOLD = 10;
const OVERALL_RARITY_BOLD_THRESHOLD = 50;
const OVERALL_RARITY_SIZE5_THRESHOLD = 9;
const OVERALL_RARITY_SIZE4_THRESHOLD = 29;
const LEVEL4_RARITY_BOLD_THRESHOLD = 50;
const LEVEL4_RARITY_SIZE5_THRESHOLD = 9;
const LEVEL4_RARITY_SIZE4_THRESHOLD = 19;

const EXCEPTIONALLY_HARD_TO_GET = new Set([
  "goldenhoundour",
  "goldenheracross",
  "goldengloom",
  "goldeneevee"
]);
const BASE_RARITY_GOLD_FORM_SPECIES = new Set(["rotom", "deoxys"]);

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

function stripLeadingVariantPrefixes(name: string) {
  let out = String(name || "").trim();
  if (RE_SHINY_PREFIX.test(out)) out = out.replace(RE_SHINY_PREFIX, "").trim();
  if (RE_DARK_PREFIX.test(out)) out = out.replace(RE_DARK_PREFIX, "").trim();
  if (RE_GOLD_PREFIX.test(out)) out = out.replace(RE_GOLD_PREFIX, "").trim();
  return out;
}

function speciesFromVariantName(name: string) {
  return stripTrailingForm(stripLeadingVariantPrefixes(name));
}

function extractForm(name: string) {
  const match = stripLeadingVariantPrefixes(name).match(/\(([^)]+)\)/);
  if (!match) return "";
  return (match[1] || "").trim();
}

function goldBaseRarityName(name: string) {
  return `Golden${speciesFromVariantName(name)}`;
}

function goldRarityLookupName(name: string) {
  const form = extractForm(name);
  const speciesKey = canonicalForMatch(speciesFromVariantName(name));
  if (form && BASE_RARITY_GOLD_FORM_SPECIES.has(speciesKey)) {
    return goldBaseRarityName(name);
  }
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

export function parseLevel4RarityData(raw: string | Level4RarityJson) {
  const out = new Map<string, GoldenRarityRecord | GoldenRarityForm>();

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [name, record] of Object.entries(raw.data ?? {})) {
      const trimmedName = String(name || "").trim();
      if (!trimmedName || !record || typeof record !== "object") continue;
      out.set(canonicalForMatch(trimmedName), { name: trimmedName, ...record });
    }
    return out;
  }

  const trimmed = String(raw || "").trim();
  if (trimmed.startsWith("{")) {
    try {
      return parseLevel4RarityData(JSON.parse(trimmed) as Level4RarityJson);
    } catch {
      // fall through to the legacy text parser
    }
  }

  const re = /(.+?)\s*-\s*(\d+)\b/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(trimmed)) !== null) {
    const name = (match[1] || "").trim();
    const total = parseInt(match[2], 10);
    if (!name || !Number.isFinite(total)) continue;
    out.set(canonicalForMatch(name), { name, total });
  }

  return out;
}

function ensureSet<K>(map: Map<K, Set<K>>, key: K) {
  const existing = map.get(key);
  if (existing) return existing;
  const created = new Set<K>();
  map.set(key, created);
  return created;
}

export function buildGoldOrganizerReferenceData(
  evolutionRaw: GoldOrganizerEvolutionRaw,
  level4RarityRaw: string | Level4RarityJson
): GoldOrganizerReferenceData {
  const pokemonName = evolutionRaw?.pokemon_name ?? {};
  const evolutions = evolutionRaw?.evolutions ?? {};

  const graph = new Map<string, Set<string>>();
  const parentsByKey = new Map<string, Set<string>>();
  const childrenByKey = new Map<string, Set<string>>();
  const speciesDisplayByKey: Record<string, string> = {};
  const nameToDexByKey: Record<string, number> = {};

  for (const [idxStr, rawName] of Object.entries(pokemonName)) {
    const speciesName = String(rawName || "").trim();
    if (!speciesName) continue;

    const speciesKey = canonicalForMatch(speciesName);
    const idxNum = Number.parseInt(idxStr, 10);
    const dexNum = Number.isFinite(idxNum) ? idxNum + 1 : Number.POSITIVE_INFINITY;

    if (!speciesDisplayByKey[speciesKey]) speciesDisplayByKey[speciesKey] = speciesName;
    if (!(speciesKey in nameToDexByKey) || dexNum < nameToDexByKey[speciesKey]) {
      nameToDexByKey[speciesKey] = dexNum;
    }

    ensureSet(graph, speciesKey);

    const evoList = Array.isArray(evolutions[idxStr]) ? evolutions[idxStr] : [];
    for (const evo of evoList) {
      const evoName = String(evo?.pokemon_name || "").trim();
      if (!evoName) continue;

      const evoKey = canonicalForMatch(evoName);
      if (!speciesDisplayByKey[evoKey]) speciesDisplayByKey[evoKey] = evoName;

      ensureSet(graph, speciesKey).add(evoKey);
      ensureSet(graph, evoKey).add(speciesKey);
      ensureSet(childrenByKey, speciesKey).add(evoKey);
      ensureSet(parentsByKey, evoKey).add(speciesKey);
    }
  }

  const depthByKey: Record<string, number> = {};
  const visited = new Set<string>();

  for (const startKey of graph.keys()) {
    if (visited.has(startKey)) continue;

    const component = new Set<string>();
    const stack = [startKey];

    while (stack.length > 0) {
      const key = stack.pop()!;
      if (component.has(key)) continue;
      component.add(key);
      visited.add(key);

      const neighbors = graph.get(key) ?? new Set<string>();
      for (const nextKey of neighbors) {
        if (!component.has(nextKey)) stack.push(nextKey);
      }
    }

    const roots = Array.from(component).filter((key) => {
      const parentSet = parentsByKey.get(key);
      return !parentSet || !Array.from(parentSet).some((parentKey) => component.has(parentKey));
    });

    if (!roots.length) {
      roots.push(
        Array.from(component).sort(
          (a, b) => (nameToDexByKey[a] ?? Number.POSITIVE_INFINITY) - (nameToDexByKey[b] ?? Number.POSITIVE_INFINITY)
        )[0]!
      );
    }

    const queue: Array<[string, number]> = roots.map((key) => [key, 0]);
    const seenLocal = new Set<string>();

    while (queue.length > 0) {
      const [key, depth] = queue.shift()!;
      if (seenLocal.has(key)) continue;
      seenLocal.add(key);

      if (depthByKey[key] === undefined || depth < depthByKey[key]) {
        depthByKey[key] = depth;
      }

      const childSet = childrenByKey.get(key) ?? new Set<string>();
      for (const childKey of childSet) {
        if (component.has(childKey)) queue.push([childKey, depth + 1]);
      }
    }
  }

  return {
    parentsByKey,
    depthByKey,
    speciesDisplayByKey,
    nameToDexByKey,
    level4RarityByKey: parseLevel4RarityData(level4RarityRaw)
  };
}

type GoldRarityMeta = {
  rowRarity: number;
  overallRarity: number;
  level4Rarity: number;
  usedLv4ForThisRow: boolean;
};

function rarityEmphasis(meta: GoldRarityMeta | undefined, highlightRarity: boolean) {
  if (!highlightRarity || !meta) return "none" as const;
  const rarity = meta.rowRarity;
  if (rarity < 1) return "none" as const;

  if (meta.usedLv4ForThisRow) {
    if (rarity >= 1 && rarity <= LEVEL4_RARITY_SIZE5_THRESHOLD) return "size5" as const;
    if (rarity >= 10 && rarity <= LEVEL4_RARITY_SIZE4_THRESHOLD) return "size4" as const;
    if (rarity < LEVEL4_RARITY_BOLD_THRESHOLD) return "bold" as const;
    return "none" as const;
  }

  if (rarity >= 1 && rarity <= OVERALL_RARITY_SIZE5_THRESHOLD) return "size5" as const;
  if (rarity >= 10 && rarity <= OVERALL_RARITY_SIZE4_THRESHOLD) return "size4" as const;
  if (rarity < OVERALL_RARITY_BOLD_THRESHOLD) return "bold" as const;
  return "none" as const;
}

function wrapRaritySizeIfNeeded(
  text: string,
  emphasis: ReturnType<typeof rarityEmphasis>
) {
  if (emphasis === "none") return text;
  if (emphasis === "size5") return `[b][size="5"]${text}[/size][/b]`;
  if (emphasis === "size4") return `[b][size="4"]${text}[/size][/b]`;
  return `[b]${text}[/b]`;
}

function formatRarityAnnotation(meta: GoldRarityMeta) {
  const active = Math.round(meta.rowRarity).toLocaleString("en-US");
  if (!meta.usedLv4ForThisRow) return `${active} ig`;

  const overall = Math.round(meta.overallRarity).toLocaleString("en-US");
  if (meta.overallRarity > 0 && meta.overallRarity !== meta.level4Rarity) {
    return `${active} ig (at this level; ${overall} overall)`;
  }
  return `${active} ig (at this level)`;
}

function formatLine(
  entry: GoldEntry & { count?: number; rarityMeta?: GoldRarityMeta },
  opts: Pick<GoldOrganizerOpts, "plainLevel" | "combine" | "highlightRarity" | "annotateRarity">,
  goldColor: string
) {
  const meta = entry.rarityMeta;
  const emphasis = rarityEmphasis(meta, opts.highlightRarity);
  const nm = wrapRaritySizeIfNeeded(colorizeName(entry.name, goldColor), emphasis);
  const lvl = fmtLevel(entry.levelNum);
  let base = opts.plainLevel ? `${nm} ${lvl}` : `${nm} (Level: ${lvl})`;
  if (opts.combine && entry.count && entry.count > 1) base = `${base} x${entry.count}`;

  if (opts.annotateRarity && emphasis !== "none" && meta) {
    base += ` [size="1"]- ${formatRarityAnnotation(meta)}[/size]`;
  }

  return base;
}

function formatLegendLine(goldColor: string) {
  const color = String(goldColor || "").trim();
  const done = color ? `[color="${color}"]done[/color]` : "done";
  return `key: ${done}, [color="Red"]missing[/color], [color="grey"]unlikely[/color], [s][color="Gray"]ignore[/color][/s]`;
}

function wrapCodeBlock(lines: string[], footerLines: string[] = []) {
  const sections: string[] = [];
  if (lines.length) sections.push(lines.join("\n"));
  if (footerLines.length) sections.push(footerLines.join("\n"));
  const body = sections.join("\n\n");
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
  rarityRaw: GoldenRarity,
  referenceData?: GoldOrganizerReferenceData
): GoldOrganizerResult {
  const timeline = normalizeTimeline(timelineRaw);
  const rarityTimelineByKey = (rarityRaw && rarityRaw.timeline_by_key) || {};
  const goldRarityRecordByKey = new Map<string, GoldenRarityRecord | GoldenRarityForm>();

  for (const [timelineKey, record] of Object.entries(rarityTimelineByKey)) {
    goldRarityRecordByKey.set(timelineKey, record);

    const recordName = String(record?.name || "").trim();
    if (recordName) goldRarityRecordByKey.set(canonicalForMatch(recordName), record);

    for (const formRecord of record?.forms ?? []) {
      const formName = String(formRecord?.name || "").trim();
      if (!formName) continue;
      goldRarityRecordByKey.set(canonicalForMatch(formName), formRecord);
    }
  }

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
    const rec = goldRarityRecordByKey.get(canonicalForMatch(timelineName));
    return Number.isFinite(Number(rec?.total)) ? Number(rec?.total) : 0;
  };

  const missingMeta = (timelineName: string) => {
    const total = rarityTotalForTimelineName(timelineName);
    const key = canonicalForMatch(timelineName);
    const shouldStrike = total > 0 && total < MISSING_STRIKE_THRESHOLD;
    const shouldGray = EXCEPTIONALLY_HARD_TO_GET.has(key) || (total > 0 && total < MISSING_GRAY_THRESHOLD);
    const label = shouldStrike ? `[s]${timelineName}[/s]` : timelineName;
    const c = shouldGray ? MISSING_COLOR : MISSING_COLOR_NON_GRAY;
    return {
      shouldStrike,
      total,
      rowLine: `[color=${c}]${label}[/color]`,
      panelLine: shouldStrike ? `[s]${timelineName}[/s]` : timelineName
    };
  };

  const tlMap = buildTimelineMap(timeline);

  const level4RarityByKey =
    referenceData?.level4RarityByKey ?? new Map<string, GoldenRarityRecord | GoldenRarityForm>();

  type GoldMatchedEntry = GoldEntry & {
    timelineIndex: number;
    timelineName: string;
    matched: boolean;
    speciesKey: string;
    speciesName: string;
    form: string;
    rarityGenderBucket: "male" | "female" | "genderless" | "ungendered";
    rarityMeta: GoldRarityMeta;
  };

  const rarityGenderBucketForName = (
    name: string,
    record?: GoldenRarityRecord | GoldenRarityForm
  ): GoldMatchedEntry["rarityGenderBucket"] => {
    const genderSymbol = extractGender(name);
    if (genderSymbol === "♂") return "male";
    if (genderSymbol === "♀") return "female";

    const male = Number(record?.male ?? 0);
    const female = Number(record?.female ?? 0);
    const genderless = Number(record?.genderless ?? 0);
    const ungendered = Number(record?.ungendered ?? 0);

    if (genderless > 0 && male === 0 && female === 0) return "genderless";
    if (ungendered > 0) return "ungendered";
    return "ungendered";
  };

  const directGoldRarityForEntry = (
    fullName: string,
    isInputLevel4: boolean,
    rarityGenderBucket: GoldMatchedEntry["rarityGenderBucket"]
  ): GoldRarityMeta => {
    let overallRarity = 0;
    const baseRarityName = goldBaseRarityName(fullName);
    const primaryRarityName = goldRarityLookupName(fullName);
    const rarityLookupCandidates =
      primaryRarityName === baseRarityName ? [primaryRarityName] : [primaryRarityName, baseRarityName];

    const seenRarity = new Set<string>();
    for (const candidate of rarityLookupCandidates) {
      const candidateKey = canonicalForMatch(candidate);
      if (seenRarity.has(candidateKey)) continue;
      seenRarity.add(candidateKey);

      const record = goldRarityRecordByKey.get(candidateKey);
      if (!record) continue;

      const value = Number(record[rarityGenderBucket] ?? 0);
      if (value > 0) {
        overallRarity = value;
        break;
      }
    }

    let level4Rarity = 0;
    if (isInputLevel4) {
      const exactLv4Key = canonicalForMatch(goldRarityLookupName(fullName));
      const exactLv4Record = level4RarityByKey.get(exactLv4Key);
      level4Rarity = Number(exactLv4Record?.[rarityGenderBucket] ?? 0);
    }

    const usedLv4ForThisRow = level4Rarity > 0;
    return {
      rowRarity: usedLv4ForThisRow ? level4Rarity : overallRarity,
      overallRarity,
      level4Rarity,
      usedLv4ForThisRow
    };
  };

  const buildRarityMeta = (entry: Omit<GoldMatchedEntry, "rarityMeta">): GoldRarityMeta =>
    directGoldRarityForEntry(
      `Golden${entry.speciesName}${entry.form ? ` (${entry.form})` : ""}`,
      entry.levelNum === 4,
      entry.rarityGenderBucket
    );

  const goldOnly: GoldMatchedEntry[] = [];

  for (const e of entries) {
    if (!looksGold(e.name)) continue;

    const baseName = stripLeadingShinyDark(stripGender(e.name));
    const speciesName = speciesFromVariantName(baseName);
    const form = extractForm(baseName);
    const match = resolveTimelineMatch(baseName, tlMap);
    const timelineItem = match.timelineItem;
    const rarityLookupName = `Golden${speciesName}${form ? ` (${form})` : ""}`;
    const raritySeedRecord = goldRarityRecordByKey.get(canonicalForMatch(rarityLookupName));

    const entryBase = {
      ...e,
      timelineIndex: timelineItem ? timelineItem.index : Number.POSITIVE_INFINITY,
      timelineName: timelineItem ? timelineItem.name : baseName,
      matched: Boolean(timelineItem),
      speciesKey: match.speciesKey,
      speciesName,
      form,
      rarityGenderBucket: rarityGenderBucketForName(e.name, raritySeedRecord)
    };

    goldOnly.push({
      ...entryBase,
      rarityMeta: buildRarityMeta(entryBase)
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
      const arr = bySpecies.get(e.speciesKey);
      if (arr) arr.push(e);
      else bySpecies.set(e.speciesKey, [e]);
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
    const singleOpts = {
      plainLevel: opts.plainLevel,
      combine: opts.combine,
      highlightRarity: opts.highlightRarity,
      annotateRarity: opts.highlightRarity && opts.annotateRarity
    };
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
    output: `${statsLine}\n${wrapCodeBlock(lines, [formatLegendLine(opts.goldColor)])}`,
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
