import { scaleBand, scaleLinear, type ScaleLinear } from "d3-scale";
import { line } from "d3-shape";

// Pure geometry layer: numbers -> SVG rectangles and pixel coordinates. No
// React, no DOM. Kept pure so the coordinate math is unit-testable without a
// browser. React owns the DOM; D3 only does the maths.

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartDims {
  width: number;
  height: number;
  margin: Margin;
}

export interface BarInput {
  id: string;
  label: string;
  /** Required N, or null for an N/A criterion (rendered as a stub + "n/a"). */
  n: number | null;
  binding: boolean;
  /**
   * Does this criterion compete in the take-the-max? A criterion that does not
   * is laid out as a dashed REFERENCE LINE, never as a bar: the chart's whole
   * argument is "the tallest bar wins", which a taller non-binding bar destroys.
   */
  inMax: boolean;
}

export interface BarRect {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Baseline y (bottom of the plot), for label placement on N/A bars. */
  baseline: number;
  n: number | null;
  binding: boolean;
  na: boolean;
}

/** A criterion drawn as a horizontal reference line rather than a bar. */
export interface RefLine {
  id: string;
  label: string;
  n: number;
  /** Pixel y of the line inside the plot area. */
  y: number;
}

export interface BarsGeometry {
  bars: BarRect[];
  /** Non-competing criteria (`inMax: false`), positioned on the same y scale. */
  references: RefLine[];
  innerWidth: number;
  innerHeight: number;
  y: ScaleLinear<number, number>;
  maxN: number;
}

/**
 * Lay out the "take-the-max" bars. Only competing criteria get a bar, so the
 * tallest bar is always the binding one; a non-competing criterion becomes a
 * reference line. The y-axis spans 0..maxN across bars AND reference lines, so a
 * reference above every bar still lands on the canvas. N/A criteria get a
 * zero-height bar at the baseline so the category still appears (no silent gap)
 * without poisoning the scale; an N/A reference line has nowhere to sit and is
 * dropped.
 */
export function barGeometry(data: readonly BarInput[], dims: ChartDims): BarsGeometry {
  const innerWidth = dims.width - dims.margin.left - dims.margin.right;
  const innerHeight = dims.height - dims.margin.top - dims.margin.bottom;

  const barData = data.filter((d) => d.inMax);
  const refData = data.filter((d) => !d.inMax && d.n !== null);

  const defined = [...barData, ...refData]
    .filter((d) => d.n !== null)
    .map((d) => d.n as number);
  const maxN = defined.length > 0 ? Math.max(...defined) : 1;

  const x = scaleBand<string>()
    .domain(barData.map((d) => d.id))
    .range([0, innerWidth])
    .padding(0.28);
  // Headroom so the value label above the tallest bar is not clipped.
  const y = scaleLinear().domain([0, maxN * 1.12]).range([innerHeight, 0]);

  const bars: BarRect[] = barData.map((d) => {
    const na = d.n === null;
    const value = na ? 0 : (d.n as number);
    const yTop = y(value);
    return {
      id: d.id,
      label: d.label,
      x: x(d.id) ?? 0,
      y: yTop,
      width: x.bandwidth(),
      height: innerHeight - yTop,
      baseline: innerHeight,
      n: d.n,
      binding: d.binding,
      na,
    };
  });

  const references: RefLine[] = refData.map((d) => ({
    id: d.id,
    label: d.label,
    n: d.n as number,
    y: y(d.n as number),
  }));

  return { bars, references, innerWidth, innerHeight, y, maxN };
}

export interface Tick {
  value: number;
  pos: number;
}

export function axisTicks(scale: ScaleLinear<number, number>, count: number): Tick[] {
  return scale.ticks(count).map((value) => ({ value, pos: scale(value) }));
}

// --- Line charts (N-vs-φ demo, intro figures) -------------------------------
export interface Pt {
  x: number;
  y: number;
}

export interface LineScales {
  x: ScaleLinear<number, number>;
  y: ScaleLinear<number, number>;
  innerWidth: number;
  innerHeight: number;
}

export function makeLinearScales(
  dims: ChartDims,
  xDomain: readonly [number, number],
  yDomain: readonly [number, number],
): LineScales {
  const innerWidth = dims.width - dims.margin.left - dims.margin.right;
  const innerHeight = dims.height - dims.margin.top - dims.margin.bottom;
  const x = scaleLinear().domain([...xDomain]).range([0, innerWidth]);
  // SVG y grows downward, so the range is inverted: high values sit at the top.
  const y = scaleLinear().domain([...yDomain]).range([innerHeight, 0]);
  return { x, y, innerWidth, innerHeight };
}

/** SVG path `d` for a series; points outside the y-domain are dropped (honest break). */
export function linePath(points: readonly Pt[], scales: LineScales): string {
  const [yMin, yMax] = scales.y.domain();
  const gen = line<Pt>()
    .defined((p) => Number.isFinite(p.y) && p.y >= yMin && p.y <= yMax)
    .x((p) => scales.x(p.x))
    .y((p) => scales.y(p.y));
  return gen([...points]) ?? "";
}
