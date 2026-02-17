"use client";

import { useState } from "react";

import { runRainbowDexChecklist } from "@/features/rainbow-dex/core";

export function RainbowDexTool() {
  const [inputList, setInputList] = useState("");
  const [minRarity, setMinRarity] = useState("10");
  const [maxMissing, setMaxMissing] = useState("20");
  const [includeGolds, setIncludeGolds] = useState(true);
  const [status, setStatus] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [checklist, setChecklist] = useState("");
  const [extras, setExtras] = useState("");
  const [showOutput, setShowOutput] = useState(false);

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Organizer</div>
        <h1 className="page-title">TPPC Rainbow Dex Checklist</h1>
        <p className="page-subtitle">Generate checklist and high-rarity missing outputs for Rainbow Dex progress.</p>
      </section>

      <section className="surface tool-pane">
        <div id="input-view" className={showOutput ? "d-none" : ""}>
          <label htmlFor="inputList" className="form-label fw-semibold">
            Paste your TPPC Pokemon list
          </label>
          <textarea
            id="inputList"
            className="field-area mono"
            rows={14}
            value={inputList}
            onChange={(e) => setInputList(e.target.value)}
          />

          <div className="tool-template-grid" style={{ marginTop: "0.7rem" }}>
            <div>
              <label htmlFor="minRarity" className="form-label fw-semibold">
                Min Rarity to check
              </label>
              <input
                id="minRarity"
                type="number"
                className="field mono"
                min={0}
                value={minRarity}
                onChange={(e) => setMinRarity(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="maxMissing" className="form-label fw-semibold">
                Max Missing per variant
              </label>
              <input
                id="maxMissing"
                type="number"
                className="field mono"
                min={0}
                value={maxMissing}
                onChange={(e) => setMaxMissing(e.target.value)}
              />
            </div>
          </div>

          <div className="tool-actions">
            <label className="chip">
              <input
                id="includeGolds"
                type="checkbox"
                checked={includeGolds}
                onChange={(e) => setIncludeGolds(e.target.checked)}
              />
              Include Goldens in missing list
            </label>
          </div>

          <div className="tool-actions">
            <button
              id="runButton"
              type="button"
              className="btn-primary-soft"
              disabled={isRunning}
              onClick={async () => {
                const inputText = inputList.trim();
                if (!inputText) {
                  setStatus("Please paste your list first.");
                  return;
                }

                setIsRunning(true);
                setStatus("Running rainbow dex checklist...");
                try {
                  const result = await runRainbowDexChecklist({
                    inputText,
                    minRarity: Number.isFinite(Number(minRarity)) ? Number(minRarity) : 10,
                    maxMissing: Number.isFinite(Number(maxMissing)) ? Number(maxMissing) : 20,
                    includeGolds,
                    onStatus: setStatus
                  });
                  setChecklist(result.checklistText);
                  setExtras(result.extrasText);
                  setShowOutput(true);
                } catch (error) {
                  console.error(error);
                  setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
                } finally {
                  setIsRunning(false);
                }
              }}
            >
              Generate Checklist
            </button>
            <span id="status" className="tool-status-line">
              {status}
            </span>
          </div>
        </div>

        <div id="output-view" className={showOutput ? "" : "d-none"}>
          <label htmlFor="outputChecklist" className="form-label fw-semibold">
            Rainbow Dex Checklist (BBCode)
          </label>
          <textarea id="outputChecklist" className="field-area mono" rows={20} readOnly value={checklist} />

          <label htmlFor="outputExtras" className="form-label fw-semibold mt-3">
            Missing + Duplicates
          </label>
          <textarea id="outputExtras" className="field-area mono" rows={14} readOnly value={extras} />

          <div className="tool-actions">
            <button
              id="backButton"
              type="button"
              className="btn-outline-soft"
              onClick={() => {
                setShowOutput(false);
                setStatus("");
              }}
            >
              Back
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
