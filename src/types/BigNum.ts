// BigNum — numeric alias per CLAUDE.md §2-5.
//
// Late-game values (monster HP, tree cost) can approach/exceed
// Number.MAX_SAFE_INTEGER. For Milestone 1 (Rank 0-1) the numbers stay small,
// so BigNum is backed by the native `number`. The alias exists from day one so
// that swapping in a real BigNumber implementation (break_infinity.js, etc.)
// later only touches this file and formatNumber.ts, not every call site.

export type BigNum = number;

export const ZERO: BigNum = 0;

export function toBigNum(n: number): BigNum {
  return n;
}

export function bnAdd(a: BigNum, b: BigNum): BigNum {
  return a + b;
}

export function bnSub(a: BigNum, b: BigNum): BigNum {
  return a - b;
}

export function bnMul(a: BigNum, b: BigNum): BigNum {
  return a * b;
}

export function bnGte(a: BigNum, b: BigNum): boolean {
  return a >= b;
}

export function bnToNumber(a: BigNum): number {
  return a;
}
