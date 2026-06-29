import { describe, it, expect } from "vitest";
import { continuousSampleSize } from "./continuous";

const crit = (r: ReturnType<typeof continuousSampleSize>, id: string) =>
  r.criteria.find((c) => c.id === id)!.n;

describe("continuous worked example 3 — fat-free mass", () => {
  const r = continuousSampleSize({ parameters: 20, r2: 0.9, intercept: 26.7, sd: 8.7 });

  it("N=254, SPP 12.7, binding = residual-SD precision (C2 = 234 + P)", () => {
    expect(r.n).toBe(254);
    expect(r.ratio).toBeCloseTo(12.7, 2);
    expect(r.bindingId).toBe("C2");
    expect(crit(r, "C2")).toBe(254);
  });

  it("overfitting alone needs only 68 (shrinkage) / 41 (optimism) — far below 254", () => {
    expect(crit(r, "C3")).toBe(68); // shrinkage
    expect(crit(r, "C4")).toBe(41); // optimism
  });

  it("reports no events and no max(R²cs) (continuous enters R² directly)", () => {
    expect(r.events).toBeNull();
    expect(r.maxR2cs).toBeNull();
    expect(r.ratioLabel).toBe("SPP");
  });
});

describe("continuous residual-SD precision is always 234 + P", () => {
  it("matches across P", () => {
    expect(crit(continuousSampleSize({ parameters: 10, r2: 0.5, intercept: 20, sd: 5 }), "C2")).toBe(244);
    expect(crit(continuousSampleSize({ parameters: 30, r2: 0.5, intercept: 20, sd: 5 }), "C2")).toBe(264);
  });
});

describe("continuous degenerate input fails loud", () => {
  it("R² outside (0,1) throws (the binary shrinkage form's ln(0) trap does NOT apply here)", () => {
    expect(() => continuousSampleSize({ parameters: 20, r2: 1, intercept: 26.7, sd: 8.7 })).toThrow();
    expect(() => continuousSampleSize({ parameters: 20, r2: 0, intercept: 26.7, sd: 8.7 })).toThrow();
  });
  it("non-positive SD / intercept and P<1 throw", () => {
    expect(() => continuousSampleSize({ parameters: 20, r2: 0.5, intercept: 26.7, sd: 0 })).toThrow();
    expect(() => continuousSampleSize({ parameters: 20, r2: 0.5, intercept: 0, sd: 8.7 })).toThrow();
    expect(() => continuousSampleSize({ parameters: 0, r2: 0.5, intercept: 26.7, sd: 8.7 })).toThrow();
  });
});
