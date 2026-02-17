export type PokespriteJsonEntry = {
  idx: number;
  slug?: { eng?: string };
  name?: { eng?: string };
};

export type PokespriteData = Record<string, PokespriteJsonEntry>;

export type ResolvedPokemon = {
  id: string;
  name: string;
  slug: string;
  generationLabel: "Gen 1-8" | "Gen 9";
};

export type ResolutionMode = "auto" | "custom";

export type RenderSamplingOptions = {
  resolutionMode: ResolutionMode;
  customColumns: number;
  xScale: number;
  alphaThreshold: number;
  maxAutoColumns?: number;
};

export type PokespriteRenderMeta = {
  sampledColumns: number;
  sampledRows: number;
  croppedWidth: number;
  croppedHeight: number;
  previewScale: number;
};
