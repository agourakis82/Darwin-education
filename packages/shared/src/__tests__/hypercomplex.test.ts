import { describe, expect, it } from 'vitest';

import { cdMul } from '../math/hypercomplex/cayley-dickson';
import {
  octBasis,
  octConj,
  octMul,
  octNormSquared,
  octSub,
  type Octonion,
} from '../math/hypercomplex/octonion';
import {
  sedAdd,
  sedBasis,
  sedMul,
  sedNormSquared,
  type Sedenion,
} from '../math/hypercomplex/sedenion';

function l2(x: ReadonlyArray<number>): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return Math.sqrt(s);
}

describe('Hypercomplex (Cayley-Dickson)', () => {
  it('octonion: x * conj(x) is real scalar == ||x||^2', () => {
    const x: Octonion = [1, 2, 3, 4, 5, 6, 7, 8];
    const prod = octMul(x, octConj(x));
    expect(prod[0]).toBeCloseTo(octNormSquared(x), 12);
    for (let i = 1; i < 8; i++) expect(prod[i]).toBeCloseTo(0, 12);
  });

  it('octonion: multiplication is non-associative (find a counterexample)', () => {
    const e = Array.from({ length: 8 }, (_, i) => octBasis(i));
    let found = false;

    outer: for (let i = 1; i < 8; i++) {
      for (let j = 1; j < 8; j++) {
        for (let k = 1; k < 8; k++) {
          const left = octMul(octMul(e[i], e[j]), e[k]);
          const right = octMul(e[i], octMul(e[j], e[k]));
          if (l2(octSub(left, right)) > 1e-12) {
            found = true;
            break outer;
          }
        }
      }
    }

    expect(found).toBe(true);
  });

  it('sedenion: norm is not multiplicative (find a counterexample)', () => {
    const e = Array.from({ length: 16 }, (_, i) => sedBasis(i));
    const candidates: Sedenion[] = [];

    // Small deterministic search space: sums of two basis units.
    for (let i = 1; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        candidates.push(sedAdd(e[i], e[j]));
        if (candidates.length >= 64) break;
      }
      if (candidates.length >= 64) break;
    }

    let found = false;
    outer: for (const x of candidates) {
      for (const y of candidates) {
        const lhs = sedNormSquared(sedMul(x, y));
        const rhs = sedNormSquared(x) * sedNormSquared(y);
        if (Math.abs(lhs - rhs) > 1e-9) {
          found = true;
          break outer;
        }
      }
    }

    expect(found).toBe(true);
  });

  it('cdMul: throws on dimension mismatch', () => {
    expect(() => cdMul([1, 2], [3])).toThrow(/dimension mismatch/i);
  });
});

