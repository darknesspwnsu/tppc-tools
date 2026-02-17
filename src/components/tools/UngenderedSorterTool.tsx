"use client";

import { useState } from "react";

import { runUngenderedSorter } from "@/features/ungendered-sorter/core";
import { usePersistentOptions } from "@/hooks/usePersistentOptions";
import { PREFS_KEYS } from "@/lib/prefs-keys";

async function copyText(text: string) {
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // fall through
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

export function UngenderedSorterTool() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [outputMissing, setOutputMissing] = useState("");
  const [status, setStatus] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [prefs, setPrefs] = usePersistentOptions<{
    minUngendered: string;
    maxMissing: string;
    includeGolds: boolean;
    colorGolden: string;
    colorShiny: string;
    colorDark: string;
    colorNormal: string;
  }>(
    PREFS_KEYS.ungenderedSorter,
    {
      minUngendered: "10",
      maxMissing: "20",
      includeGolds: false,
      colorGolden: "gold",
      colorShiny: "magenta",
      colorDark: "blue",
      colorNormal: ""
    },
    {
      version: 1,
      migrate: (raw) => {
        if (!raw || typeof raw !== "object") {
          return {
            minUngendered: "10",
            maxMissing: "20",
            includeGolds: false,
            colorGolden: "gold",
            colorShiny: "magenta",
            colorDark: "blue",
            colorNormal: ""
          };
        }
        return {
          minUngendered: String((raw as { minUngendered?: unknown }).minUngendered ?? "10"),
          maxMissing: String((raw as { maxMissing?: unknown }).maxMissing ?? "20"),
          includeGolds: Boolean((raw as { includeGolds?: unknown }).includeGolds),
          colorGolden: String((raw as { colorGolden?: unknown }).colorGolden ?? "gold"),
          colorShiny: String((raw as { colorShiny?: unknown }).colorShiny ?? "magenta"),
          colorDark: String((raw as { colorDark?: unknown }).colorDark ?? "blue"),
          colorNormal: String((raw as { colorNormal?: unknown }).colorNormal ?? "")
        };
      }
    }
  );

  return (
    <div id="app" className="tool-template">
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
            <textarea id="inputList" className="field-area mono io-input" rows={16} value={inputText} onChange={(event) => setInputText(event.target.value)} />

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
                      minUngendered: Number.isFinite(Number(prefs.minUngendered)) ? Number(prefs.minUngendered) : 10,
                      maxMissing: Number.isFinite(Number(prefs.maxMissing)) ? Number(prefs.maxMissing) : 20,
                      includeGolds: prefs.includeGolds,
                      colors: {
                        golden: prefs.colorGolden,
                        shiny: prefs.colorShiny,
                        dark: prefs.colorDark,
                        normal: prefs.colorNormal
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
                  <input
                    id="minUngendered"
                    className="field mono"
                    type="number"
                    value={prefs.minUngendered}
                    onChange={(event) => setPrefs({ minUngendered: event.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="maxMissing" className="form-label fw-semibold">Max Missing</label>
                  <input
                    id="maxMissing"
                    className="field mono"
                    type="number"
                    value={prefs.maxMissing}
                    onChange={(event) => setPrefs({ maxMissing: event.target.value })}
                  />
                </div>
              </div>

              <div className="tool-actions">
                <label className="chip">
                  <input id="includeGolds" type="checkbox" checked={prefs.includeGolds} onChange={(event) => setPrefs({ includeGolds: event.target.checked })} />
                  Include Goldens in missing list
                </label>
              </div>

              <div id="colorBox" className="tool-template-grid mt-3">
                <div>
                  <label htmlFor="colorGolden" className="form-label">Golden color</label>
                  <input id="colorGolden" className="field" value={prefs.colorGolden} onChange={(event) => setPrefs({ colorGolden: event.target.value })} />
                </div>
                <div>
                  <label htmlFor="colorShiny" className="form-label">Shiny color</label>
                  <input id="colorShiny" className="field" value={prefs.colorShiny} onChange={(event) => setPrefs({ colorShiny: event.target.value })} />
                </div>
                <div>
                  <label htmlFor="colorDark" className="form-label">Dark color</label>
                  <input id="colorDark" className="field" value={prefs.colorDark} onChange={(event) => setPrefs({ colorDark: event.target.value })} />
                </div>
                <div>
                  <label htmlFor="colorNormal" className="form-label">Normal color</label>
                  <input id="colorNormal" className="field" value={prefs.colorNormal} onChange={(event) => setPrefs({ colorNormal: event.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="outputText" className="form-label fw-semibold">
              Output (Summary + Sorted BBCode)
            </label>
            <textarea id="outputText" className="field-area mono io-output" rows={14} readOnly value={outputText} />

            <label htmlFor="outputMissing" className="form-label fw-semibold mt-3">
              Missing list (per variant)
            </label>
            <textarea id="outputMissing" className="field-area mono io-output" rows={10} readOnly value={outputMissing} />

            <div className="tool-actions">
              <button
                id="copyOutputBtn"
                type="button"
                className="btn btn-success"
                onClick={async () => {
                  await copyText(outputText);
                  setStatus(outputText.trim() ? "Copied main output." : "Nothing to copy.");
                }}
              >
                Copy Output
              </button>
              <button
                id="copyMissingBtn"
                type="button"
                className="btn btn-outline-success"
                onClick={async () => {
                  await copyText(outputMissing);
                  setStatus(outputMissing.trim() ? "Copied missing output." : "Nothing to copy.");
                }}
              >
                Copy Missing
              </button>
            </div>

            <div id="status" className="tool-status-line">
              {status}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
