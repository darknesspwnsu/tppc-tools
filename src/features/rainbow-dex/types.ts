export type RainbowInputRow = {
  line: string;
  variantName: string;
  gender: string;
  levelInt: number;
  levelStr: string;
};

export type RainbowRunOptions = {
  inputText: string;
  minRarity: number;
  maxMissing: number;
  includeGolds: boolean;
  onStatus?: (message: string) => void;
};

export type RainbowRunResult = {
  checklistText: string;
  extrasText: string;
};
