import { describe, it, expect } from "vitest";
import fixtureDoc from "../data/pmsampsize-fixtures.json";
import { binarySampleSize } from "./binary";
import { round2 } from "./shared";

// The committed gold-standard battery from the authors' pmsampsize package (see
// docs/provenance.md for versions). Hermetic: no R toolchain at test time. The
// engine must reproduce the package's per-criterion Ns and final N exactly.
//
// pmsampsize does NOT compute the MAPE criterion (B2), so the package's "final
// N" is max(shrinkage, optimism, risk). We verify the engine reproduces those
// three criteria and that their max equals the package's final N. The engine's
// own take-the-max additionally includes B2, which is checked in binary.test.ts.

interface Fixture {
  label: string;
  type: "binary" | "continuous" | "survival";
  inputs: Record<string, number>;
  criteriaN: number[];
  shrinkage: number[];
  finalN: number;
  maxR2cs?: number;
  nagR2?: number;
  eventsDisplay?: number;
  epp?: number;
  spp?: number;
}

const fixtures = (fixtureDoc as unknown as { fixtures: Fixture[] }).fixtures;
const binary = fixtures.filter((f) => f.type === "binary");

describe(`pmsampsize parity — binary (${binary.length} scenarios)`, () => {
  it("has a non-trivial battery including the published examples", () => {
    expect(binary.length).toBeGreaterThan(20);
    expect(binary.some((f) => f.finalN === 5249)).toBe(true);
    expect(binary.some((f) => f.finalN === 3500)).toBe(true);
  });

  for (const f of binary) {
    it(`${f.label}`, () => {
      const r = binarySampleSize({
        parameters: f.inputs.parameters,
        r2cs: f.inputs.csrsquared,
        prevalence: f.inputs.prevalence,
        shrinkage: f.inputs.shrinkage,
      });
      const n = (id: string) => r.criteria.find((c) => c.id === id)!.n;

      // Package criteria order: [shrinkage B3, optimism B4, risk-precision B1].
      expect(n("B3")).toBe(f.criteriaN[0]);
      expect(n("B4")).toBe(f.criteriaN[1]);
      expect(n("B1")).toBe(f.criteriaN[2]);

      const pmFinal = Math.max(...f.criteriaN);
      expect(pmFinal).toBe(f.finalN);

      // Type-specific events at the package's final N — exact.
      const phi = f.inputs.prevalence;
      expect(Math.ceil(pmFinal * phi)).toBe(f.eventsDisplay);

      // EPP is a 2-dp DISPLAY value. On exact half-cent boundaries the IEEE-754
      // representation of φ (e.g. 0.3) makes R's round() and JS disagree by a
      // single cent; N and events above are exact, so we assert EPP to within
      // one cent rather than chase a float-boundary rounding artifact.
      const eppCentDiff = Math.round(Math.abs(round2((pmFinal * phi) / f.inputs.parameters) - f.epp!) * 100);
      expect(eppCentDiff).toBeLessThanOrEqual(1);

      expect(r.maxR2cs!).toBeCloseTo(f.maxR2cs!, 3);
    });
  }
});
