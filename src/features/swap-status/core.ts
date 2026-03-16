import { parseBoxInput } from "@/features/box-organizer/core";
import type { SwapLookupResult, SwapStatusDb, SwapStatusEntry } from "./types";

export type SwapFilterMode = "swaps" | "nonswaps";

export type SwapFilterResult = {
  outputText: string;
  processedCount: number;
  keptCount: number;
  filteredCount: number;
  unknownCount: number;
};

function stripDiacritics(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function sanitizeSwapInput(raw: string) {
  let out = String(raw || "").replace(/\u2642|\u2640/g, " ");
  out = out.replace(/\((?:level|lvl)\s*:?\s*\d+\)/gi, " ");
  out = out.replace(/\((?:\?|m|f|male|female|♂|♀)\)/gi, " ");
  out = out.replace(/\blevel\s*:?\s*\d+\b/gi, " ");
  out = out.replace(/\blvl\s*:?\s*\d+\b/gi, " ");
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

export function normalizeSwapLookupKey(raw: string) {
  const sanitized = stripDiacritics(sanitizeSwapInput(raw).toLowerCase());

  return sanitized
    .replace(/[’'`".,_:\-\/\\()[\]{}]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9!?]/g, "");
}

function extractLookupNameFromLine(rawLine: string) {
  const trimmed = String(rawLine || "").trim();
  if (!trimmed) return "";

  const parsedBox = parseBoxInput(trimmed);
  if (parsedBox.length > 0 && parsedBox[0]?.name) {
    return parsedBox[0].name.trim();
  }

  const tabCols = trimmed
    .split(/\t+/)
    .map((part) => part.trim())
    .filter(Boolean);
  let candidate = (tabCols[0] || trimmed).trim();

  candidate = candidate.replace(/\((?:level|lvl)\s*:?\s*\d+\)\s*$/i, "");
  candidate = candidate.replace(/\b(?:level|lvl)\s*:?\s*\d+\s*$/i, "");
  candidate = candidate.replace(/\s+[\d,]+\s*$/, "");
  candidate = candidate.replace(/\s*(?:\u2642|\u2640|\(\?\))\s*$/i, "");

  return candidate.trim();
}

function joinMapSources(sources: string[]) {
  if (sources.length === 0) return "";
  if (sources.length === 1) return sources[0];
  if (sources.length === 2) return `${sources[0]} and ${sources[1]}`;
  return `${sources.slice(0, -1).join(", ")}, and ${sources[sources.length - 1]}`;
}

function buildNotes(entry: SwapStatusEntry) {
  const notes: string[] = [];

  if (!entry.currentSecretSwap && entry.formerSecretSwap) {
    notes.push("pokemon was formerly obtained via secret swap");
  }

  if (entry.currentMap) {
    const mapLabel = joinMapSources(entry.mapSources || []);
    if (mapLabel) {
      const mapWord = entry.mapSources.length === 1 ? "map" : "maps";
      notes.push(`this pokemon is obtainable via ${mapLabel} ${mapWord}`);
    } else {
      notes.push("this pokemon is obtainable via map");
    }
  }

  return notes;
}

function buildSummary(entry: SwapStatusEntry) {
  if (entry.currentSecretSwap && entry.currentMap) {
    return "Yes. This pokemon is currently obtainable via secret swap, and it is also obtainable via maps.";
  }

  if (entry.currentSecretSwap) {
    return "Yes. This pokemon is currently obtainable via secret swap.";
  }

  return "No. This pokemon is not currently obtainable via secret swap.";
}

export function filterSwapList(inputText: string, mode: SwapFilterMode, db: SwapStatusDb | null): SwapFilterResult {
  const lines = String(inputText || "").replace(/\r\n/g, "\n").split("\n");
  const outputLines: string[] = [];

  let processedCount = 0;
  let filteredCount = 0;
  let unknownCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    processedCount += 1;

    const lookupName = extractLookupNameFromLine(line);
    const key = normalizeSwapLookupKey(lookupName || line);
    if (!key || !db) {
      outputLines.push(line);
      unknownCount += 1;
      continue;
    }

    const entry = db.entries[key];
    if (!entry) {
      outputLines.push(line);
      unknownCount += 1;
      continue;
    }

    const shouldFilter = mode === "swaps" ? entry.currentSecretSwap : !entry.currentSecretSwap;
    if (shouldFilter) {
      filteredCount += 1;
      continue;
    }

    outputLines.push(line);
  }

  return {
    outputText: outputLines.join("\n"),
    processedCount,
    keptCount: outputLines.length,
    filteredCount,
    unknownCount
  };
}

export function lookupSwapStatus(input: string, db: SwapStatusDb | null): SwapLookupResult {
  const cleanedInput = sanitizeSwapInput(input);
  if (!cleanedInput) {
    return {
      status: "empty",
      cleanedInput: "",
      normalizedKey: "",
      queryLabel: "",
      summary: "",
      notes: []
    };
  }

  const normalizedKey = normalizeSwapLookupKey(cleanedInput);
  if (!normalizedKey || !db) {
    return {
      status: "not-found",
      cleanedInput,
      normalizedKey,
      queryLabel: cleanedInput,
      summary: "Pokemon not found in the swap/map dataset.",
      notes: []
    };
  }

  const entry = db.entries[normalizedKey];
  if (!entry) {
    return {
      status: "not-found",
      cleanedInput,
      normalizedKey,
      queryLabel: cleanedInput,
      summary: "Pokemon not found in the swap/map dataset.",
      notes: []
    };
  }

  return {
    status: "found",
    cleanedInput,
    normalizedKey,
    queryLabel: entry.displayName || cleanedInput,
    entry,
    summary: buildSummary(entry),
    notes: buildNotes(entry)
  };
}
