import { PRESETS, PAPER_EXAMPLES } from "../data/paperExamples";
import { computeFromState } from "../calc/compute";
import { DEFAULTS } from "../hooks/useCalculatorState";
import type { OutcomeType } from "../engine";

// Pins the published worked example beside the live engine value computed at the
// paper's exact inputs, so a learner can verify the tool reproduces the source
// rather than merely illustrating it.
export default function MatchesThePaper({ type }: { type: OutcomeType }) {
  const paper = PAPER_EXAMPLES[type];
  const presetState = { ...DEFAULTS, ...PRESETS[type].state };
  const { result } = computeFromState(presetState);

  const live = result?.n ?? null;
  const ok = live !== null && live === paper.n;

  return (
    <section className="paper-check" aria-labelledby="paper-h">
      <h3 id="paper-h" className="paper-check__title">
        Matches the paper?
      </h3>
      <p>
        {paper.label}: Riley reports a required N of <strong>{paper.n.toLocaleString()}</strong>
        {paper.events !== null && <> ({paper.events.toLocaleString()} events)</>}. This tool
        computes{" "}
        <strong>{live === null ? "—" : live.toLocaleString()}</strong>{" "}
        {live === null ? (
          <span className="paper-check__bad">(this tab is not live yet)</span>
        ) : (
          <span className={ok ? "paper-check__ok" : "paper-check__bad"}>
            {ok ? "✓ exact match" : "✗ differs"}
          </span>
        )}
        .
      </p>
      <p className="muted">{paper.note}</p>
    </section>
  );
}
