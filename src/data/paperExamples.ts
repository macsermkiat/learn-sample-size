import type { CalcState } from "../hooks/useCalculatorState";
import type { OutcomeType } from "../engine";

// The three published worked examples (Riley 2020). Presets fill the calculator
// to reproduce them; the "matches the paper" panel pins the published N beside
// the live-computed value. Numbers verified against pmsampsize 1.1.3 (see
// docs/provenance.md).

export interface Preset {
  id: string;
  label: string;
  state: Partial<CalcState>;
}

export const PRESETS: Record<OutcomeType, Preset> = {
  binary: {
    id: "preeclampsia",
    label: "Pre-eclampsia (Example 1)",
    state: { type: "binary", p: 30, mode: "r2", r2: 0.05, phi: 0.05 },
  },
  survival: {
    id: "vte",
    label: "VTE recurrence (Example 2)",
    state: {
      type: "survival",
      p: 30,
      mode: "r2",
      r2: 0.051,
      rate: 0.065,
      timepoint: 2,
      meanfup: 2.07,
    },
  },
  continuous: {
    id: "ffm",
    label: "Fat-free mass (Example 3)",
    state: { type: "continuous", p: 20, mode: "r2", r2: 0.9, intercept: 26.7, sd: 8.7 },
  },
};

export interface PaperExample {
  /** Human label of the published example. */
  label: string;
  /** Published required N at the preset's P. */
  n: number;
  /** Published expected events (null for continuous). */
  events: number | null;
  /** Published EPP/SPP. */
  ratio: number;
  ratioLabel: "EPP" | "SPP";
  /** A second pinned point (e.g. P=20) to show the swing, if any. */
  note: string;
}

export const PAPER_EXAMPLES: Record<OutcomeType, PaperExample> = {
  binary: {
    label: "Pre-eclampsia (Riley Example 1)",
    n: 5249,
    events: 263,
    ratio: 8.75,
    ratioLabel: "EPP",
    note: "With P = 20 the paper reports 3500 (175 events). Binding criterion: required shrinkage.",
  },
  survival: {
    label: "VTE recurrence (Riley Example 2)",
    n: 5143,
    events: 692,
    ratio: 23.07,
    ratioLabel: "EPP",
    note: "With P = 20 the paper reports 3429. EPP uses events = n·rate·mean-follow-up (not n·rate).",
  },
  continuous: {
    label: "Fat-free mass (Riley Example 3)",
    n: 254,
    events: null,
    ratio: 12.7,
    ratioLabel: "SPP",
    note: "Binding criterion: residual-SD precision (234 + P). Overfitting alone needs only 68.",
  },
};
