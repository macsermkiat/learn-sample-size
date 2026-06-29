import type { Criterion, SampleSizeResult } from "./types";
import {
  assertParameters,
  assertPositive,
  assertShrinkage,
  assertBelowMax,
} from "./validate";
import { nFromShrinkage, nFromOptimism, round2 } from "./shared";

export interface SurvivalInput {
  /** Candidate predictor parameters P. */
  parameters: number;
  /** Anticipated Cox-Snell R² (already converted if entered as a C-statistic). */
  r2cs: number;
  /** Overall event rate per person-year. */
  rate: number;
  /** Key timepoint (in the same time units as mean follow-up). */
  timepoint: number;
  /** Mean follow-up time. */
  meanfup: number;
  /** Uniform shrinkage target S (default 0.9). */
  shrinkage?: number;
}

const N_REF = 10_000; // pmsampsize's reference N for the survival max(R²cs).

/** max(Cox-Snell R²) for a survival outcome (pmsampsize_surv: events at N=10000). */
export function maxR2csSurvival(rate: number, meanfup: number): number {
  // Mirror pmsampsize's multiplication ORDER exactly: it forms (meanfup·n) first,
  // then rate·that. Order matters in IEEE-754 — e.g. 0.05·(3·10000)=1500 exactly,
  // whereas (0.05·3)·10000 = 1500.0000000002 would ceil to 1501.
  const totPersonYears = meanfup * N_REF;
  const events = Math.ceil(rate * totPersonYears);
  const lnLnull = events * Math.log(events / N_REF) - events;
  return 1 - Math.exp((2 * lnLnull) / N_REF);
}

/**
 * Sample size to develop a TIME-TO-EVENT prediction model (Riley 2020, Box 1
 * T1–T3). Ports pmsampsize 1.1.3 exactly. EPP is type-specific: expected events
 * = n·rate·mean-follow-up (NOT n·rate). In v1.1.3 the risk-precision criterion
 * (T1) does NOT iterate — it reports the precision achieved at max(T2, T3) — so
 * the final N is max(shrinkage, optimism).
 */
export function survivalSampleSize(input: SurvivalInput): SampleSizeResult {
  const { parameters: P, r2cs, rate, timepoint, meanfup } = input;
  const S = input.shrinkage ?? 0.9;
  assertParameters(P);
  assertPositive(rate, "event rate");
  assertPositive(timepoint, "timepoint");
  assertPositive(meanfup, "mean follow-up");
  assertShrinkage(S);
  if (!Number.isFinite(r2cs) || r2cs <= 0) {
    throw new Error(`anticipated R²cs must be a finite number > 0, got ${r2cs}`);
  }

  const maxR2cs = maxR2csSurvival(rate, meanfup);
  assertBelowMax(r2cs, maxR2cs);

  const nShrink = nFromShrinkage(P, r2cs, S); // T2
  const nOptim = nFromOptimism(P, r2cs, maxR2cs); // T3
  const nRisk = Math.max(nShrink, nOptim); // T1 (no independent iteration in v1.1.3)

  const criteria: Criterion[] = [
    {
      id: "T1",
      label: "Precise risk at the timepoint",
      n: nRisk,
      note:
        "In pmsampsize 1.1.3 this criterion reports the precision achieved at " +
        "max(shrinkage, optimism) rather than independently increasing N.",
    },
    { id: "T2", label: "Required shrinkage", n: nShrink },
    { id: "T3", label: "Small optimism", n: nOptim },
  ];

  const n = Math.max(nShrink, nOptim, nRisk);
  // Substantive binding driver is the larger of shrinkage / optimism (T1 only
  // mirrors their max in v1.1.3).
  const bindingId = nShrink >= nOptim ? "T2" : "T3";
  const events = Math.ceil(n * rate * meanfup);

  return {
    type: "survival",
    criteria,
    n,
    bindingId,
    events,
    ratio: round2((n * rate * meanfup) / P),
    ratioLabel: "EPP",
    maxR2cs,
    nagelkerke: r2cs / maxR2cs,
  };
}
