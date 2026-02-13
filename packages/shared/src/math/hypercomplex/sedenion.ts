import {
  cdAdd,
  cdBasis,
  cdConj,
  cdMul,
  cdNormSquared,
  cdScale,
  cdSub,
} from './cayley-dickson';

export type Sedenion = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

function assertSed(x: ReadonlyArray<number>, name: string): void {
  if (x.length !== 16) throw new Error(`${name} must have length 16, got ${x.length}`);
}

export function sed(...components: Sedenion): Sedenion {
  return components;
}

export function sedBasis(i: number): Sedenion {
  const v = cdBasis(16, i);
  return v as Sedenion;
}

export function sedAdd(a: Sedenion, b: Sedenion): Sedenion {
  assertSed(a, 'a');
  assertSed(b, 'b');
  return cdAdd(a, b) as Sedenion;
}

export function sedSub(a: Sedenion, b: Sedenion): Sedenion {
  assertSed(a, 'a');
  assertSed(b, 'b');
  return cdSub(a, b) as Sedenion;
}

export function sedScale(a: Sedenion, k: number): Sedenion {
  assertSed(a, 'a');
  return cdScale(a, k) as Sedenion;
}

export function sedConj(a: Sedenion): Sedenion {
  assertSed(a, 'a');
  return cdConj(a) as Sedenion;
}

export function sedMul(a: Sedenion, b: Sedenion): Sedenion {
  assertSed(a, 'a');
  assertSed(b, 'b');
  return cdMul(a, b) as Sedenion;
}

export function sedNormSquared(a: Sedenion): number {
  assertSed(a, 'a');
  return cdNormSquared(a);
}

