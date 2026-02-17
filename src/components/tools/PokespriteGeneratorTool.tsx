"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  formatBbcode,
  imageDataToBbcode,
  POKEMON_JSON_URL,
  resolvePokemonByName,
  spriteUrlForPokemon
} from "@/features/pokesprite-generator/core";
import type { PokespriteData } from "@/features/pokesprite-generator/types";

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

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function copyText(text: string) {
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch (_) {
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
  } catch (_) {}
  document.body.removeChild(ta);
}

async function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas export failed."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

export function PokespriteGeneratorTool() {
  const [data, setData] = useState<PokespriteData>({});
  const [input, setInput] = useState("");
  const [sizePreset, setSizePreset] = useState("2");
  const [status, setStatus] = useState("Loading Pokémon list...");
  const [resolved, setResolved] = useState("—");
  const [bbcode, setBbcode] = useState("");
  const [spriteUrl, setSpriteUrl] = useState("");
  const [previewSrc, setPreviewSrc] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy BBCode");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(POKEMON_JSON_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const json = (await res.json()) as PokespriteData;
        if (!alive) return;
        setData(json);
        setStatus(`Loaded ${Object.keys(json).length} Pokémon entries.`);
      } catch (error) {
        console.error(error);
        if (!alive) return;
        setStatus("Failed to load Pokémon list.");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const names = useMemo(() => {
    return Object.values(data)
      .map((entry) => String(entry?.name?.eng || "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [data]);

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Generator</div>
        <h1 className="page-title">PokeSprite Generator</h1>
        <p className="page-subtitle">Render BBCode pixel blocks from TPPC sprites.</p>
      </section>

      <section className="surface tool-pane">
        <div className="tool-template-grid">
          <div>
            <label htmlFor="pokeInput" className="form-label fw-semibold">
              Pokémon name (English)
            </label>
            <input
              id="pokeInput"
              className="field"
              list="pokeList"
              placeholder="Start typing… (e.g., Pikachu)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <datalist id="pokeList">
              {names.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>

            <label htmlFor="sizePreset" className="form-label fw-semibold mt-3">
              Size
            </label>
            <select
              id="sizePreset"
              className="field-select"
              value={sizePreset}
              onChange={(e) => setSizePreset(e.target.value)}
            >
              <option value="1">Small</option>
              <option value="2">Normal</option>
              <option value="3">Large</option>
            </select>

            <div className="tool-actions">
              <button
                id="renderBtn"
                type="button"
                className="btn-primary-soft"
                onClick={async () => {
                  const target = resolvePokemonByName(input, data);
                  if (!target) {
                    setStatus("Could not resolve that Pokémon name.");
                    setResolved("—");
                    setBbcode("");
                    return;
                  }

                  const url = spriteUrlForPokemon(target);
                  setSpriteUrl(url);
                  setPreviewSrc(url);
                  setResolved(`${target.name} (${target.generationLabel.replace("-", "–")}) → slug: ${target.slug}`);
                  setStatus("Rendering...");

                  try {
                    const img = await loadImage(url);
                    const canvas = canvasRef.current;
                    if (!canvas) throw new Error("Canvas not ready.");
                    canvas.width = img.width;
                    canvas.height = img.height;

                    const ctx = canvas.getContext("2d");
                    if (!ctx) throw new Error("2D canvas not available.");
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                    const lines = imageDataToBbcode(imageData.data, imageData.width, imageData.height, {
                      alphaThreshold: 30,
                      xScale: Number(sizePreset) || 2
                    });
                    setBbcode(formatBbcode(lines, getGeneratorUrl()));
                    setStatus("Done.");
                  } catch (error) {
                    console.error(error);
                    setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
                    setBbcode("");
                  }
                }}
              >
                Render BBCode
              </button>
              <span id="status" className="tool-status-line">
                {status}
              </span>
            </div>

            <div className="tool-status-line">
              <strong>Resolved:</strong> <span id="resolved">{resolved}</span>
            </div>
            <div className="tool-status-line mono" id="spriteUrl">
              {spriteUrl || "—"}
            </div>

            <div className="tool-actions">
              <button
                id="clearBtn"
                type="button"
                className="btn-outline-soft"
                onClick={() => {
                  setResolved("—");
                  setBbcode("");
                  setSpriteUrl("");
                  setPreviewSrc("");
                  setStatus("Cleared.");
                }}
              >
                Clear
              </button>
            </div>
          </div>

          <div>
            <div
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "0.75rem",
                minHeight: "9rem",
                display: "grid",
                placeItems: "center",
                marginBottom: "0.7rem",
                background: "var(--color-surface-strong)"
              }}
            >
              {previewSrc ? (
                <img id="spritePreview" src={previewSrc} alt="sprite preview" style={{ imageRendering: "pixelated" }} />
              ) : (
                <div id="previewHint" className="text-muted">
                  No sprite selected
                </div>
              )}
            </div>

            <label htmlFor="bbcodeOut" className="form-label fw-semibold">
              BBCode output
            </label>
            <textarea id="bbcodeOut" className="field-area mono" rows={12} readOnly value={bbcode} />

            <div className="tool-actions">
              <button
                id="copyBtn"
                type="button"
                className="btn-outline-soft"
                onClick={async () => {
                  if (!bbcode.trim()) {
                    setStatus("Nothing to copy yet.");
                    return;
                  }
                  await copyText(bbcode);
                  setCopyLabel("Copied!");
                  window.setTimeout(() => setCopyLabel("Copy BBCode"), 900);
                }}
              >
                {copyLabel}
              </button>
              <button
                id="exportBtn"
                type="button"
                className="btn-outline-soft"
                onClick={async () => {
                  const canvas = canvasRef.current;
                  if (!canvas || !canvas.width || !canvas.height) {
                    setStatus("Render a sprite before exporting PNG.");
                    return;
                  }

                  try {
                    const blob = await canvasToPngBlob(canvas);
                    const fileStem = input.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-") || "pokesprite";
                    const fileName = `${fileStem}.png`;
                    const href = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = href;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(href);
                    setStatus(`Exported ${fileName}.`);
                  } catch (error) {
                    console.error(error);
                    setStatus(`Export error: ${error instanceof Error ? error.message : String(error)}`);
                  }
                }}
              >
                Export PNG
              </button>
            </div>
          </div>
        </div>

        <canvas id="exportCanvas" ref={canvasRef} style={{ display: "none" }} />
      </section>
    </div>
  );
}
