import type { Criterion, SampleSizeResult } from "./types";
import {
  assertParameters,
  assertProportion,
  assertShrinkage,
  assertBelowMax,
} from "./validate";
import {
  maxR2csBinary,
  nFromShrinkage,
  nFromOptimism,
  nFromMape,
  r2csToNagelkerke,
  takeMax,
  round2,
} from "./shared";

export interface BinaryInput {
  /** Candidate predictor parameters P. */
  parameters: number;
  /** Anticipated Cox-Snell R² (already converted if entered as a C-statistic). */
  r2cs: number;
  /** Anticipated outcome proportion φ. */
  prevalence: number;
  /** Uniform shrinkage target S (default 0.9). */
  shrinkage?: number;
}

const DELTA = 0.05; // hard-coded margin of error for overall-risk precision (B1)
const MAPE_MAX_PARAMS = 30; // van Smeden formula applies for P <= 30

/**
 * Sample size to develop a binary prediction model (Riley 2020, Box 1 B1–B4).
 * Final N = the largest across the four criteria (take the max). EPP is
 * type-specific: expected events = n·φ.
 */
export function binarySampleSize(input: BinaryInput): SampleSizeResult {
  const { parameters: P, r2cs, prevalence: phi } = input;
  const S = input.shrinkage ?? 0.9;
  assertParameters(P);
  assertProportion(phi, "prevalence φ");
  assertShrinkage(S);
  if (!Number.isFinite(r2cs) || r2cs <= 0) {
    throw new Error(`anticipated R²cs must be a finite number > 0, got ${r2cs}`);
  }

  const maxR2cs = maxR2csBinary(phi);
  assertBelowMax(r2cs, maxR2cs);

  // B1 — precise estimate of the overall outcome proportion.
  const b1 = Math.ceil((1.96 / DELTA) ** 2 * phi * (1 - phi));
  // B2 — small mean absolute prediction error (ported; P <= 30 only).
  const b2 = P <= MAPE_MAX_PARAMS ? nFromMape(P, phi) : null;
  // B3 — small required shrinkage.
  const b3 = nFromShrinkage(P, r2cs, S);
  // B4 — small optimism in apparent Nagelkerke R².
  const b4 = nFromOptimism(P, r2cs, maxR2cs);

  const criteria: Criterion[] = [
    { id: "B1", label: "Precise overall risk", n: b1 },
    {
      id: "B2",
      label: "Small prediction error (MAPE)",
      n: b2,
      note:
        "Ported from van Smeden (2019) / Riley Fig 2 — not computed by " +
        "pmsampsize; applies only for 30 or fewer candidate parameters.",
    },
    { id: "B3", label: "Required shrinkage", n: b3 },
    { id: "B4", label: "Small optimism", n: b4 },
  ];

  const { n, bindingId } = takeMax(criteria);
  const events = Math.ceil(n * phi);
  const ratio = round2((n * phi) / P);

  return {
    type: "binary",
    criteria,
    n,
    bindingId,
    events,
    ratio,
    ratioLabel: "EPP",
    maxR2cs,
    nagelkerke: r2csToNagelkerke(r2cs, maxR2cs),
  };
}
