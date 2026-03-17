"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildLegendSet,
  defaultLegendText,
  loadJunkLists,
  loadUeugList,
  organizeBox,
  parseBoxInput
} from "@/features/box-organizer/core";
import type { BoxJunkLists } from "@/features/box-organizer/types";
import { usePersistentOptions } from "@/hooks/usePersistentOptions";
import { PREFS_KEYS } from "@/lib/prefs-keys";

const BASE_PATH = String(process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");

type BoxOrganizerPrefs = {
  combine: boolean;
  dupeDesc: boolean;
  plainLevel: boolean;
  combineSD: boolean;
  dedicatedUnknown: boolean;
  dedicatedLegends: boolean;
  keepGoldsInGolden: boolean;
  filterJunk: boolean;
  colorGolden: string;
  colorShiny: string;
  colorDark: string;
  colorNormal: string;
  legendsText: string;
};

const DEFAULT_PREFS: BoxOrganizerPrefs = {
  combine: false,
  dupeDesc: false,
  plainLevel: false,
  combineSD: false,
  dedicatedUnknown: false,
  dedicatedLegends: false,
  keepGoldsInGolden: false,
  filterJunk: false,
  colorGolden: "",
  colorShiny: "",
  colorDark: "",
  colorNormal: "",
  legendsText: defaultLegendText()
};

async function copyText(text: string) {
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // fall through to fallback
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

export function BoxOrganizerTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("Loading UE/UG list...");

  const [prefs, setPrefs] = usePersistentOptions<BoxOrganizerPrefs>(
    PREFS_KEYS.boxOrganizer,
    DEFAULT_PREFS,
    {
      version: 1,
      migrate: (raw) => {
        if (!raw || typeof raw !== "object") return DEFAULT_PREFS;
        return { ...DEFAULT_PREFS, ...(raw as Partial<BoxOrganizerPrefs>) };
      }
    }
  );

  const [ueugSet, setUeugSet] = useState<Set<string>>(new Set());
  const [junkLists, setJunkLists] = useState<BoxJunkLists | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const set = await loadUeugList(BASE_PATH);
      if (!alive) return;
      setUeugSet(set);
      setStatus(`UE/UG list loaded: ${set.size.toLocaleString("en-US")} entries.`);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const legendsSet = useMemo(() => buildLegendSet(prefs.legendsText), [prefs.legendsText]);

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Organizer</div>
        <h1 className="page-title">Yet Another Box Organizer</h1>
        <p className="page-subtitle">Organize TPPC box lists with flexible sorting and BBCode output.</p>
      </section>

      <section className="surface tool-pane">
        <div className="tool-template-grid">
          <div>
            <label htmlFor="input" className="form-label fw-semibold">
              Input
            </label>
            <textarea
              id="input"
              className="field-area mono io-input"
              rows={16}
              placeholder="Paste your box text here..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />

            <div className="tool-actions">
              <button
                id="sortBtn"
                type="button"
                className="btn-primary-soft"
                onClick={async () => {
                  const parsed = parseBoxInput(input);

                  let loadedJunkLists = junkLists;
                  if (prefs.filterJunk && !loadedJunkLists) {
                    loadedJunkLists = await loadJunkLists(BASE_PATH);
                    setJunkLists(loadedJunkLists);
                  }

                  const result = organizeBox(
                    parsed,
                    {
                      combine: prefs.combine,
                      dupeDesc: prefs.dupeDesc,
                      plainLevel: prefs.plainLevel,
                      combineSD: prefs.combineSD,
                      dedicatedUnknown: prefs.dedicatedUnknown,
                      dedicatedLegends: prefs.dedicatedLegends,
                      keepGoldsInGolden: prefs.keepGoldsInGolden,
                      filterJunk: prefs.filterJunk,
                      colors: {
                        golden: prefs.colorGolden,
                        shiny: prefs.colorShiny,
                        dark: prefs.colorDark,
                        normal: prefs.colorNormal
                      }
                    },
                    {
                      legendSet: legendsSet,
                      ueugSet,
                      junkLists: loadedJunkLists || undefined
                    }
                  );

                  setOutput(result.output);

                  if (prefs.filterJunk) {
                    const junkSummary = loadedJunkLists
                      ? `maps=${loadedJunkLists.mapsSet.size.toLocaleString("en-US")}, swaps=${loadedJunkLists.swapsSet.size.toLocaleString("en-US")}, genderless=${loadedJunkLists.genderlessSet.size.toLocaleString("en-US")}`
                      : "n/a";
                    setStatus(
                      `Sorted ${result.outputCount.toLocaleString("en-US")}/${result.inputCount.toLocaleString("en-US")} entries (${result.filteredOutCount.toLocaleString("en-US")} filtered). ${junkSummary}`
                    );
                  }
                }}
              >
                Sort
              </button>
              <button
                id="clearBtn"
                type="button"
                className="btn-outline-soft"
                onClick={() => {
                  setInput("");
                  setOutput("");
                  setStatus("");
                }}
              >
                Clear
              </button>
            </div>

            <div className="surface-strong mt-3" style={{ padding: "0.9rem", borderRadius: "0.75rem" }}>
              <div className="fw-semibold mb-2">Options</div>

              <div className="form-check mb-2">
                <input
                  id="combine"
                  className="form-check-input"
                  type="checkbox"
                  checked={prefs.combine}
                  onChange={(event) => setPrefs({ combine: event.target.checked })}
                />
                <label className="form-check-label" htmlFor="combine">
                  Combine Pokemon with same gender and level
                </label>
              </div>

              <div className="form-check mb-2">
                <input
                  id="dupeDesc"
                  className="form-check-input"
                  type="checkbox"
                  checked={prefs.dupeDesc}
                  onChange={(event) => setPrefs({ dupeDesc: event.target.checked })}
                />
                <label className="form-check-label" htmlFor="dupeDesc">
                  Sort dupes by level descending
                </label>
              </div>

              <div className="form-check mb-2">
                <input
                  id="plainLevel"
                  className="form-check-input"
                  type="checkbox"
                  checked={prefs.plainLevel}
                  onChange={(event) => setPrefs({ plainLevel: event.target.checked })}
                />
                <label className="form-check-label" htmlFor="plainLevel">
                  Display level as X instead of (Level: X)
                </label>
              </div>

              <div className="form-check mb-2">
                <input
                  id="combineSD"
                  className="form-check-input"
                  type="checkbox"
                  checked={prefs.combineSD}
                  onChange={(event) => setPrefs({ combineSD: event.target.checked })}
                />
                <label className="form-check-label" htmlFor="combineSD">
                  Combine Shiny and Dark into one section
                </label>
              </div>

              <div className="form-check mb-2">
                <input
                  id="dedicatedUnknown"
                  className="form-check-input"
                  type="checkbox"
                  checked={prefs.dedicatedUnknown}
                  onChange={(event) => setPrefs({ dedicatedUnknown: event.target.checked })}
                />
                <label className="form-check-label" htmlFor="dedicatedUnknown">
                  Dedicated (?) section
                </label>
              </div>

              <div className="form-check mb-2">
                <input
                  id="dedicatedLegends"
                  className="form-check-input"
                  type="checkbox"
                  checked={prefs.dedicatedLegends}
                  onChange={(event) => setPrefs({ dedicatedLegends: event.target.checked })}
                />
                <label className="form-check-label" htmlFor="dedicatedLegends">
                  Dedicated Legends/Mythicals section
                </label>
              </div>

              <div className="form-check mb-2">
                <input
                  id="keepGoldsInGolden"
                  className="form-check-input"
                  type="checkbox"
                  checked={prefs.keepGoldsInGolden}
                  onChange={(event) => setPrefs({ keepGoldsInGolden: event.target.checked })}
                />
                <label className="form-check-label" htmlFor="keepGoldsInGolden">
                  Keep all golds inside Golden category
                </label>
              </div>

              <div className="form-check mb-0">
                <input
                  id="filterJunk"
                  className="form-check-input"
                  type="checkbox"
                  checked={prefs.filterJunk}
                  onChange={(event) => setPrefs({ filterJunk: event.target.checked })}
                />
                <label className="form-check-label" htmlFor="filterJunk">
                  Filter maps/swaps junk under level 1000
                </label>
              </div>
            </div>

            <div id="colorBox" className="surface-strong mt-3" style={{ padding: "0.8rem", borderRadius: "0.75rem" }}>
              <div className="fw-semibold mb-2">Optional colors (leave blank for none)</div>
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <label htmlFor="cGold" className="form-label">Gold color</label>
                  <input id="cGold" className="field" value={prefs.colorGolden} onChange={(event) => setPrefs({ colorGolden: event.target.value })} />
                </div>
                <div className="col-12 col-md-6">
                  <label htmlFor="cShiny" className="form-label">Shiny color</label>
                  <input id="cShiny" className="field" value={prefs.colorShiny} onChange={(event) => setPrefs({ colorShiny: event.target.value })} />
                </div>
                <div className="col-12 col-md-6">
                  <label htmlFor="cDark" className="form-label">Dark color</label>
                  <input id="cDark" className="field" value={prefs.colorDark} onChange={(event) => setPrefs({ colorDark: event.target.value })} />
                </div>
                <div className="col-12 col-md-6">
                  <label htmlFor="cNormal" className="form-label">Normal color</label>
                  <input id="cNormal" className="field" value={prefs.colorNormal} onChange={(event) => setPrefs({ colorNormal: event.target.value })} />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label htmlFor="legends" className="form-label fw-semibold">Legend/Mythical list (one per line)</label>
              <textarea
                id="legends"
                className="field-area mono io-input"
                rows={8}
                value={prefs.legendsText}
                onChange={(event) => setPrefs({ legendsText: event.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="output" className="form-label fw-semibold">
              Output (BBCode)
            </label>
            <textarea id="output" className="field-area mono io-output" rows={22} readOnly value={output} />

            <div className="tool-actions">
              <button
                id="copyBtn"
                type="button"
                className="btn-outline-soft"
                onClick={async () => {
                  await copyText(output);
                  setStatus(output.trim() ? "Copied output." : "Nothing to copy.");
                }}
              >
                Copy Output
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
