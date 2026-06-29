import { describe, it, expect } from "vitest";
import { binarySampleSize } from "./binary";
import { maxR2csBinary, cToR2cs } from "./shared";

const crit = (r: ReturnType<typeof binarySampleSize>, id: string) =>
  r.criteria.find((c) => c.id === id)!.n;

// Hand-computed fixtures, independent of the package. Each encodes WHY the value
// matters (faithfulness to Riley 2020 / pmsampsize), not merely WHAT it returns.
describe("binary B1 — precise overall risk: n = (1.96/0.05)²·φ(1−φ)", () => {
  it("reproduces the paper's table 385 / 246 / 139 at φ = 0.5 / 0.2 / 0.1", () => {
    // B1 does not depend on R²cs, so any valid R²cs gives the same B1.
    expect(crit(binarySampleSize({ parameters: 10, r2cs: 0.1, prevalence: 0.5 }), "B1")).toBe(385);
    expect(crit(binarySampleSize({ parameters: 10, r2cs: 0.1, prevalence: 0.2 }), "B1")).toBe(246);
    expect(crit(binarySampleSize({ parameters: 10, r2cs: 0.1, prevalence: 0.1 }), "B1")).toBe(139);
  });
});

describe("max(R²cs) binary = 1 − (φ^φ·(1−φ)^(1−φ))²", () => {
  it("reproduces the reference table to 2 dp", () => {
    const table: [number, number][] = [
      [0.5, 0.75], [0.4, 0.74], [0.3, 0.71], [0.2, 0.63],
      [0.1, 0.48], [0.05, 0.33], [0.01, 0.11],
    ];
    for (const [phi, want] of table) {
      expect(maxR2csBinary(phi)).toBeCloseTo(want, 2);
    }
  });
});

describe("binary worked example 1 — pre-eclampsia (the hero preset)", () => {
  it("P=30: N=5249, binding B3 shrinkage, 263 events, EPP 8.75", () => {
    const r = binarySampleSize({ parameters: 30, r2cs: 0.05, prevalence: 0.05 });
    expect(crit(r, "B3")).toBe(5249); // shrinkage drives the answer
    expect(r.n).toBe(5249);
    expect(r.bindingId).toBe("B3");
    expect(r.events).toBe(263);
    expect(r.ratio).toBeCloseTo(8.75, 2);
    // The whole teaching point: shrinkage binds, MAPE alone needs only 544.
    expect(crit(r, "B2")).toBe(544);
    expect(crit(r, "B2")! < r.n).toBe(true);
  });

  it("P=20: N drops to 3500 with 175 events, EPP still 8.75", () => {
    const r = binarySampleSize({ parameters: 20, r2cs: 0.05, prevalence: 0.05 });
    expect(r.n).toBe(3500);
    expect(r.events).toBe(175);
    expect(r.ratio).toBeCloseTo(8.75, 2);
  });
});

describe("binary B2 — small MAPE (van Smeden, ported)", () => {
  it("reproduces both pinned anchors: P=10,φ=0.3→461; P=30,φ=0.05→544", () => {
    expect(crit(binarySampleSize({ parameters: 10, r2cs: 0.1, prevalence: 0.3 }), "B2")).toBe(461);
    expect(crit(binarySampleSize({ parameters: 30, r2cs: 0.05, prevalence: 0.05 }), "B2")).toBe(544);
  });

  it("is N/A (null) when P > 30, and is then excluded from take-the-max", () => {
    const r = binarySampleSize({ parameters: 31, r2cs: 0.05, prevalence: 0.2 });
    expect(crit(r, "B2")).toBeNull();
    // A null criterion must never poison the result with NaN.
    expect(Number.isFinite(r.n)).toBe(true);
    expect(r.bindingId).not.toBe("B2");
  });
});

describe("binary EPP is type-specific (n·φ/P) and never NaN", () => {
  it("EPP = round(n·φ/P, 2); events = ceil(n·φ)", () => {
    // Shrinkage-bound. The oracle (pmsampsize) ceils the raw 1698.037 to 1699;
    // the handoff's "1698" anchor truncated instead of ceiling — the package wins.
    const r = binarySampleSize({ parameters: 20, r2cs: 0.1, prevalence: 0.3 });
    expect(r.n).toBe(1699);
    expect(r.bindingId).toBe("B3");
    expect(r.events).toBe(Math.ceil(1699 * 0.3));
    expect(r.ratio).toBeCloseTo((1699 * 0.3) / 20, 2);
  });
});

describe("binary degenerate input fails loud (no silent NaN/Infinity)", () => {
  it("φ outside (0,1) throws", () => {
    expect(() => binarySampleSize({ parameters: 10, r2cs: 0.1, prevalence: 0 })).toThrow();
    expect(() => binarySampleSize({ parameters: 10, r2cs: 0.1, prevalence: 1 })).toThrow();
  });
  it("R²cs at/above max(R²cs) throws (here max≈0.33 at φ=0.05)", () => {
    expect(() => binarySampleSize({ parameters: 10, r2cs: 0.4, prevalence: 0.05 })).toThrow();
  });
  it("P < 1 throws", () => {
    expect(() => binarySampleSize({ parameters: 0, r2cs: 0.1, prevalence: 0.2 })).toThrow();
  });
  it("non-finite R²cs and shrinkage outside (0,1) throw", () => {
    expect(() => binarySampleSize({ parameters: 10, r2cs: NaN, prevalence: 0.2 })).toThrow();
    expect(() => binarySampleSize({ parameters: 10, r2cs: 0.1, prevalence: 0.2, shrinkage: 1 })).toThrow();
  });
});

describe("C-statistic → R²cs (disclosed approximation of pmsampsize's simulation)", () => {
  it("lands within ±0.005 of the package's seeded values", () => {
    // pmsampsize cstat2rsq (seed 123456): reference values pinned in provenance.
    expect(cToR2cs(0.71, 0.05)).toBeCloseTo(0.028, 2);
    expect(cToR2cs(0.8, 0.1)).toBeCloseTo(0.111, 2);
    expect(cToR2cs(0.7, 0.3)).toBeCloseTo(0.103, 2);
    expect(cToR2cs(0.9, 0.1)).toBeCloseTo(0.216, 2);
  });
  it("rejects a C-statistic outside (0.5, 1)", () => {
    expect(() => cToR2cs(0.5, 0.1)).toThrow();
    expect(() => cToR2cs(1, 0.1)).toThrow();
  });
});
