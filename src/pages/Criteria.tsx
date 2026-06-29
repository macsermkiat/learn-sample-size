import { Link } from "react-router-dom";
import Lesson from "../components/Lesson";
import Formula from "../components/Formula";
import TakeMaxBars from "../charts/TakeMaxBars";
import { binarySampleSize } from "../engine";
import type { BarInput } from "../charts/geometry";

const ex1 = binarySampleSize({ parameters: 30, r2cs: 0.05, prevalence: 0.05 });
const n = (id: string) => ex1.criteria.find((c) => c.id === id)!.n!;
const bars: BarInput[] = ex1.criteria.map((c) => ({
  id: c.id,
  label: c.label,
  n: c.n,
  binding: c.id === ex1.bindingId,
}));

function Criterion({
  tag,
  title,
  binding,
  children,
  formula,
  formulaName,
}: {
  tag: string;
  title: string;
  binding?: boolean;
  children: React.ReactNode;
  formula: string;
  formulaName: Parameters<typeof Formula>[0]["name"];
}) {
  return (
    <section className={"criterion" + (binding ? " criterion--binding" : "")}>
      <span className="criterion__tag">{tag}</span>
      <h3>{title}</h3>
      {children}
      <details className="criterion__formula-toggle">
        <summary>{formula}</summary>
        <Formula name={formulaName} />
      </details>
    </section>
  );
}

export default function Criteria() {
  return (
    <Lesson path="/criteria">
      <h1>The criteria, and take the max</h1>
      <p className="lede">
        Riley's procedure sizes the development sample against several criteria, each
        targeting a concrete property of the model. We lead with the worked numbers from
        the paper's pre-eclampsia example (Example&nbsp;1: φ = 5%, P = 30, anticipated R²
        <sub>cs</sub> = 0.05), then show the formula — collapsed, so you meet one idea at
        a time. Symbols: <code>φ</code> outcome proportion, <code>P</code> candidate
        predictor parameters, <code>R²cs</code> Cox-Snell R², <code>S</code> shrinkage
        target (0.9), <code>δ</code> margin of error (0.05).
      </p>

      <Criterion
        tag="Criterion B1"
        title="A precise estimate of the overall risk"
        formula="Show the formula"
        formulaName="riskPrecision"
      >
        <p>
          You should be able to estimate the average outcome probability precisely. With
          a target margin of error of 0.05, the pre-eclampsia setting needs:
        </p>
        <div className="worked">
          <span className="worked__big">{n("B1")} participants</span>
          <span className="muted">the smallest of the four — rarely the binding one</span>
        </div>
      </Criterion>

      <Criterion
        tag="Criterion B2"
        title="A small mean absolute prediction error (MAPE)"
        formula="Show the formula (ported)"
        formulaName="mape"
      >
        <p>
          Predictions should be accurate across the spectrum of risk, not just on
          average. The van Smeden meta-model (applicable for 30 or fewer parameters)
          gives:
        </p>
        <div className="worked">
          <span className="worked__big">{n("B2")} participants</span>
          <span className="muted">
            ported from van Smeden (2019) — not computed by <code>pmsampsize</code>
          </span>
        </div>
      </Criterion>

      <Criterion
        tag="Criterion B3"
        title="A small required shrinkage (little overfitting)"
        binding
        formula="Show the formula"
        formulaName="shrinkage"
      >
        <p>
          To keep the expected uniform shrinkage to just 10% (S = 0.9), the model needs
          far more data. <strong>This is the criterion that binds here</strong> — and it
          usually does. It is driven by the anticipated R²<sub>cs</sub>, not by
          events-per-variable.
        </p>
        <div className="worked">
          <span className="worked__big">{n("B3").toLocaleString()} participants</span>
          <span className="muted">the binding criterion → this is the final answer</span>
        </div>
      </Criterion>

      <Criterion
        tag="Criterion B4"
        title="A small optimism in the apparent fit"
        formula="Show the formula"
        formulaName="optimism"
      >
        <p>
          The apparent (in-sample) R²<sub>Nagelkerke</sub> should exceed the adjusted
          value by no more than 0.05. This sets a shrinkage-like target S₄ and solves the
          same way:
        </p>
        <div className="worked">
          <span className="worked__big">{n("B4").toLocaleString()} participants</span>
        </div>
      </Criterion>

      <h2>Take the largest</h2>
      <p>
        The final required sample size is simply the maximum across the criteria. Any
        criterion that does not apply (for example MAPE when P &gt; 30) is dropped, not
        counted as zero.
      </p>
      <Formula name="takeMax" />
      <TakeMaxBars
        data={bars}
        caption="Pre-eclampsia (Example 1): the four criteria. The required shrinkage (B3) is the tallest, so N = 5249. The events-per-variable criterion (B1) alone would have allowed just 73."
      />

      <h2>Where R²cs comes from</h2>
      <p>
        Cox-Snell R² has an outcome-dependent ceiling: for a binary outcome the maximum
        achievable value is below 1 and falls as the outcome gets rarer. The calculator's
        conservative default expresses anticipated performance as a fraction (Nagelkerke
        0.15) of that ceiling.
      </p>
      <details className="criterion__formula-toggle">
        <summary>Show max(R²cs) and the Nagelkerke link</summary>
        <Formula name="maxR2cs" />
        <Formula name="nagelkerke" />
      </details>

      <p className="hero__cta">
        <Link className="button button--primary" to="/calculator">
          Try it in the calculator →
        </Link>
      </p>
    </Lesson>
  );
}
