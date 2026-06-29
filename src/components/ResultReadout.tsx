import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { SampleSizeResult } from "../engine";

// The ONE payload: the binding required N, foregrounded. Carries the binding
// criterion in TEXT (not colour), expected events / EPP (or SPP), and — when the
// binding criterion's formula is ported/approximate — discloses that inline, at
// the moment it binds (the binding-criterion-formula contract). A debounced
// aria-live region announces the SETTLED result to screen readers.
export default function ResultReadout({ result }: { result: SampleSizeResult }) {
  const settled = useDebouncedValue(result, 300);
  const binding = result.criteria.find((c) => c.id === result.bindingId);
  const bindingLabel = binding ? `${binding.id} ${binding.label}` : result.bindingId;

  const ratioName = result.ratioLabel === "EPP" ? "events per parameter" : "subjects per parameter";
  const settledBinding = settled.criteria.find((c) => c.id === settled.bindingId);
  const liveText =
    `Required sample size ${settled.n.toLocaleString()}. ` +
    `Binding criterion: ${settledBinding ? settledBinding.id + " " + settledBinding.label : settled.bindingId}. ` +
    (settled.events !== null ? `${settled.events.toLocaleString()} expected events. ` : "") +
    `${settled.ratio} ${settled.ratioLabel === "EPP" ? "events" : "subjects"} per parameter.`;

  return (
    <section className="payload" aria-labelledby="payload-h">
      <h2 id="payload-h" className="payload__eyebrow">
        Minimum sample size to develop the model
      </h2>
      <p className="payload__n">{result.n.toLocaleString()}</p>
      <p className="payload__binding">
        Driven by <b>{bindingLabel}</b> — the binding criterion. The final N is the
        largest across all criteria (take the max).
      </p>

      <dl className="payload__sub">
        {result.events !== null && (
          <div className="payload__stat">
            <dt>Expected events</dt>
            <dd>{result.events.toLocaleString()}</dd>
          </div>
        )}
        <div className="payload__stat">
          <dt>{result.ratioLabel}</dt>
          <dd>{result.ratio}</dd>
        </div>
        {result.maxR2cs !== null && (
          <div className="payload__stat">
            <dt>max(R²cs)</dt>
            <dd>{result.maxR2cs.toFixed(3)}</dd>
          </div>
        )}
      </dl>

      {binding?.note && (
        <p className="payload__disclosure">
          <strong>Note on the binding criterion:</strong> {binding.note}
        </p>
      )}

      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {liveText}
      </p>
      <span className="visually-hidden">
        This is the {ratioName} ratio.
      </span>
    </section>
  );
}
