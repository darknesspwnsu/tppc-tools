"use client";

import { useEffect, useMemo, useState } from "react";

import {
  findOptimalTrainers,
  formatUsInt,
  isEastCoastDaytime,
  parseTrainerLabel,
  topTrainerOptions
} from "@/features/perfect-exp/core";
import type { TrainerPlan, TrainersTable } from "@/features/perfect-exp/types";
import { usePersistentOptions } from "@/hooks/usePersistentOptions";
import { PREFS_KEYS } from "@/lib/prefs-keys";

const BASE_PATH = String(process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");
const TRAINERS_URL = `${BASE_PATH}/data/trainers.json`;

type ResultRow = {
  trainer: string;
  id: string;
  plan: TrainerPlan;
};

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 8h11v13H8z" stroke="currentColor" strokeWidth="1.9" />
      <path d="M5 16H4V4h11v1" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}

async function copyText(text: string) {
  if (!text) return;
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

export function PerfectExpTool() {
  const [table, setTable] = useState<TrainersTable | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentExp, setCurrentExp] = useState("");
  const [desiredExp, setDesiredExp] = useState("");
  const [prefs, setPrefs] = usePersistentOptions<{ useExpNight: boolean; highestGym: string }>(
    PREFS_KEYS.perfectExp,
    { useExpNight: !isEastCoastDaytime(), highestGym: "" },
    {
      version: 1,
      migrate: (raw) => {
        if (!raw || typeof raw !== "object") return { useExpNight: !isEastCoastDaytime(), highestGym: "" };
        const obj = raw as Partial<{ useExpNight: boolean; highestGym: string }>;
        return {
          useExpNight: typeof obj.useExpNight === "boolean" ? obj.useExpNight : !isEastCoastDaytime(),
          highestGym: typeof obj.highestGym === "string" ? obj.highestGym : ""
        };
      }
    }
  );
  const useExpNight = prefs.useExpNight;
  const highestGym = prefs.highestGym;
  const [timeOfDay] = useState<"daytime" | "nighttime">(() => (isEastCoastDaytime() ? "daytime" : "nighttime"));

  const [info, setInfo] = useState("");
  const [rows, setRows] = useState<ResultRow[]>([]);

  useEffect(() => {
    let alive = true;

    async function loadTable() {
      setIsLoading(true);
      try {
        const response = await fetch(TRAINERS_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`Failed to load (${response.status})`);
        const json = (await response.json()) as TrainersTable;
        if (!alive) return;
        setTable(json);
      } catch (error) {
        console.error(error);
        if (!alive) return;
        setTable({ columns: [], data: [] });
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    void loadTable();
    return () => {
      alive = false;
    };
  }, []);

  const options = useMemo(() => {
    if (!table) return [];
    return topTrainerOptions(table, useExpNight, 10);
  }, [table, useExpNight]);

  const calculate = () => {
    if (!table) return;
    const current = Number(currentExp);
    const desired = Number(desiredExp);
    if (!Number.isFinite(current) || !Number.isFinite(desired)) {
      setRows([]);
      setInfo("");
      return;
    }

    const selectedGym = Number(highestGym);
    const plans = findOptimalTrainers(
      current,
      desired,
      table,
      useExpNight,
      true,
      Number.isFinite(selectedGym) ? selectedGym : undefined
    );

    const nextRows: ResultRow[] = Object.entries(plans).map(([label, plan]) => {
      const parsed = parseTrainerLabel(label);
      return { trainer: parsed.name || label, id: parsed.id, plan };
    });

    setRows(nextRows);
    setInfo(`Training during ${useExpNight ? "NIGHT" : "DAY"} time`);
  };

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Calculator</div>
        <h1 className="page-title">Perfect Exp. Calculator</h1>
        <p className="page-subtitle">Calculate optimal trainer battles to perfect EXP in TPPC.</p>

        <div className="mt-3">
          <div className="alert alert-warning mb-0" role="alert">
            <strong>Heads-up:</strong> Calculator data is pulled from TPPC Wiki snapshots and can drift. Test unfamiliar
            trainers with a dummy battle before committing EXP.
          </div>
        </div>
      </section>

      <section className="surface tool-pane">
        <div className="tool-template-grid">
          <div className="surface-strong" style={{ padding: "0.85rem", borderRadius: "0.75rem" }}>
            <h2 className="h5 mb-2">Calculator</h2>
            <form
              id="input-form"
              onSubmit={(event) => {
                event.preventDefault();
                calculate();
              }}
            >
              <label htmlFor="current-exp" className="form-label fw-semibold">
                Current Exp
              </label>
              <input
                id="current-exp"
                type="number"
                className="field mono"
                value={currentExp}
                onChange={(event) => setCurrentExp(event.target.value)}
              />

              <label htmlFor="desired-exp" className="form-label fw-semibold mt-3">
                Desired Exp
              </label>
              <input
                id="desired-exp"
                type="number"
                className="field mono"
                value={desiredExp}
                onChange={(event) => setDesiredExp(event.target.value)}
              />

              <label htmlFor="highest-beatable-trainer" className="form-label fw-semibold mt-3">
                Highest gym you can KO with Exp Freeze
              </label>
              <select
                id="highest-beatable-trainer"
                className="field-select mono"
                value={highestGym}
                onChange={(event) => setPrefs({ highestGym: event.target.value })}
                disabled={isLoading}
              >
                <option value="" disabled>
                  {isLoading ? "Loading..." : "Select the highest gym you can KO with Exp Freeze"}
                </option>
                {options.map((trainer) => (
                  <option key={trainer.number} value={String(trainer.number)}>
                    {trainer.name} (level: {trainer.level || "?"})
                  </option>
                ))}
              </select>

              <div className="mt-3 form-check" style={{ alignItems: "flex-start" }}>
                <input
                  id="use-exp-night"
                  className="form-check-input"
                  type="checkbox"
                  checked={useExpNight}
                  onChange={(event) => setPrefs({ useExpNight: event.target.checked })}
                />
                <label className="form-check-label" htmlFor="use-exp-night">
                  Nighttime calculation (currently <code id="time-of-day">{timeOfDay}</code> in TPPC land)
                </label>
              </div>

              <button id="submit" type="submit" className="btn-primary-soft mt-3 w-100">
                Calculate
              </button>
            </form>
          </div>

          <div className="surface-strong" style={{ padding: "0.85rem", borderRadius: "0.75rem" }}>
            <div id="calculation-info" className={info ? "tool-status-line calc-notice" : "tool-status-line calc-notice d-none"}>
              {info}
            </div>

            <div className="table-responsive mt-2 table-shell">
              <table id="results-table" className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Trainer</th>
                    <th>RPG ID</th>
                    <th>Exp. per Battle</th>
                    <th>Battles Required</th>
                    <th>Exp. After</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={`${row.trainer}-${row.id}-${idx}`}>
                      <td>{row.trainer}</td>
                      <td>
                        {row.id ? (
                          <div className="d-flex align-items-center gap-2" style={{ justifyContent: "flex-end" }}>
                            <span className="mono">{row.id}</span>
                            <button
                              className="btn btn-outline-secondary copy-id"
                              type="button"
                              data-copy={row.id}
                              aria-label="Copy RPG ID"
                              onClick={async () => {
                                await copyText(row.id);
                              }}
                            >
                              <CopyIcon />
                            </button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{formatUsInt(row.plan.expGain)}</td>
                      <td>{formatUsInt(row.plan.numBattles)}</td>
                      <td>{formatUsInt(row.plan.expAfter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
