export type EvolutionLevels = {
  normal?: number | null;
  shiny?: number | null;
  dark?: number | null;
  golden?: number | null;
};

export type EvolutionEntry = {
  evolves_from?: string | null;
  lowest_level_possible?: EvolutionLevels;
};

export type EvolutionDb = Record<string, EvolutionEntry>;

