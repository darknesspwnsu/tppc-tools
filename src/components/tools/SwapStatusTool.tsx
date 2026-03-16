"use client";

import { useEffect, useState } from "react";

import { lookupSwapStatus } from "@/features/swap-status/core";
import type { SwapLookupResult, SwapStatusDb } from "@/features/swap-status/types";

const BASE_PATH = String(process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");
const JSON_URL = `${BASE_PATH}/data/swap_status.json`;

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

  const generatedAt = db?.metadata?.generatedAt || "";

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Lookup</div>
        <h1 className="page-title">Check Swap Status</h1>
        <p className="page-subtitle">
          Check whether a Pokemon is currently obtainable via Secret Swap. Examples: <code>Pikachu</code>,
          <code> ShinyMachop</code>, <code>DarkShelgon</code>, <code>GoldenOmanyte</code>.
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
      </section>
    </div>
  );
}
