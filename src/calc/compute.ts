import type { CalcState } from "../hooks/useCalculatorState";
import {
  binarySampleSize,
  continuousSampleSize,
  survivalSampleSize,
  cToR2cs,
  type SampleSizeResult,
} from "../engine";

// App glue between the URL-backed calculator state and the pure engine. Handles
// the C-statistic -> R²cs conversion and turns degenerate-input errors into a
// non-crashing message (the calculator shows the bound, never a NaN). The engine
// itself stays framework-agnostic; this module is the only place that knows
// about CalcState.

export interface ComputeOutput {
  result: SampleSizeResult | null;
  /** The R²cs actually used (after any C-statistic conversion), for display. */
  r2Used: number | null;
  /** A learner-facing message when the inputs are out of range. */
  error: string | null;
}

/**
 * Resolve the anticipated Cox-Snell R² for the binary tab (direct or via the
 * C-statistic approximation). The C->R²cs path is offered ONLY for binary,
 * because pmsampsize's survival entry point does not accept a C-statistic — we
 * do not invent an unfaithful conversion for survival.
 */
export function resolveBinaryR2cs(state: CalcState): number {
  if (state.mode === "c") {
    return cToR2cs(state.c, Math.min(0.999, Math.max(0.001, state.phi)));
  }
  return state.r2;
}

export function computeFromState(state: CalcState): ComputeOutput {
  try {
    if (state.type === "binary") {
      const r2 = resolveBinaryR2cs(state);
      const result = binarySampleSize({ parameters: state.p, r2cs: r2, prevalence: state.phi });
      return { result, r2Used: r2, error: null };
    }
    if (state.type === "survival") {
      const result = survivalSampleSize({
        parameters: state.p,
        r2cs: state.r2,
        rate: state.rate,
        timepoint: state.timepoint,
        meanfup: state.meanfup,
      });
      return { result, r2Used: state.r2, error: null };
    }
    const result = continuousSampleSize({
      parameters: state.p,
      r2: state.r2,
      intercept: state.intercept,
      sd: state.sd,
    });
    return { result, r2Used: state.r2, error: null };
  } catch (e) {
    return {
      result: null,
      r2Used: null,
      error: e instanceof Error ? e.message : "Inputs are out of the valid range.",
    };
  }
}
