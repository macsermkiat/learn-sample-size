import { Link } from "react-router-dom";
import Lesson from "../components/Lesson";
import TakeMaxBars from "../charts/TakeMaxBars";
import { binarySampleSize } from "../engine";
import type { BarInput } from "../charts/geometry";

// Orienting thumbnail: the real pre-eclampsia computation the learner will drive.
const preeclampsia = binarySampleSize({ parameters: 30, r2cs: 0.05, prevalence: 0.05 });
const bars: BarInput[] = preeclampsia.criteria.map((c) => ({
  id: c.id,
  label: c.label,
  n: c.n,
  binding: c.id === preeclampsia.bindingId,
}));

export default function Intro() {
  return (
    <Lesson path="/">
      <header className="hero">
        <p className="eyebrow">Riley et al. 2020 · BMJ 368:m441</p>
        <h1 className="hero__title">
          Is <strong>10 events per variable</strong> enough? <em>Usually not.</em>
        </h1>
        <p className="lede">
          The classic rule — ten outcome events for every predictor parameter — is a
          blanket heuristic. It does not guarantee a model that is well calibrated or
          low on overfitting. The sample size you actually need is{" "}
          <strong>context-specific</strong>: it depends on the outcome frequency, the
          number of candidate predictors, and the model's anticipated performance. This
          explainer builds that idea, then hands you a calculator that reproduces the
          paper's published numbers exactly.
        </p>
        <p className="hero__cta">
          <Link className="button button--primary" to="/rule-of-thumb">
            Start: why the rule of thumb fails →
          </Link>
          <Link className="button button--ghost" to="/calculator">
            Jump to the calculator
          </Link>
        </p>
      </header>

      <section className="intro-figure" aria-labelledby="orient">
        <h2 id="orient">By the end, you'll read this</h2>
        <p>
          Riley's method computes a required sample size for each of several{" "}
          <strong>criteria</strong> and tells you to <strong>take the largest</strong>.
          Here is the paper's pre-eclampsia example (Example&nbsp;1): four criteria, and
          the one that <em>binds</em> is not events-per-variable — it is the{" "}
          <strong>required shrinkage</strong>, driven by the anticipated R²<sub>cs</sub>.
        </p>
        <Link className="thumb-link" to="/calculator" aria-label="Open the calculator with the pre-eclampsia example">
          <TakeMaxBars
            data={bars}
            caption="Pre-eclampsia (Example 1): required N per criterion. The binding criterion — required shrinkage (B3) — needs 5249; events-per-variable (B1) needs only 73. Open the calculator to move the inputs."
          />
        </Link>
        <p className="muted">
          Don't worry if the criteria don't mean anything yet — the next two pages build
          them one at a time.
        </p>
      </section>
    </Lesson>
  );
}
