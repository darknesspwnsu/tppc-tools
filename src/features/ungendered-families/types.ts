export type FamiliesFlags = {
  filterGolds: boolean;
  filterNormals: boolean;
  filterShinys: boolean;
  filterDarks: boolean;
};

export type FamiliesColors = {
  golden: string;
  shiny: string;
  dark: string;
  normal: string;
};

export type FamiliesRunOptions = {
  inputText: string;
  minUngendered: number;
  maxMissing: number;
  flags: FamiliesFlags;
  colors: FamiliesColors;
  partitionOutput: boolean;
  missingOnlyFamilyNeeded: boolean;
  showLevelLabel: boolean;
  dropDuplicates: boolean;
  addMissingInline: boolean;
  noGroupSpacing: boolean;
  highlightRarity: boolean;
  annotateRarity: boolean;
  omitSummaryStats: boolean;
  onStatus?: (message: string) => void;
};

export type FamiliesRunResult = {
  mainText: string;
  missingText: string;
  secondaryText: string;
  cloudItems: unknown[];
};
