// sorter.js
import {
  stripPrefixes,
  speciesFromFullName,
  canonicalKey,
  extractForm,
  formRank,
  colorCategory,
  colorRank,
  compareTuple,
  applyLevelLabelToRemainder,
  boldLowLevels,
  parseLeadingLevelFromRemainder,
  decorateMissingInline,
  isVariantFiltered
} from "./utils.js";

import {
  fetchDexMapping,
  fetchEvolutionData,
  fetchUEUGSet,
  fetchRarityTable,
  fetchLevel4RarityMap
} from "./fetchers.js";

// ===============================
// Main logic
// ===============================

export async function runDexSorter({
  inputText,
  minUngendered,
  maxMissing,
  flags,
  colors,
  statusEl,
  partitionOutput,
  missingOnlyFamilyNeeded,
  showLevelLabel,
  dropDuplicates,
  addMissingInline,
  noGroupSpacing,
  highlightRarity,
  annotateRarity,
  omitSummaryStats
}) {
  statusEl.textContent = "Fetching Dex mapping...";
  const nameToDex = await fetchDexMapping();

  statusEl.textContent = "Loading evolution data...";
  const evoData = await fetchEvolutionData();
  const pokemonNameMap = evoData["pokemon_name"];
  const evolutionsMap = evoData["evolutions"];

  statusEl.textContent = "Building evolution graph...";
  const graph = new Map();
  const children = new Map();
  const parents = new Map();
  const evoDepth = {};

  function ensureSet(map, key) {
    if (!map.has(key)) map.set(key, new Set());
    return map.get(key);
  }

  for (const [idxStr, baseName] of Object.entries(pokemonNameMap)) {
    const baseKey = canonicalKey(baseName);
    const evoList = evolutionsMap[idxStr] || [];
    for (const evo of evoList) {
      const evoKey = canonicalKey(evo["pokemon_name"]);
      ensureSet(graph, baseKey).add(evoKey);
      ensureSet(graph, evoKey).add(baseKey);
      ensureSet(children, baseKey).add(evoKey);
      ensureSet(parents, evoKey).add(baseKey);
    }
    if (!graph.has(baseKey)) graph.set(baseKey, new Set());
  }

  statusEl.textContent = "Parsing input list...";
  const nameRegex = /^\s*([\w’'À-ÖØ-öø-ÿ-]+(?:\s*\([^)]+\))?\s*\(\?\))/;

  const raw = (inputText || "").replace(/\r\n/g, "\n").trim();
  if (!raw) throw new Error("No input provided.");

  const levelMatches = raw.match(/\(Level:\s*[\d,]+\)/gi) || [];
  const lineCount = raw.split(/\n/).length;
  const isCompact = lineCount < 2 && levelMatches.length >= 2;

  let logicalLines = [];
  if (isCompact) {
    statusEl.textContent = "Detected compact '(Level: N)' format, pre-splitting...";
    const compactEntryRegex =
      /([A-Za-z0-9'’À-ÖØ-öø-ÿ-]+(?:\s*\([^)]+\))?\s*\(\?\))\s*\(Level:\s*([\d,]+)\)/g;

    let m;
    while ((m = compactEntryRegex.exec(raw)) !== null) {
      const name = m[1].trim();
      const lvlRaw = m[2];
      const lvlInt = parseInt(lvlRaw.replace(/,/g, ""), 10);
      const lvlFmt = Number.isFinite(lvlInt) ? lvlInt.toLocaleString("en-US") : lvlRaw.replace(/\s+/g, "");
      if (!name.includes("(?)")) continue;
      logicalLines.push(`${name} ${lvlFmt}`);
    }
  } else {
    logicalLines = raw.split("\n");
  }

  const tempRows = [];
  for (const rawLine of logicalLines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (!line.includes("(?)")) continue;

    const m = line.match(nameRegex);
    if (!m) continue;

    const fullName = m[1].trim();
    const cat = colorCategory(fullName);
    if (isVariantFiltered(cat, flags)) continue;

    const afterName = line.slice(m[0].length).trim();
    let restParts = afterName.split(/\s+/).filter((x) => x.length > 0);
    if (restParts.length > 0 && restParts[restParts.length - 1].startsWith("$")) {
      restParts = restParts.slice(0, -1);
    }
    const remainder = restParts.join(" ");
    const { levelNum, levelStr } = parseLeadingLevelFromRemainder(remainder);

    tempRows.push({
      line,
      full_name: fullName,
      levelNum,
      levelStr,
    });
  }

  if (tempRows.length === 0) {
    throw new Error("No valid Pokémon lines with '(?)' found in input (after filters).");
  }

  let rows;
  if (dropDuplicates) {
    const best = new Map();
    for (const r of tempRows) {
      let key;
      const rawKey = r.full_name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if (rawKey.replace(/[^a-z0-9]/g, "").startsWith("unown")) {
        key = rawKey
          .replace("♀", "f").replace("♂", "m")
          .replace(/\s+/g, " ")
          .trim();
      } else {
        key = canonicalKey(r.full_name);
      }

      if (!best.has(key)) {
        best.set(key, r);
        continue;
      }
      const cur = best.get(key);
      const a = r.levelNum;
      const b = cur.levelNum;
      const chooseNew =
        (a !== null && b === null) ||
        (a !== null && b !== null && a < b);
      if (chooseNew) best.set(key, r);
    }
    rows = Array.from(best.values());
  } else {
    rows = tempRows;
  }

  for (const r of rows) {
    const species = speciesFromFullName(r.full_name);
    r.species = species;
    const key = canonicalKey(species);
    r.dex = nameToDex[key] ?? 9999;
  }

  statusEl.textContent = "Computing evo families & depths...";
  const rowSpeciesKeys = new Set();
  for (const r of rows) {
    const k = canonicalKey(r.species);
    rowSpeciesKeys.add(k);
    if (!graph.has(k)) graph.set(k, new Set());
  }

  const familyAnchor = {};
  const missingFamilyAnchor = {};
  const familyMembers = new Map();
  const missingFamilySize = new Map();
  const visited = new Set();

  for (const start of rowSpeciesKeys) {
    if (visited.has(start)) continue;

    const stack = [start];
    const component = new Set();

    while (stack.length > 0) {
      const u = stack.pop();
      if (visited.has(u)) continue;
      visited.add(u);
      component.add(u);
      const nbrs = graph.get(u) || new Set();
      for (const v of nbrs) if (!visited.has(v)) stack.push(v);
    }

    const present = new Set();
    for (const k of component) if (rowSpeciesKeys.has(k)) present.add(k);

    let minDex = Infinity;
    const sourceSet = present.size > 0 ? present : component;
    for (const k of sourceSet) {
      const d = nameToDex[k] ?? 9999;
      if (d < minDex) minDex = d;
    }
    if (!Number.isFinite(minDex)) minDex = 9999;

    if (!familyMembers.has(minDex)) familyMembers.set(minDex, new Set());
    const famSet = familyMembers.get(minDex);
    for (const k of component) famSet.add(k);

    for (const k of component) familyAnchor[k] = minDex;

    const componentList = Array.from(component);
    const roots = [];

    for (const k of componentList) {
      const parentSet = parents.get(k);
      const hasParentInComponent =
        parentSet && Array.from(parentSet).some((p) => component.has(p));
      if (!hasParentInComponent) roots.push(k);
    }

    if (roots.length === 0) {
      let minRoot = componentList[0];
      let bestDex = nameToDex[minRoot] ?? 9999;
      for (const k of componentList.slice(1)) {
        const d = nameToDex[k] ?? 9999;
        if (d < bestDex) { bestDex = d; minRoot = k; }
      }
      roots.push(minRoot);
    }

    const queue = [];
    const seenLocal = new Set();
    for (const rroot of roots) queue.push([rroot, 0]);

    while (queue.length > 0) {
      const [node, depth] = queue.shift();
      if (seenLocal.has(node)) continue;
      seenLocal.add(node);

      if (evoDepth[node] === undefined || depth < evoDepth[node]) evoDepth[node] = depth;

      const childSet = children.get(node) || new Set();
      for (const child of childSet) if (component.has(child)) queue.push([child, depth + 1]);
    }
  }

  function getFamilyId(speciesName) {
    const k = canonicalKey(speciesName);
    if (familyAnchor[k] !== undefined) return familyAnchor[k];
    if (missingFamilyAnchor[k] !== undefined) return missingFamilyAnchor[k];
    const d = nameToDex[k];
    return d !== undefined ? d : 9999;
  }

  statusEl.textContent = "Sorting Pokémon...";
  const rowsSorted = rows.slice().sort((a, b) => {
    const familyA = getFamilyId(a.species);
    const familyB = getFamilyId(b.species);

    const depthA = evoDepth[canonicalKey(a.species)] ?? 0;
    const depthB = evoDepth[canonicalKey(b.species)] ?? 0;

    const baseA = speciesFromFullName(a.full_name);
    const baseB = speciesFromFullName(b.full_name);

    const frA = formRank(extractForm(a.full_name));
    const frB = formRank(extractForm(b.full_name));

    const crA = colorRank(a.full_name);
    const crB = colorRank(b.full_name);

    const keyA = [familyA, depthA, a.dex, frA, crA, baseA.toLowerCase(), a.full_name];
    const keyB = [familyB, depthB, b.dex, frB, crB, baseB.toLowerCase(), b.full_name];
    return compareTuple(keyA, keyB);
  });

  statusEl.textContent = "Fetching UE/UG list...";
  const ueugSet = await fetchUEUGSet();

  function decorateName(fullName) {
    const cat = colorCategory(fullName);
    const baseForUeug = stripPrefixes(fullName);
    const key = canonicalKey(baseForUeug);
    const isUeugNormal = cat === "normal" && ueugSet.has(key);

    const wrapColor = (color, text) =>
      color && color.trim().length > 0 ? `[color="${color.trim()}"]${text}[/color]` : text;

    if (cat === "dark") return wrapColor(colors.dark, fullName);
    if (cat === "shiny") return wrapColor(colors.shiny, fullName);
    if (cat === "golden") return wrapColor(colors.golden, fullName);

    let name = fullName;
    if (isUeugNormal) name = `[B]${name}[/B]`;
    return wrapColor(colors.normal, name);
  }

  statusEl.textContent = "Fetching rarity...";
  const rarityRowsAll = await fetchRarityTable();

  statusEl.textContent = "Fetching Level 4 rarity list...";
  const level4RarityByKey = await fetchLevel4RarityMap();

  const rarityByKey = new Map();
  for (const rr of rarityRowsAll) {
    rarityByKey.set(canonicalKey(rr.pokemon), rr.ungendered);
  }

  const speciesDisplayByKey = {};
  for (const nm of Object.values(pokemonNameMap)) {
    const k = canonicalKey(nm);
    if (!(k in speciesDisplayByKey)) speciesDisplayByKey[k] = nm;
  }

  function variantPrefixFromName(fullName) {
    const cat = colorCategory(fullName);
    if (cat === "golden") return "Golden";
    if (cat === "shiny") return "Shiny";
    if (cat === "dark") return "Dark";
    return "";
  }

  function baseEvolutionKey(speciesKey) {
    let cur = speciesKey;
    while (true) {
      const pset = parents.get(cur);
      if (!pset || pset.size === 0) break;

      let best = null;
      let bestDex = Infinity;
      for (const p of pset) {
        const d = nameToDex[p] ?? 9999;
        if (d < bestDex) { bestDex = d; best = p; }
      }
      if (!best) break;
      cur = best;
    }
    return cur;
  }

  // ===============================
  // Rarity functions (with LV4 override)
  // ===============================

  function hasPreEvoWithNonZeroRarity(speciesKey, variantPrefix, fallbackSpeciesName, form, lv4Eligible) {
    let cur = speciesKey;
    const seen = new Set([cur]);

    while (true) {
      const pset = parents.get(cur);
      if (!pset || pset.size === 0) break;

      // pick "best" parent the same way you do elsewhere (lowest dex)
      let best = null;
      let bestDex = Infinity;
      for (const p of pset) {
        const d = nameToDex[p] ?? 9999;
        if (d < bestDex) { bestDex = d; best = p; }
      }
      if (!best) break;

      cur = best;
      if (seen.has(cur)) break;
      seen.add(cur);

      // Missing list never qualifies for LV4 override, so isInputLevel4 = false
      const r = rarityForVariantAtSpeciesKey(
        cur,
        variantPrefix,
        fallbackSpeciesName,
        form,
        lv4Eligible,
        false
      );

      if ((r ?? 0) > 0) return true;
    }

    return false;
  }

  function rarityForVariantAtSpeciesKey(
    speciesKey,
    variantPrefix,
    fallbackSpeciesName,
    form,
    lv4Eligible,
    isInputLevel4
  ) {
    const sName = speciesDisplayByKey[speciesKey] ?? fallbackSpeciesName;

    let lookup = variantPrefix ? `${variantPrefix}${sName}` : sName;
    if (form) lookup += ` (${form})`;

    // LV4 override ONLY if:
    // - the INPUT row itself is level 4
    // - unevolved (depth 0)
    // - variant is Shiny/Dark OR UE/UG normal (lv4Eligible)
    // - exact name (including form if present) exists in level4 list
    const isUnevolved = (evoDepth[speciesKey] ?? 0) === 0;
    const lv4Key = canonicalKey(lookup);
    if (isInputLevel4 && isUnevolved && !!lv4Eligible && level4RarityByKey.has(lv4Key)) {
      return level4RarityByKey.get(lv4Key) ?? 0;
    }

    // Existing fallback behavior (unchanged)
    if (form) {
      const rForm = rarityByKey.get(canonicalKey(lookup)) ?? 0;
      if (rForm > 0) return rForm;
    }

    let lookup2 = variantPrefix ? `${variantPrefix}${sName}` : sName;
    return rarityByKey.get(canonicalKey(lookup2)) ?? 0;
  }

  function cumulativeVariantRarityForSpecies(
    speciesKey,
    variantPrefix,
    fallbackSpeciesName,
    form,
    lv4Eligible,
    isInputLevel4
  ) {
    let total = 0;
    let cur = speciesKey;

    const seen = new Set();
    while (true) {
      if (seen.has(cur)) break;
      seen.add(cur);

      total += rarityForVariantAtSpeciesKey(
        cur,
        variantPrefix,
        fallbackSpeciesName,
        form,
        lv4Eligible,
        isInputLevel4
      );

      const pset = parents.get(cur);
      if (!pset || pset.size === 0) break;

      let best = null;
      let bestDex = Infinity;
      for (const p of pset) {
        const d = nameToDex[p] ?? 9999;
        if (d < bestDex) { bestDex = d; best = p; }
      }
      if (!best) break;
      cur = best;
    }
    return total;
  }

  function preEvoChainBreakdown(speciesKey, variantPrefix, fallbackSpeciesName, form, lv4Eligible, isInputLevel4) {
    const parts = [];
    let cur = speciesKey;
    const seen = new Set();

    while (true) {
      if (seen.has(cur)) break;
      seen.add(cur);

      const sName = speciesDisplayByKey[cur] ?? fallbackSpeciesName;
      const rUsed = rarityForVariantAtSpeciesKey(
        cur,
        variantPrefix,
        fallbackSpeciesName,
        form,
        lv4Eligible,
        isInputLevel4
      );

      parts.push({ speciesKey: cur, name: sName, rarity: rUsed });

      const pset = parents.get(cur);
      if (!pset || pset.size === 0) break;

      let best = null;
      let bestDex = Infinity;
      for (const p of pset) {
        const d = nameToDex[p] ?? 9999;
        if (d < bestDex) { bestDex = d; best = p; }
      }
      if (!best) break;
      cur = best;
    }
    return parts;
  }

  function shouldStrikeInlineMissing(missingFullName, missingSpecies) {
    const prefix = variantPrefixFromName(missingFullName);
    const sk = canonicalKey(missingSpecies);
    const form = extractForm(missingFullName);

    const memoKey = `${prefix}|${(form || "").toLowerCase()}|${sk}`;
    if (!shouldStrikeInlineMissing.memo) shouldStrikeInlineMissing.memo = new Map();
    const baseRarityMemo = shouldStrikeInlineMissing.memo;

    function rarityLookupForSpeciesKey(sk2) {
      const sName = speciesDisplayByKey[sk2] ?? missingSpecies;
      let lookup = prefix ? `${prefix}${sName}` : sName;
      if (form) lookup += ` (${form})`;
      return rarityByKey.get(canonicalKey(lookup)) ?? 0;
    }

    if (baseRarityMemo.has(memoKey)) {
      const r = baseRarityMemo.get(memoKey);
      return r > 0 && r <= 10;
    }

    const baseKey = baseEvolutionKey(sk);

    const q = [baseKey];
    const seen = new Set();
    while (q.length) {
      const layerSize = q.length;
      const layer = [];
      for (let i = 0; i < layerSize; i++) {
        const n = q.shift();
        if (seen.has(n)) continue;
        seen.add(n);
        layer.push(n);
      }

      layer.sort((a, b) => (nameToDex[a] ?? 9999) - (nameToDex[b] ?? 9999));

      for (const n of layer) {
        const r = rarityLookupForSpeciesKey(n);
        if (r > 0) {
          baseRarityMemo.set(memoKey, r);
          return r <= 10;
        }
      }

      for (const n of layer) {
        const childSet = children.get(n) || new Set();
        for (const c of childSet) if (!seen.has(c)) q.push(c);
      }
    }

    baseRarityMemo.set(memoKey, 0);
    return false;
  }

  function wrapRaritySizeIfNeeded(bbcodeText, cumulativeRarity) {
    if (!highlightRarity) return bbcodeText;
    if (cumulativeRarity >= 1 && cumulativeRarity <= 20) return `[b][size="5"]${bbcodeText}[/size][/b]`;
    if (cumulativeRarity >= 21 && cumulativeRarity <= 100) return `[b][size="4"]${bbcodeText}[/size][/b]`;
    if (cumulativeRarity >= 101 && cumulativeRarity <= 130) return `[b]${bbcodeText}[/b]`;
    return bbcodeText;
  }

  // Species present in rarity list at all (respecting variant filters)
  const raritySpeciesKeysPresent = new Set();
  for (const rr of rarityRowsAll) {
    const cat = colorCategory(rr.pokemon);
    if (isVariantFiltered(cat, flags)) continue;
    const sk = canonicalKey(speciesFromFullName(rr.pokemon));
    raritySpeciesKeysPresent.add(sk);
  }

  // family size in rarity list
  const rarityFamilySize = new Map();
  for (const [famId, members] of familyMembers.entries()) {
    let c = 0;
    for (const sk of members) if (raritySpeciesKeysPresent.has(sk)) c++;
    rarityFamilySize.set(famId, c);
  }

  const useMissingFamilies = addMissingInline && !missingOnlyFamilyNeeded;

  function ensureMissingFamilyForKey(startKey) {
    if (familyAnchor[startKey] !== undefined || missingFamilyAnchor[startKey] !== undefined) return;

    const stack = [startKey];
    const component = new Set();

    while (stack.length > 0) {
      const u = stack.pop();
      if (component.has(u)) continue;
      component.add(u);
      const nbrs = graph.get(u) || new Set();
      for (const v of nbrs) if (!component.has(v)) stack.push(v);
    }

    let minDex = Infinity;
    for (const k of component) {
      const d = nameToDex[k] ?? 9999;
      if (d < minDex) minDex = d;
    }
    if (!Number.isFinite(minDex)) minDex = 9999;

    for (const k of component) missingFamilyAnchor[k] = minDex;

    if (!missingFamilySize.has(minDex)) {
      let c = 0;
      for (const k of component) if (raritySpeciesKeysPresent.has(k)) c++;
      missingFamilySize.set(minDex, c);
    }

    const componentList = Array.from(component);
    const roots = [];

    for (const k of componentList) {
      const parentSet = parents.get(k);
      const hasParentInComponent =
        parentSet && Array.from(parentSet).some((p) => component.has(p));
      if (!hasParentInComponent) roots.push(k);
    }

    if (roots.length === 0) {
      let minRoot = componentList[0];
      let bestDex = nameToDex[minRoot] ?? 9999;
      for (const k of componentList.slice(1)) {
        const d = nameToDex[k] ?? 9999;
        if (d < bestDex) { bestDex = d; minRoot = k; }
      }
      roots.push(minRoot);
    }

    const queue = [];
    const seenLocal = new Set();
    for (const rroot of roots) queue.push([rroot, 0]);

    while (queue.length > 0) {
      const [node, depth] = queue.shift();
      if (seenLocal.has(node)) continue;
      seenLocal.add(node);

      if (evoDepth[node] === undefined || depth < evoDepth[node]) evoDepth[node] = depth;

      const childSet = children.get(node) || new Set();
      for (const child of childSet) if (component.has(child)) queue.push([child, depth + 1]);
    }
  }

  // ===============================
  // Missing list computation
  // ===============================
  statusEl.textContent = "Computing missing list...";

  const haveKeys = new Set(rowsSorted.map((r) => canonicalKey(r.full_name)));

  const candidates = rarityRowsAll
    .filter((row) => row.ungendered > minUngendered)
    .sort((a, b) => b.ungendered - a.ungendered);

  const incompleteFamilyIds = new Set();
  for (const row of candidates) {
    const pokeName = row.pokemon;
    const cat = colorCategory(pokeName);
    if (isVariantFiltered(cat, flags)) continue;

    const key = canonicalKey(pokeName);
    if (haveKeys.has(key)) continue;

    const missSpecies = speciesFromFullName(pokeName);
    const sk = canonicalKey(missSpecies);
    if (useMissingFamilies) ensureMissingFamilyForKey(sk);
    const famId = getFamilyId(missSpecies);
    const famSize = rarityFamilySize.get(famId) ?? 1;
    if (famSize > 1) incompleteFamilyIds.add(famId);
  }

  const missingByVariant = { golden: [], shiny: [], dark: [], normal: [] };
  const missingByFamily = new Map(); // famId -> array of { name, u, cat, cumR }

  for (const row of candidates) {
    const pokeName = row.pokemon;
    const cat = colorCategory(pokeName);
    if (isVariantFiltered(cat, flags)) continue;

    const key = canonicalKey(pokeName);
    if (haveKeys.has(key)) continue;

    const missSpecies = speciesFromFullName(pokeName);
    const sk = canonicalKey(missSpecies);
    if (useMissingFamilies) ensureMissingFamilyForKey(sk);
    const famId = getFamilyId(missSpecies);
    const famSize = rarityFamilySize.get(famId) ?? 1;

    if (missingOnlyFamilyNeeded) {
      if (famSize <= 1) continue;
      if (!incompleteFamilyIds.has(famId)) continue;
    }

    const prefix = (cat === "golden") ? "Golden" : (cat === "shiny") ? "Shiny" : (cat === "dark") ? "Dark" : "";
    const form = extractForm(pokeName);

    const isUeugNormal = (cat === "normal") && ueugSet.has(canonicalKey(stripPrefixes(pokeName)));
    const lv4Eligible = (cat === "shiny" || cat === "dark" || isUeugNormal);

    // Missing list entries do NOT have an input level, so they can never qualify for LV4 rarity override.
    const cumR = cumulativeVariantRarityForSpecies(sk, prefix, missSpecies, form, lv4Eligible, false);

    missingByVariant[cat].push({ name: pokeName, u: row.ungendered, cumR, famId });
    if (!missingByFamily.has(famId)) missingByFamily.set(famId, []);
    missingByFamily.get(famId).push({ name: pokeName, u: row.ungendered, cat, cumR, famId });
  }

  // ===============================
  // Output formatting
  // ===============================
  statusEl.textContent = "Formatting sorted output...";

  function formatExistingRow(r) {
    const origLine = r.line;
    const m = origLine.match(nameRegex);
    if (!m) return origLine;

    const afterName = origLine.slice(m[0].length).trim();

    const fullName = r.full_name;
    const decorated = decorateName(fullName);

    // Unown special-case: skip rarity highlight resizing + skip rarity annotations entirely.
    const rawKeyForUnown = fullName
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const isUnown = rawKeyForUnown.startsWith("unown");

    const sk = canonicalKey(r.species);
    const prefix = variantPrefixFromName(fullName);
    const form = extractForm(fullName);

    const cat = colorCategory(fullName);
    const isUeugNormal = (cat === "normal") && ueugSet.has(canonicalKey(stripPrefixes(fullName)));
    const lv4Eligible = (cat === "shiny" || cat === "dark" || isUeugNormal);

    const isInputLevel4 = (r.levelNum === 4);

    const cumR = cumulativeVariantRarityForSpecies(
      sk,
      prefix,
      r.species,
      form,
      lv4Eligible,
      isInputLevel4
    );

    // If we used the LV4 rarity override for THIS row's base lookup, we annotate "(at this level)".
    // (Only possible for unevolved + eligible + exact LV4 list hit, and only when the input row is level 4.)
    const depthHere = (evoDepth[sk] ?? 0);
    const lookupNameBase = (() => {
      const sName = speciesDisplayByKey[sk] ?? r.species;
      let lookup = prefix ? `${prefix}${sName}` : sName;
      if (form) lookup += ` (${form})`;
      return lookup;
    })();
    const usedLv4ForThisRow =
      isInputLevel4 &&
      depthHere === 0 &&
      !!lv4Eligible &&
      level4RarityByKey.has(canonicalKey(lookupNameBase));

    const decoratedSized = isUnown ? decorated : wrapRaritySizeIfNeeded(decorated, cumR);

    let restParts = afterName.split(/\s+/).filter((x) => x.length > 0);
    if (restParts.length > 0 && restParts[restParts.length - 1].startsWith("$")) {
      restParts = restParts.slice(0, -1);
    }
    let remainder = restParts.join(" ");
    if (showLevelLabel && remainder) remainder = applyLevelLabelToRemainder(remainder);
    if (remainder) remainder = boldLowLevels(remainder);

    let lineOut = remainder ? `${decoratedSized} ${remainder}` : decoratedSized;

    // Rarity annotation only when enabled, highlighted, and not Unown.
    const isHighlighted = !!highlightRarity && cumR >= 1 && cumR <= 130;
    if (annotateRarity && isHighlighted && !isUnown) {
      const ig = Number.isFinite(cumR)
        ? Math.round(cumR).toLocaleString("en-US")
        : String(cumR);

      // Only append "(including pre-evos)" if there is actually a pre-evo contribution
      // (i.e., at least one pre-evo in the chain has a non-zero rarity for this variant).
      const chain = preEvoChainBreakdown(sk, prefix, r.species, form, lv4Eligible, isInputLevel4);
      const hasPreEvoContribution = chain.slice(1).some((p) => (p.rarity ?? 0) > 0);

      const suffixAtLevel = usedLv4ForThisRow ? " (at this level)" : "";
      const suffixPreEvo = hasPreEvoContribution ? " (including pre-evos)" : "";

      lineOut += ` [size="1"]- ${ig} ig${suffixAtLevel}${suffixPreEvo}[/size]`;
    }

    return lineOut;
  }

  const rowsByFamily = new Map();
  for (const r of rowsSorted) {
    const famId = getFamilyId(r.species);
    if (!rowsByFamily.has(famId)) rowsByFamily.set(famId, []);
    rowsByFamily.get(famId).push(r);
  }

  function sortKeyForItem(item) {
    const familyId = getFamilyId(item.species);
    const depth = evoDepth[canonicalKey(item.species)] ?? 0;
    const dex = item.dex ?? (nameToDex[canonicalKey(item.species)] ?? 9999);
    const fr = formRank(extractForm(item.full_name));
    const cr = colorRank(item.full_name);
    const base = speciesFromFullName(item.full_name);
    return [familyId, depth, dex, fr, cr, base.toLowerCase(), item.full_name];
  }

  function cmpItems(a, b) { return compareTuple(sortKeyForItem(a), sortKeyForItem(b)); }

  const familyLines = [];
  const singleLines = [];

  const famIdsInOrder = (() => {
    if (!addMissingInline) return Array.from(rowsByFamily.keys()).sort((a, b) => a - b);
    const ids = new Set(rowsByFamily.keys());
    for (const famId of missingByFamily.keys()) ids.add(famId);
    return Array.from(ids).sort((a, b) => a - b);
  })();

  for (const famId of famIdsInOrder) {
    const famSizeRarity = rarityFamilySize.get(famId) ?? missingFamilySize.get(famId) ?? 1;
    const isSingleSet = partitionOutput && famSizeRarity <= 1;
    const target = isSingleSet ? singleLines : familyLines;

    const existing = rowsByFamily.get(famId) || [];
    const missingListForFamily = missingByFamily.get(famId) || [];
    const inlineMissing = addMissingInline && missingListForFamily.length > 0;

    if (!inlineMissing) {
      if (existing.length === 0) continue;
      if (!noGroupSpacing && target.length > 0) target.push("");
      for (const r of existing) target.push(formatExistingRow(r));
      continue;
    }

    if (!noGroupSpacing && target.length > 0) target.push("");
    const items = [];

    for (const r of existing) {
      items.push({
        kind: "have",
        full_name: r.full_name,
        species: r.species,
        dex: r.dex,
        row: r,
      });
    }

    for (const miss of missingListForFamily) {
      items.push({
        kind: "missing",
        full_name: `${miss.name} (?)`,
        display: `${miss.name} (?)`,
        species: speciesFromFullName(miss.name),
        dex: nameToDex[canonicalKey(speciesFromFullName(miss.name))] ?? 9999,
      });
    }

    items.sort(cmpItems);

    for (const it of items) {
      if (it.kind === "have") {
        target.push(formatExistingRow(it.row));
      } else {
        const rawTxt = decorateMissingInline(it.display);
        const out = shouldStrikeInlineMissing(it.full_name, it.species)
          ? `[color="red"][s]${rawTxt}[/s][/color]`
          : `[color="red"]${rawTxt}[/color]`;
        target.push(out);
      }
    }
  }

  const familiesSortedOutput = familyLines.join("\n");
  const singlesSortedOutput  = singleLines.join("\n");

  // ===============================
  // Summary stats
  // ===============================
  statusEl.textContent = "Computing summary stats...";

  const shinyKeys = new Set();
  const darkKeys = new Set();
  const goldenKeys = new Set();
  const normalKeys = new Set();
  const ueugNormalKeys = new Set();

  for (const r of rowsSorted) {
    const fullName = r.full_name;
    const baseKey = canonicalKey(speciesFromFullName(fullName));
    const cat = colorCategory(fullName);

    if (cat === "shiny") shinyKeys.add(baseKey);
    else if (cat === "dark") darkKeys.add(baseKey);
    else if (cat === "golden") goldenKeys.add(baseKey);
    else {
      normalKeys.add(baseKey);
      const keyUeug = canonicalKey(stripPrefixes(fullName));
      if (ueugSet.has(keyUeug)) ueugNormalKeys.add(baseKey);
    }
  }

  const summaryLines = [];
  summaryLines.push("=== Summary Stats ===");
  summaryLines.push(`Unique Shiny species:  ${shinyKeys.size}`);
  summaryLines.push(`Unique Dark species:   ${darkKeys.size}`);
  summaryLines.push(`Unique Golden species: ${goldenKeys.size}`);
  summaryLines.push(`Unique Normal species: ${normalKeys.size}`);
  summaryLines.push(`UE/UG Normal species you have: ${ueugNormalKeys.size}`);
  summaryLines.push("* Note: Unowns are only counted once.");
  summaryLines.push("");

  // ===============================
  // Missing list output text + Top 10 Targets
  // ===============================

  function sliceVariant(list) {
    if (maxMissing && maxMissing > 0) return list.slice(0, maxMissing);
    return list;
  }

  const missingLines = [];
  missingLines.push(
    `=== Missing Ungendered > ${minUngendered} (per variant; ${
      maxMissing && maxMissing > 0 ? "up to " + maxMissing + " shown per variant" : "all shown"
    }) ===`
  );

  const filterNotes = [];
  if (flags.filterGolds) filterNotes.push("Goldens filtered");
  if (flags.filterNormals) filterNotes.push("Normals filtered");
  if (flags.filterShinys) filterNotes.push("Shinys filtered");
  if (flags.filterDarks) filterNotes.push("Darks filtered");
  if (dropDuplicates) filterNotes.push("Duplicates dropped");
  if (highlightRarity) filterNotes.push("Rarity highlighted");
  if (filterNotes.length) missingLines.push(`Filters: ${filterNotes.join(", ")}.`);
  if (missingOnlyFamilyNeeded) missingLines.push("Filter: only missing entries that belong to incomplete multi-species families.");
  if (addMissingInline) missingLines.push('Note: Missing items are also added inline in the Families output (in red).');

  function emitVariant(label, variantKey) {
    const all = missingByVariant[variantKey];
    if (!all || all.length === 0) return;
    const shown = sliceVariant(all);

    missingLines.push("");
    missingLines.push(`--- ${label} ---`);
    missingLines.push(`Total missing ${label.toLowerCase()}: ${all.length}`);

    if (shown.length === 0) {
      missingLines.push("You have all of them.");
    } else {
      for (const { name, cumR } of shown) {
        const missSpecies = speciesFromFullName(name);
        const sk = canonicalKey(missSpecies);

        const cat = colorCategory(name);
        const prefix = (cat === "golden") ? "Golden" : (cat === "shiny") ? "Shiny" : (cat === "dark") ? "Dark" : "";
        const form = extractForm(name);

        const isUeugNormal = (cat === "normal") && ueugSet.has(canonicalKey(stripPrefixes(name)));
        const lv4Eligible = (cat === "shiny" || cat === "dark" || isUeugNormal);

        const hasPreEvo = hasPreEvoWithNonZeroRarity(sk, prefix, missSpecies, form, lv4Eligible);

        const ig = Number.isFinite(cumR)
          ? Math.round(cumR).toLocaleString("en-US")
          : String(cumR ?? 0);

        missingLines.push(
          `${name} (?) (${ig} ig${hasPreEvo ? " including pre-evos" : ""})`
        );
      }
    }
  }

  if (!flags.filterGolds)  emitVariant("Golden", "golden");
  if (!flags.filterShinys) emitVariant("Shiny", "shiny");
  if (!flags.filterDarks)  emitVariant("Dark", "dark");
  if (!flags.filterNormals) emitVariant("Normal", "normal");

  function bestTargetForFamily(famId) {
    const list = missingByFamily.get(famId) || [];
    if (list.length === 0) return null;

    let best = list[0];
    for (const it of list) {
      const a = (it.cumR ?? 999999999);
      const b = (best.cumR ?? 999999999);
      if (a < b) best = it;
    }

    const missingLeft = list.length;
    const famSize = rarityFamilySize.get(famId) ?? 1;

    return {
      famId,
      famSize,
      missingLeft,
      bestName: best.name,
      bestCat: best.cat,
      bestCumR: best.cumR ?? 0,
    };
  }

  const familyTargets = [];
  for (const famId of incompleteFamilyIds) {
    const famSize = rarityFamilySize.get(famId) ?? 1;
    if (famSize <= 1) continue;
    const t = bestTargetForFamily(famId);
    if (t) familyTargets.push(t);
  }

  familyTargets.sort((a, b) => {
    if (a.missingLeft !== b.missingLeft) return a.missingLeft - b.missingLeft;
    if (a.bestCumR !== b.bestCumR) return a.bestCumR - b.bestCumR;
    if (a.famSize !== b.famSize) return b.famSize - a.famSize;
    return a.famId - b.famId;
  });

  const top10 = familyTargets.slice(0, 10);

  missingLines.push("");
  missingLines.push("=== Best Targets to Complete Families (Top 10) ===");
  if (top10.length === 0) {
    missingLines.push("No incomplete multi-species families found (under current filters/min threshold).");
  } else {
    missingLines.push("Ranked by: fewest missing left → rarest pick → larger family.");
    let i = 1;
    for (const t of top10) {
      const catLabel = (t.bestCat || "normal");
      missingLines.push(
        `${i}. ${t.bestName} (?) [${catLabel}] — family missing left: ${t.missingLeft}, family size: ${t.famSize}, cumulative rarity: ${t.bestCumR}`
      );
      i++;
    }
  }

  statusEl.textContent = "Done.";

  const familiesBbcodeBlock = ["[code]", familiesSortedOutput, "[/code]"].join("\n");
  const singlesBbcodeBlock  = ["[code]", singlesSortedOutput,  "[/code]"].join("\n");

  let familiesBlockOut = familiesBbcodeBlock;
  let singlesBlockOut = singlesBbcodeBlock;

  if (partitionOutput) {
    familiesBlockOut = "[B][U]Evolution Families:[/U][/B]\n" + familiesBbcodeBlock;
    singlesBlockOut  = "[B][U]Individual Pokemon / Pairs:[/U][/B]\n" + singlesBbcodeBlock;
  }

  const summaryText = omitSummaryStats ? "" : (summaryLines.join("\n") + "\n");
  const mainText = summaryText + familiesBlockOut;
  const secondaryText = partitionOutput ? singlesBlockOut : "";
  const missingText = missingLines.join("\n");

  // ===============================
  // Tag cloud source data (post filters/dedupe)
  // ===============================

  const cloudItems = rowsSorted.map(r => {
    const sk = canonicalKey(r.species);
    const variantPrefix = variantPrefixFromName(r.full_name);
    const form = extractForm(r.full_name);

    const cat = colorCategory(r.full_name);
    const baseForUeug = stripPrefixes(r.full_name);
    const isUeug = ueugSet.has(canonicalKey(baseForUeug));
    const lv4Eligible = (cat === "shiny" || cat === "dark" || (cat === "normal" && isUeug));

    const isInputLevel4 = (r.levelNum === 4);

    const cumR = cumulativeVariantRarityForSpecies(sk, variantPrefix, r.species, form, lv4Eligible, isInputLevel4);

    const chain = preEvoChainBreakdown(sk, variantPrefix, r.species, form, lv4Eligible, isInputLevel4);
    const baseR = chain.length ? (chain[0].rarity ?? 0) : 0;

    const text = r.full_name.replace(/\(\?\)\s*$/g, "").trim();

    const levelNum = r.levelNum ?? null;
    const isLv45 = (levelNum === 4 || levelNum === 5);

    const depth = evoDepth[canonicalKey(r.species)] ?? 0;
    const isEvolved = depth > 0;

    // --- FIXED SCORING HEURISTIC (penalties make words smaller) ---
    let adjustedScore = cumR;

    if (cat === "normal") {
      if (!isUeug) {
        adjustedScore *= (1 / 0.5); // = 2.0
      } else {
        if (!isLv45) {
          adjustedScore *= (1 / 0.8); // = 1.25
        }
      }
    } else {
      if (!isLv45) adjustedScore *= (1 / 0.8); // 1.25
      if (isEvolved) adjustedScore *= (1 / 0.7); // ~1.4286
    }

    return {
      text,
      cat,
      form: form || "",
      variantPrefix,
      species: r.species,
      levelNum: r.levelNum ?? null,
      baseRarity: baseR,
      cumulativeRarity: cumR,
      adjustedScore,
      isLv45,
      isEvolved,
      isUeug,
      chain
    };
  });

  cloudItems.sort((a, b) => (a.adjustedScore ?? 999999) - (b.adjustedScore ?? 999999));

  return {
    mainText,
    missingText,
    secondaryText,
    cloudItems
  };
}
