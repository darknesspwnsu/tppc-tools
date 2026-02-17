import { describe, expect, it } from "vitest";

import {
  buyerPays,
  computeSellGuide,
  levelForTarget,
  marketPrice,
  parseMoneyToDollars,
  sellerReceives
} from "@/features/sell-guide/core";

describe("sell-guide core", () => {
  it("calculates market, buyer, and seller values", () => {
    const level = 10n;
    expect(marketPrice(level)).toBe(10010n);
    expect(buyerPays(level, false)).toBe(10010n);
    expect(buyerPays(level, true)).toBe(6673n);
    expect(sellerReceives(level)).toBe(5005n);
  });

  it("parses millions and exact money formats", () => {
    expect(parseMoneyToDollars("250.5", { exactAmount: false })).toBe(250_500_000n);
    expect(parseMoneyToDollars("$250,000,000.49", { exactAmount: true })).toBe(250_000_000n);
    expect(parseMoneyToDollars("$250,000,000.50", { exactAmount: true })).toBe(250_000_001n);
    expect(parseMoneyToDollars("oops", { exactAmount: false })).toBe("INVALID");
  });

  it("solves the minimum level for a target amount", () => {
    const target = 250_000_000n;
    const level = levelForTarget(target, "buyer", false);
    const prev = level > 1n ? level - 1n : 1n;

    expect(buyerPays(level, false) >= target).toBe(true);
    if (level > 1n) expect(buyerPays(prev, false) < target).toBe(true);
  });

  it("returns danger status on invalid money", () => {
    const out = computeSellGuide({
      moneyInput: "abc",
      levelInput: "",
      moneyMeaning: "buyer",
      ppControlled: false,
      exactAmount: false
    });
    expect(out.statusKind).toBe("danger");
    expect(out.level).toBeNull();
  });
});

