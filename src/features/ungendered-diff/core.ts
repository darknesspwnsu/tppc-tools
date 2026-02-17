import type { DiffEntry, DiffResult } from "./types";

const NAME_REGEX = /^\s*([\w’'À-ÖØ-öø-ÿ-]+(?:\s*\([^)]+\))?)/;
const COMPACT_ENTRY_REGEX =
  /([A-Za-z0-9'’À-ÖØ-öø-ÿ-]+(?:\s*\([^)]+\))?\s*\(\?\))\s*\(Level:\s*([\d,]+)\)/g;

function colorCategory(name: string) {
  const n = String(name || "").trim().toLowerCase();
  if (n.startsWith("golden")) return "golden";
  if (n.startsWith("shiny")) return "shiny";
  if (n.startsWith("dark")) return "dark";
  return "normal";
}

function variantRank(name: string) {
  const category = colorCategory(name);
  if (category === "golden") return 0;
  if (category === "shiny") return 1;
  if (category === "dark") return 2;
  return 3;
}

export function sortNamesByVariantThenName(a: string, b: string) {
  const rankA = variantRank(a);
  const rankB = variantRank(b);
  if (rankA !== rankB) return rankA - rankB;

  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la < lb) return -1;
  if (la > lb) return 1;
  return 0;
}

export function preprocessEntries(inputText: string): DiffEntry[] {
  const raw = String(inputText || "").replace(/\r\n/g, "\n").trim();
  if (!raw) return [];

  const entries: DiffEntry[] = [];
  let hadCompactMatch = false;
  let match: RegExpExecArray | null;

  while ((match = COMPACT_ENTRY_REGEX.exec(raw)) !== null) {
    hadCompactMatch = true;
    const fullName = match[1].trim();
    const levelRaw = match[2];
    const level = parseInt(levelRaw.replace(/,/g, ""), 10);
    const levelFmt = Number.isFinite(level) ? level.toLocaleString("en-US") : levelRaw.replace(/\s+/g, "");

    if (!fullName.includes("(?)")) continue;
    entries.push({
      fullName,
      line: `${fullName} ${levelFmt}`
    });
  }

  if (hadCompactMatch) return entries;

  const lines = raw.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || !line.includes("(?)")) continue;

    const lineMatch = line.match(NAME_REGEX);
    if (!lineMatch) continue;

    entries.push({
      fullName: lineMatch[1].trim(),
      line
    });
  }

  return entries;
}

export function buildSets(entries: readonly DiffEntry[]) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.fullName, (counts.get(entry.fullName) || 0) + 1);
  }

  const nameSet = new Set<string>(counts.keys());
  const dupSet = new Set<string>(
    [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([name]) => name)
  );

  return { nameSet, dupSet };
}

export function buildResultText(
  boxLabel: string,
  nameSet: Set<string>,
  otherSet: Set<string>,
  dupSet: Set<string>
) {
  const unique = [...nameSet].filter((name) => !otherSet.has(name)).sort(sortNamesByVariantThenName);
  const dups = [...dupSet].sort(sortNamesByVariantThenName);

  const lines = [
    `=== Results for ${boxLabel} ===`,
    "",
    "=== Unique to this box (compared to the other) ===",
    ...(unique.length ? unique : ["None"]),
    "",
    "=== Duplicates within this box (ignoring level) ===",
    ...(dups.length ? dups : ["None"])
  ];

  return lines.join("\n");
}

export function runUngenderedDiff(input1: string, input2: string): DiffResult {
  const entries1 = preprocessEntries(input1);
  const entries2 = preprocessEntries(input2);

  const { nameSet: set1, dupSet: dup1 } = buildSets(entries1);
  const { nameSet: set2, dupSet: dup2 } = buildSets(entries2);

  return {
    output1: buildResultText("Box 1", set1, set2, dup1),
    output2: buildResultText("Box 2", set2, set1, dup2)
  };
}

