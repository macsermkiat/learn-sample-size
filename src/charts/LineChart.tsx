import {
  makeLinearScales,
  linePath,
  axisTicks,
  type ChartDims,
  type Pt,
} from "./geometry";

// Generic multi-series line chart. Series are distinguished by stroke PATTERN
// (solid / dashed / dotted) plus an inline end-label — never colour alone, so it
// reads in greyscale. Every chart ships a data-table alternative.

export type SeriesKey = "a" | "b" | "c";

export interface Series {
  key: SeriesKey;
  label: string;
  points: Pt[];
}

const DIMS: ChartDims = {
  width: 560,
  height: 340,
  margin: { top: 20, right: 96, bottom: 52, left: 64 },
};

export default function LineChart({
  series,
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  xFormat,
  yFormat,
  reference,
  caption,
}: {
  series: Series[];
  xDomain: [number, number];
  yDomain: [number, number];
  xLabel: string;
  yLabel: string;
  xFormat: (v: number) => string;
  yFormat: (v: number) => string;
  reference?: { y: number; label: string };
  caption: string;
}) {
  const s = makeLinearScales(DIMS, xDomain, yDomain);
  const { margin } = DIMS;
  const xticks = axisTicks(s.x, 6);
  const yticks = axisTicks(s.y, 5);

  return (
    <figure className="chart">
      <svg
        className="chart__svg"
        viewBox={`0 0 ${DIMS.width} ${DIMS.height}`}
        role="img"
        aria-label={caption}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Grid + y axis */}
          {yticks.map((t) => (
            <g key={t.value} transform={`translate(0,${t.pos})`}>
              <line x1={0} x2={s.innerWidth} className="chart__grid" />
              <text x={-10} dy="0.32em" textAnchor="end" className="axis__tick-label">
                {yFormat(t.value)}
              </text>
            </g>
          ))}
          <line x1={0} y1={0} x2={0} y2={s.innerHeight} className="axis__line" />
          <text
            transform={`translate(${-48},${s.innerHeight / 2}) rotate(-90)`}
            textAnchor="middle"
            className="axis__title"
          >
            {yLabel}
          </text>

          {/* x axis */}
          <g transform={`translate(0,${s.innerHeight})`}>
            <line x1={0} y1={0} x2={s.innerWidth} y2={0} className="axis__line" />
            {xticks.map((t) => (
              <g key={t.value} transform={`translate(${t.pos},0)`}>
                <line y1={0} y2={6} className="axis__tick" />
                <text y={20} textAnchor="middle" className="axis__tick-label">
                  {xFormat(t.value)}
                </text>
              </g>
            ))}
            <text x={s.innerWidth / 2} y={44} textAnchor="middle" className="axis__title">
              {xLabel}
            </text>
          </g>

          {/* Reference line (e.g. the 10-EPP rule) */}
          {reference && reference.y >= yDomain[0] && reference.y <= yDomain[1] && (
            <g transform={`translate(0,${s.y(reference.y)})`}>
              <line x1={0} x2={s.innerWidth} className="chart__marker" />
              <text x={s.innerWidth - 4} y={-4} textAnchor="end" className="axis__tick-label">
                {reference.label}
              </text>
            </g>
          )}

          {/* Series */}
          {series.map((ser) => {
            const last = [...ser.points].reverse().find((p) => p.y >= yDomain[0] && p.y <= yDomain[1]);
            return (
              <g key={ser.key}>
                <path className={`chart__line series--${ser.key}`} d={linePath(ser.points, s)} />
                {last && (
                  <text
                    className={`chart__end-label series--${ser.key}`}
                    x={s.x(last.x) + 6}
                    y={s.y(last.y)}
                    dy="0.32em"
                  >
                    {ser.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <figcaption className="chart__caption">{caption}</figcaption>
      <details className="chart__table">
        <summary>View as data table</summary>
        <table>
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{xLabel}</th>
              {series.map((ser) => (
                <th key={ser.key} scope="col">
                  {ser.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series[0].points.map((p, i) => (
              <tr key={p.x}>
                <th scope="row">{xFormat(p.x)}</th>
                {series.map((ser) => (
                  <td key={ser.key}>{yFormat(ser.points[i]?.y ?? NaN)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
