import type { RainbowInputRow, RainbowRunOptions, RainbowRunResult } from "./types";

const BASE_PATH = String(process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");
const withBasePath = (path: string) => `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;

const GEN_BREAKPOINTS = [
  { gen: 1, start: 1, label: "Generation 1" },
  { gen: 2, start: 152, label: "Generation 2" },
  { gen: 3, start: 252, label: "Generation 3" },
  { gen: 4, start: 387, label: "Generation 4" },
  { gen: 5, start: 494, label: "Generation 5" },
  { gen: 6, start: 650, label: "Generation 6" },
  { gen: 7, start: 722, label: "Generation 7" },
  { gen: 8, start: 810, label: "Generation 8" },
  { gen: 9, start: 906, label: "Generation 9" }
] as const;

type RarityRow = {
  pokemon: string;
  overall: number;
};

function setStatus(cb: RainbowRunOptions["onStatus"], message: string) {
  if (cb) cb(message);
}

function genForDex(dex: number) {
  let current = GEN_BREAKPOINTS[0];
  for (const bp of GEN_BREAKPOINTS) {
    if (dex >= bp.start) current = bp;
    else break;
  }
  return current.gen;
}

function genTitle(genNum: number) {
  return `[b][u][size="5"]Generation ${genNum}[/size][/u][/b]`;
}

function stripPrefixes(name: string) {
  if (/^darkrai\b/i.test(name)) return name.trim();
  return name.replace(/^(shiny|dark|golden)\s*/i, "").trim();
}

function speciesFromFullName(fullName: string) {
  const noPrefix = stripPrefixes(fullName);
  return noPrefix.split("(")[0].trim();
}

export function canonicalKeyExact(name: string) {
  let norm = String(name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace("♀", "F")
    .replace("♂", "M")
    .toLowerCase();

  const stripped = norm.replace(/[^a-z0-9]/g, "");
  if (stripped === "darkrai") return "darkrai";

  return norm.replace(/[^a-z0-9!?]/g, "");
}

function canonicalKeyDex(name: string) {
  const exact = canonicalKeyExact(name);
  if (exact.startsWith("unown") && exact.length > "unown".length) return "unown";
  return exact;
}

function colorCategory(name: string) {
  const n = String(name).trim();
  if (/^darkrai\b/i.test(n)) return "normal" as const;
  if (/^shinydarkrai\b/i.test(n)) return "shiny" as const;
  if (/^darkdarkrai\b/i.test(n)) return "dark" as const;
  if (/^goldendarkrai\b/i.test(n)) return "golden" as const;

  const lower = n.toLowerCase();
  if (lower.startsWith("golden")) return "golden" as const;
  if (lower.startsWith("shiny")) return "shiny" as const;
  if (lower.startsWith("dark")) return "dark" as const;
  return "normal" as const;
}

function colorOrderIndex(name: string) {
  const cat = colorCategory(name);
  if (cat === "golden") return 0;
  if (cat === "shiny") return 1;
  if (cat === "dark") return 2;
  return 3;
}

async function fetchDexMapping() {
  const res = await fetch(withBasePath("/data/name_to_dex.json"));
  if (!res.ok) throw new Error("Failed to fetch data/name_to_dex.json");
  const obj = (await res.json()) as Record<string, number | string>;
  const nameToDex: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj)) nameToDex[k] = Number(v);
  return nameToDex;
}

async function fetchRarityTable() {
  const res = await fetch(withBasePath("/data/rarity.html"));
  if (!res.ok) throw new Error("Failed to fetch TPPC rarity list.");

  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const table = doc.querySelector("table");
  if (!table) throw new Error("Could not find rarity table.");

  const rows = Array.from(table.querySelectorAll("tr"));
  if (rows.length < 2) throw new Error("No rows in rarity table.");

  const headerCells = Array.from(rows[0].querySelectorAll("th, td")).map((c) => (c.textContent || "").trim());
  const idxPokemon = headerCells.findIndex((h) => h.toLowerCase().startsWith("pok"));
  if (idxPokemon === -1) throw new Error("Could not locate Pokemon column in rarity table.");

  const idxOverall = headerCells.length - 1;
  const out: RarityRow[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const cells = Array.from(rows[i].querySelectorAll("td"));
    if (cells.length <= Math.max(idxPokemon, idxOverall)) continue;

    const pokemon = (cells[idxPokemon].textContent || "").trim();
    const overallStr = (cells[idxOverall].textContent || "").replace(/,/g, "").trim();
    const overall = parseInt(overallStr, 10) || 0;
    out.push({ pokemon, overall });
  }

  return out;
}

export function parseInputList(inputText: string): RainbowInputRow[] {
  const rows: RainbowInputRow[] = [];
  const rawLines = String(inputText || "").replace(/\r\n/g, "\n").split("\n");
  const lineRegex = /^(.+?)(?:\s+([♂♀])|\s+\(\?\))?\s+([\d,]+)\b/;

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;

    const m = line.match(lineRegex);
    if (!m) continue;

    const variantName = (m[1] || "").trim();
    let gender = m[2] || "";
    if (!gender && /\(\?\)/.test(line)) gender = "(?)";

    const lvlRaw = m[3] || "";
    const lvlInt = parseInt(lvlRaw.replace(/,/g, ""), 10);
    const levelStr = Number.isFinite(lvlInt) ? lvlInt.toLocaleString("en-US") : lvlRaw.replace(/\s+/g, "");

    rows.push({ line, variantName, gender, levelInt: lvlInt, levelStr });
  }

  return rows;
}

export async function runRainbowDexChecklist(options: RainbowRunOptions): Promise<RainbowRunResult> {
  const { inputText, minRarity, maxMissing, includeGolds } = options;
  setStatus(options.onStatus, "Parsing input list...");
  const parsedRows = parseInputList(inputText);
  if (parsedRows.length === 0) throw new Error("No valid Pokemon lines found in input.");

  setStatus(options.onStatus, "Building best-entry map + duplicates...");
  const inputByKey = new Map<string, RainbowInputRow>();
  const countsByKey = new Map<string, number>();

  for (const row of parsedRows) {
    const key = canonicalKeyExact(row.variantName);
    countsByKey.set(key, (countsByKey.get(key) || 0) + 1);

    const existing = inputByKey.get(key);
    if (!existing) {
      inputByKey.set(key, row);
      continue;
    }

    const newLevel = Number.isFinite(row.levelInt) ? row.levelInt : -1;
    const oldLevel = Number.isFinite(existing.levelInt) ? existing.levelInt : -1;
    if (newLevel > oldLevel) inputByKey.set(key, row);
  }

  const duplicates: string[] = [];
  for (const [key, count] of countsByKey.entries()) {
    if (count <= 1) continue;
    const bestRow = inputByKey.get(key);
    if (bestRow) duplicates.push(bestRow.variantName);
  }
  duplicates.sort((a, b) => {
    const oa = colorOrderIndex(a);
    const ob = colorOrderIndex(b);
    if (oa !== ob) return oa - ob;
    return a.localeCompare(b);
  });

  setStatus(options.onStatus, "Fetching Dex mapping...");
  const nameToDex = await fetchDexMapping();

  setStatus(options.onStatus, "Fetching rarity list...");
  const rarityRows = await fetchRarityTable();

  setStatus(options.onStatus, "Building dex -> form checklist...");
  type FormVariantInfo = { rarityName: string; overall: number } | null;
  type FormRec = {
    dex: number;
    baseFormLabel: string;
    variants: {
      normal: FormVariantInfo;
      shiny: FormVariantInfo;
      dark: FormVariantInfo;
      golden: FormVariantInfo;
    };
  };
  const dexMap = new Map<number, Map<string, FormRec>>();

  for (const row of rarityRows) {
    const rarityName = row.pokemon;
    if (!rarityName) continue;

    const cat = colorCategory(rarityName);
    const baseSpecies = speciesFromFullName(rarityName);
    const speciesKeyForDex = canonicalKeyDex(baseSpecies);
    const dex = nameToDex[speciesKeyForDex] ?? 9999;
    const baseFormLabel = stripPrefixes(rarityName);
    const baseFormKey = canonicalKeyExact(baseFormLabel);

    if (!dexMap.has(dex)) dexMap.set(dex, new Map<string, FormRec>());
    const formMap = dexMap.get(dex) as Map<string, FormRec>;

    if (!formMap.has(baseFormKey)) {
      formMap.set(baseFormKey, {
        dex,
        baseFormLabel,
        variants: { normal: null, shiny: null, dark: null, golden: null }
      });
    }

    const rec = formMap.get(baseFormKey) as FormRec;
    if (!rec.variants[cat]) {
      rec.variants[cat] = {
        rarityName,
        overall: row.overall || 0
      };
    }
  }

  let totalSlots = 0;
  let filledSlots = 0;

  function renderCell(variantInfo: FormVariantInfo) {
    if (!variantInfo) return "";

    const rarityName = variantInfo.rarityName;
    const keyExact = canonicalKeyExact(rarityName);

    totalSlots += 1;
    const present = inputByKey.get(keyExact);
    if (present) filledSlots += 1;

    if (present) {
      let txt = present.variantName;
      if (present.gender && present.levelStr) txt = `${present.variantName} ${present.gender} ${present.levelStr}`;
      else if (present.gender) txt = `${present.variantName} ${present.gender}`;
      else if (present.levelStr) txt = `${present.variantName} ${present.levelStr}`;
      return `[color="magenta"]${txt}[/color]`;
    }

    return `[color="slategray"]${rarityName}[/color]`;
  }

  setStatus(options.onStatus, "Formatting checklist...");
  const blocksByGen = new Map<number, string[]>();
  const dexList = Array.from(dexMap.keys()).sort((a, b) => a - b);

  for (const dex of dexList) {
    const g = genForDex(dex);
    if (!blocksByGen.has(g)) blocksByGen.set(g, []);

    const formMap = dexMap.get(dex) as Map<string, FormRec>;
    const formRecords = Array.from(formMap.values()).sort((a, b) => a.baseFormLabel.localeCompare(b.baseFormLabel));

    for (const rec of formRecords) {
      const dexStr = dex >= 0 && dex < 1000 ? dex.toString().padStart(3, "0") : String(dex);
      const dexLabel = `[B][color="red"]#${dexStr}[/color][/b]`;

      const normalCell = renderCell(rec.variants.normal);
      const shinyCell = renderCell(rec.variants.shiny);
      const darkCell = renderCell(rec.variants.dark);
      const goldenCell = renderCell(rec.variants.golden);

      const rowLine = `${dexLabel} - ${[normalCell, shinyCell, darkCell, goldenCell].join(" | ")}`.trimEnd();
      (blocksByGen.get(g) as string[]).push(rowLine);
    }
  }

  const pct = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;
  const pctStr = (Math.round(pct * 100) / 100).toFixed(2);

  const checklistParts: string[] = [];
  checklistParts.push(`Dex Completion: ${pctStr}% (${filledSlots} / ${totalSlots})`);
  checklistParts.push("");

  for (const bp of GEN_BREAKPOINTS) {
    const lines = blocksByGen.get(bp.gen) || [];
    if (!lines.length) continue;

    checklistParts.push(genTitle(bp.gen));
    checklistParts.push("[code]");
    checklistParts.push(...lines);
    checklistParts.push("[/code]");
    checklistParts.push("");
  }

  const checklistText = checklistParts.join("\n").trim();

  setStatus(options.onStatus, "Computing high-rarity missing list...");
  const missingByVariant = {
    normal: [] as { name: string; overall: number }[],
    shiny: [] as { name: string; overall: number }[],
    dark: [] as { name: string; overall: number }[],
    golden: [] as { name: string; overall: number }[]
  };

  for (const row of rarityRows) {
    const name = row.pokemon;
    if (!name) continue;

    const cat = colorCategory(name);
    if (!includeGolds && cat === "golden") continue;

    const overall = row.overall || 0;
    if (overall <= minRarity) continue;

    const keyExact = canonicalKeyExact(name);
    if (inputByKey.has(keyExact)) continue;

    missingByVariant[cat].push({ name, overall });
  }

  function sliceVariantList(list: { name: string; overall: number }[]) {
    if (maxMissing && maxMissing > 0) return list.slice(0, maxMissing);
    return list;
  }

  const extrasLines: string[] = [];
  extrasLines.push(
    `=== Missing (overall rarity > ${minRarity}) per variant; ${
      maxMissing && maxMissing > 0 ? `up to ${maxMissing} shown per variant` : "all shown"
    } ===`
  );
  extrasLines.push(includeGolds ? "Goldens are included in the missing list." : "Goldens are excluded from the missing list.");

  function emitMissingVariant(label: string, catKey: keyof typeof missingByVariant) {
    const all = missingByVariant[catKey];
    if (!all.length) return;

    all.sort((a, b) => {
      if (b.overall !== a.overall) return b.overall - a.overall;
      return a.name.localeCompare(b.name);
    });
    const shown = sliceVariantList(all);

    extrasLines.push("");
    extrasLines.push(`--- ${label} ---`);
    extrasLines.push(`Total missing ${label.toLowerCase()}: ${all.length}`);

    if (!shown.length) {
      extrasLines.push("You have all of them in this range.");
      return;
    }

    for (const { name, overall } of shown) {
      extrasLines.push(`${name}: Rarity = ${overall.toLocaleString("en-US")}`);
    }
  }

  emitMissingVariant("Golden", "golden");
  emitMissingVariant("Shiny", "shiny");
  emitMissingVariant("Dark", "dark");
  emitMissingVariant("Normal", "normal");

  extrasLines.push("");
  extrasLines.push("=== Duplicates in input (ignoring gender and level, aggregated by mon) ===");
  if (!duplicates.length) extrasLines.push("None");
  else extrasLines.push(...duplicates);

  setStatus(options.onStatus, "Done.");
  return {
    checklistText,
    extrasText: extrasLines.join("\n")
  };
}
