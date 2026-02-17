"use client";

import { useEffect, useState } from "react";

import { organizeBox, parseBoxInput } from "@/features/box-organizer/core";

const BASE_PATH = String(process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");
const UEUG_URL = `${BASE_PATH}/data/ueug_list.txt`;

export function BoxOrganizerTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [combine, setCombine] = useState(false);
  const [status, setStatus] = useState("Loading UE/UG list...");

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const response = await fetch(UEUG_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`Failed (${response.status})`);
        const text = await response.text();
        const count = text
          .split(/\r?\n/)
          .map((x) => x.trim())
          .filter(Boolean).length;
        if (!alive) return;
        setStatus(`UE/UG list loaded: ${count} entries.`);
      } catch {
        if (!alive) return;
        setStatus("UE/UG list unavailable.");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Organizer</div>
        <h1 className="page-title">Box Organizer</h1>
        <p className="page-subtitle">Sort your pasted box text into color categories with BBCode output.</p>
      </section>

      <section className="surface tool-pane">
        <div className="tool-template-grid">
          <div>
            <label htmlFor="input" className="form-label fw-semibold">
              Input
            </label>
            <textarea
              id="input"
              className="field-area mono"
              rows={16}
              placeholder="Paste your box text here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <div className="tool-actions">
              <label className="chip">
                <input
                  id="combine"
                  type="checkbox"
                  checked={combine}
                  onChange={(e) => setCombine(e.target.checked)}
                />
                Combine exact duplicate lines
              </label>
            </div>

            <div className="tool-actions">
              <button
                id="sortBtn"
                type="button"
                className="btn-primary-soft"
                onClick={() => {
                  const parsed = parseBoxInput(input);
                  const result = organizeBox(parsed, { combine });
                  setOutput(result.output);
                }}
              >
                Sort
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="output" className="form-label fw-semibold">
              Output
            </label>
            <textarea id="output" className="field-area mono" rows={22} readOnly value={output} />
            <div id="status" className="tool-status-line">
              {status}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
