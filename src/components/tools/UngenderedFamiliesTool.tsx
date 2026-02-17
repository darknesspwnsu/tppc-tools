"use client";

import { useState } from "react";

import { runUngenderedFamilies } from "@/features/ungendered-families/core";

export function UngenderedFamiliesTool() {
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [partitionOutput, setPartitionOutput] = useState(false);
  const [missingOnlyFamilyNeeded, setMissingOnlyFamilyNeeded] = useState(false);
  const [addMissingInline, setAddMissingInline] = useState(false);
  const [noGroupSpacing, setNoGroupSpacing] = useState(false);
  const [showLevelLabel, setShowLevelLabel] = useState(false);
  const [dropDuplicates, setDropDuplicates] = useState(true);
  const [highlightRarity, setHighlightRarity] = useState(true);
  const [annotateRarity, setAnnotateRarity] = useState(false);
  const [omitSummaryStats, setOmitSummaryStats] = useState(false);

  const [filterGolds, setFilterGolds] = useState(false);
  const [filterNormals, setFilterNormals] = useState(false);
  const [filterShinys, setFilterShinys] = useState(false);
  const [filterDarks, setFilterDarks] = useState(false);
  const [minUngendered, setMinUngendered] = useState("10");
  const [maxMissing, setMaxMissing] = useState("20");

  const [colorGolden, setColorGolden] = useState("gold");
  const [colorShiny, setColorShiny] = useState("magenta");
  const [colorDark, setColorDark] = useState("slategray");
  const [colorNormal, setColorNormal] = useState("");

  const [outputText, setOutputText] = useState("");
  const [outputMissing, setOutputMissing] = useState("");
  const [outputSingles, setOutputSingles] = useState("");

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Organizer</div>
        <h1 className="page-title">TPPC (?) Enhanced Dex Sorter & Stats</h1>
        <p className="page-subtitle">Ungendered family grouping with rarity-aware missing outputs.</p>
      </section>

      <section className="surface tool-pane">
        <div className="tool-template-grid">
          <div>
            <label htmlFor="inputList" className="form-label fw-semibold">
              Input
            </label>
            <textarea
              id="inputList"
              className="field-area mono"
              rows={16}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <div className="tool-actions">
              <button
                id="runButton"
                type="button"
                className="btn-primary-soft"
                disabled={isRunning}
                onClick={async () => {
                  if (!inputText.trim()) {
                    setStatus("Please paste your list first.");
                    return;
                  }

                  setIsRunning(true);
                  setStatus("Running sorter...");
                  try {
                    const result = await runUngenderedFamilies({
                      inputText,
                      minUngendered: Number.isFinite(Number(minUngendered)) ? Number(minUngendered) : 10,
                      maxMissing: Number.isFinite(Number(maxMissing)) ? Number(maxMissing) : 20,
                      flags: {
                        filterGolds,
                        filterNormals,
                        filterShinys,
                        filterDarks
                      },
                      colors: {
                        golden: colorGolden,
                        shiny: colorShiny,
                        dark: colorDark,
                        normal: colorNormal
                      },
                      partitionOutput,
                      missingOnlyFamilyNeeded,
                      showLevelLabel,
                      dropDuplicates,
                      addMissingInline,
                      noGroupSpacing,
                      highlightRarity,
                      annotateRarity: highlightRarity && annotateRarity,
                      omitSummaryStats,
                      onStatus: setStatus
                    });

                    setOutputText(result.mainText);
                    setOutputMissing(result.missingText);
                    setOutputSingles(result.secondaryText || "");
                  } catch (error) {
                    console.error(error);
                    setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
                  } finally {
                    setIsRunning(false);
                  }
                }}
              >
                Generate BBCode & Stats
              </button>

              <button
                id="clearButton"
                type="button"
                className="btn-outline-soft"
                onClick={() => {
                  setInputText("");
                  setOutputText("");
                  setOutputMissing("");
                  setOutputSingles("");
                  setStatus("");
                }}
              >
                Clear
              </button>
            </div>

            <div className="surface-strong mt-3" style={{ padding: "0.8rem", borderRadius: "0.75rem" }}>
              <div className="stack">
                <label className="chip">
                  <input id="partitionOutput" type="checkbox" checked={partitionOutput} onChange={(e) => setPartitionOutput(e.target.checked)} />
                  Partition output into Families vs Singles/Sets
                </label>
                <label className="chip">
                  <input id="missingOnlyFamilyNeeded" type="checkbox" checked={missingOnlyFamilyNeeded} onChange={(e) => setMissingOnlyFamilyNeeded(e.target.checked)} />
                  Missing list only for incomplete families
                </label>
                <label className="chip">
                  <input id="addMissingInline" type="checkbox" checked={addMissingInline} onChange={(e) => setAddMissingInline(e.target.checked)} />
                  Add missing items inline
                </label>
                <label className="chip">
                  <input id="noGroupSpacing" type="checkbox" checked={noGroupSpacing} onChange={(e) => setNoGroupSpacing(e.target.checked)} />
                  No space between family groups
                </label>
                <label className="chip">
                  <input id="showLevelLabel" type="checkbox" checked={showLevelLabel} onChange={(e) => setShowLevelLabel(e.target.checked)} />
                  Show level as (Level: X)
                </label>
                <label className="chip">
                  <input id="dropDuplicates" type="checkbox" checked={dropDuplicates} onChange={(e) => setDropDuplicates(e.target.checked)} />
                  Drop duplicates (keep lowest level)
                </label>
                <label className="chip">
                  <input id="highlightRarity" type="checkbox" checked={highlightRarity} onChange={(e) => setHighlightRarity(e.target.checked)} />
                  Highlight rarity
                </label>
                <label className="chip">
                  <input id="annotateRarity" type="checkbox" checked={annotateRarity} onChange={(e) => setAnnotateRarity(e.target.checked)} />
                  Annotate rarity
                </label>
                <label className="chip">
                  <input id="omitSummaryStats" type="checkbox" checked={omitSummaryStats} onChange={(e) => setOmitSummaryStats(e.target.checked)} />
                  Omit summary stats
                </label>
              </div>

              <div className="tool-template-grid mt-3">
                <div>
                  <label htmlFor="minUngendered" className="form-label fw-semibold">Min Ungendered</label>
                  <input id="minUngendered" className="field mono" type="number" value={minUngendered} onChange={(e) => setMinUngendered(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="maxMissing" className="form-label fw-semibold">Max Missing</label>
                  <input id="maxMissing" className="field mono" type="number" value={maxMissing} onChange={(e) => setMaxMissing(e.target.value)} />
                </div>
              </div>

              <div className="stack mt-3">
                <label className="chip"><input id="filterGolds" type="checkbox" checked={filterGolds} onChange={(e) => setFilterGolds(e.target.checked)} /> Filter Goldens</label>
                <label className="chip"><input id="filterNormals" type="checkbox" checked={filterNormals} onChange={(e) => setFilterNormals(e.target.checked)} /> Filter Normals</label>
                <label className="chip"><input id="filterShinys" type="checkbox" checked={filterShinys} onChange={(e) => setFilterShinys(e.target.checked)} /> Filter Shinys</label>
                <label className="chip"><input id="filterDarks" type="checkbox" checked={filterDarks} onChange={(e) => setFilterDarks(e.target.checked)} /> Filter Darks</label>
              </div>

              <div className="tool-template-grid mt-3">
                <div>
                  <label htmlFor="colorGolden" className="form-label fw-semibold">Gold color</label>
                  <input id="colorGolden" className="field" value={colorGolden} onChange={(e) => setColorGolden(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="colorShiny" className="form-label fw-semibold">Shiny color</label>
                  <input id="colorShiny" className="field" value={colorShiny} onChange={(e) => setColorShiny(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="colorDark" className="form-label fw-semibold">Dark color</label>
                  <input id="colorDark" className="field" value={colorDark} onChange={(e) => setColorDark(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="colorNormal" className="form-label fw-semibold">Normal color</label>
                  <input id="colorNormal" className="field" value={colorNormal} onChange={(e) => setColorNormal(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="outputText" className="form-label fw-semibold">
              Output (Summary + Families BBCode)
            </label>
            <textarea id="outputText" className="field-area mono" rows={14} readOnly value={outputText} />

            <div id="familiesSinglesBlock" className={partitionOutput ? "mt-3" : "mt-3 d-none"}>
              <label htmlFor="outputSingles" className="form-label fw-semibold">Singles / Sets Output</label>
              <textarea id="outputSingles" className="field-area mono" rows={8} readOnly value={outputSingles} />
            </div>

            <label htmlFor="outputMissing" className="form-label fw-semibold mt-3">
              Missing (per variant)
            </label>
            <textarea id="outputMissing" className="field-area mono" rows={10} readOnly value={outputMissing} />

            <div id="status" className="tool-status-line">
              {status}
            </div>
            <div id="jumpStatus" className="tool-status-line" />
          </div>
        </div>
      </section>
    </div>
  );
}
