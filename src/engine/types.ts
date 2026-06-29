// Engine domain types. The engine is pure TS: numbers in, numbers out. No React,
// no DOM. A separate geometry layer turns these numbers into SVG paths.

export type OutcomeType = "binary" | "continuous" | "survival";

/** One Box-1 criterion's required sample size. */
export interface Criterion {
  /** Box-1 identifier, e.g. "B1", "B3", "C2", "T2". */
  id: string;
  /** Short learner-facing label, e.g. "Required shrinkage". */
  label: string;
  /**
   * Required N for this criterion. `null` when the criterion is N/A for these
   * inputs (e.g. MAPE/B2 when P > 30); an N/A criterion is excluded from the
   * take-the-max and rendered as "n/a", never as NaN.
   */
  n: number | null;
  /**
   * Disclosed at the moment this criterion binds: set when the formula is
   * ported/approximate/externally sourced (B2 MAPE via van Smeden's BeyondEPV).
   */
  note?: string;
}

/** What the per-parameter ratio means for an outcome type. */
export type RatioLabel = "EPP" | "SPP";

export interface SampleSizeResult {
  type: OutcomeType;
  /** All Box-1 criteria for this outcome type, in display order. */
  criteria: readonly Criterion[];
  /** Final required N = the largest N across the defined criteria. */
  n: number;
  /** The id of the binding criterion (the one whose N equals the final N). */
  bindingId: string;
  /** Expected events at the final N (display rounding); null for continuous. */
  events: number | null;
  /** Events-per-parameter (binary/survival) or subjects-per-parameter (continuous). */
  ratio: number;
  ratioLabel: RatioLabel;
  /** max(Cox-Snell R²); null for continuous (where it is 1 and R² is direct). */
  maxR2cs: number | null;
  /** Implied Nagelkerke R²; null for continuous. */
  nagelkerke: number | null;
}
