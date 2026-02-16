import { stripPrefixes, escapeRegex } from "./utils.js";

export function sampleArray(arr, n) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

export function buildVariantColorMapFromInputs(colorGoldenEl, colorShinyEl, colorDarkEl, colorNormalEl) {
  const gold = (colorGoldenEl?.value || "").trim() || "gold";
  const shiny = (colorShinyEl?.value || "").trim() || "magenta";
  const dark = (colorDarkEl?.value || "").trim() || "slategray";
  const normal = (colorNormalEl?.value || "").trim() || "#2b2b2b";
  return { golden: gold, shiny, dark, normal };
}

export function chainTooltipText(item) {
  const pieces = (item.chain || []).map(p => `${p.name}:${p.rarity ?? 0}`);
  const base = item.cumulativeRarity ?? 0;
  const adj = item.adjustedScore ?? base;

  const cat = item.cat || "normal";
  const form = item.form ? ` (${item.form})` : "";

  const flags = [];
  if (cat === "normal") flags.push(item.isUeug ? "UE/UG" : "non-UE/UG");
  else flags.push(item.isEvolved ? "evolved" : "base");
  flags.push(item.isLv45 ? "Lv4/5" : "not Lv4/5");

  return [
    `${item.text}`,
    `variant: ${cat}${form}`,
    `flags: ${flags.join(", ")}`,
    `baseline cumulative rarity: ${base}`,
    `adjusted score (cloud sizing): ${adj}`,
    `chain: ${pieces.join(" + ")} = ${base}`
  ].join("\n");
}

export function jumpHighlightWord(wordText, { outputTextEl, outputSinglesEl, outputMissingEl, jumpStatusEl }) {
  const word = (wordText || "").trim();
  if (!word) return false;

  const targets = [
    { el: outputTextEl, name: "Main output" },
    { el: outputSinglesEl, name: "Singles output" },
    { el: outputMissingEl, name: "Missing output" },
  ];

  const variantsToTry = (() => {
    const out = [];
    out.push(word);

    const cleaned = word.replace(/\s+/g, " ").trim();
    if (cleaned !== word) out.push(cleaned);

    const noPrefix = stripPrefixes(cleaned);
    if (noPrefix && noPrefix !== cleaned) out.push(noPrefix);

    const noForm = cleaned.replace(/\s*\([^)]+\)\s*$/g, "").trim();
    if (noForm && noForm !== cleaned) out.push(noForm);

    const noPrefixNoForm = stripPrefixes(noForm);
    if (noPrefixNoForm && !out.includes(noPrefixNoForm)) out.push(noPrefixNoForm);

    return Array.from(new Set(out)).filter(Boolean);
  })();

  for (const t of targets) {
    const el = t.el;
    if (!el) continue;

    const hay = el.value || "";
    if (!hay) continue;

    let bestIdx = -1;
    let bestNeedleLen = 0;

    for (const needle of variantsToTry) {
      const re = new RegExp(`\\b${escapeRegex(needle)}\\b`, "i");
      const m = re.exec(hay);
      if (m && (bestIdx === -1 || m.index < bestIdx)) {
        bestIdx = m.index;
        bestNeedleLen = m[0].length;
      }
    }

    if (bestIdx !== -1) {
      el.focus();
      el.setSelectionRange(bestIdx, bestIdx + Math.max(1, bestNeedleLen));
      const fontSizePx = parseFloat(getComputedStyle(el).fontSize) || 14;
      const lineHeightPx = parseFloat(getComputedStyle(el).lineHeight) || (fontSizePx * 1.2);
      const before = hay.slice(0, bestIdx);
      const lineIndex = before.split("\n").length - 1;
      const approxTop = Math.max(0, lineIndex * lineHeightPx - (el.clientHeight / 3));
      el.scrollTop = approxTop;

      jumpStatusEl.textContent = `Jumped to "${word}" in ${t.name}`;
      clearTimeout(jumpHighlightWord._timer);
      jumpHighlightWord._timer = setTimeout(() => { jumpStatusEl.textContent = ""; }, 1600);
      return true;
    }
  }

  jumpStatusEl.textContent = `Couldn't find "${word}" in outputs.`;
  clearTimeout(jumpHighlightWord._timer);
  jumpHighlightWord._timer = setTimeout(() => { jumpStatusEl.textContent = ""; }, 1600);
  return false;
}

export function renderTagCloud(items, svgEl, statusEl, colorMap, sampleSize, jumpCtx) {
  if (!items || items.length === 0) {
    statusEl.textContent = "No items to visualize.";
    if (window.d3) d3.select(svgEl).selectAll("*").remove();
    return;
  }

  const n = Number.isFinite(sampleSize) && sampleSize > 0 ? Math.floor(sampleSize) : 100;
  const sample = sampleArray(items, n);

  // cancel any previous drift loop
  if (renderTagCloud._raf) cancelAnimationFrame(renderTagCloud._raf);
  renderTagCloud._raf = null;

  function tScore(v) {
    if (!Number.isFinite(v)) v = 0;
    v = Math.max(0, v);
    return Math.log10(1 + v);
  }

  const tVals = sample.map(w => tScore(w.adjustedScore));
  const minV = Math.min(...tVals);
  const maxV = Math.max(...tVals);

  function invNormScoreFromTransformed(tv) {
    if (!Number.isFinite(tv)) tv = 0;
    if (minV === maxV) return 0.5;
    const norm = (tv - minV) / (maxV - minV);
    return 1 - norm;
  }

  const MIN_FONT = 11;
  const MAX_FONT = 34;

  const bbox = svgEl.getBoundingClientRect();
  const width = Math.max(320, Math.floor(bbox.width || 720));
  const height = Math.max(360, Math.floor(bbox.height || 650));

  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  statusEl.textContent =
    `Sample: ${sample.length}. (Log-scaled) adjusted score min: ${minV.toFixed(3)}, max: ${maxV.toFixed(3)}. ` +
    `Log10(1+score) → min-max normalized and inverted (lower score => bigger).`;

  const cloudWords = sample.map(w => {
    const score = invNormScoreFromTransformed(tScore(w.adjustedScore));
    const size = Math.round(MIN_FONT + score * (MAX_FONT - MIN_FONT));
    const fill = colorMap?.[w.cat] || "#2b2b2b";
    return {
      ...w,
      size,
      fill,
      tooltip: chainTooltipText(w),
    };
  });

  d3.layout.cloud()
    .size([width, height])
    .words(cloudWords)
    .padding(1)
    .spiral("rectangular")
    .rotate(() => (Math.random() < 0.15 ? (Math.random() < 0.5 ? 90 : -90) : 0))
    .font("sans-serif")
    .fontSize(d => d.size)
    .on("end", draw)
    .start();

  function draw(layoutWords) {
    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const tooltipEl = document.getElementById("cloudTooltip");

    const nodes = g.selectAll("g.word")
      .data(layoutWords)
      .enter()
      .append("g")
      .attr("class", "word")
      .attr("transform", d => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
      .style("cursor", "pointer")
      .style("pointer-events", "all");

    // Assign per-word drift params (very small motion)
    nodes.each(function (d) {
      d._drift = {
        ax: 0.9 + Math.random() * 1.2,        // amplitude x (px)
        ay: 0.9 + Math.random() * 1.2,        // amplitude y (px)
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        speedX: 0.0007 + Math.random() * 0.0010, // radians per ms
        speedY: 0.0007 + Math.random() * 0.0010
      };
    });

    nodes.append("text")
      .style("font-size", d => `${d.size}px`)
      .style("font-family", "sans-serif")
      .style("text-anchor", "middle")
      .style("fill", d => d.fill)
      .style("paint-order", "stroke")
      .style("stroke", "rgba(0,0,0,0.25)")
      .style("stroke-width", d => Math.max(0.6, d.size * 0.04))
      .each(function (d) {
        const textEl = d3.select(this);

        // Main Pokémon name
        textEl.append("tspan")
          .text(d.text);

        // Lv4 annotation (only if exactly level 4)
        if (d.levelNum === 4) {
          textEl.append("tspan")
            .text("4")
            .attr("baseline-shift", "sub")
            .attr("dx", "0.02em")             // tighter horizontal spacing
            .attr("dy", "0.10em")              // pulls it slightly down & closer
            .style("font-size", `${Math.round(d.size * 0.5)}px`)
            .style("font-weight", "bold")
            .style("fill", "red");          // red
        }
      });

    nodes
      .filter(d => d.cat === "normal" && d.isUeug)
      .append("text")
      .style("font-size", d => `${d.size}px`)
      .style("font-family", "sans-serif")
      .style("text-anchor", "middle")
      .style("fill", "rgba(255,255,255,0.38)")
      .attr("transform", "translate(-1.2,-1.2)")
      .text(d => d.text);

    function showTip(text, x, y) {
      if (!tooltipEl) return;
      tooltipEl.textContent = text;
      tooltipEl.style.display = "block";

      const pad = 12;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      tooltipEl.style.left = "0px";
      tooltipEl.style.top = "0px";

      const rect = tooltipEl.getBoundingClientRect();
      let left = x + pad;
      let top  = y + pad;

      if (left + rect.width > vw - 8) left = x - rect.width - pad;
      if (top + rect.height > vh - 8) top = y - rect.height - pad;

      left = Math.max(8, Math.min(left, vw - rect.width - 8));
      top  = Math.max(8, Math.min(top,  vh - rect.height - 8));

      tooltipEl.style.left = `${left}px`;
      tooltipEl.style.top  = `${top}px`;
    }

    function hideTip() {
      if (!tooltipEl) return;
      tooltipEl.style.display = "none";
    }

    nodes
      .on("pointerenter", (event, d) => showTip(d.tooltip, event.clientX, event.clientY))
      .on("pointermove", (event, d) => showTip(d.tooltip, event.clientX, event.clientY))
      .on("pointerleave", hideTip)
      .on("click", (_, d) => {
        navigator.clipboard.writeText(d.text).catch(() => {});
        jumpHighlightWord(d.text, jumpCtx);
      });

    function driftLoop(t) {
      nodes.attr("transform", d => {
        const p = d._drift;
        const dx = Math.sin(t * p.speedX + p.phaseX) * p.ax;
        const dy = Math.cos(t * p.speedY + p.phaseY) * p.ay;
        return `translate(${d.x + dx}, ${d.y + dy}) rotate(${d.rotate})`;
      });

      renderTagCloud._raf = requestAnimationFrame(driftLoop);
    }

    renderTagCloud._raf = requestAnimationFrame(driftLoop);
  }
}
