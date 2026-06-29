import { describe, it, expect } from "vitest";
import { barGeometry, axisTicks, type ChartDims, type BarInput } from "./geometry";

const dims: ChartDims = {
  width: 480,
  height: 300,
  margin: { top: 20, right: 16, bottom: 60, left: 56 },
};
// innerWidth = 480-56-16 = 408 ; innerHeight = 300-20-60 = 220

const data: BarInput[] = [
  { id: "B1", label: "Risk", n: 73, binding: false },
  { id: "B2", label: "MAPE", n: null, binding: false }, // N/A
  { id: "B3", label: "Shrinkage", n: 5249, binding: true },
  { id: "B4", label: "Optimism", n: 1770, binding: false },
];

describe("barGeometry", () => {
  const g = barGeometry(data, dims);

  it("scales the tallest (binding) bar to near the full inner height", () => {
    expect(g.innerWidth).toBe(408);
    expect(g.innerHeight).toBe(220);
    expect(g.maxN).toBe(5249);
    const b3 = g.bars.find((b) => b.id === "B3")!;
    // With 12% headroom, the max bar fills 1/1.12 ≈ 0.893 of the height.
    expect(b3.height).toBeGreaterThan(0.85 * 220);
    expect(b3.height).toBeLessThan(220);
    expect(b3.binding).toBe(true);
  });

  it("gives an N/A criterion a zero-height stub at the baseline, not NaN", () => {
    const b2 = g.bars.find((b) => b.id === "B2")!;
    expect(b2.na).toBe(true);
    expect(b2.height).toBe(0);
    expect(Number.isNaN(b2.y)).toBe(false);
    expect(b2.y).toBe(b2.baseline);
  });

  it("orders bars left-to-right within the inner width with positive widths", () => {
    const xs = g.bars.map((b) => b.x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
    g.bars.forEach((b) => {
      expect(b.width).toBeGreaterThan(0);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(g.innerWidth + 1e-6);
    });
  });

  it("relative bar heights track the relative Ns", () => {
    const h = (id: string) => g.bars.find((b) => b.id === id)!.height;
    expect(h("B3")).toBeGreaterThan(h("B4"));
    expect(h("B4")).toBeGreaterThan(h("B1"));
    expect(h("B1")).toBeGreaterThan(h("B2"));
  });

  it("never emits NaN geometry", () => {
    g.bars.forEach((b) => {
      [b.x, b.y, b.width, b.height].forEach((v) => expect(Number.isNaN(v)).toBe(false));
    });
  });
});

describe("axisTicks", () => {
  it("returns ascending values paired with in-range pixel positions", () => {
    const g = barGeometry(data, dims);
    const ticks = axisTicks(g.y, 5);
    expect(ticks.length).toBeGreaterThan(0);
    const values = ticks.map((t) => t.value);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
    ticks.forEach((t) => {
      expect(t.pos).toBeGreaterThanOrEqual(-1e-6);
      expect(t.pos).toBeLessThanOrEqual(g.innerHeight + 1e-6);
    });
  });
});
