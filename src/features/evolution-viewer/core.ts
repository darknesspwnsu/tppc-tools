import type { EvolutionDb, EvolutionEntry } from "./types";

export function sentenceCaseKey(key: string) {
  return String(key || "")
    .split(" ")
    .map((word) => {
      if (!word) return word;
      if (word.startsWith("(")) return word;
      return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
    })
    .join(" ");
}

export function normalizeEvolutionDb(raw: Record<string, EvolutionEntry>) {
  const normalized: EvolutionDb = {};
  for (const [key, value] of Object.entries(raw || {})) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}

export function evolutionKeys(db: EvolutionDb) {
  return Object.keys(db).sort((a, b) => a.localeCompare(b));
}

export function lookupEvolution(inputValue: string, db: EvolutionDb) {
  const raw = String(inputValue || "").trim().toLowerCase();
  if (!raw) return null;
  return db[raw] || null;
}

export function renderVariantLevels(entry: EvolutionEntry) {
  const levels = entry.lowest_level_possible || {};
  return {
    normal: levels.normal ?? null,
    shiny: levels.shiny ?? null,
    dark: levels.dark ?? null,
    golden: levels.golden ?? null
  };
}

