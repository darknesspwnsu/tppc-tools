"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

declare global {
  interface Window {
    MathJax?: {
      startup?: { promise?: Promise<void> };
      typesetClear?: (elements?: Element[]) => void;
      typesetPromise?: (elements?: Element[]) => Promise<void>;
    };
  }
}

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

  const ppForOutputs = moneyMeaning === "seller" ? true : ppControlled;
  const badge = modeBadge(moneyMeaning, ppControlled);

  const unitPill = useMemo(() => (exactAmount ? "Exact $" : "Millions"), [exactAmount]);
  const moneyHint = useMemo(() => moneyHintText(exactAmount), [exactAmount]);
  const formulaLatex = useMemo(() => formulaLatexText(moneyMeaning, ppControlled), [moneyMeaning, ppControlled]);
  const formulaNodeRef = useRef<HTMLDivElement>(null);

  const updateOutputsForLevel = (level: bigint | null, meaning = moneyMeaning, pp = ppForOutputs) => {
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

  const typesetFormula = useCallback(() => {
    const node = formulaNodeRef.current;
    if (!node) return;
    const mathJax = window.MathJax;
    if (!mathJax?.typesetPromise) return;
    mathJax.typesetClear?.([node]);
    void mathJax.typesetPromise([node]).catch(() => undefined);
  }, []);

  useEffect(() => {
    const node = formulaNodeRef.current;
    if (!node) return;
    node.innerHTML = formulaLatex;
    typesetFormula();
  }, [formulaLatex, typesetFormula]);

  return (
    <div className="tool-template">
      <Script
        id="MathJax-script"
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        strategy="afterInteractive"
        onLoad={() => {
          typesetFormula();
        }}
      />

      <section className="surface hero tool-template-header">
        <div className="kicker">Calculator</div>
        <h1 className="page-title">TPPC Sell Guide</h1>
        <p className="page-subtitle">Convert TPPC money values to the right selling level.</p>
      </section>

      <section className="surface tool-pane">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="fw-semibold">Calculator</div>
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

            <div className="d-flex flex-wrap gap-2 mt-2">
              <div className="form-check">
                <input
                  className="form-check-input"
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
                <label className="form-check-label" htmlFor="meaningBuyerPays">
                  Money is what <b>buyer pays</b>
                </label>
              </div>

              <div className="form-check">
                <input
                  className="form-check-input"
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
                <label className="form-check-label" htmlFor="meaningSellerGets">
                  Money is what <b>seller receives</b>
                </label>
              </div>
            </div>

            <div className="form-check mt-2">
              <input
                className="form-check-input"
                id="exactAmount"
                type="checkbox"
                checked={exactAmount}
                onChange={(event) => {
                  const next = { exactAmount: event.target.checked, ppControlled, moneyMeaning };
                  setPrefs({ exactAmount: event.target.checked });
                  recompute(next);
                }}
              />
              <label className="form-check-label" htmlFor="exactAmount">
                Enter exact amount (dollars/cents)
              </label>
            </div>

            <div id="ppRow" className={moneyMeaning === "seller" ? "form-check mt-2 d-none" : "form-check mt-2"}>
              <input
                className="form-check-input"
                id="ppControlled"
                type="checkbox"
                checked={ppControlled}
                onChange={(event) => {
                  const next = { exactAmount, ppControlled: event.target.checked, moneyMeaning };
                  setPrefs({ ppControlled: event.target.checked });
                  recompute(next);
                }}
              />
              <label className="form-check-label" htmlFor="ppControlled">
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

            <div className="tool-status-line" style={{ marginTop: "0.3rem" }}>
              Type a level → updates the money based on your selected meaning.
            </div>

            <div className="stack" style={{ marginTop: "0.75rem", gap: "0.3rem" }}>
              <div>
                <span className="text-muted">Market price (no PP): </span>
                <strong id="marketOut" className="mono fw-semibold">{marketOut}</strong>
              </div>
              <div>
                <span className="text-muted">Buyer pays (with PP setting): </span>
                <strong id="buyerOut" className="mono fw-semibold">{buyerOut}</strong>
              </div>
              <div>
                <span className="text-muted">Seller receives: </span>
                <strong id="sellerOut" className="mono fw-semibold">{sellerOut}</strong>
              </div>
            </div>
          </div>
        </div>

        <div id="status" className={`alert alert-light border mb-0 mono ${statusKind === "danger" ? "text-danger" : "text-muted"}`}>
          {status}
        </div>

        <div className="surface-strong" style={{ marginTop: "0.95rem", padding: "0.85rem", borderRadius: "0.75rem" }}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="fw-semibold">Formula</div>
            <span id="modeBadge" className={`badge mode-badge tone-${badge.tone}`}>
              {badge.label}
            </span>
          </div>

          <div id="formulaLatex" className="mono formula-latex" ref={formulaNodeRef} style={{ minHeight: "7.75rem" }} />

          <div className="tool-status-line" style={{ marginTop: "0.4rem" }}>
            Note: PP control affects the <b>buyer price only</b>. Seller still receives half of the original (non-discounted) market price.
          </div>
        </div>
      </section>
    </div>
  );
}
