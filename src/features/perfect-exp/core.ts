import type { TrainerPlan, TrainerRow, TrainersTable } from "./types";

function toFiniteInt(v: unknown, fallback = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

export function isEastCoastDaytime(now = new Date()) {
  const easternTime = now.toLocaleString("en-US", {
    timeZone: "America/New_York"
  });
  const easternDate = new Date(easternTime);
  const hour = easternDate.getHours();
  return hour >= 6 && hour < 18;
}

export function trainerExp(row: TrainerRow, useExpNight = false) {
  return useExpNight ? toFiniteInt(row.expNight) : toFiniteInt(row.expDay);
}

export function sortByBestExp(rows: readonly TrainerRow[], useExpNight = false) {
  return [...rows].sort((a, b) => trainerExp(b, useExpNight) - trainerExp(a, useExpNight));
}

export function topTrainerOptions(table: TrainersTable, useExpNight = false, max = 10) {
  return sortByBestExp(table.data, useExpNight).slice(0, max);
}

export function findOptimalTrainers(
  currentExp: number,
  desiredExp: number,
  table: TrainersTable,
  useExpNight = false,
  includeId = false,
  highestGym?: number
) {
  const safeCurrent = toFiniteInt(currentExp);
  const safeDesired = toFiniteInt(desiredExp);
  const targetDelta = safeDesired - safeCurrent;
  const expKey = useExpNight ? "expNight" : "expDay";

  const tableFiltered = table.data
    .filter((row) => toFiniteInt((row as Record<string, unknown>)[expKey]) <= targetDelta)
    .sort((a, b) => trainerExp(b, useExpNight) - trainerExp(a, useExpNight));

  if (Number.isFinite(highestGym)) {
    const index = tableFiltered.findIndex((row) => row.number === highestGym);
    if (index > 0) tableFiltered.splice(0, index);
  }

  const trainers: Record<string, TrainerPlan> = {};
  let remainingExp = targetDelta;
  let currentExpAfter = safeCurrent;

  for (const row of tableFiltered) {
    const expGain = trainerExp(row, useExpNight);
    if (expGain <= 0) continue;

    const numBattles = Math.floor(remainingExp / expGain);
    if (numBattles <= 0) continue;

    remainingExp -= numBattles * expGain;
    currentExpAfter += numBattles * expGain;

    const key = `${row.name}${includeId ? ` (${row.number})` : ""}`;
    trainers[key] = {
      numBattles,
      expAfter: currentExpAfter,
      expGain
    };

    if (remainingExp <= 0) break;
  }

  return trainers;
}

export function parseTrainerLabel(label: string) {
  const match = String(label).match(/^(.*?)(?:\s*\((\d+)\))?$/);
  if (!match) return { name: label, id: "" };
  return { name: (match[1] || "").trim(), id: match[2] || "" };
}

export function formatUsInt(n: number) {
  return Number(n).toLocaleString("en-US");
}
