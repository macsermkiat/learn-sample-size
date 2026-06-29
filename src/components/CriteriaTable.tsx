import type { SampleSizeResult } from "../engine";

// The full per-criterion breakdown as a semantic table. The binding criterion is
// conveyed NON-VISUALLY: a dedicated "Binding" column with the literal word
// "binding" (and a per-row aria-label), never colour/bold alone. N/A criteria
// render a literal "n/a" cell, not a silent gap.
export default function CriteriaTable({ result }: { result: SampleSizeResult }) {
  return (
    <div className="criteria">
      <table className="criteria__table">
        <caption>
          Required N per criterion. The final sample size is the largest — "take
          the max".
        </caption>
        <thead>
          <tr>
            <th scope="col">Criterion</th>
            <th scope="col">Required N</th>
            <th scope="col">Binding</th>
          </tr>
        </thead>
        <tbody>
          {result.criteria.map((c) => {
            const binding = c.id === result.bindingId;
            const nText = c.n === null ? "n/a" : c.n.toLocaleString();
            return (
              <tr
                key={c.id}
                className={binding ? "criteria__row--binding" : undefined}
                aria-label={
                  `${c.id} ${c.label}: ` +
                  (c.n === null
                    ? "not applicable for these inputs"
                    : `requires ${c.n} participants${binding ? ", binding criterion" : ""}`)
                }
              >
                <th scope="row">
                  {c.id} — {c.label}
                </th>
                <td className={c.n === null ? "criteria__na" : undefined}>{nText}</td>
                <td>{binding ? <span className="criteria__binding-mark">binding</span> : ""}</td>
              </tr>
            );
          })}
          <tr className="criteria__row--final">
            <th scope="row">Final required N (take the max)</th>
            <td>{result.n.toLocaleString()}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
