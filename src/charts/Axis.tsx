import { axisTicks } from "./geometry";
import type { ScaleLinear } from "d3-scale";

// Hand-rolled SVG y-axis for the bar chart (no charting framework). Axes are
// decorative for screen readers (aria-hidden) because the chart ships a
// data-table alternative; the numbers are reachable there.
export function YAxis({
  y,
  innerWidth,
  label,
  tickCount = 5,
  format,
}: {
  y: ScaleLinear<number, number>;
  innerWidth: number;
  label: string;
  tickCount?: number;
  format: (v: number) => string;
}) {
  const ticks = axisTicks(y, tickCount);
  const innerHeight = y.range()[0];
  return (
    <g className="axis axis--y" aria-hidden="true">
      {ticks.map((t) => (
        <g key={t.value} transform={`translate(0,${t.pos})`}>
          <line x1={0} x2={innerWidth} className="chart__grid" />
          <text x={-10} dy="0.32em" textAnchor="end" className="axis__tick-label">
            {format(t.value)}
          </text>
        </g>
      ))}
      <line x1={0} y1={0} x2={0} y2={innerHeight} className="axis__line" />
      <text
        transform={`translate(${-42},${innerHeight / 2}) rotate(-90)`}
        textAnchor="middle"
        className="axis__title"
      >
        {label}
      </text>
    </g>
  );
}
