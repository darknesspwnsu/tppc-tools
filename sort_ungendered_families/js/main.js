import { getDomRefs } from "./dom.js";
import { runDexSorter } from "./sorter.js";
import { buildVariantColorMapFromInputs, renderTagCloud } from "./cloud.js";
import { initDarkMode } from "./darkmode.js";

function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard.writeText(text).catch(() => {});
}

function getCloudSampleSize(cloudSampleSizeEl) {
  const n = parseInt((cloudSampleSizeEl?.value || "100"), 10);
  if (!Number.isFinite(n) || n <= 0) return 100;
  return n;
}


function syncAnnotateRarityVisibility(dom) {
  const wrap = dom.annotateRarityWrapEl;
  const cb = dom.annotateRarityEl;
  if (!wrap || !cb) return;

  const show = !!dom.highlightRarityEl?.checked;
  wrap.classList.toggle("d-none", !show);
  if (!show) cb.checked = false;
}

function syncCloudSampleOptionVisibility(visualizeCloudEl, cloudSampleControlsEl) {
  if (visualizeCloudEl.checked) cloudSampleControlsEl.classList.remove("d-none");
  else cloudSampleControlsEl.classList.add("d-none");
}

const dom = getDomRefs();
syncAnnotateRarityVisibility(dom);
let lastCloudItems = null;

function rerenderCloudIfVisible() {
  if (!dom.visualizeCloudEl.checked) return;
  if (dom.cloudRowEl.classList.contains("d-none")) return;
  if (!lastCloudItems || lastCloudItems.length === 0) return;

  const colorMap = buildVariantColorMapFromInputs(dom.colorGoldenEl, dom.colorShinyEl, dom.colorDarkEl, dom.colorNormalEl);
  renderTagCloud(
    lastCloudItems,
    dom.tagCloudSvgEl,
    dom.cloudStatusEl,
    colorMap,
    getCloudSampleSize(dom.cloudSampleSizeEl),
    { outputTextEl: dom.outputTextEl, outputSinglesEl: dom.outputSinglesEl, outputMissingEl: dom.outputMissingEl, jumpStatusEl: dom.jumpStatusEl }
  );
}

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(rerenderCloudIfVisible, 180);
});

dom.runButton.addEventListener("click", async () => {
  const inputText = dom.inputListEl.value.trim();
  if (!inputText) {
    dom.statusEl.textContent = "Please paste your list first.";
    return;
  }

  const minUngendered = parseInt(dom.minUngEl.value, 10);
  const maxMissing = parseInt(dom.maxMissEl.value, 10);

  const flags = {
    filterGolds: dom.filterGoldsEl.checked,
    filterNormals: dom.filterNormalsEl.checked,
    filterShinys: dom.filterShinysEl.checked,
    filterDarks: dom.filterDarksEl.checked,
  };

  const partitionOutput = dom.partitionOutputEl.checked;
  const missingOnlyFamilyNeeded = dom.missingOnlyFamilyNeededEl.checked;
  const showLevelLabel = dom.showLevelLabelEl.checked;
  const dropDuplicates = dom.dropDuplicatesEl.checked;
  const addMissingInline = dom.addMissingInlineEl.checked;
  const noGroupSpacing = dom.noGroupSpacingEl.checked;
  const highlightRarity = dom.highlightRarityEl.checked;
  const annotateRarity = highlightRarity && !!dom.annotateRarityEl?.checked;
  const omitSummaryStats = dom.omitSummaryStatsEl.checked;

  const colors = {
    golden: dom.colorGoldenEl.value || "",
    shiny: dom.colorShinyEl.value || "",
    dark: dom.colorDarkEl.value || "",
    normal: dom.colorNormalEl.value || "",
  };

  dom.runButton.disabled = true;
  dom.statusEl.textContent = "Running sorter...";

  try {
    const { mainText, missingText, secondaryText, cloudItems } = await runDexSorter({
      inputText,
      minUngendered: Number.isFinite(minUngendered) ? minUngendered : 10,
      maxMissing: Number.isFinite(maxMissing) ? maxMissing : 20,
      flags,
      colors,
      statusEl: dom.statusEl,
      partitionOutput,
      missingOnlyFamilyNeeded,
      showLevelLabel,
      dropDuplicates,
      addMissingInline,
      noGroupSpacing,
      highlightRarity,
      annotateRarity,
      omitSummaryStats
    });

    dom.outputTextEl.value = mainText;
    dom.outputMissingEl.value = missingText;

    if (partitionOutput) {
      dom.familiesSinglesBlock.classList.remove("d-none");
      dom.outputSinglesEl.value = secondaryText || "";
    } else {
      dom.familiesSinglesBlock.classList.add("d-none");
      dom.outputSinglesEl.value = "";
    }

    lastCloudItems = cloudItems || null;

    if (dom.visualizeCloudEl.checked && lastCloudItems && lastCloudItems.length > 0) {
      dom.cloudRowEl.classList.remove("d-none");
      const colorMap = buildVariantColorMapFromInputs(dom.colorGoldenEl, dom.colorShinyEl, dom.colorDarkEl, dom.colorNormalEl);
      setTimeout(() => renderTagCloud(
        lastCloudItems,
        dom.tagCloudSvgEl,
        dom.cloudStatusEl,
        colorMap,
        getCloudSampleSize(dom.cloudSampleSizeEl),
        { outputTextEl: dom.outputTextEl, outputSinglesEl: dom.outputSinglesEl, outputMissingEl: dom.outputMissingEl, jumpStatusEl: dom.jumpStatusEl }
      ), 0);
    } else {
      dom.cloudRowEl.classList.add("d-none");
      dom.cloudStatusEl.textContent = "";
      if (window.d3) d3.select(dom.tagCloudSvgEl).selectAll("*").remove();
    }

  } catch (err) {
    console.error(err);
    dom.statusEl.textContent = "Error: " + err.message;
  } finally {
    dom.runButton.disabled = false;
  }
});

dom.clearButton.addEventListener("click", () => {
  dom.inputListEl.value = "";
  dom.outputTextEl.value = "";
  dom.outputMissingEl.value = "";
  dom.outputSinglesEl.value = "";
  dom.familiesSinglesBlock.classList.add("d-none");
  dom.statusEl.textContent = "";
  dom.jumpStatusEl.textContent = "";

  dom.cloudRowEl.classList.add("d-none");
  dom.cloudStatusEl.textContent = "";
  lastCloudItems = null;
  if (window.d3) d3.select(dom.tagCloudSvgEl).selectAll("*").remove();
});

dom.copyMainBtn.addEventListener("click", () => copyToClipboard(dom.outputTextEl.value));
dom.copyMissingBtn.addEventListener("click", () => copyToClipboard(dom.outputMissingEl.value));
dom.copySinglesBtn.addEventListener("click", () => copyToClipboard(dom.outputSinglesEl.value));

dom.rerollCloudBtn.addEventListener("click", () => {
  if (!lastCloudItems || lastCloudItems.length === 0) return;
  dom.cloudRowEl.classList.remove("d-none");
  const colorMap = buildVariantColorMapFromInputs(dom.colorGoldenEl, dom.colorShinyEl, dom.colorDarkEl, dom.colorNormalEl);
  renderTagCloud(
    lastCloudItems,
    dom.tagCloudSvgEl,
    dom.cloudStatusEl,
    colorMap,
    getCloudSampleSize(dom.cloudSampleSizeEl),
    { outputTextEl: dom.outputTextEl, outputSinglesEl: dom.outputSinglesEl, outputMissingEl: dom.outputMissingEl, jumpStatusEl: dom.jumpStatusEl }
  );
});

dom.visualizeCloudEl.addEventListener("change", () => {
  syncCloudSampleOptionVisibility(dom.visualizeCloudEl, dom.cloudSampleControlsEl);

  if (dom.visualizeCloudEl.checked && lastCloudItems && lastCloudItems.length > 0) {
    dom.cloudRowEl.classList.remove("d-none");
    const colorMap = buildVariantColorMapFromInputs(dom.colorGoldenEl, dom.colorShinyEl, dom.colorDarkEl, dom.colorNormalEl);
    setTimeout(() => renderTagCloud(
      lastCloudItems,
      dom.tagCloudSvgEl,
      dom.cloudStatusEl,
      colorMap,
      getCloudSampleSize(dom.cloudSampleSizeEl),
      { outputTextEl: dom.outputTextEl, outputSinglesEl: dom.outputSinglesEl, outputMissingEl: dom.outputMissingEl, jumpStatusEl: dom.jumpStatusEl }
    ), 0);
  } else {
    dom.cloudRowEl.classList.add("d-none");
    dom.cloudStatusEl.textContent = "";
    if (window.d3) d3.select(dom.tagCloudSvgEl).selectAll("*").remove();
  }
});

dom.highlightRarityEl.addEventListener("change", () => {
  syncAnnotateRarityVisibility(dom);
});

dom.cloudSampleSizeEl.addEventListener("change", () => {
  if (!dom.visualizeCloudEl.checked) return;
  rerenderCloudIfVisible();
});

syncCloudSampleOptionVisibility(dom.visualizeCloudEl, dom.cloudSampleControlsEl);

document.getElementById("copyright-year").textContent = new Date().getFullYear();

initDarkMode(dom.darkModeToggleEl);
