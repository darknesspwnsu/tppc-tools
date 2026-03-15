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
  total?: number;
};

export type GoldenRarityRecord = {
  name?: string;
  total?: number;
  forms?: GoldenRarityForm[];
};

export type GoldenRarity = {
  timeline_by_key?: Record<string, GoldenRarityRecord>;
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
  level4RarityByKey: Map<string, number>;
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

function wrapRaritySizeIfNeeded(text: string, cumulativeRarity: number, highlightRarity: boolean) {
  if (!highlightRarity) return text;
  if (cumulativeRarity >= 1 && cumulativeRarity <= 20) return `[b][size="5"]${text}[/size][/b]`;
  if (cumulativeRarity >= 21 && cumulativeRarity <= 100) return `[b][size="4"]${text}[/size][/b]`;
  if (cumulativeRarity >= 101 && cumulativeRarity <= 130) return `[b]${text}[/b]`;
  return text;
}

export function parseLevel4RarityText(raw: string) {
  const out = new Map<string, number>();
  const re = /(.+?)\s*-\s*(\d+)\b/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(raw || "")) !== null) {
    const name = (match[1] || "").trim();
    const total = parseInt(match[2], 10);
    if (!name || !Number.isFinite(total)) continue;
    out.set(canonicalForMatch(name), total);
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
  level4RarityText: string
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
    level4RarityByKey: parseLevel4RarityText(level4RarityText)
  };
}

type GoldRarityMeta = {
  cumulativeRarity: number;
  hasPreEvoContribution: boolean;
  usedLv4ForThisRow: boolean;
};

function formatLine(
  entry: GoldEntry & { count?: number; rarityMeta?: GoldRarityMeta },
  opts: Pick<GoldOrganizerOpts, "plainLevel" | "combine" | "highlightRarity" | "annotateRarity">,
  goldColor: string
) {
  const meta = entry.rarityMeta;
  const nm = wrapRaritySizeIfNeeded(colorizeName(entry.name, goldColor), meta?.cumulativeRarity ?? 0, opts.highlightRarity);
  const lvl = fmtLevel(entry.levelNum);
  let base = opts.plainLevel ? `${nm} ${lvl}` : `${nm} (Level: ${lvl})`;
  if (opts.combine && entry.count && entry.count > 1) base = `${base} x${entry.count}`;

  const isHighlighted = (meta?.cumulativeRarity ?? 0) >= 1 && (meta?.cumulativeRarity ?? 0) <= 130;
  if (opts.highlightRarity && opts.annotateRarity && meta && isHighlighted) {
    const ig = Math.round(meta.cumulativeRarity).toLocaleString("en-US");
    const suffixAtLevel = meta.usedLv4ForThisRow ? " (at this level)" : "";
    const suffixPreEvo = meta.hasPreEvoContribution ? " (including pre-evos)" : "";
    base += ` [size="1"]- ${ig} ig${suffixAtLevel}${suffixPreEvo}[/size]`;
  }

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
  rarityRaw: GoldenRarity,
  referenceData?: GoldOrganizerReferenceData
): GoldOrganizerResult {
  const timeline = normalizeTimeline(timelineRaw);
  const rarityTimelineByKey = (rarityRaw && rarityRaw.timeline_by_key) || {};
  const goldRarityByKey = new Map<string, number>();

  for (const [timelineKey, record] of Object.entries(rarityTimelineByKey)) {
    const total = Number.isFinite(Number(record?.total)) ? Number(record?.total) : 0;
    goldRarityByKey.set(timelineKey, total);

    const recordName = String(record?.name || "").trim();
    if (recordName) goldRarityByKey.set(canonicalForMatch(recordName), total);

    for (const formRecord of record?.forms ?? []) {
      const formName = String(formRecord?.name || "").trim();
      if (!formName) continue;
      const formTotal = Number.isFinite(Number(formRecord?.total)) ? Number(formRecord.total) : total;
      goldRarityByKey.set(canonicalForMatch(formName), formTotal);
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
    return goldRarityByKey.get(canonicalForMatch(timelineName)) ?? 0;
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

  const parentsByKey = referenceData?.parentsByKey ?? new Map<string, Set<string>>();
  const depthByKey = referenceData?.depthByKey ?? {};
  const speciesDisplayByKey = referenceData?.speciesDisplayByKey ?? {};
  const nameToDexByKey = referenceData?.nameToDexByKey ?? {};
  const level4RarityByKey = referenceData?.level4RarityByKey ?? new Map<string, number>();

  type GoldMatchedEntry = GoldEntry & {
    timelineIndex: number;
    timelineName: string;
    matched: boolean;
    speciesKey: string;
    speciesName: string;
    form: string;
    rarityMeta: GoldRarityMeta;
  };

  const pickBestParent = (speciesKey: string) => {
    const parentSet = parentsByKey.get(speciesKey);
    if (!parentSet || parentSet.size === 0) return null;

    let bestParent: string | null = null;
    let bestDex = Number.POSITIVE_INFINITY;
    for (const parentKey of parentSet) {
      const dex = nameToDexByKey[parentKey] ?? Number.POSITIVE_INFINITY;
      if (dex < bestDex) {
        bestDex = dex;
        bestParent = parentKey;
      }
    }
    return bestParent;
  };

  const goldRarityForSpeciesKey = (
    speciesKey: string,
    fallbackSpeciesName: string,
    form: string,
    isInputLevel4: boolean
  ) => {
    const speciesDisplayName = speciesDisplayByKey[speciesKey] ?? fallbackSpeciesName;

    let lookup = `Golden${speciesDisplayName}`;
    if (form) lookup += ` (${form})`;

    const isUnevolved = (depthByKey[speciesKey] ?? 0) === 0;
    const lv4Key = canonicalForMatch(lookup);
    if (isInputLevel4 && isUnevolved && level4RarityByKey.has(lv4Key)) {
      return level4RarityByKey.get(lv4Key) ?? 0;
    }

    if (form) {
      const formTotal = goldRarityByKey.get(canonicalForMatch(lookup)) ?? 0;
      if (formTotal > 0) return formTotal;
    }

    return goldRarityByKey.get(canonicalForMatch(`Golden${speciesDisplayName}`)) ?? 0;
  };

  const cumulativeGoldRarityForSpecies = (
    speciesKey: string,
    fallbackSpeciesName: string,
    form: string,
    isInputLevel4: boolean
  ) => {
    let total = 0;
    let currentKey = speciesKey;
    const seen = new Set<string>();

    while (!seen.has(currentKey)) {
      seen.add(currentKey);
      total += goldRarityForSpeciesKey(currentKey, fallbackSpeciesName, form, isInputLevel4);

      const parentKey = pickBestParent(currentKey);
      if (!parentKey) break;
      currentKey = parentKey;
    }

    return total;
  };

  const goldPreEvoChainBreakdown = (
    speciesKey: string,
    fallbackSpeciesName: string,
    form: string,
    isInputLevel4: boolean
  ) => {
    const parts: Array<{ speciesKey: string; rarity: number }> = [];
    let currentKey = speciesKey;
    const seen = new Set<string>();

    while (!seen.has(currentKey)) {
      seen.add(currentKey);
      parts.push({
        speciesKey: currentKey,
        rarity: goldRarityForSpeciesKey(currentKey, fallbackSpeciesName, form, isInputLevel4)
      });

      const parentKey = pickBestParent(currentKey);
      if (!parentKey) break;
      currentKey = parentKey;
    }

    return parts;
  };

  const buildRarityMeta = (entry: Omit<GoldMatchedEntry, "rarityMeta">): GoldRarityMeta => {
    const isInputLevel4 = entry.levelNum === 4;
    const cumulativeRarity = cumulativeGoldRarityForSpecies(
      entry.speciesKey,
      entry.speciesName,
      entry.form,
      isInputLevel4
    );

    const lookupSpeciesName = speciesDisplayByKey[entry.speciesKey] ?? entry.speciesName;
    let lookupNameBase = `Golden${lookupSpeciesName}`;
    if (entry.form) lookupNameBase += ` (${entry.form})`;

    const usedLv4ForThisRow =
      isInputLevel4 &&
      (depthByKey[entry.speciesKey] ?? 0) === 0 &&
      level4RarityByKey.has(canonicalForMatch(lookupNameBase));

    const chain = goldPreEvoChainBreakdown(entry.speciesKey, entry.speciesName, entry.form, isInputLevel4);
    const hasPreEvoContribution = chain.slice(1).some((part) => (part.rarity ?? 0) > 0);

    return {
      cumulativeRarity,
      hasPreEvoContribution,
      usedLv4ForThisRow
    };
  };

  const goldOnly: GoldMatchedEntry[] = [];

  for (const e of entries) {
    if (!looksGold(e.name)) continue;

    const baseName = stripLeadingShinyDark(stripGender(e.name));
    const speciesName = speciesFromVariantName(baseName);
    const form = extractForm(baseName);
    const match = resolveTimelineMatch(baseName, tlMap);
    const timelineItem = match.timelineItem;

    const entryBase = {
      ...e,
      timelineIndex: timelineItem ? timelineItem.index : Number.POSITIVE_INFINITY,
      timelineName: timelineItem ? timelineItem.name : baseName,
      matched: Boolean(timelineItem),
      speciesKey: canonicalForMatch(speciesName),
      speciesName,
      form
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
