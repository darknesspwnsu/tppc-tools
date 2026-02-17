export function level2Exp(level: number) {
  return Math.pow(level, 3) + 1;
}

export function level2ExpInBillion(level: number) {
  return (level2Exp(level) / 1e9).toFixed(2);
}

export function exp2Level(exp: number) {
  return Math.pow(exp - 1, 1 / 3);
}

export function expInBillion2Level(expBillion: number) {
  return exp2Level(expBillion * 1e9);
}

export function levelDifference(level1: number, level2: number) {
  const small = level1 > level2 ? level2 : level1;
  const big = level1 > level2 ? level1 : level2;
  return exp2Level(level2Exp(big) - level2Exp(small));
}

export function expAdd(exp: number, level: number) {
  return exp2Level(level2Exp(level) + exp);
}

export function expInBillAdd(expBillion: number, level: number) {
  return exp2Level(level2Exp(level) + expBillion * 1e9);
}

