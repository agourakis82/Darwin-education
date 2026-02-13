/**
 * Cayley-Dickson construction for 2^n-dimensional hypercomplex algebras:
 * reals -> complex -> quaternions -> octonions -> sedenions -> ...
 *
 * This is intentionally small and dependency-free so it can run anywhere
 * (including self-hosted deployments).
 */

export type Hypercomplex = ReadonlyArray<number>;

function isPowerOfTwo(n: number): boolean {
  return Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0;
}

function assertValidVector(x: Hypercomplex, name: string): void {
  if (!isPowerOfTwo(x.length)) {
    throw new Error(`${name} length must be a power of two, got ${x.length}`);
  }
  for (let i = 0; i < x.length; i++) {
    const v = x[i];
    if (!Number.isFinite(v)) {
      throw new Error(`${name}[${i}] must be finite, got ${String(v)}`);
    }
  }
}

function assertSameDim(a: Hypercomplex, b: Hypercomplex): void {
  if (a.length !== b.length) {
    throw new Error(`dimension mismatch: ${a.length} vs ${b.length}`);
  }
}

export function cdAdd(a: Hypercomplex, b: Hypercomplex): number[] {
  assertValidVector(a, 'a');
  assertValidVector(b, 'b');
  assertSameDim(a, b);
  const out = new Array<number>(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] + b[i];
  return out;
}

export function cdSub(a: Hypercomplex, b: Hypercomplex): number[] {
  assertValidVector(a, 'a');
  assertValidVector(b, 'b');
  assertSameDim(a, b);
  const out = new Array<number>(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i];
  return out;
}

export function cdScale(a: Hypercomplex, k: number): number[] {
  assertValidVector(a, 'a');
  if (!Number.isFinite(k)) throw new Error(`k must be finite, got ${String(k)}`);
  const out = new Array<number>(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] * k;
  return out;
}

export function cdConj(x: Hypercomplex): number[] {
  assertValidVector(x, 'x');
  if (x.length === 1) return [x[0]];

  const n = x.length / 2;
  const a = x.slice(0, n);
  const b = x.slice(n);

  const ca = cdConj(a);
  const out = new Array<number>(x.length);
  for (let i = 0; i < n; i++) out[i] = ca[i];
  for (let i = 0; i < n; i++) out[n + i] = -b[i];
  return out;
}

/**
 * Multiplication via Cayley-Dickson doubling:
 * (a, b) * (c, d) = (a c - d conj(b), conj(a) d + c b)
 */
export function cdMul(x: Hypercomplex, y: Hypercomplex): number[] {
  assertValidVector(x, 'x');
  assertValidVector(y, 'y');
  assertSameDim(x, y);

  if (x.length === 1) return [x[0] * y[0]];

  const n = x.length / 2;
  const a = x.slice(0, n);
  const b = x.slice(n);
  const c = y.slice(0, n);
  const d = y.slice(n);

  const ac = cdMul(a, c);
  const dConjB = cdMul(d, cdConj(b));
  const left = cdSub(ac, dConjB);

  const conjA_d = cdMul(cdConj(a), d);
  const cb = cdMul(c, b);
  const right = cdAdd(conjA_d, cb);

  return [...left, ...right];
}

export function cdNormSquared(x: Hypercomplex): number {
  assertValidVector(x, 'x');
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return s;
}

export function cdBasis(dim: number, i: number): number[] {
  if (!isPowerOfTwo(dim)) throw new Error(`dim must be a power of two, got ${dim}`);
  if (!Number.isInteger(i) || i < 0 || i >= dim) {
    throw new Error(`basis index out of range: i=${i} dim=${dim}`);
  }
  const v = new Array<number>(dim).fill(0);
  v[i] = 1;
  return v;
}

