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
