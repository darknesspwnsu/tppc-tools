import goldenRarityData from "../../data/gold/golden_rarity.json";

type GoldRarityRecord = {
  found?: boolean;
  total?: number;
};

type GoldenRarityData = {
  timeline_by_key?: Record<string, GoldRarityRecord | undefined>;
  rarity_only_by_key?: Record<string, GoldRarityRecord | undefined>;
};

function canonicalForGoldMatch(name: string) {
  return String(name || "")
    .replace(/\s*[\u2642\u2640]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/['\u2019.]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function stripUnknownGender(name: string) {
  return String(name || "").replace(/\s*\(\s*\?\s*\)\s*$/g, "").trim();
}

function stripVariantPrefix(name: string) {
  return String(name || "")
    .replace(/^Shiny(?=[A-Z(])/, "")
    .replace(/^Dark(?=[A-Z(])/, "")
    .replace(/^Golden(?=[A-Z(])/, "")
    .trim();
}

export function goldRarityKeyForUeugName(name: string) {
  const baseName = stripVariantPrefix(stripUnknownGender(name));
  return canonicalForGoldMatch(`Golden${baseName}`);
}

export function hasGoldRarityRecordForUeugName(
  name: string,
  rarityData: GoldenRarityData = goldenRarityData
) {
  const key = goldRarityKeyForUeugName(name);
  const record = rarityData.timeline_by_key?.[key] ?? rarityData.rarity_only_by_key?.[key];
  return Boolean(record && record.found !== false && Number(record.total || 0) > 0);
}

export function filterUeugEntriesAgainstGoldRarity<T extends string>(
  entries: readonly T[],
  rarityData: GoldenRarityData = goldenRarityData
) {
  return entries.filter((entry) => !hasGoldRarityRecordForUeugName(entry, rarityData));
}

export function buildValidatedUeugSet(
  entries: readonly string[],
  normalizeEntry: (entry: string) => string,
  rarityData: GoldenRarityData = goldenRarityData
) {
  return new Set(filterUeugEntriesAgainstGoldRarity(entries, rarityData).map((entry) => normalizeEntry(entry)));
}
