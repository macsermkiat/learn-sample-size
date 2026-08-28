import { describe, it, expect } from "vitest";
import {
  barGeometry,
  axisTicks,
  makeLinearScales,
  linePath,
  type ChartDims,
  type BarInput,
  type Pt,
} from "./geometry";

const dims: ChartDims = {
  width: 480,
  height: 300,
  margin: { top: 20, right: 16, bottom: 60, left: 56 },
};
// innerWidth = 480-56-16 = 408 ; innerHeight = 300-20-60 = 220

// Pre-eclampsia (Example 1) shape: three competing criteria, plus MAPE (B2),
// which is reported but does not compete in the take-the-max.
const data: BarInput[] = [
  { id: "B1", label: "Risk", n: 73, binding: false, inMax: true },
  { id: "B2", label: "MAPE", n: 544, binding: false, inMax: false },
  { id: "B3", label: "Shrinkage", n: 5249, binding: true, inMax: true },
  { id: "B4", label: "Optimism", n: 1770, binding: false, inMax: true },
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
    // BarInput.n is nullable (a criterion can be N/A for the given inputs), and
    // a null must never reach the scale as a NaN — the category still appears.
    const withNa = barGeometry(
      [...data, { id: "BX", label: "N/A criterion", n: null, binding: false, inMax: true }],
      dims,
    );
    const bx = withNa.bars.find((b) => b.id === "BX")!;
    expect(bx.na).toBe(true);
    expect(bx.height).toBe(0);
    expect(Number.isNaN(bx.y)).toBe(false);
    expect(bx.y).toBe(bx.baseline);
    expect(withNa.maxN).toBe(5249); // the null did not poison the scale
  });

  it("draws a non-competing criterion as a reference line, never as a bar", () => {
    // The chart's argument is "the tallest bar wins". A criterion outside the
    // maximum must not be able to out-rank the binding bar visually.
    expect(g.bars.find((b) => b.id === "B2")).toBeUndefined();
    const ref = g.references.find((r) => r.id === "B2")!;
    expect(ref.n).toBe(544);
    expect(ref.y).toBeCloseTo(g.y(544), 6);
    expect(ref.y).toBeGreaterThanOrEqual(0);
    expect(ref.y).toBeLessThanOrEqual(g.innerHeight);
  });

  it("keeps a reference line on the canvas when it exceeds every bar", () => {
    // The reported case: MAPE asks for 792 while the binding criterion needs 668.
    const overshoot: BarInput[] = [
      { id: "B1", label: "Risk", n: 217, binding: false, inMax: true },
      { id: "B2", label: "MAPE", n: 792, binding: false, inMax: false },
      { id: "B3", label: "Shrinkage", n: 625, binding: false, inMax: true },
      { id: "B4", label: "Optimism", n: 668, binding: true, inMax: true },
    ];
    const go = barGeometry(overshoot, dims);
    expect(go.maxN).toBe(792); // the scale accounts for the reference line
    const ref = go.references[0];
    expect(ref.y).toBeGreaterThanOrEqual(0);
    expect(ref.y).toBeLessThan(go.innerHeight);
    // The tallest DRAWN BAR is still the binding one.
    const tallest = go.bars.reduce((a, b) => (b.height > a.height ? b : a));
    expect(tallest.id).toBe("B4");
    expect(tallest.binding).toBe(true);
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
    expect(h("B1")).toBeGreaterThan(0);
  });

  it("never emits NaN geometry", () => {
    g.bars.forEach((b) => {
      [b.x, b.y, b.width, b.height].forEach((v) => expect(Number.isNaN(v)).toBe(false));
    });
  });
});

describe("makeLinearScales + linePath", () => {
  const s = makeLinearScales(dims, [0, 0.5], [0, 5000]);
  it("maps the x domain across the inner width and inverts y", () => {
    expect(s.x(0)).toBeCloseTo(0, 6);
    expect(s.x(0.5)).toBeCloseTo(s.innerWidth, 6);
    expect(s.y(5000)).toBeCloseTo(0, 6); // top
    expect(s.y(0)).toBeCloseTo(s.innerHeight, 6); // bottom
  });
  it("builds an SVG path that starts with a moveto and never emits NaN", () => {
    const pts: Pt[] = [
      { x: 0.05, y: 1000 },
      { x: 0.2, y: 2500 },
      { x: 0.4, y: 4800 },
    ];
    const d = linePath(pts, s);
    expect(d.startsWith("M")).toBe(true);
    expect(d.includes("NaN")).toBe(false);
  });
  it("drops out-of-domain points instead of drawing off-canvas", () => {
    const pts: Pt[] = [
      { x: 0.05, y: 1000 },
      { x: 0.2, y: 99999 }, // above y-domain -> dropped
    ];
    const d = linePath(pts, s);
    const commandCount = (d.match(/[ML]/g) ?? []).length;
    expect(commandCount).toBeLessThanOrEqual(1);
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
