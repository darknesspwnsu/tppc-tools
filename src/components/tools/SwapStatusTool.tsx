"use client";

import { useEffect, useState } from "react";

import { filterSwapList, lookupSwapStatus, type SwapFilterMode } from "@/features/swap-status/core";
import type { SwapLookupResult, SwapStatusDb } from "@/features/swap-status/types";

const BASE_PATH = String(process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");
const JSON_URL = `${BASE_PATH}/data/swap_status.json`;

async function copyText(text: string) {
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // fallback below
  }

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
  } catch {
    // no-op
  }
  document.body.removeChild(ta);
}

function emptyResult(): SwapLookupResult {
  return {
    status: "empty",
    cleanedInput: "",
    normalizedKey: "",
    queryLabel: "",
    summary: "",
    notes: []
  };
}

export function SwapStatusTool() {
  const [query, setQuery] = useState("");
  const [db, setDb] = useState<SwapStatusDb | null>(null);
  const [statusLine, setStatusLine] = useState("Loading swap/map data...");
  const [result, setResult] = useState<SwapLookupResult>(emptyResult);
  const [filterInput, setFilterInput] = useState("");
  const [filterOutput, setFilterOutput] = useState("");
  const [filterMode, setFilterMode] = useState<SwapFilterMode>("swaps");
  const [filterStatus, setFilterStatus] = useState("Paste a list, pick a mode, then apply the filter.");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(JSON_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`Fetch failed (${response.status})`);
        const parsed = (await response.json()) as SwapStatusDb;
        setDb(parsed);
        setStatusLine("Swap/map dataset loaded.");
      } catch (error) {
        console.error(error);
        setDb(null);
        setStatusLine("Failed to load swap/map dataset.");
      }
    };

    void load();
  }, []);

  const runLookup = () => {
    const next = lookupSwapStatus(query, db);
    setResult(next);
  };

  const runFilter = () => {
    if (!db) {
      setFilterStatus("Swap/map dataset is still loading.");
      return;
    }

    const filtered = filterSwapList(filterInput, filterMode, db);
    setFilterOutput(filtered.outputText);

    if (filtered.processedCount === 0) {
      setFilterStatus("No valid Pokemon lines found.");
      return;
    }

    const filteredLabel = filterMode === "swaps" ? "swap" : "nonswap";
    const unknownSuffix =
      filtered.unknownCount > 0 ? ` ${filtered.unknownCount} unrecognized line(s) were kept.` : "";

    setFilterStatus(
      `Kept ${filtered.keptCount}/${filtered.processedCount} lines. Filtered out ${filtered.filteredCount} ${filteredLabel} line(s).${unknownSuffix}`
    );
  };

  const generatedAt = db?.metadata?.generatedAt || "";

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Lookup</div>
        <h1 className="page-title">Check Swap Status</h1>
        <p className="page-subtitle">
          Check whether a Pokemon is currently obtainable via Secret Swap. Examples: <code>Pikachu</code>,
          <code> ShinyMachop</code>, <code>DarkShelgon</code>.
        </p>

        <div style={{ marginTop: "1rem", display: "grid", gap: "0.55rem" }}>
          <label htmlFor="swapInput" className="mono" style={{ fontSize: "0.78rem" }}>
            Pokemon
          </label>
          <input
            id="swapInput"
            className="field mono"
            placeholder="Enter a Pokemon name..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              runLookup();
            }}
            style={{
              fontSize: "clamp(1.15rem, 2.2vw, 1.7rem)",
              padding: "0.85rem 1rem",
              fontWeight: 600
            }}
          />

          <div className="tool-actions" style={{ marginTop: "0.2rem" }}>
            <button id="checkSwapBtn" type="button" className="btn-primary-soft" onClick={runLookup}>
              Check Status
            </button>
          </div>
        </div>
      </section>

      <section className="surface tool-pane">
        <div
          className="surface-strong"
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "0.75rem",
            padding: "1rem"
          }}
        >
          <div id="swapStatusMessage" style={{ whiteSpace: "pre-wrap", fontWeight: 600 }}>
            {(() => {
              if (result.status === "empty") return "Enter a Pokemon and click Check Status.";
              return result.summary;
            })()}
          </div>

          {result.status === "found" ? (
            <div style={{ marginTop: "0.55rem", color: "var(--color-muted)", fontSize: "0.88rem" }}>
              Matched: <code>{result.queryLabel}</code>
            </div>
          ) : null}

          {result.status === "found" && result.notes.length ? (
            <div id="swapStatusNotes" style={{ marginTop: "0.8rem", display: "grid", gap: "0.3rem" }}>
              {result.notes.map((note) => (
                <div key={note} className="mono" style={{ fontSize: "0.82rem" }}>
                  * {note}
                </div>
              ))}
            </div>
          ) : null}

          <div className="tool-status-line" id="swapStatusLine">
            {statusLine}
            {generatedAt ? ` Data timestamp: ${generatedAt}.` : ""}
          </div>
        </div>

        <hr className="my-4" style={{ borderColor: "var(--color-border)", opacity: 0.55 }} />

        <div className="tool-template-grid">
          <div>
            <label htmlFor="swapFilterInput" className="form-label fw-semibold">
              Input List
            </label>
            <textarea
              id="swapFilterInput"
              className="field-area mono io-input"
              rows={16}
              placeholder="Paste one Pokemon per line..."
              value={filterInput}
              onChange={(event) => setFilterInput(event.target.value)}
            />

            <div className="stack" style={{ marginTop: "0.75rem", gap: "0.45rem" }}>
              <label className="chip">
                <input
                  id="filterOutSwaps"
                  name="swapFilterMode"
                  type="radio"
                  checked={filterMode === "swaps"}
                  onChange={() => setFilterMode("swaps")}
                />
                Filter out swaps
              </label>
              <label className="chip">
                <input
                  id="filterOutNonswaps"
                  name="swapFilterMode"
                  type="radio"
                  checked={filterMode === "nonswaps"}
                  onChange={() => setFilterMode("nonswaps")}
                />
                Filter out nonswaps
              </label>
            </div>

            <div className="tool-actions">
              <button id="applySwapFilterBtn" type="button" className="btn-primary-soft" onClick={runFilter}>
                Apply Filter
              </button>
              <button
                id="clearSwapFilterBtn"
                type="button"
                className="btn-outline-soft"
                onClick={() => {
                  setFilterInput("");
                  setFilterOutput("");
                  setFilterStatus("Cleared.");
                }}
              >
                Clear
              </button>
            </div>

            <div id="swapFilterStatus" className="tool-status-line">
              {filterStatus}
            </div>
          </div>

          <div>
            <label htmlFor="swapFilterOutput" className="form-label fw-semibold">
              Output
            </label>
            <textarea id="swapFilterOutput" className="field-area mono io-output" rows={22} readOnly value={filterOutput} />

            <div className="tool-actions">
              <button
                id="copySwapFilterOutputBtn"
                type="button"
                className="btn-outline-soft"
                onClick={async () => {
                  await copyText(filterOutput);
                  setFilterStatus(filterOutput.trim() ? "Copied output." : "Nothing to copy.");
                }}
              >
                Copy Output
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
