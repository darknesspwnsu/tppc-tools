"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  FamiliesCloudItem,
  FamiliesCloudRuntime,
  FamiliesRunResult
} from "@/features/ungendered-families/types";
import { usePersistentOptions } from "@/hooks/usePersistentOptions";
import { PREFS_KEYS } from "@/lib/prefs-keys";

const D3_CDN = "https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js";
const D3_CLOUD_CDN = "https://cdn.jsdelivr.net/npm/d3-cloud@1/build/d3.layout.cloud.js";

const scriptCache = new Map<string, Promise<void>>();

function ensureScript(src: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is unavailable."));
  }

  if (scriptCache.has(src)) {
    return scriptCache.get(src)!;
  }

  const existing = document.querySelector(`script[data-cloud-src="${src}"]`) as HTMLScriptElement | null;
  if (existing?.dataset.loaded === "true") {
    const done = Promise.resolve();
    scriptCache.set(src, done);
    return done;
  }
  if (existing && (existing as HTMLScriptElement & { readyState?: string }).readyState === "complete") {
    existing.dataset.loaded = "true";
    const done = Promise.resolve();
    scriptCache.set(src, done);
    return done;
  }

  const p = new Promise<void>((resolve, reject) => {
    const script = existing ?? document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.cloudSrc = src;

    const onLoad = () => {
      script.dataset.loaded = "true";
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error(`Failed to load script: ${src}`));
    };

    const cleanup = () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    if (!existing) {
      document.head.appendChild(script);
    }
  });

  const guarded = p.catch((error) => {
    scriptCache.delete(src);
    throw error;
  });

  scriptCache.set(src, guarded);
  return guarded;
}

async function copyText(text: string) {
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // fallback
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

type FamiliesPrefs = {
  partitionOutput: boolean;
  missingOnlyFamilyNeeded: boolean;
  addMissingInline: boolean;
  noGroupSpacing: boolean;
  showLevelLabel: boolean;
  dropDuplicates: boolean;
  highlightRarity: boolean;
  annotateRarity: boolean;
  omitSummaryStats: boolean;
  visualizeCloud: boolean;
  cloudSampleSize: string;
  filterGolds: boolean;
  filterNormals: boolean;
  filterShinys: boolean;
  filterDarks: boolean;
  minUngendered: string;
  maxMissing: string;
  colorGolden: string;
  colorShiny: string;
  colorDark: string;
  colorNormal: string;
};

const DEFAULT_PREFS: FamiliesPrefs = {
  partitionOutput: false,
  missingOnlyFamilyNeeded: false,
  addMissingInline: false,
  noGroupSpacing: false,
  showLevelLabel: false,
  dropDuplicates: true,
  highlightRarity: true,
  annotateRarity: false,
  omitSummaryStats: false,
  visualizeCloud: false,
  cloudSampleSize: "100",
  filterGolds: false,
  filterNormals: false,
  filterShinys: false,
  filterDarks: false,
  minUngendered: "10",
  maxMissing: "20",
  colorGolden: "gold",
  colorShiny: "magenta",
  colorDark: "slategray",
  colorNormal: ""
};

export function UngenderedFamiliesTool() {
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [outputText, setOutputText] = useState("");
  const [outputMissing, setOutputMissing] = useState("");
  const [outputSingles, setOutputSingles] = useState("");

  const [cloudItems, setCloudItems] = useState<FamiliesCloudItem[]>([]);
  const [cloudRuntime, setCloudRuntime] = useState<FamiliesCloudRuntime>("idle");
  const [cloudError, setCloudError] = useState("");
  const [cloudRenderNonce, setCloudRenderNonce] = useState(0);

  const [prefs, setPrefs] = usePersistentOptions<FamiliesPrefs>(
    PREFS_KEYS.ungenderedFamilies,
    DEFAULT_PREFS,
    {
      version: 1,
      migrate: (raw) => {
        if (!raw || typeof raw !== "object") return DEFAULT_PREFS;
        return { ...DEFAULT_PREFS, ...(raw as Partial<FamiliesPrefs>) };
      }
    }
  );

  const outputTextRef = useRef<HTMLTextAreaElement | null>(null);
  const outputMissingRef = useRef<HTMLTextAreaElement | null>(null);
  const outputSinglesRef = useRef<HTMLTextAreaElement | null>(null);
  const jumpStatusRef = useRef<HTMLDivElement | null>(null);
  const tagCloudSvgRef = useRef<SVGSVGElement | null>(null);
  const cloudStatusRef = useRef<HTMLDivElement | null>(null);

  const renderCloudRef = useRef<null | ((...args: any[]) => void)>(null);
  const stopCloudRef = useRef<null | (() => void)>(null);
  const cloudLoadPromiseRef = useRef<Promise<boolean> | null>(null);

  const cloudSampleSizeNum = useMemo(() => {
    const n = parseInt(prefs.cloudSampleSize, 10);
    if (!Number.isFinite(n) || n <= 0) return 100;
    return n;
  }, [prefs.cloudSampleSize]);

  const ensureCloudRuntime = useCallback(async () => {
    if (cloudRuntime === "ready") return true;
    if (cloudLoadPromiseRef.current) return cloudLoadPromiseRef.current;

    const loadPromise = (async () => {
      try {
        setCloudRuntime("loading");
        setCloudError("");

        await ensureScript(D3_CDN);
        await ensureScript(D3_CLOUD_CDN);

        const cloudModule = await import("@/features/ungendered-families/cloud");
        renderCloudRef.current = cloudModule.renderTagCloud;
        stopCloudRef.current = cloudModule.stopTagCloudAnimation;

        const d3Obj = (window as unknown as { d3?: any }).d3;
        if (!d3Obj || !d3Obj.layout || typeof d3Obj.layout.cloud !== "function") {
          throw new Error("d3-cloud runtime did not initialize.");
        }

        setCloudRuntime("ready");
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setCloudRuntime("error");
        setCloudError(message);
        if (cloudStatusRef.current) {
          cloudStatusRef.current.textContent = `Cloud unavailable: ${message}`;
        }
        return false;
      } finally {
        cloudLoadPromiseRef.current = null;
      }
    })();

    cloudLoadPromiseRef.current = loadPromise;
    return loadPromise;
  }, [cloudRuntime]);

  useEffect(() => {
    let cancelled = false;
    const svg = tagCloudSvgRef.current;

    if (!prefs.visualizeCloud || !svg || cloudItems.length === 0) {
      if (stopCloudRef.current) stopCloudRef.current();
      if (svg && (window as unknown as { d3?: any }).d3) {
        (window as unknown as { d3: any }).d3.select(svg).selectAll("*").remove();
      }
      if (cloudStatusRef.current) cloudStatusRef.current.textContent = "";
      return;
    }

    void (async () => {
      const ready = await ensureCloudRuntime();
      if (!ready || cancelled || !renderCloudRef.current || !tagCloudSvgRef.current) return;

      const colorMap = {
        golden: prefs.colorGolden.trim() || "gold",
        shiny: prefs.colorShiny.trim() || "magenta",
        dark: prefs.colorDark.trim() || "slategray",
        normal: prefs.colorNormal.trim() || "#2b2b2b"
      };

      renderCloudRef.current(
        cloudItems,
        tagCloudSvgRef.current,
        cloudStatusRef.current,
        colorMap,
        cloudSampleSizeNum,
        {
          outputTextEl: outputTextRef.current,
          outputSinglesEl: outputSinglesRef.current,
          outputMissingEl: outputMissingRef.current,
          jumpStatusEl: jumpStatusRef.current
        }
      );
    })();

    return () => {
      cancelled = true;
      if (stopCloudRef.current) stopCloudRef.current();
    };
  }, [
    cloudItems,
    cloudRenderNonce,
    cloudSampleSizeNum,
    ensureCloudRuntime,
    prefs.colorDark,
    prefs.colorGolden,
    prefs.colorNormal,
    prefs.colorShiny,
    prefs.visualizeCloud
  ]);

  useEffect(() => {
    return () => {
      if (stopCloudRef.current) stopCloudRef.current();
    };
  }, []);

  return (
    <>
      <div id="app" className="tool-template">
        <section className="surface hero tool-template-header">
          <div className="kicker">Organizer</div>
          <h1 className="page-title">TPPC (?) Enhanced Dex Sorter & Stats</h1>
          <p className="page-subtitle">Ungendered family grouping + rarity-aware highlighting + missing list + optional tag cloud.</p>
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
                      const familiesModule = await import("@/features/ungendered-families/core");
                      const result = (await familiesModule.runUngenderedFamilies({
                        inputText,
                        minUngendered: Number.isFinite(Number(prefs.minUngendered)) ? Number(prefs.minUngendered) : 10,
                        maxMissing: Number.isFinite(Number(prefs.maxMissing)) ? Number(prefs.maxMissing) : 20,
                        flags: {
                          filterGolds: prefs.filterGolds,
                          filterNormals: prefs.filterNormals,
                          filterShinys: prefs.filterShinys,
                          filterDarks: prefs.filterDarks
                        },
                        colors: {
                          golden: prefs.colorGolden,
                          shiny: prefs.colorShiny,
                          dark: prefs.colorDark,
                          normal: prefs.colorNormal
                        },
                        partitionOutput: prefs.partitionOutput,
                        missingOnlyFamilyNeeded: prefs.missingOnlyFamilyNeeded,
                        showLevelLabel: prefs.showLevelLabel,
                        dropDuplicates: prefs.dropDuplicates,
                        addMissingInline: prefs.addMissingInline,
                        noGroupSpacing: prefs.noGroupSpacing,
                        highlightRarity: prefs.highlightRarity,
                        annotateRarity: prefs.highlightRarity && prefs.annotateRarity,
                        omitSummaryStats: prefs.omitSummaryStats,
                        visualizeCloud: prefs.visualizeCloud,
                        cloudSampleSize: cloudSampleSizeNum,
                        onStatus: setStatus
                      })) as FamiliesRunResult;

                      setOutputText(result.mainText);
                      setOutputMissing(result.missingText);
                      setOutputSingles(result.secondaryText || "");
                      setCloudItems(prefs.visualizeCloud ? (result.cloudItems || []) : []);
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
                    setCloudItems([]);
                    if (stopCloudRef.current) stopCloudRef.current();
                    setStatus("");
                  }}
                >
                  Clear
                </button>
              </div>

              <div className="surface-strong mt-3" style={{ padding: "0.8rem", borderRadius: "0.75rem" }}>
                <div className="stack" style={{ gap: "0.45rem" }}>
                  <label className="chip">
                    <input id="partitionOutput" type="checkbox" checked={prefs.partitionOutput} onChange={(event) => setPrefs({ partitionOutput: event.target.checked })} />
                    Partition output into Families vs Singles/Sets
                  </label>
                  <label className="chip">
                    <input
                      id="missingOnlyFamilyNeeded"
                      type="checkbox"
                      checked={prefs.missingOnlyFamilyNeeded}
                      onChange={(event) => setPrefs({ missingOnlyFamilyNeeded: event.target.checked })}
                    />
                    Missing list only for incomplete families
                  </label>
                  <label className="chip">
                    <input id="addMissingInline" type="checkbox" checked={prefs.addMissingInline} onChange={(event) => setPrefs({ addMissingInline: event.target.checked })} />
                    Add missing items inline
                  </label>
                  <label className="chip">
                    <input id="noGroupSpacing" type="checkbox" checked={prefs.noGroupSpacing} onChange={(event) => setPrefs({ noGroupSpacing: event.target.checked })} />
                    No space between family groups
                  </label>
                  <label className="chip">
                    <input id="showLevelLabel" type="checkbox" checked={prefs.showLevelLabel} onChange={(event) => setPrefs({ showLevelLabel: event.target.checked })} />
                    Show level as (Level: X)
                  </label>
                  <label className="chip">
                    <input id="dropDuplicates" type="checkbox" checked={prefs.dropDuplicates} onChange={(event) => setPrefs({ dropDuplicates: event.target.checked })} />
                    Drop duplicates (keep lowest level)
                  </label>
                  <label className="chip">
                    <input id="highlightRarity" type="checkbox" checked={prefs.highlightRarity} onChange={(event) => setPrefs({ highlightRarity: event.target.checked })} />
                    Highlight rarity
                  </label>

                  <div id="annotateRarityWrap" className={prefs.highlightRarity ? "" : "d-none"}>
                    <label className="chip">
                      <input id="annotateRarity" type="checkbox" checked={prefs.annotateRarity} onChange={(event) => setPrefs({ annotateRarity: event.target.checked })} />
                      Annotate rarity
                    </label>
                  </div>

                  <label className="chip">
                    <input id="omitSummaryStats" type="checkbox" checked={prefs.omitSummaryStats} onChange={(event) => setPrefs({ omitSummaryStats: event.target.checked })} />
                    Omit summary stats
                  </label>

                  <label className="chip">
                    <input id="visualizeCloud" type="checkbox" checked={prefs.visualizeCloud} onChange={(event) => setPrefs({ visualizeCloud: event.target.checked })} />
                    Visualize output (tag cloud sample)
                  </label>

                  <div id="cloudSampleControls" className={prefs.visualizeCloud ? "" : "d-none"}>
                    <label htmlFor="cloudSampleSize" className="form-label mb-1">Tag cloud sample size</label>
                    <input
                      id="cloudSampleSize"
                      type="number"
                      className="field mono"
                      min={1}
                      step={1}
                      value={prefs.cloudSampleSize}
                      onChange={(event) => setPrefs({ cloudSampleSize: event.target.value })}
                    />
                    <div id="cloudRuntimeStatus" className="tool-status-line" style={{ marginTop: "0.4rem" }}>
                      {prefs.visualizeCloud
                        ? cloudRuntime === "ready"
                          ? "Cloud runtime ready."
                          : cloudRuntime === "loading"
                          ? "Loading cloud runtime..."
                          : cloudRuntime === "error"
                          ? `Cloud runtime error: ${cloudError}`
                          : "Cloud runtime idle."
                        : ""}
                    </div>
                  </div>
                </div>

                <div className="tool-template-grid mt-3">
                  <div>
                    <label htmlFor="minUngendered" className="form-label fw-semibold">Min Ungendered</label>
                    <input id="minUngendered" className="field mono" type="number" value={prefs.minUngendered} onChange={(event) => setPrefs({ minUngendered: event.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="maxMissing" className="form-label fw-semibold">Max Missing</label>
                    <input id="maxMissing" className="field mono" type="number" value={prefs.maxMissing} onChange={(event) => setPrefs({ maxMissing: event.target.value })} />
                  </div>
                </div>

                <div className="stack mt-3" style={{ gap: "0.45rem" }}>
                  <label className="chip"><input id="filterGolds" type="checkbox" checked={prefs.filterGolds} onChange={(event) => setPrefs({ filterGolds: event.target.checked })} /> Filter Goldens</label>
                  <label className="chip"><input id="filterNormals" type="checkbox" checked={prefs.filterNormals} onChange={(event) => setPrefs({ filterNormals: event.target.checked })} /> Filter Normals</label>
                  <label className="chip"><input id="filterShinys" type="checkbox" checked={prefs.filterShinys} onChange={(event) => setPrefs({ filterShinys: event.target.checked })} /> Filter Shinys</label>
                  <label className="chip"><input id="filterDarks" type="checkbox" checked={prefs.filterDarks} onChange={(event) => setPrefs({ filterDarks: event.target.checked })} /> Filter Darks</label>
                </div>

                <div className="tool-template-grid mt-3">
                  <div>
                    <label htmlFor="colorGolden" className="form-label fw-semibold">Gold color</label>
                    <input id="colorGolden" className="field" value={prefs.colorGolden} onChange={(event) => setPrefs({ colorGolden: event.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="colorShiny" className="form-label fw-semibold">Shiny color</label>
                    <input id="colorShiny" className="field" value={prefs.colorShiny} onChange={(event) => setPrefs({ colorShiny: event.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="colorDark" className="form-label fw-semibold">Dark color</label>
                    <input id="colorDark" className="field" value={prefs.colorDark} onChange={(event) => setPrefs({ colorDark: event.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="colorNormal" className="form-label fw-semibold">Normal color</label>
                    <input id="colorNormal" className="field" value={prefs.colorNormal} onChange={(event) => setPrefs({ colorNormal: event.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="outputText" className="form-label fw-semibold">Output (Summary + Families BBCode)</label>
              <textarea id="outputText" ref={outputTextRef} className="field-area mono io-output" rows={14} readOnly value={outputText} />

              <div className="tool-actions">
                <button
                  id="copyMainBtn"
                  type="button"
                  className="btn btn-success"
                  onClick={async () => {
                    await copyText(outputText);
                    setStatus(outputText.trim() ? "Copied main output." : "Nothing to copy.");
                  }}
                >
                  Copy Main
                </button>
                <span id="jumpStatus" ref={jumpStatusRef} className="tool-status-line" style={{ marginTop: 0 }}>
                  {" "}
                </span>
              </div>

              <div id="familiesSinglesBlock" className={prefs.partitionOutput ? "mt-3" : "mt-3 d-none"}>
                <label htmlFor="outputSingles" className="form-label fw-semibold">Singles / Sets Output</label>
                <textarea id="outputSingles" ref={outputSinglesRef} className="field-area mono io-output" rows={8} readOnly value={outputSingles} />
                <div className="tool-actions">
                  <button
                    id="copySinglesBtn"
                    type="button"
                    className="btn btn-success"
                    onClick={async () => {
                      await copyText(outputSingles);
                      setStatus(outputSingles.trim() ? "Copied singles output." : "Nothing to copy.");
                    }}
                  >
                    Copy Singles
                  </button>
                </div>
              </div>

              <label htmlFor="outputMissing" className="form-label fw-semibold mt-3">Missing (per variant)</label>
              <textarea id="outputMissing" ref={outputMissingRef} className="field-area mono io-output" rows={10} readOnly value={outputMissing} />
              <div className="tool-actions">
                <button
                  id="copyMissingBtn"
                  type="button"
                  className="btn btn-success"
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

              <div id="cloudRow" className={prefs.visualizeCloud && cloudItems.length > 0 ? "mt-3" : "mt-3 d-none"}>
                <div className="surface-strong" style={{ padding: "0.85rem", borderRadius: "0.75rem" }}>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                      <div className="fw-semibold">Tag Cloud</div>
                      <div className="form-text">Click a word to jump-highlight it in output.</div>
                    </div>
                    <button
                      id="rerollCloudBtn"
                      type="button"
                      className="btn btn-outline-success"
                      onClick={() => {
                        if (!cloudItems.length) return;
                        setCloudRenderNonce((prev) => prev + 1);
                      }}
                    >
                      Resample
                    </button>
                  </div>

                  <div className="mt-2">
                    <svg id="tagCloudSvg" ref={tagCloudSvgRef} className="w-100" style={{ height: "650px" }} />
                  </div>

                  <div id="cloudStatus" ref={cloudStatusRef} className="tool-status-line" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div id="cloudTooltip" className="cloud-tooltip" />
    </>
  );
}
