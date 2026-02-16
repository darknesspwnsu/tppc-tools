import { canonicalKey } from "./utils.js";

const SITE_ROOT = new URL("../../", import.meta.url);
const siteUrl = (path) => new URL(String(path || "").replace(/^\//, ""), SITE_ROOT).toString();

export async function fetchDexMapping() {
  // Same-origin so the tool works from mirrors (and doesn't depend on an old username site).
  const res = await fetch(siteUrl("data/name_to_dex.json"));
  if (!res.ok) throw new Error("Failed to fetch data/name_to_dex.json");
  const obj = await res.json();
  const nameToDex = {};
  for (const [k, v] of Object.entries(obj)) nameToDex[k] = Number(v);
  return nameToDex;
}

export async function fetchEvolutionData() {
  const res = await fetch(siteUrl("data/pokemon_evolution.json"));
  if (!res.ok) throw new Error("Failed to fetch data/pokemon_evolution.json");
  return res.json();
}

export async function fetchUEUGSet() {
  const res = await fetch(siteUrl("data/ueug_list.txt"));
  if (!res.ok) throw new Error("Failed to fetch data/ueug_list.txt");
  const text = await res.text();
  const lines = text.split(/\r?\n/);
  const names = [];
  for (const line of lines) {
    const t = line.trim();
    if (t) names.push(t);
  }
  return new Set(names.map((n) => canonicalKey(n)));
}

export async function fetchRarityTable() {
  // Same-origin mirror so this tool works from GitHub Pages project sites.
  const res = await fetch(siteUrl("data/rarity.html"));
  if (!res.ok) throw new Error("Failed to fetch TPPC rarity list.");
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  const table = doc.querySelector("table");
  if (!table) throw new Error("Could not find rarity table.");

  const rows = Array.from(table.querySelectorAll("tr"));
  if (rows.length < 2) throw new Error("No rows in rarity table.");

  const headerCells = Array.from(rows[0].querySelectorAll("th, td")).map((c) => c.textContent.trim());
  const idxPokemon = headerCells.findIndex((h) => h.toLowerCase().startsWith("pok"));
  const idxUng = headerCells.findIndex((h) => h.toLowerCase().startsWith("ungendered"));
  if (idxPokemon === -1 || idxUng === -1) {
    throw new Error("Could not locate Pokémon/Ungendered columns in rarity table.");
  }

  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll("td"));
    if (cells.length <= Math.max(idxPokemon, idxUng)) continue;
    const pokemon = cells[idxPokemon].textContent.trim();
    const ungStr = cells[idxUng].textContent.replace(/,/g, "").trim();
    const ung = parseInt(ungStr, 10) || 0;
    out.push({ pokemon, ungendered: ung });
  }
  return out;
}

// Level 4 rarity list (Name - count)
export async function fetchLevel4RarityMap() {
  const res = await fetch(siteUrl("data/level4_rarity.txt"));
  if (!res.ok) throw new Error("Failed to fetch data/level4_rarity.txt");
  const text = await res.text();

  // The file is basically a stream like: "Bulbasaur - 518 UnownW - 785 ..."
  // Parse globally: (name) - (number)
  const map = new Map();
  const re = /(.+?)\s*-\s*(\d+)\b/g;

  let m;
  while ((m = re.exec(text)) !== null) {
    const name = (m[1] || "").trim();
    const count = parseInt(m[2], 10);
    if (!name || !Number.isFinite(count)) continue;
    map.set(canonicalKey(name), count);
  }
  return map;
}
