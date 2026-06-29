import { describe, it, expect } from "vitest";
import { survivalSampleSize, maxR2csSurvival } from "./survival";

const crit = (r: ReturnType<typeof survivalSampleSize>, id: string) =>
  r.criteria.find((c) => c.id === id)!.n;

describe("survival worked example 2 — VTE recurrence", () => {
  const vte = (p: number) =>
    survivalSampleSize({ parameters: p, r2cs: 0.051, rate: 0.065, timepoint: 2, meanfup: 2.07 });

  it("P=30: N=5143, 692 events, EPP 23.07 (events = n·rate·mean-follow-up)", () => {
    const r = vte(30);
    expect(r.n).toBe(5143);
    expect(r.events).toBe(692);
    expect(r.ratio).toBeCloseTo(23.07, 2);
  });

  it("EPP is type-specific: n·rate·mean-follow-up, NOT n·rate (which gives a wrong 11.1)", () => {
    const r = vte(30);
    const wrong = (r.n * 0.065) / 30; // the n·rate/P mistake
    expect(wrong).toBeCloseTo(11.14, 1);
    expect(r.ratio).not.toBeCloseTo(11.14, 1);
    expect(r.ratio).toBeCloseTo((r.n * 0.065 * 2.07) / 30, 1);
  });

  it("P=20: N drops to 3429", () => {
    expect(vte(20).n).toBe(3429);
  });
});

describe("max(R²cs) for survival depends on rate·mean-follow-up", () => {
  it("VTE setting (rate 0.065, mean-fup 2.07) gives max ≈ 0.555", () => {
    expect(maxR2csSurvival(0.065, 2.07)).toBeCloseTo(0.555, 3);
  });
});

describe("survival degenerate input fails loud", () => {
  it("non-positive rate / timepoint / mean-follow-up throw", () => {
    expect(() => survivalSampleSize({ parameters: 20, r2cs: 0.05, rate: 0, timepoint: 2, meanfup: 2 })).toThrow();
    expect(() => survivalSampleSize({ parameters: 20, r2cs: 0.05, rate: 0.05, timepoint: 0, meanfup: 2 })).toThrow();
    expect(() => survivalSampleSize({ parameters: 20, r2cs: 0.05, rate: 0.05, timepoint: 2, meanfup: -1 })).toThrow();
  });
  it("R²cs at/above max(R²cs) throws (no silent NaN)", () => {
    expect(() => survivalSampleSize({ parameters: 20, r2cs: 0.9, rate: 0.065, timepoint: 2, meanfup: 2.07 })).toThrow();
  });
});

describe("survival criterion 3 (T1) does not independently bind in v1.1.3", () => {
  it("reports max(shrinkage, optimism); the substantive binder is T2 here", () => {
    const r = survivalSampleSize({ parameters: 30, r2cs: 0.051, rate: 0.065, timepoint: 2, meanfup: 2.07 });
    expect(crit(r, "T1")).toBe(Math.max(crit(r, "T2")!, crit(r, "T3")!));
    expect(r.bindingId).toBe("T2");
  });
});
