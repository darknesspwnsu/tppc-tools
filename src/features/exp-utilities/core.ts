import type { ExpUtilitiesResult } from "./types";

function toFiniteNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function level2Exp(level: number) {
  return Math.pow(toFiniteNumber(level), 3) + 1;
}

export function level2ExpInBillion(level: number) {
  return (level2Exp(level) / 1e9).toFixed(2);
}

export function exp2Level(exp: number) {
  const value = Math.max(0, toFiniteNumber(exp) - 1);
  return Math.pow(value, 1 / 3);
}

export function expInBillion2Level(expBillion: number) {
  return exp2Level(toFiniteNumber(expBillion) * 1e9);
}

export function levelDifference(level1: number, level2: number) {
  const a = toFiniteNumber(level1);
  const b = toFiniteNumber(level2);
  const small = a > b ? b : a;
  const big = a > b ? a : b;
  return exp2Level(level2Exp(big) - level2Exp(small));
}

export function expAdd(exp: number, level: number) {
  return exp2Level(level2Exp(level) + toFiniteNumber(exp));
}

export function expInBillAdd(expBillion: number, level: number) {
  return exp2Level(level2Exp(level) + toFiniteNumber(expBillion) * 1e9);
}

export function addLevels(levels: number[]) {
  const totalExp = levels.reduce((sum, level) => sum + level2Exp(level), 0);
  return exp2Level(totalExp);
}

export function levelTo4499Equivalents(level: number) {
  const lv4499InBillion = Number(level2ExpInBillion(4499));
  if (!lv4499InBillion) return 0;
  return Number(level2ExpInBillion(level)) / lv4499InBillion;
}

export function sumInputs(values: number[]) {
  return values.reduce((sum, value) => sum + toFiniteNumber(value), 0);
}

export function computeExpUtilities(inputs: {
  levelInput: number;
  levelInputBillion: number;
  expInput: number;
  expInputBillion: number;
  levelInput1: number;
  levelInput2: number;
  levelInput3: number;
  expAddItems: number[];
  levelInput4: number;
  expBillAddItems: number[];
  addLevelItems: number[];
  levelInput5: number;
}): ExpUtilitiesResult {
  const expAddTotal = sumInputs(inputs.expAddItems);
  const expBillAddTotal = sumInputs(inputs.expBillAddItems);
  const addLevelsList = inputs.addLevelItems.map((level) => toFiniteNumber(level)).filter((level) => level > 0);

  return {
    levelExpOutput: String(level2Exp(inputs.levelInput)),
    levelExpOutputBillion: String(level2ExpInBillion(inputs.levelInputBillion)),
    expLevelOutput: String(exp2Level(inputs.expInput)),
    expLevelOutputBillion: String(expInBillion2Level(inputs.expInputBillion)),
    levelDiffOutput: String(levelDifference(inputs.levelInput1, inputs.levelInput2)),
    expLevelOutput2: String(expAdd(expAddTotal, inputs.levelInput3)),
    expLevelOutput3: String(expInBillAdd(expBillAddTotal, inputs.levelInput4)),
    addLevelsOutput: String(addLevels(addLevelsList)),
    levelTo4499Output: String(levelTo4499Equivalents(inputs.levelInput5)),
    expAddSumHint: `Total EXP added: ${expAddTotal.toLocaleString("en-US")}`,
    expBillAddSumHint: `Total EXP (B) added: ${expBillAddTotal}`,
    addLevelsSumHint: `Total EXP summed: ${addLevelsList
      .reduce((sum, level) => sum + level2Exp(level), 0)
      .toLocaleString("en-US")}`
  };
}
