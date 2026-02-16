"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  GoldenRarity,
  GoldenTimelineItemRaw,
  GoldOrganizerOpts,
  GoldOrganizerResult
} from "@/lib/gold-organizer";
import { organizeGold, parseInput } from "@/lib/gold-organizer";

const PREFS_KEY = "tppc_gold_organizer_prefs_v1";

type Prefs = Pick<
  GoldOrganizerOpts,
  | "combine"
  | "dupeDesc"
  | "plainLevel"
  | "missingRows"
  | "includeStruckMissing"
  | "dropDupes"
  | "preferredGender"
  | "goldColor"
>;

const DEFAULT_PREFS: Prefs = {
  combine: false,
  dupeDesc: false,
  plainLevel: false,
  missingRows: false,
  includeStruckMissing: false,
  dropDupes: false,
  preferredGender: "U",
  goldColor: ""
};

async function copyToClipboard(text: string) {
  const t = (text || "").trim();
  if (!t) return;

  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch (_) {
    // fallback
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
  } catch (_) {}
  document.body.removeChild(ta);
}

function fmt(n: number) {
  return Number(n).toLocaleString("en-US");
}

export function GoldOrganizer({
  timelineRaw,
  rarity
}: {
  timelineRaw: readonly GoldenTimelineItemRaw[];
  rarity: GoldenRarity;
}) {
  const [input, setInput] = useState("");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [status, setStatus] = useState("");

  const [output, setOutput] = useState("");
  const [droppedOutput, setDroppedOutput] = useState("");
  const [missingOutput, setMissingOutput] = useState("");

  const timelineCount = useMemo(
    () => (Array.isArray(timelineRaw) ? timelineRaw.filter((x) => x && x.name).length : 0),
    [timelineRaw]
  );

  // Load prefs
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const next: Prefs = {
        ...DEFAULT_PREFS,
        ...(parsed && typeof parsed === "object" ? parsed : {})
      };

      // Guard types
      if (next.preferredGender !== "M" && next.preferredGender !== "F" && next.preferredGender !== "U") {
        next.preferredGender = "U";
      }

      setPrefs(next);
    } catch (_) {
      // ignore malformed/blocked storage
    }
  }, []);

  // Save prefs
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (_) {
      // ignore
    }
  }, [prefs]);

  useEffect(() => {
    setStatus(`Loaded timeline with ${fmt(timelineCount)} gold releases.`);
  }, [timelineCount]);

  const run = () => {
    const entries = parseInput(input);
    const opts: GoldOrganizerOpts = {
      ...prefs,
      preferredGender: prefs.preferredGender
    };

    const result: GoldOrganizerResult = organizeGold(entries, opts, timelineRaw, rarity);
    setOutput(result.output);
    setDroppedOutput(result.droppedOutput);
    setMissingOutput(result.missingOutput);

    setStatus(
      `Parsed ${fmt(result.parsedCount)} entries, kept ` +
        `${fmt(result.keptGoldCount)} gold entries (` +
        `${fmt(result.matchedCount)} in reference, ` +
        `${fmt(result.ignoredCount)} ignored not-in-reference). ` +
        `Inserted ${fmt(result.missingRowsCount)} missing rows. ` +
        `Missing panel shows ${fmt(result.missingPanelCount)} of ${fmt(result.missingTotalCount)} missing species. ` +
        `Completion ${result.completionPercent}% (${result.completionCaught}/${result.completionTotal}). ` +
        `Dropped ${fmt(result.droppedCount)} duplicate entries.`
    );
  };

  const clear = () => {
    setInput("");
    setOutput("");
    setDroppedOutput("");
    setMissingOutput("");
    setStatus("");
  };

  return (
    <div>
      <section className="panel page-header site-hero">
        <h1 className="page-title">Gold Organizer</h1>
        <div className="page-subtitle">
          Uses the same input formats as Box Organizer, keeps only <code>Golden...</code> Pokemon,
          and outputs them in chronological release order.
        </div>
      </section>

      <section className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="panel h-100">
            <label className="form-label fw-semibold" htmlFor="input">
              Input
            </label>
            <textarea
              id="input"
              className="form-control"
              rows={16}
              placeholder="Paste your box text here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <div className="mt-3 d-flex flex-wrap gap-2">
              <button className="btn btn-primary" type="button" onClick={run}>
                Sort Golds
              </button>
              <button className="btn btn-outline-secondary" type="button" onClick={clear}>
                Clear
              </button>
            </div>

            <div className="panel-muted mt-3 p-3">
              <div className="fw-semibold mb-2">Options</div>

              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="combine"
                  checked={prefs.combine}
                  onChange={(e) => setPrefs((p) => ({ ...p, combine: e.target.checked }))}
                />
                <label className="form-check-label" htmlFor="combine">
                  Combine Pokemon with the same gender and level into one entry
                </label>
              </div>

              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="dupeDesc"
                  checked={prefs.dupeDesc}
                  onChange={(e) => setPrefs((p) => ({ ...p, dupeDesc: e.target.checked }))}
                />
                <label className="form-check-label" htmlFor="dupeDesc">
                  Sort dupes by level descending
                </label>
              </div>

              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="plainLevel"
                  checked={prefs.plainLevel}
                  onChange={(e) => setPrefs((p) => ({ ...p, plainLevel: e.target.checked }))}
                />
                <label className="form-check-label" htmlFor="plainLevel">
                  Display levels as <code>X</code> instead of <code>(Level: X)</code>
                </label>
              </div>

              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="missingRows"
                  checked={prefs.missingRows}
                  onChange={(e) => setPrefs((p) => ({ ...p, missingRows: e.target.checked }))}
                />
                <label className="form-check-label" htmlFor="missingRows">
                  Add missing release rows inline in grey
                </label>
              </div>

              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="includeStruckMissing"
                  checked={prefs.includeStruckMissing}
                  onChange={(e) => setPrefs((p) => ({ ...p, includeStruckMissing: e.target.checked }))}
                />
                <label className="form-check-label" htmlFor="includeStruckMissing">
                  Include struck-through missing Pokemon in the Missing panel
                </label>
              </div>

              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="dropDupes"
                  checked={prefs.dropDupes}
                  onChange={(e) => setPrefs((p) => ({ ...p, dropDupes: e.target.checked }))}
                />
                <label className="form-check-label" htmlFor="dropDupes">
                  Drop duplicates per species (keep only one, lowest level)
                </label>
              </div>

              <div className="row g-2 mb-2">
                <div className="col-12 col-md-8">
                  <label className="form-label mb-1" htmlFor="preferredGender">
                    Preferred gender to keep (when multiple)
                  </label>
                  <select
                    id="preferredGender"
                    className="form-select"
                    disabled={!prefs.dropDupes}
                    value={prefs.preferredGender}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, preferredGender: e.target.value as Prefs["preferredGender"] }))
                    }
                  >
                    <option value="M">M (Male)</option>
                    <option value="F">F (Female)</option>
                    <option value="U">U (Unknown / no symbol)</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 p-3 border rounded-3">
                <div className="fw-semibold mb-2">Optional color</div>
                <label className="form-label" htmlFor="goldColor">
                  Gold color
                </label>
                <input
                  id="goldColor"
                  className="form-control"
                  type="text"
                  placeholder="#DAA520 or gold"
                  value={prefs.goldColor}
                  onChange={(e) => setPrefs((p) => ({ ...p, goldColor: e.target.value }))}
                />
                <div className="text-muted small mt-2">
                  Color applies to found names only via <code>[color=...]Name[/color]</code>. Missing rows are always
                  grey.
                </div>
              </div>

              <div className="text-muted small mt-3">
                Accepted input formats: mixed blurb text with <code>(Level: X)</code>, tab-separated lines, or line
                format ending in a numeric level.
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="panel">
            <label className="form-label fw-semibold" htmlFor="output">
              Output (BBCode-friendly)
            </label>
            <textarea id="output" className="form-control" rows={18} readOnly value={output} />
            <div className="mt-3 d-flex flex-wrap gap-2">
              <button
                className="btn btn-success"
                type="button"
                onClick={async () => {
                  await copyToClipboard(output);
                  setStatus("Copied output.");
                }}
              >
                Copy Output
              </button>
            </div>
            <div className="text-muted small mt-2">{status}</div>
          </div>

          <div className="panel mt-3">
            <label className="form-label fw-semibold" htmlFor="droppedOutput">
              Not Shown Above (when drop duplicates is enabled)
            </label>
            <textarea
              id="droppedOutput"
              className="form-control"
              rows={8}
              readOnly
              disabled={!prefs.dropDupes}
              value={droppedOutput}
            />
            <div className="mt-3 d-flex flex-wrap gap-2">
              <button
                className="btn btn-outline-success"
                type="button"
                disabled={!prefs.dropDupes}
                onClick={async () => {
                  await copyToClipboard(droppedOutput);
                  setStatus("Copied not-shown list.");
                }}
              >
                Copy Not-Shown List
              </button>
            </div>
          </div>

          <div className="panel mt-3">
            <label className="form-label fw-semibold" htmlFor="missingOutput">
              Missing Pokemon
            </label>
            <textarea id="missingOutput" className="form-control" rows={8} readOnly value={missingOutput} />
            <div className="mt-3 d-flex flex-wrap gap-2">
              <button
                className="btn btn-outline-danger"
                type="button"
                onClick={async () => {
                  await copyToClipboard(missingOutput);
                  setStatus("Copied missing list.");
                }}
              >
                Copy Missing List
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
