export type UngenderedSorterRunOptions = {
  inputText: string;
  minUngendered: number;
  maxMissing: number;
  includeGolds: boolean;
  colors: {
    golden: string;
    shiny: string;
    dark: string;
    normal: string;
  };
  onStatus?: (message: string) => void;
};

export type UngenderedSorterRunResult = {
  mainText: string;
  missingText: string;
};
