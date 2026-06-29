import "../styles/calculator.css";
import Lesson from "../components/Lesson";
import OutcomeTabs from "../components/OutcomeTabs";
import BinaryControls from "../components/BinaryControls";
import SurvivalControls from "../components/SurvivalControls";
import ContinuousControls from "../components/ContinuousControls";
import ResultReadout from "../components/ResultReadout";
import CriteriaTable from "../components/CriteriaTable";
import MatchesThePaper from "../components/MatchesThePaper";
import TakeMaxBars from "../charts/TakeMaxBars";
import { useCalculatorState } from "../hooks/useCalculatorState";
import { computeFromState } from "../calc/compute";
import { PRESETS } from "../data/paperExamples";
import { DEFAULTS } from "../hooks/useCalculatorState";
import type { BarInput } from "../charts/geometry";

export default function Calculator() {
  const { state, patch } = useCalculatorState();
  const { result, error } = computeFromState(state);

  const bars: BarInput[] =
    result?.criteria.map((c) => ({
      id: c.id,
      label: c.label,
      n: c.n,
      binding: c.id === result.bindingId,
    })) ?? [];

  return (
    <Lesson path="/calculator">
      <h1>Sample-size calculator</h1>
      <p className="lede">
        Move the inputs and watch the required N — and the <em>binding</em>{" "}
        criterion — respond. The pre-eclampsia preset reproduces the paper's
        Example&nbsp;1 exactly.
      </p>

      <OutcomeTabs value={state.type} onChange={(type) => patch({ ...PRESETS[type].state, type })} />

      <div className="presets">
        <span className="presets__label">Preset:</span>
        <button
          type="button"
          className="preset-btn"
          onClick={() => patch({ ...DEFAULTS, ...PRESETS[state.type].state })}
        >
          {PRESETS[state.type].label}
        </button>
      </div>

      <div id="calc-panel" role="tabpanel" aria-labelledby={`tab-${state.type}`} className="calc">
        <div className="calc__payload">
          {result ? (
            <ResultReadout result={result} />
          ) : (
            <section className="payload payload--error" aria-live="assertive">
              <h2 className="payload__eyebrow">Adjust the inputs</h2>
              <p className="payload__n">—</p>
              <p className="payload__binding">{error}</p>
            </section>
          )}
        </div>

        <div className="calc__payload2">
          {result && (
            <TakeMaxBars
              data={bars}
              caption="Required N for each criterion. The final sample size is the tallest bar — take the max. The binding bar is marked with a hatch and a 'binding' label."
            />
          )}
          <MatchesThePaper type={state.type} />
        </div>

        {state.type === "binary" && <BinaryControls state={state} patch={patch} />}
        {state.type === "survival" && <SurvivalControls state={state} patch={patch} />}
        {state.type === "continuous" && <ContinuousControls state={state} patch={patch} />}

        <div className="calc__details">
          {result && (
            <details className="disclose">
              <summary>Show the full per-criterion breakdown</summary>
              <CriteriaTable result={result} />
            </details>
          )}
        </div>
      </div>
    </Lesson>
  );
}
