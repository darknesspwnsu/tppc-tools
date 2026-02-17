"use client";

import { useMemo, useState } from "react";

import {
  buyerPays,
  formatDollars,
  levelForTarget,
  marketPrice,
  moneyDisplayFromDollars,
  parseLevel,
  parseMoneyToDollars,
  sellerReceives
} from "@/features/sell-guide/core";
import type { MoneyMeaning } from "@/features/sell-guide/types";

type StatusKind = "light" | "danger";

function modeLabel(meaning: MoneyMeaning) {
  return meaning === "seller" ? "Seller receives" : "Buyer pays";
}

export function SellGuideTool() {
  const [moneyInput, setMoneyInput] = useState("");
  const [levelInput, setLevelInput] = useState("");
  const [ppControlled, setPpControlled] = useState(false);
  const [exactAmount, setExactAmount] = useState(false);
  const [moneyMeaning, setMoneyMeaning] = useState<MoneyMeaning>("buyer");
  const [status, setStatus] = useState("Ready.");
  const [statusKind, setStatusKind] = useState<StatusKind>("light");
  const [marketOut, setMarketOut] = useState("$—");
  const [buyerOut, setBuyerOut] = useState("$—");
  const [sellerOut, setSellerOut] = useState("$—");

  const unitPill = useMemo(() => (exactAmount ? "Exact $" : "Millions"), [exactAmount]);

  const updateOutputsForLevel = (level: bigint | null) => {
    if (level === null) {
      setMarketOut("$—");
      setBuyerOut("$—");
      setSellerOut("$—");
      return;
    }
    const market = marketPrice(level);
    const buyer = buyerPays(level, moneyMeaning === "seller" ? true : ppControlled);
    const seller = sellerReceives(level);
    setMarketOut(formatDollars(market));
    setBuyerOut(formatDollars(buyer));
    setSellerOut(formatDollars(seller));
  };

  const updateFromMoney = (raw: string, opts?: { exactAmount?: boolean; ppControlled?: boolean; meaning?: MoneyMeaning }) => {
    const nextExact = opts?.exactAmount ?? exactAmount;
    const nextPP = opts?.ppControlled ?? ppControlled;
    const nextMeaning = opts?.meaning ?? moneyMeaning;
    const dollars = parseMoneyToDollars(raw, { exactAmount: nextExact });

    if (dollars === "INVALID") {
      setLevelInput("");
      updateOutputsForLevel(null);
      setStatus("Invalid input");
      setStatusKind("danger");
      return;
    }
    if (dollars === null) {
      setLevelInput("");
      updateOutputsForLevel(null);
      setStatus("Ready.");
      setStatusKind("light");
      return;
    }

    const level = levelForTarget(dollars, nextMeaning, nextPP);
    setLevelInput(level.toString());
    updateOutputsForLevel(level);

    const actual = nextMeaning === "seller" ? sellerReceives(level) : buyerPays(level, nextPP);
    setStatus(`${modeLabel(nextMeaning)} target ${formatDollars(dollars)} → minimum Level ${level.toString()} gives ${formatDollars(actual)}.`);
    setStatusKind("light");
  };

  const updateFromLevel = (raw: string, opts?: { exactAmount?: boolean; ppControlled?: boolean; meaning?: MoneyMeaning }) => {
    const nextExact = opts?.exactAmount ?? exactAmount;
    const nextPP = opts?.ppControlled ?? ppControlled;
    const nextMeaning = opts?.meaning ?? moneyMeaning;
    const level = parseLevel(raw);

    if (level === null) {
      setMoneyInput("");
      updateOutputsForLevel(null);
      setStatus("Ready.");
      setStatusKind("light");
      return;
    }

    updateOutputsForLevel(level);
    const dollars = nextMeaning === "seller" ? sellerReceives(level) : buyerPays(level, nextPP);
    setMoneyInput(moneyDisplayFromDollars(dollars, nextExact));
    setStatus(`Level ${level.toString()} → ${modeLabel(nextMeaning)} ${formatDollars(dollars)}.`);
    setStatusKind("light");
  };

  const recompute = (next: { exactAmount: boolean; ppControlled: boolean; moneyMeaning: MoneyMeaning }) => {
    const parsedMoney = parseMoneyToDollars(moneyInput, { exactAmount: next.exactAmount });
    if (parsedMoney !== null && parsedMoney !== "INVALID") {
      updateFromMoney(moneyInput, { exactAmount: next.exactAmount, ppControlled: next.ppControlled, meaning: next.moneyMeaning });
      return;
    }
    if (parseLevel(levelInput) !== null) {
      updateFromLevel(levelInput, { exactAmount: next.exactAmount, ppControlled: next.ppControlled, meaning: next.moneyMeaning });
      return;
    }
    setStatus("Ready.");
    setStatusKind("light");
    updateOutputsForLevel(null);
  };

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Calculator</div>
        <h1 className="page-title">TPPC Sell Guide</h1>
        <p className="page-subtitle">Convert TPPC money values to the right selling level.</p>
      </section>

      <section className="surface tool-pane">
        <div className="tool-template-grid">
          <div>
            <label htmlFor="moneyInput" className="mono" style={{ fontSize: "0.78rem" }}>
              Money input <span id="unitPill">({unitPill})</span>
            </label>
            <input
              id="moneyInput"
              className="field mono"
              placeholder={exactAmount ? "e.g. $250,000,000.00" : "e.g. 250 (meaning $250,000,000)"}
              value={moneyInput}
              onChange={(e) => {
                setMoneyInput(e.target.value);
                updateFromMoney(e.target.value);
              }}
            />

            <div className="tool-actions">
              <label className="chip">
                <input
                  id="meaningBuyerPays"
                  type="radio"
                  name="moneyMeaning"
                  checked={moneyMeaning === "buyer"}
                  onChange={() => {
                    const next = { exactAmount, ppControlled, moneyMeaning: "buyer" as const };
                    setMoneyMeaning("buyer");
                    recompute(next);
                  }}
                />
                Buyer pays
              </label>
              <label className="chip">
                <input
                  id="meaningSellerGets"
                  type="radio"
                  name="moneyMeaning"
                  checked={moneyMeaning === "seller"}
                  onChange={() => {
                    const next = { exactAmount, ppControlled, moneyMeaning: "seller" as const };
                    setMoneyMeaning("seller");
                    recompute(next);
                  }}
                />
                Seller receives
              </label>
            </div>

            <div className="tool-actions">
              <label className="chip" id="ppRow">
                <input
                  id="ppControlled"
                  type="checkbox"
                  checked={ppControlled}
                  onChange={(e) => {
                    const next = { exactAmount, ppControlled: e.target.checked, moneyMeaning };
                    setPpControlled(e.target.checked);
                    recompute(next);
                  }}
                  disabled={moneyMeaning === "seller"}
                />
                PP controlled
              </label>
              <label className="chip">
                <input
                  id="exactAmount"
                  type="checkbox"
                  checked={exactAmount}
                  onChange={(e) => {
                    const next = { exactAmount: e.target.checked, ppControlled, moneyMeaning };
                    setExactAmount(e.target.checked);
                    recompute(next);
                  }}
                />
                Exact dollars
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="levelInput" className="mono" style={{ fontSize: "0.78rem" }}>
              Level to sell
            </label>
            <input
              id="levelInput"
              className="field mono"
              placeholder="e.g. 610"
              value={levelInput}
              onChange={(e) => {
                setLevelInput(e.target.value);
                updateFromLevel(e.target.value);
              }}
            />

            <div className="stack" style={{ marginTop: "0.75rem", gap: "0.3rem" }}>
              <div>
                Market price: <strong id="marketOut">{marketOut}</strong>
              </div>
              <div>
                Buyer pays: <strong id="buyerOut">{buyerOut}</strong>
              </div>
              <div>
                Seller receives: <strong id="sellerOut">{sellerOut}</strong>
              </div>
            </div>

            <div className="tool-actions">
              <button
                id="btnClear"
                type="button"
                className="btn-outline-soft"
                onClick={() => {
                  setMoneyInput("");
                  setLevelInput("");
                  setPpControlled(false);
                  setExactAmount(false);
                  setMoneyMeaning("buyer");
                  setStatus("Cleared.");
                  setStatusKind("light");
                  updateOutputsForLevel(null);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div
          id="status"
          className={`tool-status-line ${statusKind === "danger" ? "text-danger" : "text-muted"}`}
        >
          {status}
        </div>
      </section>
    </div>
  );
}

