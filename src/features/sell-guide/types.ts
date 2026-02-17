export type MoneyMeaning = "buyer" | "seller";

export type ParseMoneyMode = {
  exactAmount: boolean;
};

export type SellGuideInputs = {
  moneyInput: string;
  levelInput: string;
  moneyMeaning: MoneyMeaning;
  ppControlled: boolean;
  exactAmount: boolean;
};

export type SellGuideOutputs = {
  level: bigint | null;
  marketPrice: bigint | null;
  buyerPays: bigint | null;
  sellerReceives: bigint | null;
  normalizedMoneyInput: string;
  status: string;
  statusKind: "light" | "danger";
  modeBadgeLabel: string;
  modeBadgeTone: "secondary" | "success" | "primary";
  moneyHint: string;
  formulaLatex: string;
};
