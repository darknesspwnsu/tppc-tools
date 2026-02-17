"use client";

import { useEffect, useMemo, useState } from "react";

import {
  lookupEvolution,
  normalizeEvolutionDb,
  renderVariantLevels,
  sentenceCaseKey
} from "@/features/evolution-viewer/core";
import type { EvolutionDb } from "@/features/evolution-viewer/types";

const BASE_PATH = String(process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");
const JSON_URL = `${BASE_PATH}/data/evolution_min_levels.json`;

function toOutText(nameKey: string, entry: EvolutionDb[string]) {
  const levels = renderVariantLevels(entry);
  const evolvesFrom = entry.evolves_from ? sentenceCaseKey(entry.evolves_from) : "none";

  return [
    sentenceCaseKey(nameKey),
    `evolves from: ${evolvesFrom}`,
    "Normal",
    String(levels.normal),
    "Shiny",
    String(levels.shiny),
    "Dark",
    String(levels.dark),
    "Golden",
    String(levels.golden)
  ].join("\n");
}

export function EvolutionViewerTool() {
  const [db, setDb] = useState<EvolutionDb | null>(null);
  const [input, setInput] = useState("");
  const [outText, setOutText] = useState("Loading evolution data...");
  const [jsonOut, setJsonOut] = useState("");
  const [copyText, setCopyText] = useState("Copy JSON");
  const [isLoading, setIsLoading] = useState(true);

  const keys = useMemo(() => (db ? Object.keys(db).sort((a, b) => a.localeCompare(b)) : []), [db]);

  const renderForInput = (value: string, nextDb: EvolutionDb | null = db) => {
    if (!nextDb) {
      setOutText("Data not loaded.");
      setJsonOut("");
      return;
    }

    const raw = String(value || "").trim();
    if (!raw) {
      setOutText("Select a Pokémon to see details.");
      setJsonOut("");
      return;
    }

    const key = raw.toLowerCase();
    const entry = lookupEvolution(key, nextDb);
    if (!entry) {
      setOutText("Pokémon not found.");
      setJsonOut("");
      return;
    }

    setOutText(toOutText(key, entry));
    setJsonOut(JSON.stringify({ [key]: entry }, null, 2));
  };

  const load = async () => {
    setIsLoading(true);
    setOutText("Loading evolution data...");
    setJsonOut("");

    try {
      const response = await fetch(JSON_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`Fetch failed (${response.status})`);
      const raw = (await response.json()) as EvolutionDb;
      const normalized = normalizeEvolutionDb(raw);
      setDb(normalized);
      renderForInput(input, normalized);
    } catch (error) {
      console.error(error);
      setOutText("Failed to load data.");
      setJsonOut("");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Lookup</div>
        <h1 className="page-title">TPPC Evolution Viewer</h1>
        <p className="page-subtitle">Look up evolution requirements and lowest obtainable levels by variant.</p>
      </section>

      <section className="surface tool-pane">
        <div className="tool-template-grid">
          <div>
            <label htmlFor="pokeInput" className="mono" style={{ fontSize: "0.78rem" }}>
              Pokémon
            </label>
            <input
              id="pokeInput"
              className="field"
              list="pokeList"
              placeholder="Start typing a Pokémon name..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                renderForInput(e.target.value);
              }}
            />
            <datalist id="pokeList">
              {keys.map((key) => (
                <option key={key} value={sentenceCaseKey(key)} />
              ))}
            </datalist>

            <div className="tool-actions">
              <button
                id="reloadBtn"
                type="button"
                className="btn-secondary-soft"
                onClick={() => {
                  void load();
                }}
              >
                {isLoading ? "Reloading..." : "Reload data"}
              </button>
              <button
                id="copyBtn"
                type="button"
                className="btn-outline-soft"
                onClick={async () => {
                  if (!jsonOut) return;
                  await navigator.clipboard.writeText(jsonOut);
                  setCopyText("Copied!");
                  window.setTimeout(() => setCopyText("Copy JSON"), 900);
                }}
              >
                {copyText}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="out" className="mono" style={{ fontSize: "0.78rem" }}>
              Evolution information
            </label>
            <div
              id="out"
              className="surface-strong"
              style={{
                minHeight: "9.5rem",
                border: "1px solid var(--color-border)",
                borderRadius: "0.7rem",
                padding: "0.75rem",
                whiteSpace: "pre-wrap"
              }}
            >
              {outText}
            </div>

            <label htmlFor="jsonOut" className="mono" style={{ fontSize: "0.78rem", marginTop: "0.6rem", display: "block" }}>
              JSON output
            </label>
            <textarea
              id="jsonOut"
              className="field-area mono"
              rows={9}
              readOnly
              spellCheck={false}
              value={jsonOut}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

