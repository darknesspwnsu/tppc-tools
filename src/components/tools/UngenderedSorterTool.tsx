"use client";

import { useState } from "react";

import { runUngenderedSorter } from "@/features/ungendered-sorter/core";

export function UngenderedSorterTool() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [outputMissing, setOutputMissing] = useState("");
  const [status, setStatus] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [minUngendered, setMinUngendered] = useState("10");
  const [maxMissing, setMaxMissing] = useState("20");
  const [includeGolds, setIncludeGolds] = useState(false);
  const [colorGolden, setColorGolden] = useState("gold");
  const [colorShiny, setColorShiny] = useState("magenta");
  const [colorDark, setColorDark] = useState("blue");
  const [colorNormal, setColorNormal] = useState("");

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Organizer</div>
        <h1 className="page-title">TPPC (?) Dex Sorter & Stats</h1>
        <p className="page-subtitle">Sort ungendered lists, show missing entries, and generate BBCode.</p>
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
                    const result = await runUngenderedSorter({
                      inputText,
                      minUngendered: Number.isFinite(Number(minUngendered)) ? Number(minUngendered) : 10,
                      maxMissing: Number.isFinite(Number(maxMissing)) ? Number(maxMissing) : 20,
                      includeGolds,
                      colors: {
                        golden: colorGolden,
                        shiny: colorShiny,
                        dark: colorDark,
                        normal: colorNormal
                      },
                      onStatus: setStatus
                    });
                    setOutputText(result.mainText);
                    setOutputMissing(result.missingText);
                  } catch (error) {
                    console.error(error);
                    setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
                  } finally {
                    setIsRunning(false);
                  }
                }}
              >
                Generate
              </button>
              <button
                id="clearButton"
                type="button"
                className="btn-outline-soft"
                onClick={() => {
                  setInputText("");
                  setOutputText("");
                  setOutputMissing("");
                  setStatus("");
                }}
              >
                Clear
              </button>
            </div>

            <div className="surface-strong mt-3" style={{ padding: "0.8rem", borderRadius: "0.75rem" }}>
              <div className="tool-template-grid">
                <div>
                  <label htmlFor="minUngendered" className="form-label fw-semibold">Min Ungendered</label>
                  <input id="minUngendered" className="field mono" type="number" value={minUngendered} onChange={(e) => setMinUngendered(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="maxMissing" className="form-label fw-semibold">Max Missing</label>
                  <input id="maxMissing" className="field mono" type="number" value={maxMissing} onChange={(e) => setMaxMissing(e.target.value)} />
                </div>
              </div>

              <div className="tool-actions">
                <label className="chip">
                  <input id="includeGolds" type="checkbox" checked={includeGolds} onChange={(e) => setIncludeGolds(e.target.checked)} />
                  Include Goldens in missing list
                </label>
              </div>

              <div className="tool-template-grid mt-3">
                <div>
                  <label htmlFor="colorGolden" className="form-label">Golden color</label>
                  <input id="colorGolden" className="field" value={colorGolden} onChange={(e) => setColorGolden(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="colorShiny" className="form-label">Shiny color</label>
                  <input id="colorShiny" className="field" value={colorShiny} onChange={(e) => setColorShiny(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="colorDark" className="form-label">Dark color</label>
                  <input id="colorDark" className="field" value={colorDark} onChange={(e) => setColorDark(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="colorNormal" className="form-label">Normal color</label>
                  <input id="colorNormal" className="field" value={colorNormal} onChange={(e) => setColorNormal(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="outputText" className="form-label fw-semibold">
              Output (Summary + Sorted BBCode)
            </label>
            <textarea id="outputText" className="field-area mono" rows={14} readOnly value={outputText} />

            <label htmlFor="outputMissing" className="form-label fw-semibold mt-3">
              Missing list (per variant)
            </label>
            <textarea id="outputMissing" className="field-area mono" rows={10} readOnly value={outputMissing} />

            <div id="status" className="tool-status-line">
              {status}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
