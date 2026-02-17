import type { MoneyMeaning, ParseMoneyMode, SellGuideInputs, SellGuideOutputs } from "./types";

function cube(level: bigint) {
  return level * level * level;
}

export function marketPrice(level: bigint) {
  return 10n * (cube(level) + 1n);
}

export function buyerPays(level: bigint, isPPControlled: boolean) {
  const market = marketPrice(level);
  if (!isPPControlled) return market;
  return (2n * market) / 3n;
}

export function sellerReceives(level: bigint) {
  return marketPrice(level) / 2n;
}

export function formatDollars(value: bigint | null) {
  if (value === null) return "$—";
  return `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function parseMoneyToDollars(input: string, mode: ParseMoneyMode) {
  if (!input) return null as bigint | null | "INVALID";
  let str = String(input).trim();
  if (!str) return null as bigint | null | "INVALID";

  if (str.startsWith("$")) str = str.slice(1).trim();
  if (!str) return null as bigint | null | "INVALID";

  if (!mode.exactAmount) {
    if (!/^[\d,]+(\.\d+)?$/.test(str)) return "INVALID" as const;
    str = str.replace(/,/g, "");
    const parts = str.split(".");
    const whole = parts[0];
    const frac = (parts[1] || "").slice(0, 6).padEnd(6, "0");
    if (!/^\d+$/.test(whole) || !/^\d{6}$/.test(frac)) return "INVALID" as const;
    return BigInt(whole) * 1_000_000n + BigInt(frac);
  }

  if (!/^[\d,]+(\.\d{1,2})?$/.test(str)) return "INVALID" as const;
  str = str.replace(/,/g, "");
  const parts = str.split(".");
  if (!parts[0] || !/^\d+$/.test(parts[0])) return "INVALID" as const;

  let dollars = BigInt(parts[0]);
  const cents = (parts[1] || "00").padEnd(2, "0");
  if (!/^\d{2}$/.test(cents)) return "INVALID" as const;
  if (Number(cents) >= 50) dollars += 1n;
  return dollars;
}

export function moneyDisplayFromDollars(dollars: bigint | null, exactAmount: boolean) {
  if (dollars === null) return "";
  if (exactAmount) {
    return dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const whole = dollars / 1_000_000n;
  const frac = dollars % 1_000_000n;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(6, "0").replace(/0+$/, "");
  return `${whole.toString()}.${fracStr}`;
}

export function parseLevel(input: string) {
  if (!input) return null;
  const cleaned = String(input).replace(/[^0-9]/g, "");
  if (!cleaned) return null;
  return BigInt(cleaned);
}

export function levelForTarget(targetDollars: bigint, meaning: MoneyMeaning, isPPControlled: boolean) {
  const calc = (level: bigint) => (meaning === "seller" ? sellerReceives(level) : buyerPays(level, isPPControlled));
  if (targetDollars <= 0n) return 1n;

  let low = 1n;
  let high = 1n;
  while (calc(high) < targetDollars) {
    high *= 2n;
    if (high > 10_000_000n) break;
  }

  while (low < high) {
    const mid = (low + high) / 2n;
    if (calc(mid) >= targetDollars) high = mid;
    else low = mid + 1n;
  }

  return low;
}

export function computeSellGuide(inputs: SellGuideInputs): SellGuideOutputs {
  const dollars = parseMoneyToDollars(inputs.moneyInput, { exactAmount: inputs.exactAmount });

  if (dollars === "INVALID") {
    return {
      level: null,
      marketPrice: null,
      buyerPays: null,
      sellerReceives: null,
      normalizedMoneyInput: inputs.moneyInput,
      status: "Invalid input",
      statusKind: "danger"
    };
  }

  if (dollars === null) {
    return {
      level: null,
      marketPrice: null,
      buyerPays: null,
      sellerReceives: null,
      normalizedMoneyInput: "",
      status: "Ready.",
      statusKind: "light"
    };
  }

  const level = levelForTarget(dollars, inputs.moneyMeaning, inputs.ppControlled);
  const market = marketPrice(level);
  const buyer = buyerPays(level, inputs.ppControlled);
  const seller = sellerReceives(level);
  const actual = inputs.moneyMeaning === "seller" ? seller : buyer;

  return {
    level,
    marketPrice: market,
    buyerPays: buyer,
    sellerReceives: seller,
    normalizedMoneyInput: moneyDisplayFromDollars(dollars, inputs.exactAmount),
    status: `${
      inputs.moneyMeaning === "seller" ? "Seller receives" : "Buyer pays"
    } target ${formatDollars(dollars)} → minimum Level ${level.toString()} gives ${formatDollars(actual)}.`,
    statusKind: "light"
  };
}
