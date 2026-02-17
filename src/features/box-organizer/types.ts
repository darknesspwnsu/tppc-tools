export type BoxEntry = {
  name: string;
  levelNum: number;
};

export type BoxOrganizerColorConfig = {
  golden: string;
  shiny: string;
  dark: string;
  normal: string;
};

export type BoxOrganizerOptions = {
  combine: boolean;
  dupeDesc: boolean;
  plainLevel: boolean;
  combineSD: boolean;
  dedicatedUnknown: boolean;
  dedicatedLegends: boolean;
  keepGoldsInGolden: boolean;
  filterJunk: boolean;
  colors: BoxOrganizerColorConfig;
};

export type BoxJunkLists = {
  mapsSet: Set<string>;
  swapsSet: Set<string>;
  genderlessSet: Set<string>;
};

export type BoxOrganizerContext = {
  legendSet?: Set<string>;
  ueugSet?: Set<string>;
  junkLists?: BoxJunkLists;
};

export type BoxOrganizerResult = {
  output: string;
  filteredOutCount: number;
  inputCount: number;
  outputCount: number;
};
