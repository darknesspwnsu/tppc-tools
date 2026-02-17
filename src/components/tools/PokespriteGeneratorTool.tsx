"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  canvasToPngBlob,
  cropToOpaqueCanvas,
  exportSampleCanvasPng,
  formatBbcode,
  loadImage,
  makeSampleCanvas,
  POKEMON_JSON_URL,
  renderSynthPreview,
  resolvePokemonByName,
  safeFilename,
  sampleCanvasToBbcode,
  spriteUrlForPokemon
} from "@/features/pokesprite-generator/core";
import type { PokespriteData, ResolutionMode } from "@/features/pokesprite-generator/types";
import { usePersistentOptions } from "@/hooks/usePersistentOptions";
import { PREFS_KEYS } from "@/lib/prefs-keys";

function getGeneratorUrl() {
  try {
    const u = new URL(window.location.href);
    u.hash = "";
    u.search = "";
    return u.toString();
  } catch {
    return "/tools/pokesprite-generator/";
  }
}

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

export function PokespriteGeneratorTool() {
  const [data, setData] = useState<PokespriteData>({});
  const [input, setInput] = useState("");
  const [prefs, setPrefs] = usePersistentOptions<{
    sizePreset: string;
    resMode: ResolutionMode;
    cols: string;
    alpha: string;
  }>(
    PREFS_KEYS.pokespriteGenerator,
    { sizePreset: "2", resMode: "auto", cols: "120", alpha: "30" },
    {
      version: 1,
      migrate: (raw) => {
        if (!raw || typeof raw !== "object") {
          return { sizePreset: "2", resMode: "auto", cols: "120", alpha: "30" };
        }
        const obj = raw as Partial<{ sizePreset: string; resMode: ResolutionMode; cols: string; alpha: string }>;
        return {
          sizePreset: String(obj.sizePreset ?? "2"),
          resMode: obj.resMode === "custom" ? "custom" : "auto",
          cols: String(obj.cols ?? "120"),
          alpha: String(obj.alpha ?? "30")
        };
      }
    }
  );
  const sizePreset = prefs.sizePreset;
  const resMode = prefs.resMode;
  const cols = prefs.cols;
  const alpha = prefs.alpha;

  const [status, setStatus] = useState("Loading Pokemon list...");
  const [resolved, setResolved] = useState("—");
  const [spriteUrl, setSpriteUrl] = useState("—");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [bbcode, setBbcode] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy BBCode");

  const [showPreviewCanvas, setShowPreviewCanvas] = useState(false);

  const previewPaneRef = useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastXScaleRef = useRef(2);

  useEffect(() => {
    let alive = true;

    void (async () => {
      try {
        const response = await fetch(POKEMON_JSON_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`Failed to load (${response.status})`);
        const json = (await response.json()) as PokespriteData;

        if (!alive) return;
        setData(json);

        const loaded = Object.keys(json).length;
        setStatus(`Loaded ${loaded.toLocaleString("en-US")} Pokemon names. Start typing and press Render.`);
      } catch (error) {
        console.error(error);
        if (!alive) return;
        setStatus("Failed to load pokemon.json.");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (!sampleCanvasRef.current || !previewCanvasRef.current || !previewPaneRef.current) return;
      renderSynthPreview(sampleCanvasRef.current, previewCanvasRef.current, previewPaneRef.current, lastXScaleRef.current);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const names = useMemo(() => {
    return Object.values(data)
      .map((entry) => String(entry?.name?.eng || "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [data]);

  const clearAll = () => {
    setInput("");
    setResolved("—");
    setSpriteUrl("—");
    setPreviewSrc(null);
    setBbcode("");
    setShowPreviewCanvas(false);
    sampleCanvasRef.current = null;
    setStatus("Cleared.");
  };

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Generator</div>
        <h1 className="page-title">PokeSprite Generator</h1>
        <p className="page-subtitle">Render BBCode pixel blocks from TPPC sprites with size presets.</p>
      </section>

      <section className="surface tool-pane">
        <div className="row g-3">
          <div className="col-12 col-lg-9">
            <label htmlFor="pokeInput" className="form-label fw-semibold">
              Pokemon name (English)
            </label>
            <input
              id="pokeInput"
              className="form-control"
              list="pokeList"
              placeholder="Start typing... (e.g., Glaceon)"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                const button = document.getElementById("renderBtn") as HTMLButtonElement | null;
                button?.click();
              }}
            />
            <datalist id="pokeList">
              {names.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="col-12 col-lg-3">
            <label htmlFor="sizePreset" className="form-label fw-semibold">
              Size
            </label>
            <select
              id="sizePreset"
              className="form-select"
              value={sizePreset}
              onChange={(event) => setPrefs({ sizePreset: event.target.value })}
            >
              <option value="1">Small</option>
              <option value="2">Normal</option>
              <option value="3">Large</option>
            </select>
          </div>

          <div className="col-12">
            <button
              id="renderBtn"
              type="button"
              className="btn btn-primary w-100"
              onClick={async () => {
                try {
                  setBbcode("");
                  setResolved("—");
                  setSpriteUrl("—");
                  setPreviewSrc(null);
                  sampleCanvasRef.current = null;
                  setShowPreviewCanvas(false);

                  const target = resolvePokemonByName(input, data);
                  if (!target) {
                    setStatus("Pick a Pokemon from autocomplete.");
                    return;
                  }

                  const xScale = Math.max(1, Number(sizePreset) || 2);
                  const customCols = Number(cols);
                  const alphaThreshold = Number(alpha);

                  const url = spriteUrlForPokemon(target);
                  setResolved(`${target.name} (${target.generationLabel.replace("-", "–")}) → slug: ${target.slug}`);
                  setSpriteUrl(url);
                  setPreviewSrc(url);

                  setStatus(`Loading sprite for ${target.name}...`);
                  const img = await loadImage(url);

                  setStatus("Cropping transparency...");
                  const cropCanvas = cropToOpaqueCanvas(img, Number.isFinite(alphaThreshold) ? alphaThreshold : 30, 1);
                  if (!cropCanvas) {
                    setStatus("Sprite appears fully transparent at current alpha threshold.");
                    return;
                  }

                  setStatus("Sampling...");
                  const sampleCanvas = makeSampleCanvas(cropCanvas, {
                    resolutionMode: resMode,
                    customColumns: customCols,
                    xScale,
                    alphaThreshold: Number.isFinite(alphaThreshold) ? alphaThreshold : 30,
                    maxAutoColumns: 180
                  });

                  if (!sampleCanvas) {
                    setStatus("Failed to sample sprite.");
                    return;
                  }

                  sampleCanvasRef.current = sampleCanvas;
                  lastXScaleRef.current = xScale;

                  if (previewCanvasRef.current && previewPaneRef.current) {
                    renderSynthPreview(sampleCanvas, previewCanvasRef.current, previewPaneRef.current, xScale);
                    setShowPreviewCanvas(true);
                  }

                  setStatus("Rendering BBCode...");
                  const lines = sampleCanvasToBbcode(sampleCanvas, {
                    alphaThreshold: Number.isFinite(alphaThreshold) ? alphaThreshold : 30,
                    xScale
                  });

                  setBbcode(formatBbcode(lines, getGeneratorUrl()));
                  setStatus("Done.");
                } catch (error) {
                  console.error(error);
                  setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
                }
              }}
            >
              Render BBCode
            </button>
            <div id="status" className="tool-status-line">
              {status}
            </div>
          </div>

          <div className="col-12">
            <details>
              <summary className="text-muted">Advanced options</summary>
              <div className="row g-3 mt-1">
                <div className="col-12 col-lg-4">
                  <label htmlFor="resMode" className="form-label">Resolution</label>
                  <select
                    id="resMode"
                    className="form-select"
                    value={resMode}
                    onChange={(event) => setPrefs({ resMode: event.target.value as ResolutionMode })}
                  >
                    <option value="auto">Auto (native)</option>
                    <option value="custom">Custom columns</option>
                  </select>
                </div>

                <div className="col-6 col-lg-4">
                  <label htmlFor="cols" className="form-label">Columns (Custom mode)</label>
                  <input
                    id="cols"
                    type="number"
                    className="form-control"
                    min={16}
                    max={220}
                    value={cols}
                    onChange={(event) => setPrefs({ cols: event.target.value })}
                  />
                </div>

                <div className="col-6 col-lg-4">
                  <label htmlFor="alpha" className="form-label">Alpha threshold</label>
                  <input
                    id="alpha"
                    type="number"
                    className="form-control"
                    min={0}
                    max={255}
                    value={alpha}
                    onChange={(event) => setPrefs({ alpha: event.target.value })}
                  />
                </div>
              </div>
            </details>
          </div>
        </div>

        <hr className="my-4" />

        <div className="row g-3">
          <div className="col-12 col-lg-4 d-flex flex-column gap-3">
            <div className="d-flex gap-3 align-items-center">
              <div
                style={{
                  width: "220px",
                  height: "176px",
                  border: "2px solid var(--color-border)",
                  borderRadius: "1rem",
                  background: "var(--color-surface-strong)",
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                  flex: "0 0 auto"
                }}
              >
                {previewSrc ? (
                  <img
                    id="spritePreview"
                    src={previewSrc}
                    alt="sprite preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      imageRendering: "pixelated"
                    }}
                  />
                ) : (
                  <div id="previewHint" className="text-muted" style={{ display: "block", padding: "0.45rem" }}>
                    No sprite selected
                  </div>
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <div className="tool-status-line" style={{ marginTop: 0 }}>
                  <strong>Resolved:</strong> <span id="resolved">{resolved}</span>
                </div>
                <div id="spriteUrl" className="tool-status-line mono" style={{ marginTop: "0.25rem", wordBreak: "break-all" }}>
                  {spriteUrl}
                </div>

                <div className="tool-actions" style={{ marginTop: "0.8rem" }}>
                  <button
                    id="exportBtn"
                    type="button"
                    className="btn btn-outline-success"
                    onClick={async () => {
                      const sampleCanvas = sampleCanvasRef.current;
                      const exportCanvas = exportCanvasRef.current;
                      if (!sampleCanvas || !exportCanvas) {
                        setStatus("Render a Pokemon first, then Export PNG.");
                        return;
                      }

                      try {
                        exportSampleCanvasPng(sampleCanvas, exportCanvas, {
                          scale: 8,
                          background: "transparent"
                        });

                        const blob = await canvasToPngBlob(exportCanvas);
                        const href = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = href;
                        a.download = `${safeFilename(input)}.png`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(href);
                        setStatus("Exported PNG.");
                      } catch (error) {
                        setStatus(`Export error: ${error instanceof Error ? error.message : String(error)}`);
                      }
                    }}
                  >
                    Export PNG
                  </button>
                  <button id="clearBtn" type="button" className="btn btn-outline-danger" onClick={clearAll}>
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-8">
            <div className="split-wrap">
              <div
                id="previewPane"
                ref={previewPaneRef}
                className="preview-pane"
              >
                <div id="previewEmpty" className="preview-empty" style={{ display: showPreviewCanvas ? "none" : "block" }}>
                  Preview will appear here after you Render.
                </div>
                <canvas
                  id="previewCanvas"
                  ref={previewCanvasRef}
                  style={{ display: showPreviewCanvas ? "block" : "none", imageRendering: "pixelated", maxWidth: "100%", maxHeight: "100%" }}
                />
              </div>

              <div className="bbcode-pane">
                <label htmlFor="bbcodeOut" className="form-label mb-0">
                  BBCode output
                </label>
                <textarea id="bbcodeOut" className="field-area mono io-output" rows={7} spellCheck={false} readOnly value={bbcode} />
                <button
                  id="copyBtn"
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={async () => {
                    if (!bbcode.trim()) {
                      setStatus("Nothing to copy yet.");
                      return;
                    }
                    await copyText(bbcode);
                    setCopyLabel("Copied!");
                    setStatus("Copied BBCode to clipboard.");
                    window.setTimeout(() => setCopyLabel("Copy BBCode"), 900);
                  }}
                >
                  {copyLabel}
                </button>
              </div>
            </div>
          </div>
        </div>

        <canvas id="exportCanvas" ref={exportCanvasRef} style={{ display: "none" }} />
      </section>
    </div>
  );
}
