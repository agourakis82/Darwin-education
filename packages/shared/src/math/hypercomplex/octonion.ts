import {
  cdAdd,
  cdBasis,
  cdConj,
  cdMul,
  cdNormSquared,
  cdScale,
  cdSub,
} from './cayley-dickson';

export type Octonion = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

function assertOct(x: ReadonlyArray<number>, name: string): void {
  if (x.length !== 8) throw new Error(`${name} must have length 8, got ${x.length}`);
}

export function oct(...components: Octonion): Octonion {
  return components;
}

export function octBasis(i: number): Octonion {
  const v = cdBasis(8, i);
  return v as Octonion;
}

export function octAdd(a: Octonion, b: Octonion): Octonion {
  assertOct(a, 'a');
  assertOct(b, 'b');
  return cdAdd(a, b) as Octonion;
}

export function octSub(a: Octonion, b: Octonion): Octonion {
  assertOct(a, 'a');
  assertOct(b, 'b');
  return cdSub(a, b) as Octonion;
}

export function octScale(a: Octonion, k: number): Octonion {
  assertOct(a, 'a');
  return cdScale(a, k) as Octonion;
}

export function octConj(a: Octonion): Octonion {
  assertOct(a, 'a');
  return cdConj(a) as Octonion;
}

export function octMul(a: Octonion, b: Octonion): Octonion {
  assertOct(a, 'a');
  assertOct(b, 'b');
  return cdMul(a, b) as Octonion;
}

export function octNormSquared(a: Octonion): number {
  assertOct(a, 'a');
  return cdNormSquared(a);
}

