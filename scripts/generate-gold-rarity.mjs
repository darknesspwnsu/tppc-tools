import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL = "https://www.tppcrpg.net/rarity.html";

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&eacute;/gi, "\u00e9")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const n = Number.parseInt(hex, 16);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    })
    .replace(/&#([0-9]+);/g, (_, dec) => {
      const n = Number.parseInt(dec, 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    });
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]*>/g, "");
}

function parseNumber(value) {
  const cleaned = String(value || "").replace(/,/g, "").trim();
  const n = Number.parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : 0;
}

function canonicalForMatch(name) {
  return String(name || "")
    .replace(/\s*[\u2642\u2640]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/['\u2019.]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function stripTrailingForm(name) {
  return String(name || "").replace(/\s*\([^)]*\)\s*$/g, "").trim();
}

function stripGoldenPrefix(name) {
  return String(name || "").replace(/^Golden\s*/i, "").trim();
}

function speciesKeyFromGoldName(name) {
  return canonicalForMatch(stripTrailingForm(stripGoldenPrefix(name)));
}

function buildParentSpeciesKeys(evolutionRaw) {
  const pokemonName = evolutionRaw?.pokemon_name ?? {};
  const evolutions = evolutionRaw?.evolutions ?? {};
  const parents = new Set();

  for (const [idxStr, rawName] of Object.entries(pokemonName)) {
    const parentName = String(rawName || "").trim();
    if (!parentName) continue;

    const evoList = Array.isArray(evolutions[idxStr]) ? evolutions[idxStr] : [];
    for (const evo of evoList) {
      const evoName = String(evo?.pokemon_name || "").trim();
      if (!evoName) continue;
      parents.add(canonicalForMatch(stripTrailingForm(evoName)));
    }
  }

  return parents;
}

function parseLastUpdated(html) {
  const match = String(html || "").match(/Last\s*Updated:\s*([^<]+)/i);
  return match ? decodeHtmlEntities(match[1]).trim() : "";
}

function parseRarityRows(html) {
  const rows = [...String(html || "").matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const out = [];

  for (const row of rows) {
    const cols = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) =>
      decodeHtmlEntities(stripTags(match[1])).trim()
    );

    if (cols.length !== 7 || /^rank$/i.test(cols[0])) continue;

    const [rank, name, male, female, genderless, ungendered, total] = cols;
    if (!name) continue;

    out.push({
      name,
      rank: parseNumber(rank),
      male: parseNumber(male),
      female: parseNumber(female),
      genderless: parseNumber(genderless),
      ungendered: parseNumber(ungendered),
      total: parseNumber(total)
    });
  }

  return out;
}

function emptyTimelineRecord(name) {
  return {
    name,
    found: false,
    matched_mode: "none",
    matched_name: "",
    rank: 0,
    male: 0,
    female: 0,
    genderless: 0,
    ungendered: 0,
    total: 0,
    forms: []
  };
}

function exactTimelineRecord(name, row) {
  return {
    name,
    found: true,
    matched_mode: "exact",
    matched_name: row.name,
    rank: row.rank,
    male: row.male,
    female: row.female,
    genderless: row.genderless,
    ungendered: row.ungendered,
    total: row.total,
    forms: [{ ...row }]
  };
}

function aggregateTimelineRecord(name, rows) {
  const forms = rows.map((row) => ({ ...row }));
  return {
    name,
    found: true,
    matched_mode: "forms_aggregate",
    matched_name: forms[0]?.name || "",
    rank: forms.reduce((min, row) => Math.min(min, row.rank || 0), Number.POSITIVE_INFINITY),
    male: forms.reduce((sum, row) => sum + row.male, 0),
    female: forms.reduce((sum, row) => sum + row.female, 0),
    genderless: forms.reduce((sum, row) => sum + row.genderless, 0),
    ungendered: forms.reduce((sum, row) => sum + row.ungendered, 0),
    total: forms.reduce((sum, row) => sum + row.total, 0),
    forms
  };
}

function buildGoldRarity({ timeline, rarityRows, sourceLastUpdated, extractedAt, evolvedSpeciesKeys }) {
  const rarityByKey = new Map();
  for (const row of rarityRows) rarityByKey.set(canonicalForMatch(row.name), row);

  const goldenRows = rarityRows.filter((row) => /^Golden/i.test(row.name));
  const timelineRecords = [];
  const timelineByKey = {};
  const coveredRarityKeys = new Set();

  for (const item of timeline) {
    const name = String(item?.name || "").trim();
    if (!name) continue;

    const key = canonicalForMatch(name);
    const exact = rarityByKey.get(key);
    let record;

    if (exact) {
      record = exactTimelineRecord(name, exact);
      coveredRarityKeys.add(canonicalForMatch(exact.name));
    } else {
      const formRows = goldenRows.filter((row) => canonicalForMatch(stripTrailingForm(row.name)) === key);
      if (formRows.length) {
        record = aggregateTimelineRecord(name, formRows);
        for (const row of formRows) coveredRarityKeys.add(canonicalForMatch(row.name));
      } else {
        record = emptyTimelineRecord(name);
      }
    }

    timelineRecords.push(record);
    timelineByKey[key] = record;
  }

  const timelineKeys = new Set(Object.keys(timelineByKey));
  const rarityOnly = goldenRows
    .filter((row) => {
      const rowKey = canonicalForMatch(row.name);
      const baseKey = canonicalForMatch(stripTrailingForm(row.name));
      return !coveredRarityKeys.has(rowKey) && !timelineKeys.has(rowKey) && !timelineKeys.has(baseKey);
    })
    .filter((row) => !evolvedSpeciesKeys.has(speciesKeyFromGoldName(row.name)))
    .map((row) => exactTimelineRecord(row.name, row));
  const rarityOnlyByKey = Object.fromEntries(rarityOnly.map((record) => [canonicalForMatch(record.name), record]));

  return {
    source_url: SOURCE_URL,
    source_last_updated: sourceLastUpdated,
    extracted_at: extractedAt,
    golden_rarity_count: goldenRows.length,
    timeline_count: timelineRecords.length,
    timeline_missing_count: timelineRecords.filter((record) => !record.found).length,
    timeline_missing_names: timelineRecords.filter((record) => !record.found).map((record) => record.name),
    rarity_only_count: rarityOnly.length,
    rarity_only_names: rarityOnly.map((record) => record.name),
    rarity_only_by_key: rarityOnlyByKey,
    rarity_only: rarityOnly,
    timeline_by_key: timelineByKey,
    timeline: timelineRecords
  };
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const timelinePath = path.join(root, "src", "data", "gold", "golden_timeline.json");
  const rarityHtmlPath = path.join(root, "public", "data", "rarity.html");
  const evolutionPath = path.join(root, "public", "data", "pokemon_evolution.json");
  const outPath = path.join(root, "src", "data", "gold", "golden_rarity.json");

  const [timelineRaw, rarityHtml, evolutionRaw, existingRaw] = await Promise.all([
    readFile(timelinePath, "utf8"),
    readFile(rarityHtmlPath, "utf8"),
    readFile(evolutionPath, "utf8"),
    readFile(outPath, "utf8").catch(() => "")
  ]);

  const timeline = JSON.parse(timelineRaw);
  const evolution = JSON.parse(evolutionRaw);
  const rarityRows = parseRarityRows(rarityHtml);
  const sourceLastUpdated = parseLastUpdated(rarityHtml);
  const evolvedSpeciesKeys = buildParentSpeciesKeys(evolution);
  const existing = existingRaw ? JSON.parse(existingRaw) : null;
  const extractedAt =
    existing?.source_last_updated === sourceLastUpdated && existing?.extracted_at
      ? existing.extracted_at
      : new Date().toISOString();
  const goldRarity = buildGoldRarity({ timeline, rarityRows, sourceLastUpdated, extractedAt, evolvedSpeciesKeys });

  await writeFile(outPath, `${JSON.stringify(goldRarity, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(root, outPath)} (${goldRarity.golden_rarity_count} golden rarity rows)`);
  if (goldRarity.rarity_only_count) {
    console.log(`Found ${goldRarity.rarity_only_count} rarity-only gold rows: ${goldRarity.rarity_only_names.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
