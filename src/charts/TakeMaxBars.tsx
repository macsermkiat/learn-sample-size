import { barGeometry, type BarInput, type ChartDims } from "./geometry";
import { YAxis } from "./Axis";

// "Take the max" bar chart: one bar per COMPETING criterion, the binding
// (tallest) one emphasised by COLOUR + a hatch overlay + a bold label + an
// explicit "binding" tag — never colour alone. Ships a data-table alternative
// for screen readers.
//
// A criterion that does not compete in the maximum (`inMax: false`) is drawn as
// a dashed reference line instead of a bar, so "the tallest bar wins" stays
// literally true even when that criterion asks for more. It carries a short tag
// on the line and a full legend entry below it — the reference can sit anywhere
// on the scale, so a long in-plot label would have to cross the bars. The data
// table names the same three states in words.

const REF_NOTE = "different target, not in the max";

const DIMS: ChartDims = {
  width: 460,
  height: 300,
  margin: { top: 24, right: 14, bottom: 64, left: 56 },
};

const fmtN = (v: number): string =>
  v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : String(Math.round(v));

export default function TakeMaxBars({
  data,
  caption,
}: {
  data: readonly BarInput[];
  caption: string;
}) {
  const g = barGeometry(data, DIMS);
  const { margin } = DIMS;

  return (
    <figure className="chart">
      <svg
        className="chart__svg"
        viewBox={`0 0 ${DIMS.width} ${DIMS.height}`}
        role="img"
        aria-label={caption}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          <YAxis y={g.y} innerWidth={g.innerWidth} label="Required N" format={fmtN} />
          {g.bars.map((b) => {
            const cls = b.na
              ? "bars__bar bars__bar--na"
              : b.binding
                ? "bars__bar bars__bar--binding"
                : "bars__bar";
            const cx = b.x + b.width / 2;
            return (
              <g key={b.id}>
                <rect className={cls} x={b.x} y={b.y} width={b.width} height={b.height} rx={3} />
                {/* Hatch overlay marks the binding bar non-chromatically. */}
                {b.binding && !b.na && (
                  <g className="bars__hatch">
                    {[0.25, 0.5, 0.75].map((f) => (
                      <line key={f} x1={b.x} y1={b.y + b.height * f} x2={b.x + b.width} y2={b.y + b.height * f} />
                    ))}
                  </g>
                )}
                {/* Value label above the bar (or "n/a" at the baseline). */}
                <text className="bars__value" x={cx} y={b.na ? b.baseline - 6 : b.y - 6} textAnchor="middle">
                  {b.na ? "n/a" : fmtN(b.n as number)}
                </text>
                {/* Category labels: criterion id, then short name. */}
                <text
                  className={b.binding ? "bars__label bars__label--binding" : "bars__label"}
                  x={cx}
                  y={b.baseline + 18}
                  textAnchor="middle"
                >
                  {b.id}
                </text>
                <text className="bars__label" x={cx} y={b.baseline + 34} textAnchor="middle">
                  {b.binding ? "binding" : ""}
                </text>
              </g>
            );
          })}
          {/* Non-competing criteria: a dashed reference line drawn over the bars,
              tagged with its id and value; the legend below carries the rest. */}
          {g.references.map((r) => (
            <g key={r.id}>
              <line
                className="bars__ref-line"
                x1={0}
                y1={r.y}
                x2={g.innerWidth}
                y2={r.y}
              />
              <text className="bars__ref-label" x={0} y={r.y - 6} textAnchor="start">
                {r.id} {fmtN(r.n)}
              </text>
            </g>
          ))}
        </g>
      </svg>
      {g.references.length > 0 && (
        <ul className="chart__legend">
          {g.references.map((r) => (
            <li key={r.id} className="chart__legend-item">
              <span className="chart__legend-dash" aria-hidden="true" />
              {r.id} — {r.label}: {r.n.toLocaleString()} — {REF_NOTE}.
            </li>
          ))}
        </ul>
      )}
      <figcaption className="chart__caption">{caption}</figcaption>
      <details className="chart__table">
        <summary>View as data table</summary>
        <table>
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Criterion</th>
              <th scope="col">Required N</th>
              <th scope="col">Binding</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id}>
                <th scope="row">
                  {d.id} — {d.label}
                </th>
                <td>{d.n === null ? "n/a" : d.n}</td>
                <td>{d.inMax ? (d.binding ? "yes" : "no") : REF_NOTE}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
