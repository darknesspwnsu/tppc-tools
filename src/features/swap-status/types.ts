export type SwapVariant = "normal" | "shiny" | "dark" | "golden";

export type SwapStatusEntry = {
  displayName: string;
  species: string;
  variant: SwapVariant;
  currentSecretSwap: boolean;
  formerSecretSwap: boolean;
  currentMap: boolean;
  mapSources: string[];
};

export type SwapStatusDb = {
  metadata: {
    generatedAt: string;
    sourceThreadUrl: string;
    sourceFirstPostUrl: string;
    forumListSource: string;
    wikiSourcePath: string;
    mapPokemonCount: number;
    secretSwapPokemonCount: number;
    wikiPokemonPagesParsed: number;
    entryCount: number;
  };
  entries: Record<string, SwapStatusEntry>;
};

export type SwapLookupResult =
  | {
      status: "empty";
      cleanedInput: "";
      normalizedKey: "";
      queryLabel: "";
      summary: "";
      notes: [];
    }
  | {
      status: "not-found";
      cleanedInput: string;
      normalizedKey: string;
      queryLabel: string;
      summary: string;
      notes: [];
    }
  | {
      status: "found";
      cleanedInput: string;
      normalizedKey: string;
      queryLabel: string;
      entry: SwapStatusEntry;
      summary: string;
      notes: string[];
    };
