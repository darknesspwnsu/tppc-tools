// @ts-nocheck

// ===============================
// Utility helpers (moved as-is)
// ===============================

export function stripPrefixes(name) {
  return name
    .replace(/^(shiny|dark|golden)\s*/i, "")
    .replace(/^(shiny|dark|golden)/i, "")
    .trim();
}

export function speciesFromFullName(fullName) {
  const noPrefix = stripPrefixes(fullName);
  return noPrefix.split("(")[0].trim();
}

export function canonicalKey(name) {
  let norm = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  norm = norm.replace("♀", "F").replace("♂", "M");
  norm = norm.toLowerCase();
  const stripped = norm.replace(/[^a-z0-9]/g, "");
  if (stripped.startsWith("unown") && stripped.length > "unown".length) return "unown";
  return stripped;
}

export function extractForm(fullName) {
  const noPrefix = stripPrefixes(fullName);
  const m = noPrefix.match(/\(([^)]+)\)/);
  if (!m) return "";
  const form = m[1].trim();
  if (form === "?") return "";
  return form;
}

const FORM_PRIORITY = { "": 0, "normal": 0, "alola": 1, "galarian": 2, "hisui": 3, "paldea": 4 };
export function formRank(form) { return FORM_PRIORITY[form.toLowerCase()] ?? 10; }

export function colorCategory(name) {
  const n = name.trim().toLowerCase();
  if (n.startsWith("golden")) return "golden";
  if (n.startsWith("shiny")) return "shiny";
  if (n.startsWith("dark")) return "dark";
  return "normal";
}

export function colorRank(name) {
  const cat = colorCategory(name);
  if (cat === "golden") return 3;
  if (cat === "shiny") return 2;
  if (cat === "dark") return 1;
  return 0;
}

export function buildGoldenizedKeySet(rarityRows) {
  const goldenized = new Set();
  for (const row of rarityRows || []) {
    if (colorCategory(row?.pokemon || "") !== "golden") continue;
    goldenized.add(canonicalKey(stripPrefixes(row.pokemon)));
  }
  return goldenized;
}

export function isEffectivelyUeugNormal(name, ueugSet, goldenizedKeySet) {
  if (colorCategory(name) !== "normal") return false;
  const key = canonicalKey(stripPrefixes(name));
  return ueugSet.has(key) && !goldenizedKeySet.has(key);
}

export function compareTuple(a, b) {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i], bv = b[i];
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
}

export function applyLevelLabelToRemainder(remainder) {
  const m = remainder.match(/^(\d[\d,]*)(\b.*)?$/);
  if (!m) return remainder;
  const lvl = m[1];
  const tail = (m[2] || "").trim();
  return tail ? `(Level: ${lvl}) ${tail}` : `(Level: ${lvl})`;
}

export function boldLowLevels(remainder) {
  return remainder
    .replace(/\(Level:\s*(4|5)\)/g, '(Level: [B]$1[/B])')
    .replace(/^([45])\b/, '[B]$1[/B]');
}

export function parseLeadingLevelFromRemainder(remainder) {
  const m = (remainder || "").match(/^(\d[\d,]*)\b/);
  if (!m) return { levelNum: null, levelStr: null };
  const s = m[1];
  const n = parseInt(s.replace(/,/g, ""), 10);
  return Number.isFinite(n) ? { levelNum: n, levelStr: s } : { levelNum: null, levelStr: s };
}

export function decorateMissingInline(text) { return text; }

export function isVariantFiltered(cat, flags) {
  if (cat === "golden" && flags.filterGolds) return true;
  if (cat === "normal" && flags.filterNormals) return true;
  if (cat === "shiny"  && flags.filterShinys) return true;
  if (cat === "dark"   && flags.filterDarks) return true;
  return false;
}

export function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
