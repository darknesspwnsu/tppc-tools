export function getDomRefs() {
  const runButton = document.getElementById("runButton");
  const clearButton = document.getElementById("clearButton");
  const statusEl = document.getElementById("status");
  const jumpStatusEl = document.getElementById("jumpStatus");

  const inputListEl = document.getElementById("inputList");
  const outputTextEl = document.getElementById("outputText");
  const outputMissingEl = document.getElementById("outputMissing");
  const outputSinglesEl = document.getElementById("outputSingles");
  const familiesSinglesBlock = document.getElementById("familiesSinglesBlock");

  const minUngEl = document.getElementById("minUngendered");
  const maxMissEl = document.getElementById("maxMissing");

  const partitionOutputEl = document.getElementById("partitionOutput");

  const filterGoldsEl = document.getElementById("filterGolds");
  const filterNormalsEl = document.getElementById("filterNormals");
  const filterShinysEl = document.getElementById("filterShinys");
  const filterDarksEl = document.getElementById("filterDarks");

  const missingOnlyFamilyNeededEl = document.getElementById("missingOnlyFamilyNeeded");
  const addMissingInlineEl = document.getElementById("addMissingInline");
  const noGroupSpacingEl = document.getElementById("noGroupSpacing");

  const showLevelLabelEl = document.getElementById("showLevelLabel");
  const dropDuplicatesEl = document.getElementById("dropDuplicates");
  const highlightRarityEl = document.getElementById("highlightRarity");
  const annotateRarityWrapEl = document.getElementById("annotateRarityWrap");
  const annotateRarityEl = document.getElementById("annotateRarity");
  const omitSummaryStatsEl = document.getElementById("omitSummaryStats");

  const visualizeCloudEl = document.getElementById("visualizeCloud");
  const cloudSampleControlsEl = document.getElementById("cloudSampleControls");
  const cloudSampleSizeEl = document.getElementById("cloudSampleSize");

  const colorGoldenEl = document.getElementById("colorGolden");
  const colorShinyEl = document.getElementById("colorShiny");
  const colorDarkEl = document.getElementById("colorDark");
  const colorNormalEl = document.getElementById("colorNormal");

  const copyMainBtn = document.getElementById("copyMainBtn");
  const copyMissingBtn = document.getElementById("copyMissingBtn");
  const copySinglesBtn = document.getElementById("copySinglesBtn");

  const cloudRowEl = document.getElementById("cloudRow");
  const tagCloudSvgEl = document.getElementById("tagCloudSvg");
  const cloudStatusEl = document.getElementById("cloudStatus");
  const rerollCloudBtn = document.getElementById("rerollCloudBtn");

  const darkModeToggleEl = document.getElementById("darkModeToggle");

  return {
    runButton, clearButton, statusEl, jumpStatusEl,
    inputListEl, outputTextEl, outputMissingEl, outputSinglesEl, familiesSinglesBlock,
    minUngEl, maxMissEl,
    partitionOutputEl,
    filterGoldsEl, filterNormalsEl, filterShinysEl, filterDarksEl,
    missingOnlyFamilyNeededEl, addMissingInlineEl, noGroupSpacingEl,
    showLevelLabelEl, dropDuplicatesEl, highlightRarityEl, annotateRarityWrapEl, annotateRarityEl, omitSummaryStatsEl,
    visualizeCloudEl, cloudSampleControlsEl, cloudSampleSizeEl,
    colorGoldenEl, colorShinyEl, colorDarkEl, colorNormalEl,
    copyMainBtn, copyMissingBtn, copySinglesBtn,
    cloudRowEl, tagCloudSvgEl, cloudStatusEl, rerollCloudBtn,
    darkModeToggleEl
  };
}
