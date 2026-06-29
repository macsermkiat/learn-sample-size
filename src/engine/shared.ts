// Shared, type-agnostic helpers. NOTE: EPP and the shrinkage solver are NOT
// shared across outcome types where they differ — survival EPP multiplies by
// mean follow-up, and continuous shrinkage is a separate solver. The genuinely
// shared pieces (Nagelkerke<->Cox-Snell, the binary/survival shrinkage &
// optimism solvers, take-the-max, C->R²cs) live here.
import type { Criterion } from "./types";
import { assertBelowShrinkage, assertProportion } from "./validate";

/**
 * Round to 2 dp the way the package reports EPP/SPP. R's round() uses
 * round-half-to-even (IEC 60559), so we match it: half-cents go to the even
 * neighbour rather than always up, keeping the displayed EPP faithful to
 * pmsampsize on exact half-boundaries (e.g. 25.485 -> 25.48, not 25.49).
 */
export function round2(x: number): number {
  const scaled = x * 100;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  let rounded: number;
  if (Math.abs(frac - 0.5) < 1e-9) {
    rounded = floor % 2 === 0 ? floor : floor + 1;
  } else {
    rounded = Math.round(scaled);
  }
  return rounded / 100;
}

/**
 * Maximum achievable Cox-Snell R² for a binary outcome of proportion φ:
 *   max = 1 − (φ^φ · (1−φ)^(1−φ))²   (Riley 2019 suppl., eq. for max R²cs).
 * Computed via the log form for numerical fidelity to pmsampsize.
 */
export function maxR2csBinary(phi: number): number {
  assertProportion(phi, "outcome proportion φ");
  const lnLnullPerN = phi * Math.log(phi) + (1 - phi) * Math.log(1 - phi);
  return 1 - Math.exp(2 * lnLnullPerN);
}

export function nagelkerkeToR2cs(nagelkerke: number, maxR2cs: number): number {
  return nagelkerke * maxR2cs;
}

export function r2csToNagelkerke(r2cs: number, maxR2cs: number): number {
  return r2cs / maxR2cs;
}

/**
 * Required N for the shrinkage criterion (binary B3 / survival T2):
 *   n = ceil( P / ((S − 1)·ln(1 − R²cs/S)) ),   S = shrinkage target (0.9).
 * Guards the ln(0)/ln(<0) trap (R²cs must be < S).
 */
export function nFromShrinkage(P: number, r2cs: number, S: number): number {
  assertBelowShrinkage(r2cs, S);
  return Math.ceil(P / ((S - 1) * Math.log(1 - r2cs / S)));
}

/**
 * Required N for the optimism criterion (binary B4 / survival T3): the shrinkage
 * needed so apparent and adjusted Nagelkerke R² differ by <= 0.05.
 *   S₄ = R²cs / (R²cs + 0.05·max(R²cs));  n = ceil( P/((S₄−1)·ln(1−R²cs/S₄)) ).
 */
export function nFromOptimism(P: number, r2cs: number, maxR2cs: number): number {
  const s4 = r2cs / (r2cs + 0.05 * maxR2cs);
  return Math.ceil(P / ((s4 - 1) * Math.log(1 - r2cs / s4)));
}

/**
 * Required N for the small-MAPE criterion (binary B2), van Smeden 2019 / Riley
 * 2020 Fig 2. PORTED (not in pmsampsize) and applicable only for P <= 30 — caller
 * returns N/A otherwise. Targets MAPE 0.05. Validated: P=10,φ=0.3→461; P=30,φ=0.05→544.
 */
export function nFromMape(P: number, phi: number): number {
  const num =
    -0.508 + 0.259 * Math.log(phi) + 0.504 * Math.log(P) - Math.log(0.05);
  return Math.ceil(Math.exp(num / 0.544));
}

/**
 * Take-the-max over the criteria, ignoring N/A (null) criteria so a dropped
 * criterion never poisons the result with NaN. Returns the largest N and the id
 * of the (first) criterion attaining it.
 */
export function takeMax(criteria: readonly Criterion[]): {
  n: number;
  bindingId: string;
} {
  let best = -Infinity;
  let bindingId = "";
  for (const c of criteria) {
    if (c.n !== null && c.n > best) {
      best = c.n;
      bindingId = c.id;
    }
  }
  if (!Number.isFinite(best)) {
    throw new Error("takeMax: no defined criterion to take the maximum of");
  }
  return { n: best, bindingId };
}

// --- C-statistic -> Cox-Snell R² (disclosed approximation) ------------------
// pmsampsize's cstat2rsq() is a SEEDED Monte-Carlo: it draws a linear predictor
// under a two-normal model separated by mu = √2·Φ⁻¹(C), fits logistic
// regression, and reads the Cox-Snell R². We reproduce the SAME population model
// deterministically (fixed Gauss grid + IRLS, no RNG) — the noise-free limit of
// that simulation. It is disclosed in-app as an approximation.

function invNormCdf(p: number): number {
  // Acklam's rational approximation to the standard normal quantile.
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const pl = 0.02425;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p > 1 - pl) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

function sigmoid(x: number): number {
  return x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x));
}

/**
 * Approximate Cox-Snell R² implied by a C-statistic at outcome proportion φ.
 * Deterministic reproduction of pmsampsize's generative model. DISCLOSED AS AN
 * APPROXIMATION (the package's value is a seeded simulation of the same model).
 */
export function cToR2cs(cstat: number, phi: number): number {
  if (!Number.isFinite(cstat) || cstat <= 0.5 || cstat >= 1) {
    throw new Error(`C-statistic must be in (0.5, 1), got ${cstat}`);
  }
  assertProportion(phi, "outcome proportion φ");
  const mu = Math.SQRT2 * invNormCdf(cstat);

  // Fixed standard-normal grid (deterministic quadrature), shared by both
  // classes; class 1 is shifted by mu. Mirrors cstat2rsq's class assignment:
  // y=0 carries weight φ with LP~N(0,1); y=1 carries weight (1−φ) with LP~N(mu,1).
  const H = 0.02;
  const ZMAX = 8;
  const z: number[] = [];
  const w: number[] = [];
  let wsum = 0;
  for (let t = -ZMAX; t <= ZMAX + 1e-9; t += H) {
    const dens = Math.exp(-0.5 * t * t);
    z.push(t);
    w.push(dens);
    wsum += dens;
  }
  for (let i = 0; i < w.length; i++) w[i] /= wsum; // normalise per class

  // IRLS / Newton for β0, β1 over the two weighted classes.
  let b0 = 0;
  let b1 = 1;
  const prior1 = 1 - phi; // weight of the y=1 class
  const prior0 = phi;
  for (let iter = 0; iter < 50; iter++) {
    let g0 = 0;
    let g1 = 0;
    let h00 = 0;
    let h01 = 0;
    let h11 = 0;
    for (let i = 0; i < z.length; i++) {
      // y = 1 class: LP = z + mu
      const lp1 = z[i] + mu;
      const p1 = sigmoid(b0 + b1 * lp1);
      const wt1 = prior1 * w[i];
      g0 += wt1 * (1 - p1);
      g1 += wt1 * (1 - p1) * lp1;
      const v1 = wt1 * p1 * (1 - p1);
      h00 += v1;
      h01 += v1 * lp1;
      h11 += v1 * lp1 * lp1;
      // y = 0 class: LP = z
      const lp0 = z[i];
      const p0 = sigmoid(b0 + b1 * lp0);
      const wt0 = prior0 * w[i];
      g0 += wt0 * (0 - p0);
      g1 += wt0 * (0 - p0) * lp0;
      const v0 = wt0 * p0 * (1 - p0);
      h00 += v0;
      h01 += v0 * lp0;
      h11 += v0 * lp0 * lp0;
    }
    const det = h00 * h11 - h01 * h01;
    if (Math.abs(det) < 1e-12) break;
    const d0 = (h11 * g0 - h01 * g1) / det;
    const d1 = (h00 * g1 - h01 * g0) / det;
    b0 += d0;
    b1 += d1;
    if (Math.abs(d0) < 1e-9 && Math.abs(d1) < 1e-9) break;
  }

  // Average log-likelihoods -> Cox-Snell R².
  let avgLL = 0;
  for (let i = 0; i < z.length; i++) {
    const lp1 = z[i] + mu;
    avgLL += prior1 * w[i] * Math.log(sigmoid(b0 + b1 * lp1));
    const lp0 = z[i];
    avgLL += prior0 * w[i] * Math.log(1 - sigmoid(b0 + b1 * lp0));
  }
  const pbar = 1 - phi;
  const avgLL0 = pbar * Math.log(pbar) + (1 - pbar) * Math.log(1 - pbar);
  return 1 - Math.exp(-2 * (avgLL - avgLL0));
}
