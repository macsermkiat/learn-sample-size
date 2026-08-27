import type { Criterion, SampleSizeResult } from "../engine";

// The full per-criterion breakdown as a semantic table. The binding criterion is
// conveyed NON-VISUALLY: a dedicated "Binding" column with the literal word
// "binding" (and a per-row aria-label), never colour/bold alone. N/A criteria
// render a literal "n/a" cell, not a silent gap.
//
// Criteria that do not compete in the take-the-max (`inMax: false`) are listed
// BELOW the final-N row under their own subhead, because a larger N sitting
// above a smaller final N reads as an arithmetic error. Which criteria those are
// is driven entirely off `inMax` — never off an id.

function CriterionRow({ c, binding }: { c: Criterion; binding: boolean }) {
  const nText = c.n === null ? "n/a" : c.n.toLocaleString();
  const nDescription =
    c.n === null ? "not applicable for these inputs" : `requires ${c.n} participants`;
  const roleDescription = c.inMax
    ? binding
      ? ", binding criterion"
      : ""
    : ", reported for context and not part of the take-the-max";

  return (
    <tr
      className={binding ? "criteria__row--binding" : undefined}
      aria-label={`${c.id} ${c.label}: ${nDescription}${roleDescription}`}
    >
      <th scope="row">
        {c.id} — {c.label}
        {c.pmsampsizeCriteria !== undefined && (
          <span className="criteria__pm"> (pmsampsize Criteria {c.pmsampsizeCriteria})</span>
        )}
        {c.note && <p className="criteria__note">{c.note}</p>}
      </th>
      <td className={c.n === null ? "criteria__na" : undefined}>{nText}</td>
      <td>{binding ? <span className="criteria__binding-mark">binding</span> : ""}</td>
    </tr>
  );
}

export default function CriteriaTable({ result }: { result: SampleSizeResult }) {
  const competing = result.criteria.filter((c) => c.inMax);
  const context = result.criteria.filter((c) => !c.inMax);

  return (
    <div className="criteria">
      <table className="criteria__table">
        <caption>
          Required N per criterion. The final sample size is the largest of the
          criteria that compete — "take the max".
        </caption>
        <thead>
          <tr>
            <th scope="col">Criterion</th>
            <th scope="col">Required N</th>
            <th scope="col">Binding</th>
          </tr>
        </thead>
        <tbody>
          {competing.map((c) => (
            <CriterionRow key={c.id} c={c} binding={c.id === result.bindingId} />
          ))}
          <tr className="criteria__row--final">
            <th scope="row">Final required N (take the max)</th>
            <td>{result.n.toLocaleString()}</td>
            <td />
          </tr>
        </tbody>
        {context.length > 0 && (
          <tbody className="criteria__context">
            <tr>
              <th scope="colgroup" colSpan={3} className="criteria__subhead">
                Shown for context, not part of the maximum
              </th>
            </tr>
            {context.map((c) => (
              <CriterionRow key={c.id} c={c} binding={false} />
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}
