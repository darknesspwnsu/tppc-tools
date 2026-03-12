import sourceConfig from "./source-config.json";
import type {
  ParsedPokemonInput,
  PokemonVariantResolution,
  PokemonVariantSelection,
  PokespriteData,
  PokespriteFormEntry,
  PokespriteManifest,
  PokespriteSourceConfig,
  PokespriteSpeciesEntry,
  RenderSamplingOptions,
  ResolvedPokemon,
  ResolutionMode
} from "./types";

const BASE_PATH = String(process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");
const withBasePath = (path: string) => `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;

export const POKESPRITE_SOURCE = sourceConfig as PokespriteSourceConfig;
export const POKEMON_JSON_URL = withBasePath(POKESPRITE_SOURCE.manifestPath);
export const SPRITE_BASE = POKESPRITE_SOURCE.regularBaseUrl;
export const SHINY_SPRITE_BASE = POKESPRITE_SOURCE.shinyBaseUrl;

const DEFAULT_CROP_PAD = 1;
const SHINY_TOKEN = "shiny";

type ManifestIndex = {
  speciesByKey: Map<string, PokespriteSpeciesEntry>;
  speciesBySlug: Map<string, PokespriteSpeciesEntry>;
  variantByKey: Map<string, { species: PokespriteSpeciesEntry; form: PokespriteFormEntry }>;
};

const manifestIndexCache = new WeakMap<PokespriteManifest, ManifestIndex>();

export function normalizeName(s: string) {
  return String(s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function addUniqueKey<T>(map: Map<string, T>, key: string, value: T) {
  const normalized = normalizeName(key);
  if (!normalized || map.has(normalized)) return;
  map.set(normalized, value);
}

function getSpeciesKeys(species: PokespriteSpeciesEntry) {
  return [
    species.species_name,
    species.species_slug,
    ...(species.species_aliases || [])
  ];
}

function getFormKeys(form: PokespriteFormEntry) {
  return [
    form.id,
    form.label,
    form.file_slug,
    ...(form.aliases || [])
  ];
}

export function getCanonicalForm(species: PokespriteSpeciesEntry, form: PokespriteFormEntry) {
  if (!form.canonical_form) return form;
  return species.forms.find((entry) => entry.id === form.canonical_form) ?? form;
}

export function getDefaultForm(species: PokespriteSpeciesEntry) {
  return (
    species.forms.find((entry) => entry.id === species.default_form) ??
    species.forms.find((entry) => entry.id === "base") ??
    species.forms[0] ??
    null
  );
}

export function getPokemonForms(species: PokespriteSpeciesEntry) {
  const seen = new Set<string>();
  const forms: PokespriteFormEntry[] = [];

  for (const entry of species.forms) {
    const canonical = getCanonicalForm(species, entry);
    if (seen.has(canonical.id)) continue;
    seen.add(canonical.id);
    forms.push(canonical);
  }

  const defaultFormId = getDefaultForm(species)?.id;
  return forms.sort((a, b) => {
    if (a.id === defaultFormId) return -1;
    if (b.id === defaultFormId) return 1;
    return a.label.localeCompare(b.label);
  });
}

export function getPokemonBySlug(data: PokespriteManifest, slug: string | null | undefined) {
  if (!slug) return null;
  return getManifestIndex(data).speciesBySlug.get(normalizeName(slug)) ?? null;
}

export function getFormForSpecies(species: PokespriteSpeciesEntry, formId: string | null | undefined) {
  const defaultForm = getDefaultForm(species);
  if (!formId) return defaultForm;

  const query = normalizeName(formId);
  if (!query) return defaultForm;

  for (const form of species.forms) {
    const keys = getFormKeys(form);
    if (keys.some((key) => normalizeName(key) === query)) {
      return getCanonicalForm(species, form);
    }
  }

  return null;
}

function buildVariantKeys(speciesKey: string, formKey: string) {
  const species = normalizeName(speciesKey);
  const form = normalizeName(formKey);
  if (!species || !form) return [];

  const keys = new Set<string>([
    `${species} ${form}`,
    `${form} ${species}`
  ]);

  const formParts = form.split(" ");
  if (formParts.length > 1) {
    keys.add(`${formParts[0]} ${species} ${formParts.slice(1).join(" ")}`);
  }

  return [...keys];
}

function getManifestIndex(data: PokespriteManifest): ManifestIndex {
  const cached = manifestIndexCache.get(data);
  if (cached) return cached;

  const speciesByKey = new Map<string, PokespriteSpeciesEntry>();
  const speciesBySlug = new Map<string, PokespriteSpeciesEntry>();
  const variantByKey = new Map<string, { species: PokespriteSpeciesEntry; form: PokespriteFormEntry }>();

  for (const species of data.pokemon || []) {
    for (const key of getSpeciesKeys(species)) {
      addUniqueKey(speciesByKey, key, species);
    }
    addUniqueKey(speciesBySlug, species.species_slug, species);

    for (const rawForm of species.forms || []) {
      const form = getCanonicalForm(species, rawForm);
      for (const speciesKey of getSpeciesKeys(species)) {
        for (const formKey of getFormKeys(rawForm)) {
          for (const variantKey of buildVariantKeys(speciesKey, formKey)) {
            addUniqueKey(variantByKey, variantKey, { species, form });
          }
        }
      }
    }
  }

  const index = { speciesByKey, speciesBySlug, variantByKey };
  manifestIndexCache.set(data, index);
  return index;
}

function formatGenerationLabel(generation: number) {
  return generation > 0 ? `Gen ${generation}` : "Unknown Gen";
}

function buildSpriteUrl(fileSlug: string, isShiny: boolean) {
  return `${isShiny ? SHINY_SPRITE_BASE : SPRITE_BASE}${fileSlug}.png`;
}

function makeResolvedPokemon(
  species: PokespriteSpeciesEntry,
  rawForm: PokespriteFormEntry,
  isShiny: boolean
): ResolvedPokemon {
  const form = getCanonicalForm(species, rawForm);
  return {
    speciesId: species.species_id,
    dex: species.dex,
    generation: species.generation,
    generationLabel: formatGenerationLabel(species.generation),
    name: species.species_name,
    speciesSlug: species.species_slug,
    formId: form.id,
    formLabel: form.label,
    formFileSlug: form.file_slug,
    isShiny,
    source: form.source,
    spriteUrl: buildSpriteUrl(form.file_slug, isShiny)
  };
}

function variantAvailabilityError(species: PokespriteSpeciesEntry, form: PokespriteFormEntry, isShiny: boolean) {
  if (isShiny && !form.has_shiny) {
    return `Shiny is not available for ${species.species_name} (${form.label}).`;
  }
  if (!isShiny && !form.has_regular) {
    return `Regular is not available for ${species.species_name} (${form.label}).`;
  }
  return null;
}

export function parsePokemonInput(input: string, data: PokespriteData): ParsedPokemonInput {
  const normalizedInput = normalizeName(input);
  if (!normalizedInput) {
    return {
      input,
      normalizedQuery: "",
      species: null,
      form: null,
      isShiny: false
    };
  }

  const tokens = normalizedInput.split(" ");
  const filteredTokens = tokens.filter((token) => token !== SHINY_TOKEN);
  const isShiny = filteredTokens.length !== tokens.length;
  const query = filteredTokens.join(" ").trim();

  if (!query) {
    return {
      input,
      normalizedQuery: "",
      species: null,
      form: null,
      isShiny
    };
  }

  const index = getManifestIndex(data);
  const variant = index.variantByKey.get(query);
  if (variant) {
    return {
      input,
      normalizedQuery: query,
      species: variant.species,
      form: variant.form,
      isShiny
    };
  }

  const species = index.speciesByKey.get(query) ?? null;
  return {
    input,
    normalizedQuery: query,
    species,
    form: species ? getDefaultForm(species) : null,
    isShiny
  };
}

export function resolvePokemonByName(input: string, data: PokespriteData): ResolvedPokemon | null {
  const parsed = parsePokemonInput(input, data);
  if (!parsed.species || !parsed.form) return null;
  return makeResolvedPokemon(parsed.species, parsed.form, parsed.isShiny);
}

export function spriteUrlForPokemon(target: ResolvedPokemon) {
  return target.spriteUrl;
}

export function describeResolvedPokemon(target: ResolvedPokemon) {
  return `${target.name} (${target.generationLabel}, ${target.formLabel}, ${target.isShiny ? "Shiny" : "Regular"}) -> ${target.formFileSlug}`;
}

export function resolvePokemonVariant(
  data: PokespriteManifest,
  selection: PokemonVariantSelection
): PokemonVariantResolution {
  const species = getPokemonBySlug(data, selection.speciesSlug);
  if (!species) {
    return {
      pokemon: null,
      error: "Pick a Pokemon from autocomplete or enter a supported form name."
    };
  }

  const form = getFormForSpecies(species, selection.formId ?? species.default_form);
  if (!form) {
    return {
      pokemon: null,
      error: `${species.species_name} does not have that form in pokesprite-v2.`
    };
  }

  const isShiny = Boolean(selection.isShiny);
  const availabilityError = variantAvailabilityError(species, form, isShiny);
  if (availabilityError) {
    return {
      pokemon: null,
      error: availabilityError
    };
  }

  return {
    pokemon: makeResolvedPokemon(species, form, isShiny),
    error: null
  };
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
