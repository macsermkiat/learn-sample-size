import Slider from "./Slider";
import type { CalcState } from "../hooks/useCalculatorState";

// Inputs for the continuous tab, matching pmsampsize type(c): P, anticipated R²
// (entered directly — max(R²cs) = 1 for continuous, so there is no Nagelkerke
// rescaling and no C-statistic), the outcome mean (model intercept) and SD.
export default function ContinuousControls({
  state,
  patch,
}: {
  state: CalcState;
  patch: (next: Partial<CalcState>) => void;
}) {
  return (
    <div className="calc__controls">
      <fieldset className="field-group">
        <legend className="field-group__legend">Model performance</legend>
        <Slider
          label="Candidate predictor parameters (P)"
          value={state.p}
          min={1}
          max={50}
          step={1}
          onChange={(p) => patch({ p })}
          format={(v) => String(v)}
          valueText={(v) => `${v} candidate predictor parameters`}
        />
        <Slider
          label="Anticipated R²"
          value={state.r2}
          min={0.05}
          max={0.95}
          step={0.01}
          onChange={(r2) => patch({ r2 })}
          format={(v) => v.toFixed(2)}
          valueText={(v) => `R squared ${v.toFixed(2)}`}
          hint="For continuous outcomes R² is ordinary R² (max is 1), entered directly."
        />
      </fieldset>

      <fieldset className="field-group">
        <legend className="field-group__legend">Outcome setting</legend>
        <Slider
          label="Outcome mean (intercept)"
          value={state.intercept}
          min={1}
          max={100}
          step={0.1}
          onChange={(intercept) => patch({ intercept })}
          format={(v) => v.toFixed(1)}
          valueText={(v) => `outcome mean ${v.toFixed(1)}`}
          hint="Used by the intercept-precision criterion (C1)."
        />
        <Slider
          label="Outcome SD"
          value={state.sd}
          min={0.5}
          max={30}
          step={0.1}
          onChange={(sd) => patch({ sd })}
          format={(v) => v.toFixed(1)}
          valueText={(v) => `outcome standard deviation ${v.toFixed(1)}`}
          hint="The residual-SD precision criterion (C2 = 234 + P) usually binds regardless of SD."
        />
        <p className="field-group__why">
          Shrinkage target S = 0.9 and the precision margin (MMOE ≤ 1.1) are fixed,
          as in <code>pmsampsize</code>.
        </p>
      </fieldset>
    </div>
  );
}
