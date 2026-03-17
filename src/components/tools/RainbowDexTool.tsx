"use client";

import { useState } from "react";

import { runRainbowDexChecklist } from "@/features/rainbow-dex/core";
import { usePersistentOptions } from "@/hooks/usePersistentOptions";
import { PREFS_KEYS } from "@/lib/prefs-keys";

async function copyText(text: string) {
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // fallback below
  }

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
  } catch {
    // no-op
  }
  document.body.removeChild(ta);
}

export function RainbowDexTool() {
  const [inputList, setInputList] = useState("");
  const [status, setStatus] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [checklist, setChecklist] = useState("");
  const [extras, setExtras] = useState("");

  const [prefs, setPrefs] = usePersistentOptions<{
    minRarity: string;
    maxMissing: string;
    includeGolds: boolean;
  }>(
    PREFS_KEYS.rainbowDex,
    {
      minRarity: "10",
      maxMissing: "20",
      includeGolds: true
    },
    {
      version: 1,
      migrate: (raw) => {
        if (!raw || typeof raw !== "object") {
          return { minRarity: "10", maxMissing: "20", includeGolds: true };
        }
        return {
          minRarity: String((raw as { minRarity?: unknown }).minRarity ?? "10"),
          maxMissing: String((raw as { maxMissing?: unknown }).maxMissing ?? "20"),
          includeGolds: (raw as { includeGolds?: unknown }).includeGolds !== false
        };
      }
    }
  );

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Organizer</div>
        <h1 className="page-title">TPPC Rainbow Dex Checklist</h1>
        <p className="page-subtitle">Generate checklist and high-rarity missing outputs for Rainbow Dex progress.</p>
      </section>

      <section className="surface tool-pane">
        <div className="tool-template-grid">
          <div>
            <label htmlFor="inputList" className="form-label fw-semibold">
              Paste your TPPC Pokemon list
            </label>
            <textarea
              id="inputList"
              className="field-area mono io-input"
              rows={16}
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
                  value={prefs.minRarity}
                  onChange={(e) => setPrefs({ minRarity: e.target.value })}
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
                  value={prefs.maxMissing}
                  onChange={(e) => setPrefs({ maxMissing: e.target.value })}
                />
              </div>
            </div>

            <div className="surface-strong mt-3" style={{ padding: "0.8rem", borderRadius: "0.75rem" }}>
              <div className="fw-semibold mb-2">Options</div>
              <div className="form-check mb-0">
                <input
                  id="includeGolds"
                  className="form-check-input"
                  type="checkbox"
                  checked={prefs.includeGolds}
                  onChange={(e) => setPrefs({ includeGolds: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="includeGolds">
                  Include Goldens in missing list
                </label>
              </div>
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
                      minRarity: Number.isFinite(Number(prefs.minRarity)) ? Number(prefs.minRarity) : 10,
                      maxMissing: Number.isFinite(Number(prefs.maxMissing)) ? Number(prefs.maxMissing) : 20,
                      includeGolds: prefs.includeGolds,
                      onStatus: setStatus
                    });
                    setChecklist(result.checklistText);
                    setExtras(result.extrasText);
                    setStatus("Checklist generated.");
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

              <button
                id="clearButton"
                type="button"
                className="btn-outline-soft"
                onClick={() => {
                  setInputList("");
                  setChecklist("");
                  setExtras("");
                  setStatus("");
                }}
              >
                Clear
              </button>
            </div>

            <span id="status" className="tool-status-line">
              {status}
            </span>
          </div>

          <div>
            <label htmlFor="outputChecklist" className="form-label fw-semibold">
              Rainbow Dex Checklist (BBCode)
            </label>
            <textarea id="outputChecklist" className="field-area mono io-output" rows={20} readOnly value={checklist} />
            <div className="tool-actions">
              <button
                id="copyChecklistBtn"
                type="button"
                className="btn-outline-soft"
                onClick={async () => {
                  await copyText(checklist);
                  setStatus(checklist.trim() ? "Copied checklist." : "Nothing to copy.");
                }}
              >
                Copy Checklist
              </button>
            </div>

            <label htmlFor="outputExtras" className="form-label fw-semibold mt-3">
              Missing + Duplicates
            </label>
            <textarea id="outputExtras" className="field-area mono io-output" rows={14} readOnly value={extras} />
            <div className="tool-actions">
              <button
                id="copyExtrasBtn"
                type="button"
                className="btn-outline-soft"
                onClick={async () => {
                  await copyText(extras);
                  setStatus(extras.trim() ? "Copied missing/duplicates." : "Nothing to copy.");
                }}
              >
                Copy Missing + Duplicates
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
