import Lesson from "../components/Lesson";
import LineChart, { type Series } from "../charts/LineChart";
import { binarySampleSize } from "../engine";
import type { Pt } from "../charts/geometry";

// Demo: hold P and R²cs fixed and sweep the outcome proportion φ. Riley's
// required N (binding criterion) vs the "10 events per variable" rule, which
// implies N = 10·P/φ. They cross — so the rule over-sizes at low prevalence and
// under-sizes at high prevalence. The point: required size is context-specific.
const P = 20;
const R2CS = 0.1;
const PHIS = Array.from({ length: 25 }, (_, i) => 0.02 + i * 0.02);

const rileyN: Pt[] = PHIS.map((phi) => ({
  x: phi,
  y: binarySampleSize({ parameters: P, r2cs: R2CS, prevalence: phi }).n,
}));
const ruleN: Pt[] = PHIS.map((phi) => ({ x: phi, y: (10 * P) / phi }));

const series: Series[] = [
  { key: "a", label: "Riley (required)", points: rileyN },
  { key: "b", label: "10-EPP rule", points: ruleN },
];

export default function RuleOfThumb() {
  return (
    <Lesson path="/rule-of-thumb">
      <h1>Why the 10-EPP rule fails</h1>
      <p className="lede">
        "Ten events per variable" is a single number applied to every problem. But the
        sample size that actually controls overfitting and calibration is not a single
        number — it changes with the outcome frequency, the number of candidate
        predictors, and how predictive the model is expected to be.
      </p>

      <h2>The rule is context-specific, and often wrong in both directions</h2>
      <p>
        The 10-EPP rule says: collect ten outcome events per candidate parameter. For{" "}
        <code>P = {P}</code> parameters that is {10 * P} events, so it implies a sample
        size of <code>N = 10·P/φ</code> — which depends entirely on the outcome
        proportion φ. Hold <code>P = {P}</code> and an anticipated R²
        <sub>cs</sub> of {R2CS} fixed, and sweep φ. Riley's required N (the binding
        criterion) barely moves; the rule's demand swings wildly.
      </p>

      <LineChart
        series={series}
        xDomain={[0, 0.5]}
        yDomain={[0, 6000]}
        xLabel="Outcome proportion φ"
        yLabel="Required N"
        xFormat={(v) => `${Math.round(v * 100)}%`}
        yFormat={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
        caption="Required sample size versus outcome proportion, at P = 20 and R²cs = 0.10. The 10-EPP rule (dashed) over-sizes at low prevalence and under-sizes at high prevalence; the actual requirement (solid) is driven by shrinkage and is far flatter. Where the dashed line sits below the solid one, the rule of thumb under-powers the model."
      />

      <aside className="callout">
        <p className="callout__title">Read the crossing.</p>
        <p>
          Below roughly φ = 12%, the rule demands <em>more</em> than is needed; above it,
          the rule demands <em>less</em> — exactly when overfitting risk is highest. A
          fixed events-per-variable target cannot track the real requirement because it
          ignores the anticipated predictive performance entirely.
        </p>
      </aside>

      <h2>What actually drives the requirement</h2>
      <p>
        Riley et al. replace the heuristic with a small set of criteria, each targeting a
        concrete property of the developed model: a precise estimate of the overall risk,
        a small prediction error, a small required shrinkage (little overfitting), and a
        small optimism in the apparent fit. You compute the sample size needed for each,
        and then <strong>take the largest</strong>. The next page builds them one at a
        time.
      </p>
      <p className="muted footnote">
        EPP (events per predictor parameter) is still a useful <em>summary</em> of a
        chosen design — it is just not a good <em>target</em>. The calculator reports the
        EPP your sample size implies, computed correctly for each outcome type.
      </p>
    </Lesson>
  );
}
