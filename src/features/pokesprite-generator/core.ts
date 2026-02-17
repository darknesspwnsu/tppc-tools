import type {
  PokespriteData,
  RenderSamplingOptions,
  ResolvedPokemon,
  ResolutionMode
} from "./types";

export const POKEMON_JSON_URL = "https://raw.githubusercontent.com/msikma/pokesprite/master/data/pokemon.json";
export const SPRITE_BASE = "https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8/regular/";
export const GEN9_BASE = "https://raw.githubusercontent.com/bamq/pokemon-sprites/main/pokemon/regular/";

const DEFAULT_CROP_PAD = 1;

export function normalizeName(s: string) {
  return String(s || "").trim().toLowerCase();
}

function resolveDexNumber(id: string, idx: number | undefined) {
  if (Number.isFinite(idx)) return Number(idx);
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function resolvePokemonByName(input: string, data: PokespriteData): ResolvedPokemon | null {
  const q = normalizeName(input);
  if (!q) return null;

  for (const [id, entry] of Object.entries(data || {})) {
    const name = String(entry?.name?.eng || "").trim();
    const slug = String(entry?.slug?.eng || "").trim();
    if (!name || !slug) continue;

    if (normalizeName(name) === q || normalizeName(slug) === q) {
      const dex = resolveDexNumber(id, entry.idx);
      return {
        id,
        name,
        slug,
        generationLabel: dex >= 906 ? "Gen 9" : "Gen 1-8"
      };
    }
  }

  return null;
}

export function spriteUrlForPokemon(target: ResolvedPokemon) {
  const base = target.generationLabel === "Gen 9" ? GEN9_BASE : SPRITE_BASE;
  return `${base}${target.slug}.png`;
}

export async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function clampNum(value: number, lo: number, hi: number, fallback: number) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : fallback;
  return Math.max(lo, Math.min(hi, safe));
}

export function rgbaToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function findOpaqueBounds(img: HTMLImageElement, alphaThreshold: number) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const i = (y * canvas.width + x) * 4;
      const a = data[i + 3];
      if (a < alphaThreshold) continue;

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) return null;

  return {
    minX,
    minY,
    maxX,
    maxY
  };
}

export function cropToOpaqueCanvas(img: HTMLImageElement, alphaThreshold: number, pad = DEFAULT_CROP_PAD) {
  const bounds = findOpaqueBounds(img, alphaThreshold);
  if (!bounds) return null;

  const x0 = Math.max(0, bounds.minX - pad);
  const y0 = Math.max(0, bounds.minY - pad);
  const x1 = Math.min(img.width - 1, bounds.maxX + pad);
  const y1 = Math.min(img.height - 1, bounds.maxY + pad);

  const width = x1 - x0 + 1;
  const height = y1 - y0 + 1;

  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;

  const ctx = out.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, x0, y0, width, height, 0, 0, width, height);
  return out;
}

function aspectFromXScale(xScale: number) {
  return xScale / 2;
}

export function makeSampleCanvas(cropCanvas: HTMLCanvasElement, options: RenderSamplingOptions) {
  const srcWidth = cropCanvas.width;
  const srcHeight = cropCanvas.height;

  if (srcWidth <= 0 || srcHeight <= 0) return null;

  const mode: ResolutionMode = options.resolutionMode;
  const maxAutoColumns = clampNum(options.maxAutoColumns || 180, 16, 220, 180);

  let sampledColumns =
    mode === "auto"
      ? Math.max(1, Math.min(maxAutoColumns, srcWidth))
      : clampNum(options.customColumns, 16, 220, 120);

  sampledColumns = mode === "auto" ? Math.max(1, Math.floor(sampledColumns)) : Math.max(16, Math.floor(sampledColumns));

  const aspect = srcHeight / srcWidth;
  const charAspect = aspectFromXScale(Math.max(1, options.xScale));
  const sampledRows = Math.max(1, Math.round(sampledColumns * aspect * charAspect));

  const canvas = document.createElement("canvas");
  canvas.width = sampledColumns;
  canvas.height = sampledRows;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, sampledColumns, sampledRows);
  ctx.drawImage(cropCanvas, 0, 0, srcWidth, srcHeight, 0, 0, sampledColumns, sampledRows);

  return canvas;
}

export function makeSampleCanvasForPreview(
  cropCanvas: HTMLCanvasElement,
  options: Pick<RenderSamplingOptions, "resolutionMode" | "customColumns"> & { maxAutoColumns?: number }
) {
  const srcWidth = cropCanvas.width;
  const srcHeight = cropCanvas.height;
  if (srcWidth <= 0 || srcHeight <= 0) return null;

  const maxAutoColumns = clampNum(options.maxAutoColumns || 180, 16, 220, 180);
  let sampledColumns =
    options.resolutionMode === "auto"
      ? Math.max(1, Math.min(maxAutoColumns, srcWidth))
      : clampNum(options.customColumns, 16, 220, 120);

  sampledColumns =
    options.resolutionMode === "auto"
      ? Math.max(1, Math.floor(sampledColumns))
      : Math.max(16, Math.floor(sampledColumns));

  const aspect = srcHeight / srcWidth;
  const sampledRows = Math.max(1, Math.round(sampledColumns * aspect));

  const canvas = document.createElement("canvas");
  canvas.width = sampledColumns;
  canvas.height = sampledRows;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, sampledColumns, sampledRows);
  ctx.drawImage(cropCanvas, 0, 0, srcWidth, srcHeight, 0, 0, sampledColumns, sampledRows);

  return canvas;
}

export function renderSynthPreview(sampleCanvas: HTMLCanvasElement, previewCanvas: HTMLCanvasElement, pane: HTMLElement, xScale: number) {
  const scaledSource = document.createElement("canvas");
  scaledSource.width = sampleCanvas.width * xScale;
  scaledSource.height = sampleCanvas.height * xScale;

  const sourceCtx = scaledSource.getContext("2d");
  if (!sourceCtx) return;

  sourceCtx.imageSmoothingEnabled = false;
  sourceCtx.clearRect(0, 0, scaledSource.width, scaledSource.height);
  sourceCtx.drawImage(sampleCanvas, 0, 0, scaledSource.width, scaledSource.height);

  const paneBox = pane.getBoundingClientRect();
  const paneWidth = Math.max(1, Math.floor(paneBox.width));
  const paneHeight = Math.max(1, Math.floor(paneBox.height));

  const cssScale = Math.max(1, Math.floor(Math.min(paneWidth / scaledSource.width, paneHeight / scaledSource.height)));
  const cssWidth = scaledSource.width * cssScale;
  const cssHeight = scaledSource.height * cssScale;

  const dpr = Math.max(1, window.devicePixelRatio || 1);

  previewCanvas.style.width = `${cssWidth}px`;
  previewCanvas.style.height = `${cssHeight}px`;
  previewCanvas.width = Math.floor(cssWidth * dpr);
  previewCanvas.height = Math.floor(cssHeight * dpr);

  const ctx = previewCanvas.getContext("2d");
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  ctx.drawImage(scaledSource, 0, 0, cssWidth, cssHeight);
}

export function imageDataToBbcode(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  opts?: { alphaThreshold?: number; xScale?: number; emptyChar?: string }
) {
  const alphaThreshold = Number.isFinite(opts?.alphaThreshold) ? Number(opts?.alphaThreshold) : 30;
  const xScale = Math.max(1, Number.isFinite(opts?.xScale) ? Number(opts?.xScale) : 2);
  const emptyChar = opts?.emptyChar ?? " ";

  const lines: string[] = [];
  const block = "█";

  for (let y = 0; y < height; y += 1) {
    let line = "";
    let runColor: string | null = null;
    let runCount = 0;

    const flush = () => {
      if (!runCount) return;
      const pixels = block.repeat(runCount * xScale);
      if (runColor === null) {
        line += emptyChar.repeat(runCount * xScale);
      } else {
        line += `[color=${runColor}]${pixels}[/color]`;
      }
      runCount = 0;
      runColor = null;
    };

    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const r = rgba[idx];
      const g = rgba[idx + 1];
      const b = rgba[idx + 2];
      const a = rgba[idx + 3];
      const color = a >= alphaThreshold ? rgbaToHex(r, g, b) : null;

      if (x === 0) {
        runColor = color;
        runCount = 1;
        continue;
      }

      if (runColor === color) {
        runCount += 1;
        continue;
      }

      flush();
      runColor = color;
      runCount = 1;
    }

    flush();
    lines.push(line.replace(/[ \t]+$/, ""));
  }

  return lines;
}

export function sampleCanvasToBbcode(sampleCanvas: HTMLCanvasElement, opts: { alphaThreshold: number; xScale: number }) {
  const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  const { data } = ctx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height);
  return imageDataToBbcode(data, sampleCanvas.width, sampleCanvas.height, {
    alphaThreshold: opts.alphaThreshold,
    xScale: opts.xScale,
    emptyChar: " "
  });
}

export function buildFootnote(pageUrl: string) {
  return `[size="2"][url="${pageUrl}"]Generated by the PokeSprite Generator[/url][/size]`;
}

export function formatBbcode(lines: string[], pageUrl: string) {
  return `[code]\n${lines.join("\n")}\n[/code]\n\n${buildFootnote(pageUrl)}\n`;
}

export function canvasToPngBlob(canvas: HTMLCanvasElement) {
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

export function exportSampleCanvasPng(
  sourceCanvas: HTMLCanvasElement,
  exportCanvas: HTMLCanvasElement,
  options: { scale?: number; background?: string } = {}
) {
  const scale = Math.max(1, Math.floor(options.scale || 8));
  const outWidth = sourceCanvas.width * scale;
  const outHeight = sourceCanvas.height * scale;

  exportCanvas.width = outWidth;
  exportCanvas.height = outHeight;

  const ctx = exportCanvas.getContext("2d");
  if (!ctx) throw new Error("2D export context unavailable.");

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, outWidth, outHeight);

  if (options.background && options.background !== "transparent") {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, outWidth, outHeight);
  }

  ctx.drawImage(sourceCanvas, 0, 0, outWidth, outHeight);
}

export function safeFilename(value: string) {
  return String(value || "pokesprite")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "pokesprite";
}
