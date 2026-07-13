// Shared number-display utility (CLAUDE.md §2-5). ALL rendered numbers go
// through here so that swapping BigNum's backing implementation later only
// touches this file and types/BigNum.ts.

import type { BigNum } from '../../types/BigNum';
import { bnToNumber } from '../../types/BigNum';

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];

// Compact K/M/B... formatting. Values below 1,000 show up to `decimals` places.
export function formatNumber(value: BigNum, decimals = 1): string {
  let n = bnToNumber(value);
  if (!Number.isFinite(n)) return '∞';
  const neg = n < 0;
  n = Math.abs(n);

  if (n < 1000) {
    const s = n % 1 === 0 ? n.toString() : n.toFixed(decimals);
    return neg ? `-${s}` : s;
  }

  let idx = 0;
  while (n >= 1000 && idx < SUFFIXES.length - 1) {
    n /= 1000;
    idx += 1;
  }
  const s = `${n.toFixed(decimals)}${SUFFIXES[idx]}`;
  return neg ? `-${s}` : s;
}

// Integer formatting with thousands separators (for counts like drops).
export function formatInt(value: BigNum): string {
  return Math.floor(bnToNumber(value)).toLocaleString('en-US');
}

// Percent formatting (input 0..1).
export function formatPercent(ratio: number, decimals = 0): string {
  return `${(ratio * 100).toFixed(decimals)}%`;
}
