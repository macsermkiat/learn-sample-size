import type { Criterion, SampleSizeResult } from "./types";
import { assertParameters, assertR2, assertPositive } from "./validate";
import { round2 } from "./shared";
import { tQuantile } from "./tdist";

export interface ContinuousInput {
  /** Candidate predictor parameters P. */
  parameters: number;
  /** Anticipated R² (ordinary; max(R²cs) = 1 for continuous, R² is direct). */
  r2: number;
  /** Outcome mean (model intercept). */
  intercept: number;
  /** Outcome standard deviation. */
  sd: number;
  /** Uniform shrinkage target S (default 0.9). */
  shrinkage?: number;
  /** Multiplicative margin of error for intercept/residual-SD (default 1.1). */
  mmoe?: number;
}

const MAX_ITER = 5_000_000;

/** Expected uniform shrinkage at sample size n (Riley 2019 Part I, continuous). */
function expectedShrinkage(n: number, P: number, r2: number): number {
  return 1 + (P - 2) / (n * Math.log(1 - (r2 * (n - P - 1) + P) / (n - 1)));
}

/**
 * Sample size to develop a CONTINUOUS-outcome prediction model (Riley 2020,
 * Box 1 C1–C4). Ports pmsampsize's exact closed forms. Continuous shrinkage is a
 * DIFFERENT solver from the binary/survival one (the binary form is undefined at
 * Example 3, R²=0.9, S=0.9). No "events": reports N and subjects-per-parameter.
 */
export function continuousSampleSize(input: ContinuousInput): SampleSizeResult {
  const { parameters: P, r2, intercept, sd } = input;
  const S = input.shrinkage ?? 0.9;
  const mmoe = input.mmoe ?? 1.1;
  assertParameters(P);
  assertR2(r2, "anticipated R²");
  assertPositive(sd, "outcome SD");
  assertPositive(intercept, "outcome mean (intercept)");

  // C3 — shrinkage: smallest n (from P+2 up) whose expected shrinkage reaches S.
  let nShrink = P + 2;
  let es = expectedShrinkage(nShrink, P, r2);
  if (!(es > S)) {
    let guard = 0;
    while (!(Number.isFinite(es) && es >= S)) {
      nShrink += 1;
      es = expectedShrinkage(nShrink, P, r2);
      if (++guard > MAX_ITER) break;
    }
  }

  // C4 — optimism: small difference (<=0.05) between apparent and adjusted R².
  const nOptim = Math.ceil(1 + (P * (1 - r2)) / 0.05);

  // C2 — residual-SD precision: 234 + P (MMOE <= 1.1 in the residual SD).
  const nResid = 234 + P;

  // C1 — intercept precision: from the running max, grow until MMOE(intercept)
  // <= mmoe. Mirrors pmsampsize exactly (including its sign handling).
  let nIntercept = Math.max(nShrink, nOptim, nResid);
  const se = (n: number) => Math.sqrt((sd * sd * (1 - r2)) / n);
  // Initial: uci uses -qt(0.025,df) = +|t| (upper bound above the mean).
  let intMmoe =
    (intercept + se(nIntercept) * -tQuantile(0.025, nIntercept - P - 1)) / intercept;
  if (intMmoe > mmoe) {
    let guard = 0;
    while (intMmoe > mmoe) {
      nIntercept += 1;
      // pmsampsize flips the sign inside the loop; replicate for parity.
      const uci = intercept + se(nIntercept) * tQuantile(0.025, nIntercept - P - 1);
      intMmoe = uci / intercept;
      if (++guard > MAX_ITER) break;
    }
  }

  // Display order C1–C4 (Box 1). Final N = the largest (take the max). The
  // intercept solver starts at max(others), so the package's final N = C1.
  const criteria: Criterion[] = [
    { id: "C1", label: "Intercept precision", n: nIntercept },
    { id: "C2", label: "Residual-SD precision", n: nResid },
    { id: "C3", label: "Required shrinkage", n: nShrink },
    { id: "C4", label: "Small optimism", n: nOptim },
  ];

  const n = Math.max(nIntercept, nResid, nShrink, nOptim);
  // Binding attribution: if the intercept genuinely needed more than the others
  // it binds; otherwise the substantive driver among C2/C3/C4 binds (this is the
  // residual-SD precision in Example 3, per the paper, not C1).
  const othersMax = Math.max(nResid, nShrink, nOptim);
  let bindingId: string;
  if (nIntercept > othersMax) {
    bindingId = "C1";
  } else if (othersMax === nResid) {
    bindingId = "C2";
  } else if (othersMax === nShrink) {
    bindingId = "C3";
  } else {
    bindingId = "C4";
  }

  return {
    type: "continuous",
    criteria,
    n,
    bindingId,
    events: null,
    ratio: round2(n / P),
    ratioLabel: "SPP",
    maxR2cs: null,
    nagelkerke: null,
  };
}
