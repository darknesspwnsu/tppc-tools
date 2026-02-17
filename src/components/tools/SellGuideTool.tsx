"use client";

import { useMemo, useState } from "react";

import {
  buyerPays,
  formatDollars,
  formulaLatexText,
  levelForTarget,
  marketPrice,
  modeBadge,
  moneyDisplayFromDollars,
  moneyHintText,
  parseLevel,
  parseMoneyToDollars,
  sellerReceives
} from "@/features/sell-guide/core";
import type { MoneyMeaning } from "@/features/sell-guide/types";
import { usePersistentOptions } from "@/hooks/usePersistentOptions";
import { PREFS_KEYS } from "@/lib/prefs-keys";

type StatusKind = "light" | "danger";

function modeLabel(meaning: MoneyMeaning) {
  return meaning === "seller" ? "Seller receives" : "Buyer pays";
}

export function SellGuideTool() {
  const [moneyInput, setMoneyInput] = useState("");
  const [levelInput, setLevelInput] = useState("");
  const [prefs, setPrefs] = usePersistentOptions<{
    ppControlled: boolean;
    exactAmount: boolean;
    moneyMeaning: MoneyMeaning;
  }>(
    PREFS_KEYS.sellGuide,
    { ppControlled: false, exactAmount: false, moneyMeaning: "buyer" },
    {
      version: 1,
      migrate: (raw) => {
        if (!raw || typeof raw !== "object") {
          return { ppControlled: false, exactAmount: false, moneyMeaning: "buyer" };
        }
        const obj = raw as Partial<{
          ppControlled: boolean;
          exactAmount: boolean;
          moneyMeaning: MoneyMeaning;
        }>;
        return {
          ppControlled: Boolean(obj.ppControlled),
          exactAmount: Boolean(obj.exactAmount),
          moneyMeaning: obj.moneyMeaning === "seller" ? "seller" : "buyer"
        };
      }
    }
  );
  const ppControlled = prefs.ppControlled;
  const exactAmount = prefs.exactAmount;
  const moneyMeaning = prefs.moneyMeaning;

  const [status, setStatus] = useState("Ready.");
  const [statusKind, setStatusKind] = useState<StatusKind>("light");
  const [marketOut, setMarketOut] = useState("$—");
  const [buyerOut, setBuyerOut] = useState("$—");
  const [sellerOut, setSellerOut] = useState("$—");

  const ppForMode = moneyMeaning === "seller" ? true : ppControlled;
  const badge = modeBadge(moneyMeaning, ppForMode);

  const unitPill = useMemo(() => (exactAmount ? "Exact $" : "Millions"), [exactAmount]);
  const moneyHint = useMemo(() => moneyHintText(exactAmount), [exactAmount]);
  const formulaLatex = useMemo(() => formulaLatexText(moneyMeaning, ppForMode), [moneyMeaning, ppForMode]);

  const updateOutputsForLevel = (level: bigint | null, meaning = moneyMeaning, pp = ppForMode) => {
    if (level === null) {
      setMarketOut("$—");
      setBuyerOut("$—");
      setSellerOut("$—");
      return;
    }
    const market = marketPrice(level);
    const buyer = buyerPays(level, pp);
    const seller = sellerReceives(level);
    setMarketOut(formatDollars(market));
    setBuyerOut(formatDollars(buyer));
    setSellerOut(formatDollars(seller));

    const dollars = meaning === "seller" ? seller : buyer;
    setMoneyInput(moneyDisplayFromDollars(dollars, exactAmount));
  };

  const updateFromMoney = (
    raw: string,
    opts?: { exactAmount?: boolean; ppControlled?: boolean; meaning?: MoneyMeaning }
  ) => {
    const nextExact = opts?.exactAmount ?? exactAmount;
    const nextMeaning = opts?.meaning ?? moneyMeaning;
    const nextPP = nextMeaning === "seller" ? true : opts?.ppControlled ?? ppControlled;

    const dollars = parseMoneyToDollars(raw, { exactAmount: nextExact });

    if (dollars === "INVALID") {
      setLevelInput("");
      updateOutputsForLevel(null, nextMeaning, nextPP);
      setStatus("Invalid input");
      setStatusKind("danger");
      return;
    }

    if (dollars === null) {
      setLevelInput("");
      updateOutputsForLevel(null, nextMeaning, nextPP);
      setStatus("Ready.");
      setStatusKind("light");
      return;
    }

    const level = levelForTarget(dollars, nextMeaning, nextPP);
    setLevelInput(level.toString());

    const market = marketPrice(level);
    const buyer = buyerPays(level, nextPP);
    const seller = sellerReceives(level);

    setMarketOut(formatDollars(market));
    setBuyerOut(formatDollars(buyer));
    setSellerOut(formatDollars(seller));

    const actual = nextMeaning === "seller" ? seller : buyer;
    setStatus(`${modeLabel(nextMeaning)} target ${formatDollars(dollars)} → minimum Level ${level.toString()} gives ${formatDollars(actual)}.`);
    setStatusKind("light");
  };

  const updateFromLevel = (
    raw: string,
    opts?: { exactAmount?: boolean; ppControlled?: boolean; meaning?: MoneyMeaning }
  ) => {
    const nextExact = opts?.exactAmount ?? exactAmount;
    const nextMeaning = opts?.meaning ?? moneyMeaning;
    const nextPP = nextMeaning === "seller" ? true : opts?.ppControlled ?? ppControlled;

    const level = parseLevel(raw);

    if (level === null) {
      setMoneyInput("");
      updateOutputsForLevel(null, nextMeaning, nextPP);
      setStatus("Ready.");
      setStatusKind("light");
      return;
    }

    const market = marketPrice(level);
    const buyer = buyerPays(level, nextPP);
    const seller = sellerReceives(level);

    setMarketOut(formatDollars(market));
    setBuyerOut(formatDollars(buyer));
    setSellerOut(formatDollars(seller));

    const dollars = nextMeaning === "seller" ? seller : buyer;
    setMoneyInput(moneyDisplayFromDollars(dollars, nextExact));
    setStatus(`Level ${level.toString()} → ${modeLabel(nextMeaning)} ${formatDollars(dollars)}.`);
    setStatusKind("light");
  };

  const recompute = (next: { exactAmount: boolean; ppControlled: boolean; moneyMeaning: MoneyMeaning }) => {
    const parsedMoney = parseMoneyToDollars(moneyInput, { exactAmount: next.exactAmount });
    if (parsedMoney !== null && parsedMoney !== "INVALID") {
      updateFromMoney(moneyInput, {
        exactAmount: next.exactAmount,
        ppControlled: next.ppControlled,
        meaning: next.moneyMeaning
      });
      return;
    }
    if (parseLevel(levelInput) !== null) {
      updateFromLevel(levelInput, {
        exactAmount: next.exactAmount,
        ppControlled: next.ppControlled,
        meaning: next.moneyMeaning
      });
      return;
    }

    setStatus("Ready.");
    setStatusKind("light");
    updateOutputsForLevel(null, next.moneyMeaning, next.moneyMeaning === "seller" ? true : next.ppControlled);
  };

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Calculator</div>
        <h1 className="page-title">TPPC Sell Guide</h1>
        <p className="page-subtitle">Convert TPPC money values to the right selling level.</p>
      </section>

      <section className="surface tool-pane">
        <div className="d-flex justify-content-end mb-2">
          <button
            id="btnClear"
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => {
              setMoneyInput("");
              setLevelInput("");
              setPrefs({ ppControlled: false, exactAmount: false, moneyMeaning: "buyer" });
              setStatus("Cleared.");
              setStatusKind("light");
              updateOutputsForLevel(null, "buyer", false);
            }}
          >
            Clear
          </button>
        </div>

        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5">
            <label htmlFor="moneyInput" className="form-label d-flex align-items-center gap-2">
              <span>Money ($)</span>
              <span id="unitPill" className="pill mono">{unitPill}</span>
            </label>

            <input
              id="moneyInput"
              className="field mono"
              placeholder={exactAmount ? "e.g. $250,000,000.00" : "e.g. 250 (meaning $250,000,000)"}
              value={moneyInput}
              onChange={(event) => {
                setMoneyInput(event.target.value);
                updateFromMoney(event.target.value);
              }}
            />

            <div className="tool-actions" style={{ marginTop: "0.6rem" }}>
              <label className="chip">
                <input
                  id="meaningBuyerPays"
                  type="radio"
                  name="moneyMeaning"
                  checked={moneyMeaning === "buyer"}
                  onChange={() => {
                    const next = { exactAmount, ppControlled, moneyMeaning: "buyer" as const };
                    setPrefs({ moneyMeaning: "buyer" });
                    recompute(next);
                  }}
                />
                Money is what buyer pays
              </label>

              <label className="chip">
                <input
                  id="meaningSellerGets"
                  type="radio"
                  name="moneyMeaning"
                  checked={moneyMeaning === "seller"}
                  onChange={() => {
                    const next = { exactAmount, ppControlled, moneyMeaning: "seller" as const };
                    setPrefs({ moneyMeaning: "seller" });
                    recompute(next);
                  }}
                />
                Money is what seller receives
              </label>
            </div>

            <div className="tool-actions" style={{ marginTop: "0.4rem" }}>
              <label className="chip">
                <input
                  id="exactAmount"
                  type="checkbox"
                  checked={exactAmount}
                  onChange={(event) => {
                    const next = { exactAmount: event.target.checked, ppControlled, moneyMeaning };
                    setPrefs({ exactAmount: event.target.checked });
                    recompute(next);
                  }}
                />
                Enter exact amount (dollars/cents)
              </label>
            </div>

            <div id="ppRow" className={moneyMeaning === "seller" ? "tool-actions d-none" : "tool-actions"} style={{ marginTop: "0.4rem" }}>
              <label className="chip">
                <input
                  id="ppControlled"
                  type="checkbox"
                  checked={ppControlled}
                  onChange={(event) => {
                    const next = { exactAmount, ppControlled: event.target.checked, moneyMeaning };
                    setPrefs({ ppControlled: event.target.checked });
                    recompute(next);
                  }}
                />
                If PP controlled (buyer pays 33% off)
              </label>
            </div>

            <div id="moneyHint" className="tool-status-line">
              {moneyHint}
            </div>
          </div>

          <div className="col-12 col-md-2 text-center">
            <div className="eq">=</div>
          </div>

          <div className="col-12 col-md-5">
            <label htmlFor="levelInput" className="form-label">
              Level to sell
            </label>
            <input
              id="levelInput"
              className="field mono"
              placeholder="e.g. 610"
              value={levelInput}
              onChange={(event) => {
                setLevelInput(event.target.value);
                updateFromLevel(event.target.value);
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
          </div>
        </div>

        <div id="status" className={`alert ${statusKind === "danger" ? "text-danger" : "text-muted"}`} style={{ marginTop: "0.95rem" }}>
          {status}
        </div>

        <div className="surface-strong" style={{ marginTop: "0.95rem", padding: "0.85rem", borderRadius: "0.75rem" }}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="fw-semibold">Formula</div>
            <span id="modeBadge" className={`badge mode-badge tone-${badge.tone}`}>
              {badge.label}
            </span>
          </div>

          <pre id="formulaLatex" className="mono formula-latex">
            {formulaLatex}
          </pre>

          <div className="tool-status-line" style={{ marginTop: "0.4rem" }}>
            Note: PP control affects buyer price only. Seller still receives half of non-discounted market price.
          </div>
        </div>
      </section>
    </div>
  );
}
