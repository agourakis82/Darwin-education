/**
 * Darwin Education — CDM Calculator (DINA / G-DINA)
 * ===================================================
 *
 * Cognitive Diagnostic Models for binary attribute mastery classification.
 * Implements DINA and G-DINA with EM (MMLE) parameter estimation,
 * MAP/EAP classification, CDM-CAT item selection (Shannon entropy),
 * Q-matrix validation, and model fit statistics.
 *
 * K=6 cognitive attributes → 2^6 = 64 latent classes.
 *
 * References:
 *   DINA:   Junker & Sijtsma (2001). APM, 25(3), 258-282.
 *   G-DINA: de la Torre (2011). Psychometrika, 76, 179-199.
 *   EM-MMLE: de la Torre (2009). Journal of Educational Measurement.
 *   CDM-CAT: Xu et al. (2003). Applied Measurement in Education.
 */

import {
  CDM_K,
  CDM_NCLASSES,
  CDM_ATTRIBUTES,
  DEFAULT_CDM_EM_CONFIG,
  type QMatrix,
  type QMatrixRow,
  type QMatrixDiagnostics,
  type DINAItemParameters,
  type DINAParameters,
  type GDINAItemParameters,
  type GDINAParameters,
  type AttributeProfile,
  type CDMFit,
  type CDMClassification,
  type CDMEMConfig,
  type CDMEstimationResult,
  type CDMCATNextItem,
  type CognitiveAttribute,
  type GDINALinkFunction,
} from '../types/cdm';

// ============================================
// Latent Class Enumeration
// ============================================

/**
 * Enumerate all 2^K latent classes as binary vectors.
 *
 * Class c ∈ {0..63}: bit k of c determines α_{ck}.
 *   e.g., class 0  = [0,0,0,0,0,0] (no attributes mastered)
 *         class 63 = [1,1,1,1,1,1] (all attributes mastered)
 *         class 4  = [0,0,1,0,0,0] (bit 2 = 1 → A3 mastered)
 *
 * Bit order: attribute k corresponds to bit k (LSB = A1).
 */
export function enumerateLatentClasses(K: number = CDM_K): number[][] {
  const nClasses = 1 << K;
  const classes: number[][] = [];
  for (let c = 0; c < nClasses; c++) {
    const alpha: number[] = new Array(K);
    for (let k = 0; k < K; k++) {
      alpha[k] = (c >> k) & 1;
    }
    classes.push(alpha);
  }
  return classes;
}

// Pre-computed for K=6 (used throughout)
const LATENT_CLASSES = enumerateLatentClasses(CDM_K);

// ============================================
// Q-Matrix Utilities
// ============================================

/** Extract required attribute indices for item j from Q-matrix */
function getRequiredAttributes(qRow: QMatrixRow): number[] {
  const required: number[] = [];
  for (let k = 0; k < CDM_K; k++) {
    if (qRow[k] === 1) required.push(k);
  }
  return required;
}

/**
 * Compute ideal response η_{cj} for latent class c and item j.
 *
 * η_{cj} = ∏_{k: q_{jk}=1} α_{ck}
 *
 * This is 1 iff the student in class c has mastered ALL required attributes.
 * This is the DINA AND-gate. For G-DINA, we use the reduced class directly.
 */
function computeEta(classAlpha: number[], requiredAttributes: number[]): number {
  if (requiredAttributes.length === 0) return 1;
  for (const k of requiredAttributes) {
    if (classAlpha[k] === 0) return 0;
  }
  return 1;
}

/**
 * Compute reduced attribute vector α* for class c and item j.
 * α* is the sub-vector of α over required attributes only.
 *
 * Returns an integer index into the 2^{K_j*} reduced class space.
 */
function reducedClassIndex(classAlpha: number[], requiredAttributes: number[]): number {
  let index = 0;
  for (let r = 0; r < requiredAttributes.length; r++) {
    index |= classAlpha[requiredAttributes[r]] << r;
  }
  return index;
}

// ============================================
// DINA Probability Model
// ============================================

/**
 * Compute P(X_{ij}=1 | α_c) for DINA model.
 *
 * P = (1 - s_j)^{η_{cj}} × g_j^{1 - η_{cj}}
 *
 * Numerically: avoid log(0) by clamping P ∈ [1e-10, 1-1e-10].
 */
function dinaProbability(
  classAlpha: number[],
  slip: number,
  guessing: number,
  requiredAttributes: number[]
): number {
  const eta = computeEta(classAlpha, requiredAttributes);
  const p = eta === 1 ? 1 - slip : guessing;
  return Math.max(1e-10, Math.min(1 - 1e-10, p));
}

/**
 * Compute P(X_{ij}=1 | α*_l) for G-DINA model (identity link).
 *
 * P = δ_{j0} + Σ_k δ_{jk} α*_k + Σ_{k<l} δ_{jkl} α*_k α*_l + ...
 *
 * deltaCoeffs[i] maps to the i-th term in the saturated model:
 *   index 0 = intercept
 *   index 1..K_j* = main effects
 *   index K_j*+1.. = interaction effects (binary enumeration order)
 *
 * We use the design vector approach: for reduced class l, the design
 * vector s_l has entries for all 2^{K_j*} interaction terms.
 */
function gdinaProbabilityIdentity(
  reducedClassIdx: number,
  deltaCoeffs: number[],
  numRequired: number
): number {
  // The design vector for reduced class l:
  // bit r of l determines α*_r; interaction terms are products of subsets
  const nTerms = 1 << numRequired; // 2^{K_j*}
  let p = 0;
  for (let term = 0; term < nTerms; term++) {
    // term indexes a subset S of {1..K_j*}; contribution = δ_S × ∏_{r∈S} α*_r
    // α*_r for reduced class l: bit r of reducedClassIdx
    let isActive = true;
    for (let r = 0; r < numRequired; r++) {
      if ((term >> r) & 1) {
        // This term requires attribute r in the reduced space
        if (!((reducedClassIdx >> r) & 1)) {
          isActive = false;
          break;
        }
      }
    }
    if (isActive && term < deltaCoeffs.length) {
      p += deltaCoeffs[term];
    }
  }
  return Math.max(1e-10, Math.min(1 - 1e-10, p));
}

// ============================================
// Log-Sum-Exp Utility
// ============================================

/** Numerically stable log-sum-exp: log(Σ exp(x_i)) */
function logSumExp(logValues: number[]): number {
  let maxVal = -Infinity;
  for (const v of logValues) {
    if (v > maxVal) maxVal = v;
  }
  if (!isFinite(maxVal)) return -Infinity;
  let sum = 0;
  for (const v of logValues) {
    sum += Math.exp(v - maxVal);
  }
  return maxVal + Math.log(sum);
}

// ============================================
// EM Algorithm — E-Step
// ============================================

/**
 * E-step: compute posterior class memberships r_{ic} = P(α_c | X_i).
 *
 * log L(α_c | X_i) = Σ_j [X_{ij} log P_{jc} + (1-X_{ij}) log(1-P_{jc})]
 * log posterior_c = log L(α_c | X_i) + log π_c
 *
 * Normalize: r_{ic} = exp(log_posterior_c - log Z_i)
 * where Z_i = log-sum-exp over all classes.
 *
 * @param responses  N×J boolean response matrix
 * @param itemProbs  J×64 matrix: P(X_{ij}=1 | α_c)
 * @param classPriors  P(α_c) for c ∈ {0..63}
 * @returns N×64 posterior matrix r[i][c]
 */
function eStep(
  responses: boolean[][],
  itemProbs: number[][],
  classPriors: number[]
): number[][] {
  const N = responses.length;
  const J = itemProbs.length;
  const C = CDM_NCLASSES;
  const posterior: number[][] = new Array(N);

  for (let i = 0; i < N; i++) {
    const logPost: number[] = new Array(C);
    for (let c = 0; c < C; c++) {
      let logL = Math.log(Math.max(1e-300, classPriors[c]));
      for (let j = 0; j < J; j++) {
        const p = itemProbs[j][c];
        logL += responses[i][j]
          ? Math.log(p)
          : Math.log(1 - p);
      }
      logPost[c] = logL;
    }
    const logZ = logSumExp(logPost);
    posterior[i] = new Array(C);
    for (let c = 0; c < C; c++) {
      posterior[i][c] = Math.exp(logPost[c] - logZ);
    }
  }
  return posterior;
}

// ============================================
// EM Algorithm — M-Step (DINA)
// ============================================

/**
 * M-step for DINA: update slip, guessing, and class priors.
 *
 * For item j, let:
 *   "mastered" classes: those with η_{cj} = 1
 *   "non-mastered" classes: those with η_{cj} = 0
 *
 * Expected counts:
 *   T_{j1} = Σ_i Σ_{c: η=1} r_{ic}  (expected masters)
 *   W_{j1} = Σ_i Σ_{c: η=1} r_{ic} × (1 - X_{ij})  (expected wrong-and-master = slips)
 *   T_{j0} = Σ_i Σ_{c: η=0} r_{ic}  (expected non-masters)
 *   C_{j0} = Σ_i Σ_{c: η=0} r_{ic} × X_{ij}  (expected correct-and-nonmaster = guesses)
 *
 * MLE updates:
 *   s_j = W_{j1} / T_{j1}
 *   g_j = C_{j0} / T_{j0}
 *
 * Constrain: s_j, g_j ∈ [minSlipGuess, maxSlipGuess]
 *
 * New priors: π_c = (1/N) Σ_i r_{ic}
 */
function mStepDINA(
  responses: boolean[][],
  itemDINA: DINAItemParameters[],
  posterior: number[][],
  config: CDMEMConfig
): { items: DINAItemParameters[]; classPriors: number[] } {
  const N = responses.length;
  const J = itemDINA.length;
  const C = CDM_NCLASSES;

  // Pre-compute eta for all items × classes
  const eta: number[][] = new Array(J);
  for (let j = 0; j < J; j++) {
    eta[j] = new Array(C);
    for (let c = 0; c < C; c++) {
      eta[j][c] = computeEta(LATENT_CLASSES[c], itemDINA[j].requiredAttributes);
    }
  }

  // Update slip and guessing for each item
  const newItems: DINAItemParameters[] = new Array(J);
  for (let j = 0; j < J; j++) {
    let T1 = 1e-10, W1 = 0, T0 = 1e-10, C0 = 0;
    for (let i = 0; i < N; i++) {
      const xij = responses[i][j] ? 1 : 0;
      for (let c = 0; c < C; c++) {
        const r = posterior[i][c];
        if (eta[j][c] === 1) {
          T1 += r;
          W1 += r * (1 - xij);
        } else {
          T0 += r;
          C0 += r * xij;
        }
      }
    }
    const slip = Math.max(config.minSlipGuess, Math.min(config.maxSlipGuess, W1 / T1));
    const guessing = Math.max(config.minSlipGuess, Math.min(config.maxSlipGuess, C0 / T0));
    newItems[j] = { ...itemDINA[j], slip, guessing };
  }

  // Update class priors
  const classPriors: number[] = new Array(C);
  for (let c = 0; c < C; c++) {
    let sum = 0;
    for (let i = 0; i < N; i++) sum += posterior[i][c];
    classPriors[c] = Math.max(config.minClassPrior, sum / N);
  }
  // Re-normalize priors
  const priorSum = classPriors.reduce((a, b) => a + b, 0);
  for (let c = 0; c < C; c++) classPriors[c] /= priorSum;

  return { items: newItems, classPriors };
}

// ============================================
// EM Algorithm — M-Step (G-DINA)
// ============================================

/**
 * Builds the G-DINA design matrix S_j for item j.
 *
 * S_j is a (2^{K_j*} × 2^{K_j*}) matrix where:
 *   Row l = reduced class l (l ∈ {0..2^{K_j*}-1})
 *   Col 0 = intercept (always 1)
 *   Col t = binary-encoded interaction term t
 *     (t encodes which attributes in the subset contribute)
 *
 * The design follows the saturated model: each of the 2^{K_j*} row-
 * patterns is a unique combination of 0/1 attribute values.
 * The j-th delta coefficient is identified from this matrix.
 */
function buildGDINADesignMatrix(numRequired: number): number[][] {
  const nClasses = 1 << numRequired;
  const S: number[][] = new Array(nClasses);
  for (let l = 0; l < nClasses; l++) {
    S[l] = new Array(nClasses);
    for (let term = 0; term < nClasses; term++) {
      // Term `term` is a subset indicator; S[l][term] = ∏_{r∈term} α*_{l,r}
      let val = 1;
      for (let r = 0; r < numRequired; r++) {
        if ((term >> r) & 1) {
          val *= (l >> r) & 1;
        }
      }
      S[l][term] = val;
    }
  }
  return S;
}

/**
 * Solve overdetermined system via normal equations.
 * Ax = b → x = (A'A)^{-1} A'b (OLS)
 *
 * For G-DINA design matrices (square, invertible), this reduces to
 * x = A^{-1} b.
 */
function solveOLS(A: number[][], b: number[]): number[] {
  const n = b.length;
  // Gaussian elimination with partial pivoting
  const aug: number[][] = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) continue;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col] / pivot;
      for (let k = col; k <= n; k++) {
        aug[row][k] -= factor * aug[col][k];
      }
    }
    for (let k = col; k <= n; k++) aug[col][k] /= pivot;
  }
  return aug.map(row => row[n]);
}

/**
 * M-step for G-DINA: update delta coefficients and class priors.
 *
 * For each item j:
 *   Marginal class counts (over reduced attribute space):
 *     n_{jl} = Σ_i Σ_{c: reducedIdx(c,j)=l} r_{ic}
 *     r_{jl} = Σ_i Σ_{c: reducedIdx(c,j)=l} r_{ic} × X_{ij}
 *
 *   Empirical P̂_{jl} = r_{jl} / n_{jl}
 *   Update δ_j = S_j^{-1} P̂_j  (for square system; OLS for over-determined)
 *
 *   Project to ensure P ∈ [0,1] via truncated normal or direct clamping.
 */
function mStepGDINA(
  responses: boolean[][],
  itemGDINA: GDINAItemParameters[],
  posterior: number[][],
  config: CDMEMConfig
): { items: GDINAItemParameters[]; classPriors: number[] } {
  const N = responses.length;
  const J = itemGDINA.length;
  const C = CDM_NCLASSES;

  const newItems: GDINAItemParameters[] = new Array(J);

  for (let j = 0; j < J; j++) {
    const numRequired = itemGDINA[j].numRequiredAttributes;
    const requiredAttrs = itemGDINA[j].requiredAttributes;
    const nReduced = 1 << numRequired;

    // Aggregate counts per reduced class
    const nCount = new Array(nReduced).fill(0);
    const rCount = new Array(nReduced).fill(0);

    for (let i = 0; i < N; i++) {
      const xij = responses[i][j] ? 1 : 0;
      for (let c = 0; c < C; c++) {
        const r = posterior[i][c];
        if (r < 1e-12) continue;
        const l = reducedClassIndex(LATENT_CLASSES[c], requiredAttrs);
        nCount[l] += r;
        rCount[l] += r * xij;
      }
    }

    // Empirical probabilities P̂_{jl}
    const pHat = nCount.map((n, l) => (n > 1e-10 ? rCount[l] / n : 0.5));

    // Solve S_j × δ_j = P̂_j to get new delta coefficients
    const S = buildGDINADesignMatrix(numRequired);
    const delta = solveOLS(S, pHat);

    newItems[j] = { ...itemGDINA[j], deltaCoeffs: delta };
  }

  // Update class priors (same as DINA)
  const classPriors: number[] = new Array(C);
  for (let c = 0; c < C; c++) {
    let sum = 0;
    for (let i = 0; i < N; i++) sum += posterior[i][c];
    classPriors[c] = Math.max(config.minClassPrior, sum / N);
  }
  const priorSum = classPriors.reduce((a, b) => a + b, 0);
  for (let c = 0; c < C; c++) classPriors[c] /= priorSum;

  return { items: newItems, classPriors };
}

// ============================================
// Item Probability Matrix Computation
// ============================================

/** Build J×C item-probability matrix for DINA parameters */
function buildDINAProbMatrix(itemParams: DINAItemParameters[]): number[][] {
  return itemParams.map(item =>
    LATENT_CLASSES.map(cls =>
      dinaProbability(cls, item.slip, item.guessing, item.requiredAttributes)
    )
  );
}

/** Build J×C item-probability matrix for G-DINA parameters */
function buildGDINAProbMatrix(itemParams: GDINAItemParameters[]): number[][] {
  return itemParams.map(item =>
    LATENT_CLASSES.map(cls => {
      const l = reducedClassIndex(cls, item.requiredAttributes);
      return gdinaProbabilityIdentity(l, item.deltaCoeffs, item.numRequiredAttributes);
    })
  );
}

// ============================================
// Log-Likelihood Computation
// ============================================

function computeLogLikelihood(
  responses: boolean[][],
  itemProbs: number[][],
  classPriors: number[]
): number {
  const N = responses.length;
  const J = itemProbs.length;
  const C = CDM_NCLASSES;
  let totalLL = 0;

  for (let i = 0; i < N; i++) {
    const logClassLL: number[] = new Array(C);
    for (let c = 0; c < C; c++) {
      let ll = Math.log(Math.max(1e-300, classPriors[c]));
      for (let j = 0; j < J; j++) {
        const p = itemProbs[j][c];
        ll += responses[i][j] ? Math.log(p) : Math.log(1 - p);
      }
      logClassLL[c] = ll;
    }
    totalLL += logSumExp(logClassLL);
  }
  return totalLL;
}

// ============================================
// Model Fit Statistics
// ============================================

/**
 * Compute CDM fit statistics.
 *
 * G² uses observed response pattern frequencies vs. model-implied.
 * For large J, patterns become sparse; we cap df at a practical limit.
 *
 * AIC = -2LL + 2p
 * BIC = -2LL + p × ln(N)
 * RMSEA = sqrt(max(0, (G² - df) / (N × df)))
 */
export function computeModelFit(
  responses: boolean[][],
  itemProbs: number[][],
  classPriors: number[],
  numParameters: number
): CDMFit {
  const N = responses.length;
  const J = itemProbs.length;
  const logLikelihood = computeLogLikelihood(responses, itemProbs, classPriors);

  const aic = -2 * logLikelihood + 2 * numParameters;
  const bic = -2 * logLikelihood + numParameters * Math.log(N);

  // M₂ limited-information fit statistic (Maydeu-Olivares & Joe, 2006).
  // Avoids the sparse-cell problem of full-pattern G² when J > 15.
  // Uses univariate + bivariate item margins, which are well-populated
  // even at modest N and large J.

  // Pre-compute model-implied item marginals: ξ_j = Σ_c π_c P_{jc}
  const modelMarg: number[] = new Array(J).fill(0);
  for (let j = 0; j < J; j++) {
    for (let c = 0; c < CDM_NCLASSES; c++) {
      modelMarg[j] += classPriors[c] * itemProbs[j][c];
    }
    modelMarg[j] = Math.max(1e-10, Math.min(1 - 1e-10, modelMarg[j]));
  }

  // Observed item proportions
  const obsMarg: number[] = new Array(J).fill(0);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < J; j++) {
      if (responses[i][j]) obsMarg[j]++;
    }
  }
  for (let j = 0; j < J; j++) obsMarg[j] /= N;

  // Univariate G² terms
  let gSquared = 0;
  for (let j = 0; j < J; j++) {
    const p = Math.max(1e-10, Math.min(1 - 1e-10, obsMarg[j]));
    const q = 1 - p;
    const mp = modelMarg[j];
    const mq = 1 - mp;
    gSquared += 2 * N * (p * Math.log(p / mp) + q * Math.log(q / mq));
  }

  // Bivariate G² terms (all J(J-1)/2 pairs, local independence under DINA)
  for (let j1 = 0; j1 < J; j1++) {
    for (let j2 = j1 + 1; j2 < J; j2++) {
      // Observed 2×2 joint proportions
      let n11 = 0, n10 = 0, n01 = 0, n00 = 0;
      for (let i = 0; i < N; i++) {
        const x1 = responses[i][j1], x2 = responses[i][j2];
        if (x1 && x2) n11++;
        else if (x1)  n10++;
        else if (x2)  n01++;
        else          n00++;
      }
      // Model-implied joint (local independence: P(x1,x2|α) = P(x1|α)P(x2|α))
      let m11 = 0, m10 = 0, m01 = 0, m00 = 0;
      for (let c = 0; c < CDM_NCLASSES; c++) {
        const pc = classPriors[c];
        const p1 = itemProbs[j1][c], p2 = itemProbs[j2][c];
        m11 += pc * p1 * p2;
        m10 += pc * p1 * (1 - p2);
        m01 += pc * (1 - p1) * p2;
        m00 += pc * (1 - p1) * (1 - p2);
      }
      // G² for this 2×2 table
      const cells: [number, number][] = [[n11, m11], [n10, m10], [n01, m01], [n00, m00]];
      for (const [obs, exp] of cells) {
        const expN = Math.max(1e-10, exp) * N;
        if (obs > 0) gSquared += 2 * obs * Math.log(obs / expN);
      }
    }
  }

  // df = J (univariate) + J(J-1)/2 (bivariate) − numParameters
  const df = Math.max(1, J + Math.floor(J * (J - 1) / 2) - numParameters);

  const rmsea = Math.sqrt(Math.max(0, (gSquared - df) / (N * df)));

  // SRMR: simplified using item variance-covariance residuals
  let srmrSum = 0;
  let srmrCount = 0;
  for (let j1 = 0; j1 < Math.min(J, 20); j1++) {
    for (let j2 = j1 + 1; j2 < Math.min(J, 20); j2++) {
      // Observed covariance
      let sumJ1 = 0, sumJ2 = 0, sumJ1J2 = 0;
      for (let i = 0; i < N; i++) {
        const x1 = responses[i][j1] ? 1 : 0;
        const x2 = responses[i][j2] ? 1 : 0;
        sumJ1 += x1; sumJ2 += x2; sumJ1J2 += x1 * x2;
      }
      const meanJ1 = sumJ1 / N, meanJ2 = sumJ2 / N;
      const obsCov = sumJ1J2 / N - meanJ1 * meanJ2;
      // Model-implied covariance: Σ_c π_c P_{j1,c} P_{j2,c} - (Σ_c π_c P_{j1,c})(Σ_c π_c P_{j2,c})
      let modelMargJ1 = 0, modelMargJ2 = 0, modelCovTerm = 0;
      for (let c = 0; c < CDM_NCLASSES; c++) {
        modelMargJ1 += classPriors[c] * itemProbs[j1][c];
        modelMargJ2 += classPriors[c] * itemProbs[j2][c];
        modelCovTerm += classPriors[c] * itemProbs[j1][c] * itemProbs[j2][c];
      }
      const modelCov = modelCovTerm - modelMargJ1 * modelMargJ2;
      const denom = Math.sqrt(meanJ1 * (1 - meanJ1) * meanJ2 * (1 - meanJ2));
      if (denom > 1e-10) {
        srmrSum += Math.pow((obsCov - modelCov) / denom, 2);
        srmrCount++;
      }
    }
  }
  const srmr = srmrCount > 0 ? Math.sqrt(srmrSum / srmrCount) : 0;

  // p-value via chi-square approximation
  const pValue = chiSquarePValue(gSquared, df);

  return { logLikelihood, numParameters, numObservations: N, aic, bic, gSquared, df, rmsea, srmr, pValue };
}

/** Chi-square p-value via incomplete gamma approximation */
function chiSquarePValue(x: number, df: number): number {
  if (x <= 0) return 1;
  // Regularized incomplete gamma Q(df/2, x/2)
  return 1 - regularizedGammaP(df / 2, x / 2);
}

/** Regularized incomplete gamma P(a, x) via series expansion */
function regularizedGammaP(a: number, x: number): number {
  if (x < 0) return 0;
  if (x === 0) return 0;
  if (x < a + 1) {
    // Series representation
    let term = 1 / a;
    let sum = term;
    for (let n = 1; n < 200; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < 1e-8 * Math.abs(sum)) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
  } else {
    // Continued fraction representation (Lentz)
    return 1 - regularizedGammaCF(a, x);
  }
}

function regularizedGammaCF(a: number, x: number): number {
  const FPMIN = 1e-30;
  let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b;
  let h = d;
  for (let i = 1; i <= 200; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-8) break;
  }
  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

/** Stirling-series approximation of log Γ(x) */
function logGamma(x: number): number {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, tmp = x + 5.5, ser = 1.000000000190015;
  tmp -= (x + 0.5) * Math.log(tmp);
  for (const ci of c) ser += ci / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

// ============================================
// DINA EM Estimation
// ============================================

/**
 * Build initial DINA parameters from Q-matrix.
 * Initialize slip=0.1, guessing=0.2 (reasonable priors), uniform class priors.
 */
function initializeDINA(qMatrix: QMatrix): DINAParameters {
  const items: DINAItemParameters[] = Object.entries(qMatrix).map(([itemId, qRow]) => ({
    itemId,
    slip: 0.1,
    guessing: 0.2,
    requiredAttributes: getRequiredAttributes(qRow),
  }));

  const classPriors = new Array(CDM_NCLASSES).fill(1 / CDM_NCLASSES);
  return { items, classPriors };
}

/**
 * Run EM (MMLE) to estimate DINA parameters.
 *
 * Convergence: |LL_t - LL_{t-1}| < threshold
 */
export function estimateDINA(
  responses: boolean[][],
  qMatrix: QMatrix,
  config: CDMEMConfig = DEFAULT_CDM_EM_CONFIG
): CDMEstimationResult {
  let params = initializeDINA(qMatrix);
  let prevLL = -Infinity;
  let converged = false;

  for (let iter = 0; iter < config.maxIterations; iter++) {
    const itemProbs = buildDINAProbMatrix(params.items);
    const posterior = eStep(responses, itemProbs, params.classPriors);
    const { items, classPriors } = mStepDINA(responses, params.items, posterior, config);
    params = { items, classPriors };

    const newProbs = buildDINAProbMatrix(params.items);
    const ll = computeLogLikelihood(responses, newProbs, params.classPriors);

    if (Math.abs(ll - prevLL) < config.convergenceThreshold) {
      converged = true;
      prevLL = ll;
      break;
    }
    prevLL = ll;
  }

  const finalProbs = buildDINAProbMatrix(params.items);
  // numParameters: J×2 (slip + guess) + (2^K - 1) priors
  const J = params.items.length;
  const numParameters = J * 2 + (CDM_NCLASSES - 1);
  const fit = computeModelFit(responses, finalProbs, params.classPriors, numParameters);

  return { params, modelType: 'dina', converged, iterations: config.maxIterations, finalLogLikelihood: prevLL, fit };
}

// ============================================
// G-DINA EM Estimation
// ============================================

/** Initialize G-DINA parameters: uniform probabilities (saturated model start) */
function initializeGDINA(
  qMatrix: QMatrix,
  linkFunction: GDINALinkFunction = 'identity'
): GDINAParameters {
  const items: GDINAItemParameters[] = Object.entries(qMatrix).map(([itemId, qRow]) => {
    const requiredAttributes = getRequiredAttributes(qRow);
    const numRequired = requiredAttributes.length;
    const nTerms = 1 << numRequired;
    // Initialize with uniform probability: δ₀ = 1/nReduced, others 0
    // This ensures all reduced classes start with probability 1/nReduced
    const deltaCoeffs = new Array(nTerms).fill(0);
    deltaCoeffs[0] = 1 / (1 << numRequired); // intercept = 1/2^K_j*
    return { itemId, deltaCoeffs, numRequiredAttributes: numRequired, requiredAttributes, linkFunction };
  });

  const classPriors = new Array(CDM_NCLASSES).fill(1 / CDM_NCLASSES);
  return { items, classPriors, linkFunction };
}

/**
 * Run EM (MMLE) to estimate G-DINA parameters.
 */
export function estimateGDINA(
  responses: boolean[][],
  qMatrix: QMatrix,
  config: CDMEMConfig = { ...DEFAULT_CDM_EM_CONFIG, modelType: 'gdina' }
): CDMEstimationResult {
  let params = initializeGDINA(qMatrix, config.linkFunction ?? 'identity');
  let prevLL = -Infinity;
  let converged = false;

  for (let iter = 0; iter < config.maxIterations; iter++) {
    const itemProbs = buildGDINAProbMatrix(params.items);
    const posterior = eStep(responses, itemProbs, params.classPriors);
    const { items, classPriors } = mStepGDINA(responses, params.items, posterior, config);
    params = { items, classPriors, linkFunction: params.linkFunction };

    const newProbs = buildGDINAProbMatrix(params.items);
    const ll = computeLogLikelihood(responses, newProbs, params.classPriors);

    if (Math.abs(ll - prevLL) < config.convergenceThreshold) {
      converged = true;
      prevLL = ll;
      break;
    }
    prevLL = ll;
  }

  const finalProbs = buildGDINAProbMatrix(params.items);
  // numParameters: Σ_j 2^{K_j*} (delta coefficients) + (2^K - 1) priors
  const numParameters =
    params.items.reduce((s, it) => s + (1 << it.numRequiredAttributes), 0) + (CDM_NCLASSES - 1);
  const fit = computeModelFit(responses, finalProbs, params.classPriors, numParameters);

  return { params, modelType: 'gdina', converged, iterations: config.maxIterations, finalLogLikelihood: prevLL, fit };
}

// ============================================
// Classification: MAP and EAP
// ============================================

/**
 * MAP classification: argmax_c P(α_c | X_i)
 */
export function mapClassify(posterior: number[]): { latentClass: number; mapEstimate: boolean[] } {
  let best = 0;
  for (let c = 1; c < CDM_NCLASSES; c++) {
    if (posterior[c] > posterior[best]) best = c;
  }
  return {
    latentClass: best,
    mapEstimate: LATENT_CLASSES[best].map(b => b === 1),
  };
}

/**
 * EAP marginal posteriors: E[α_k | X_i] = Σ_c α_{ck} × P(α_c | X_i)
 *
 * Returns length-K array of marginal mastery probabilities ∈ [0,1].
 */
export function eapClassify(posterior: number[]): number[] {
  const eap = new Array(CDM_K).fill(0);
  for (let c = 0; c < CDM_NCLASSES; c++) {
    for (let k = 0; k < CDM_K; k++) {
      eap[k] += LATENT_CLASSES[c][k] * posterior[c];
    }
  }
  return eap;
}

/**
 * Posterior entropy H = -Σ_c P(c|X) log₂ P(c|X)
 *
 * Range: [0, log₂(64)] = [0, 6] bits.
 * H=0: perfectly classified (degenerate posterior).
 * H=6: maximally uncertain (uniform posterior).
 */
export function posteriorEntropy(posterior: number[]): number {
  let H = 0;
  for (const p of posterior) {
    if (p > 1e-12) H -= p * Math.log2(p);
  }
  return H;
}

// ============================================
// Student Classification (Full Pipeline)
// ============================================

/**
 * Classify a single student given their responses and DINA parameters.
 *
 * @param responses   Map from itemId → boolean (true = correct)
 * @param qMatrix     Q-matrix for the administered items
 * @param params      Pre-estimated DINA parameters
 * @param userId      Student identifier
 */
export function classifyStudentDINA(
  responses: Record<string, boolean>,
  qMatrix: QMatrix,
  params: DINAParameters,
  userId: string
): AttributeProfile {
  // Build response vector aligned with params.items order
  const itemIds = params.items.map(it => it.itemId).filter(id => id in responses);
  const responseVec = [itemIds.map(id => responses[id])];
  const filteredItems = params.items.filter(it => itemIds.includes(it.itemId));

  // Compute item probs for administered items only
  const itemProbs = filteredItems.map(item =>
    LATENT_CLASSES.map(cls =>
      dinaProbability(cls, item.slip, item.guessing, item.requiredAttributes)
    )
  );

  const posterior = eStep(responseVec, itemProbs, params.classPriors)[0];
  return buildAttributeProfile(userId, posterior);
}

/**
 * Classify a single student given their responses and G-DINA parameters.
 */
export function classifyStudentGDINA(
  responses: Record<string, boolean>,
  qMatrix: QMatrix,
  params: GDINAParameters,
  userId: string
): AttributeProfile {
  const itemIds = params.items.map(it => it.itemId).filter(id => id in responses);
  const filteredItems = params.items.filter(it => itemIds.includes(it.itemId));
  const responseVec = [itemIds.map(id => responses[id])];

  const itemProbs = filteredItems.map(item =>
    LATENT_CLASSES.map(cls => {
      const l = reducedClassIndex(cls, item.requiredAttributes);
      return gdinaProbabilityIdentity(l, item.deltaCoeffs, item.numRequiredAttributes);
    })
  );

  const posterior = eStep(responseVec, itemProbs, params.classPriors)[0];
  return buildAttributeProfile(userId, posterior);
}

function buildAttributeProfile(userId: string, posterior: number[]): AttributeProfile {
  const { latentClass, mapEstimate } = mapClassify(posterior);
  const eapEst = eapClassify(posterior);
  const entropy = posteriorEntropy(posterior);

  const masteredAttributes: CognitiveAttribute[] = [];
  const unmasteredAttributes: CognitiveAttribute[] = [];
  for (let k = 0; k < CDM_K; k++) {
    if (mapEstimate[k]) {
      masteredAttributes.push(CDM_ATTRIBUTES[k]);
    } else {
      unmasteredAttributes.push(CDM_ATTRIBUTES[k]);
    }
  }

  return {
    userId,
    mapEstimate,
    eapEstimate: eapEst,
    posteriorProbabilities: posterior,
    latentClass,
    posteriorEntropy: entropy,
    masteredAttributes,
    unmasteredAttributes,
    classifiedAt: new Date(),
  };
}

// ============================================
// Q-Matrix Validation
// ============================================

/**
 * Validate Q-matrix for DINA identifiability conditions.
 *
 * Completeness: every attribute must appear in ≥2 items.
 * Discernibility: no two attributes have identical Q-columns
 *   (i.e., for every pair (k1,k2) there must exist item j where q_{jk1} ≠ q_{jk2}).
 */
export function validateQMatrix(qMatrix: QMatrix): QMatrixDiagnostics {
  const items = Object.values(qMatrix);
  const J = items.length;

  // Attribute coverage: count items requiring each attribute
  const attributeCoverage = {} as Record<CognitiveAttribute, number>;
  for (const attr of CDM_ATTRIBUTES) attributeCoverage[attr] = 0;

  for (const qRow of items) {
    for (let k = 0; k < CDM_K; k++) {
      if (qRow[k] === 1) attributeCoverage[CDM_ATTRIBUTES[k]]++;
    }
  }

  const isComplete = CDM_ATTRIBUTES.every(attr => attributeCoverage[attr] >= 2);
  const completenessWarnings: string[] = [];
  for (const attr of CDM_ATTRIBUTES) {
    if (attributeCoverage[attr] < 2) {
      completenessWarnings.push(
        `Attribute '${attr}' covered by only ${attributeCoverage[attr]} item(s). Minimum 2 required.`
      );
    }
  }

  // Discernibility: check all (k1,k2) pairs
  const discernibilityMatrix: boolean[][] = Array.from({ length: CDM_K }, () =>
    new Array(CDM_K).fill(false)
  );
  for (let k1 = 0; k1 < CDM_K; k1++) {
    discernibilityMatrix[k1][k1] = true; // trivially discernible from itself
    for (let k2 = k1 + 1; k2 < CDM_K; k2++) {
      let discernible = false;
      for (const qRow of items) {
        if (qRow[k1] !== qRow[k2]) { discernible = true; break; }
      }
      discernibilityMatrix[k1][k2] = discernible;
      discernibilityMatrix[k2][k1] = discernible;
    }
  }
  const isDiscernible = discernibilityMatrix
    .every((row, k1) => row.every((d, k2) => k1 === k2 || d));

  return { isComplete, isDiscernible, attributeCoverage, discernibilityMatrix, completenessWarnings };
}

// ============================================
// CDM-CAT: Entropy-Based Item Selection
// ============================================

/**
 * Select the next CDM-CAT item that maximally reduces posterior entropy.
 *
 * For each candidate item j not yet administered:
 *   P(X_j=1) = Σ_c P_j(α_c) × posterior_c
 *   P(X_j=0) = 1 - P(X_j=1)
 *
 *   posterior_c_given_1[c] = posterior_c × P_j(α_c) / P(X_j=1)
 *   posterior_c_given_0[c] = posterior_c × (1 - P_j(α_c)) / P(X_j=0)
 *
 *   H_given_1 = -Σ_c p1_c × log₂(p1_c)
 *   H_given_0 = -Σ_c p0_c × log₂(p0_c)
 *
 *   ExpectedEntropy_j = P(X_j=1) × H_given_1 + P(X_j=0) × H_given_0
 *   ΔH_j = currentEntropy - ExpectedEntropy_j
 *
 * Returns item with maximum ΔH_j.
 */
export function selectNextItemCDMCAT(
  currentPosterior: number[],
  candidateItemIds: string[],
  qMatrix: QMatrix,
  params: DINAParameters | GDINAParameters,
  administeredItemIds: Set<string> = new Set()
): CDMCATNextItem {
  const currentH = posteriorEntropy(currentPosterior);

  // Build prob vector for each candidate item
  const isDINA = 'items' in params && (params as DINAParameters).items[0]?.slip !== undefined;

  let bestItem = candidateItemIds[0] ?? '';
  let bestDeltaH = -Infinity;

  for (const itemId of candidateItemIds) {
    if (administeredItemIds.has(itemId)) continue;
    const qRow = qMatrix[itemId];
    if (!qRow) continue;

    // Find item params
    let itemProbVec: number[];
    if (isDINA) {
      const dinaParams = params as DINAParameters;
      const item = dinaParams.items.find(it => it.itemId === itemId);
      if (!item) continue;
      itemProbVec = LATENT_CLASSES.map(cls =>
        dinaProbability(cls, item.slip, item.guessing, item.requiredAttributes)
      );
    } else {
      const gdinaParams = params as GDINAParameters;
      const item = gdinaParams.items.find(it => it.itemId === itemId);
      if (!item) continue;
      itemProbVec = LATENT_CLASSES.map(cls => {
        const l = reducedClassIndex(cls, item.requiredAttributes);
        return gdinaProbabilityIdentity(l, item.deltaCoeffs, item.numRequiredAttributes);
      });
    }

    // P(X_j = 1) = Σ_c P_jc × posterior_c
    let pCorrect = 0;
    for (let c = 0; c < CDM_NCLASSES; c++) {
      pCorrect += itemProbVec[c] * currentPosterior[c];
    }
    const pWrong = 1 - pCorrect;

    // Posterior given correct
    const post1 = new Array(CDM_NCLASSES);
    for (let c = 0; c < CDM_NCLASSES; c++) {
      post1[c] = pCorrect > 1e-10
        ? (currentPosterior[c] * itemProbVec[c]) / pCorrect
        : 1 / CDM_NCLASSES;
    }

    // Posterior given wrong
    const post0 = new Array(CDM_NCLASSES);
    for (let c = 0; c < CDM_NCLASSES; c++) {
      post0[c] = pWrong > 1e-10
        ? (currentPosterior[c] * (1 - itemProbVec[c])) / pWrong
        : 1 / CDM_NCLASSES;
    }

    const H1 = posteriorEntropy(post1);
    const H0 = posteriorEntropy(post0);
    const expectedH = pCorrect * H1 + pWrong * H0;
    const deltaH = currentH - expectedH;

    if (deltaH > bestDeltaH) {
      bestDeltaH = deltaH;
      bestItem = itemId;
    }
  }

  // Determine target attributes for the selected item
  const targetAttributes: CognitiveAttribute[] = [];
  const qRow = qMatrix[bestItem];
  if (qRow) {
    for (let k = 0; k < CDM_K; k++) {
      if (qRow[k] === 1) targetAttributes.push(CDM_ATTRIBUTES[k]);
    }
  }

  return {
    itemId: bestItem,
    expectedEntropyReduction: Math.max(0, bestDeltaH),
    targetAttributes,
  };
}

// ============================================
// Utility: Build QMatrix from DB rows
// ============================================

/**
 * Build a QMatrix object from database rows.
 *
 * @param rows  Array of { question_id, attribute_id } from question_q_matrix table
 */
export function buildQMatrixFromRows(
  rows: Array<{ question_id: string; attribute_id: string }>
): QMatrix {
  const qMatrix: QMatrix = {};
  for (const row of rows) {
    if (!qMatrix[row.question_id]) {
      qMatrix[row.question_id] = [0, 0, 0, 0, 0, 0];
    }
    const attrIndex = CDM_ATTRIBUTES.indexOf(row.attribute_id as CognitiveAttribute);
    if (attrIndex >= 0) {
      qMatrix[row.question_id][attrIndex] = 1;
    }
  }
  return qMatrix;
}

/**
 * Count number of DINA parameters for a given Q-matrix.
 * = J × 2 (slip + guess) + (2^K - 1) class priors
 */
export function countDINAParameters(J: number): number {
  return J * 2 + (CDM_NCLASSES - 1);
}

/**
 * Count number of G-DINA parameters for a given Q-matrix.
 * = Σ_j 2^{K_j*} (delta terms per item) + (2^K - 1) class priors
 */
export function countGDINAParameters(qMatrix: QMatrix): number {
  let paramCount = CDM_NCLASSES - 1;
  for (const qRow of Object.values(qMatrix)) {
    const numRequired = qRow.reduce((s, v) => s + v, 0);
    paramCount += 1 << numRequired;
  }
  return paramCount;
}
