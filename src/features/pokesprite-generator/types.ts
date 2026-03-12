export type PokespriteSourceConfig = {
  owner: string;
  repo: string;
  tag: string;
  manifestPath: string;
  manifestRawUrl: string;
  regularBaseUrl: string;
  shinyBaseUrl: string;
};

export type PokespriteManifestMetadata = {
  repo_owner: string;
  repo_name: string;
  default_branch: string;
  version: string;
  generated_at: string;
};

export type PokespriteFormEntry = {
  id: string;
  label: string;
  aliases: string[];
  file_slug: string;
  canonical_form: string | null;
  has_regular: boolean;
  has_shiny: boolean;
  is_generated: boolean;
  source: string;
};

export type PokespriteSpeciesEntry = {
  species_id: string;
  dex: number;
  species_name: string;
  species_slug: string;
  species_aliases: string[];
  generation: number;
  default_form: string;
  forms: PokespriteFormEntry[];
};

export type PokespriteManifest = {
  metadata: PokespriteManifestMetadata;
  pokemon: PokespriteSpeciesEntry[];
};

export type PokespriteData = PokespriteManifest;

export type ParsedPokemonInput = {
  input: string;
  normalizedQuery: string;
  species: PokespriteSpeciesEntry | null;
  form: PokespriteFormEntry | null;
  isShiny: boolean;
};

export type ResolvedPokemon = {
  speciesId: string;
  dex: number;
  generation: number;
  generationLabel: string;
  name: string;
  speciesSlug: string;
  formId: string;
  formLabel: string;
  formFileSlug: string;
  isShiny: boolean;
  source: string;
  spriteUrl: string;
};

export type PokemonVariantSelection = {
  speciesSlug: string | null;
  formId?: string | null;
  isShiny?: boolean;
};

export type PokemonVariantResolution = {
  pokemon: ResolvedPokemon | null;
  error: string | null;
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
