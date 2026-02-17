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

export type FamiliesCloudItem = {
  text: string;
  cat: "golden" | "shiny" | "dark" | "normal";
  form?: string;
  chain?: Array<{ name: string; rarity: number }>;
  cumulativeRarity?: number;
  adjustedScore?: number;
  isUeug?: boolean;
  isEvolved?: boolean;
  isLv45?: boolean;
  levelNum?: number | null;
};

export type FamiliesCloudRuntime = "idle" | "loading" | "ready" | "error";

export type FamiliesCloudRuntimeState = {
  cloudRuntime: FamiliesCloudRuntime;
  cloudError?: string;
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
  visualizeCloud: boolean;
  cloudSampleSize: number;
  onStatus?: (message: string) => void;
};

export type FamiliesRunResult = {
  mainText: string;
  missingText: string;
  secondaryText: string;
  cloudItems: FamiliesCloudItem[];
};
