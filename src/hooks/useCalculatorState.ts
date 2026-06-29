import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { OutcomeType } from "../engine";

// Calculator state lives in the URL so a configured scenario is a shareable deep
// link. Performance can be entered as an anticipated R²cs (R² for continuous) or
// a C-statistic (binary/survival), with live conversion. Shrinkage S=0.9 and the
// precision margin δ=0.05 are fixed (as in pmsampsize and the paper) to keep the
// learner focused on the inputs that actually move the answer.

export type PerfMode = "r2" | "c";

export interface CalcState {
  type: OutcomeType;
  /** Candidate predictor parameters P. */
  p: number;
  /** Performance entry mode. */
  mode: PerfMode;
  /** Anticipated R²cs (binary/survival) or R² (continuous). */
  r2: number;
  /** Anticipated C-statistic (when mode === "c"). */
  c: number;
  /** Binary: outcome proportion φ. */
  phi: number;
  /** Survival: event rate per person-year, key timepoint (yrs), mean follow-up (yrs). */
  rate: number;
  timepoint: number;
  meanfup: number;
  /** Continuous: outcome mean (intercept) and SD. */
  intercept: number;
  sd: number;
}

export const DEFAULTS: CalcState = {
  type: "binary",
  p: 30,
  mode: "r2",
  r2: 0.05,
  c: 0.75,
  phi: 0.05,
  rate: 0.065,
  timepoint: 2,
  meanfup: 2.07,
  intercept: 26.7,
  sd: 8.7,
};

const num = (v: string | null, fallback: number): number => {
  if (v === null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const isType = (v: string | null): v is OutcomeType =>
  v === "binary" || v === "continuous" || v === "survival";

const tidy = (x: number): string => String(Math.round(x * 1e6) / 1e6);

export function useCalculatorState() {
  const [params, setParams] = useSearchParams();

  const state: CalcState = {
    type: isType(params.get("type")) ? (params.get("type") as OutcomeType) : DEFAULTS.type,
    p: num(params.get("p"), DEFAULTS.p),
    mode: params.get("mode") === "c" ? "c" : "r2",
    r2: num(params.get("r2"), DEFAULTS.r2),
    c: num(params.get("c"), DEFAULTS.c),
    phi: num(params.get("phi"), DEFAULTS.phi),
    rate: num(params.get("rate"), DEFAULTS.rate),
    timepoint: num(params.get("tp"), DEFAULTS.timepoint),
    meanfup: num(params.get("fup"), DEFAULTS.meanfup),
    intercept: num(params.get("icpt"), DEFAULTS.intercept),
    sd: num(params.get("sd"), DEFAULTS.sd),
  };

  const patch = useCallback(
    (next: Partial<CalcState>) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          const merged = { ...state, ...next };
          // Always-present keys.
          p.set("type", merged.type);
          p.set("p", tidy(merged.p));
          p.set("mode", merged.mode);
          if (merged.mode === "c") p.set("c", tidy(merged.c));
          else p.set("r2", tidy(merged.r2));
          // Type-specific keys (kept minimal for tidy shareable URLs).
          p.delete("phi");
          p.delete("rate");
          p.delete("tp");
          p.delete("fup");
          p.delete("icpt");
          p.delete("sd");
          if (merged.type === "binary") {
            p.set("phi", tidy(merged.phi));
          } else if (merged.type === "survival") {
            p.set("phi", tidy(merged.phi));
            p.set("rate", tidy(merged.rate));
            p.set("tp", tidy(merged.timepoint));
            p.set("fup", tidy(merged.meanfup));
          } else {
            p.set("icpt", tidy(merged.intercept));
            p.set("sd", tidy(merged.sd));
          }
          return p;
        },
        { replace: true },
      );
    },
    [setParams, state],
  );

  return { state, patch };
}
