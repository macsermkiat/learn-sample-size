import { useState } from "react";
import Slider from "./Slider";
import { maxR2csBinary, cToR2cs, round2 } from "../engine";
import type { CalcState } from "../hooks/useCalculatorState";

// Inputs for the binary tab: P, the anticipated performance (R²cs OR a
// C-statistic with live conversion), and the outcome proportion φ. The
// anticipated R²cs defaults to a CONSERVATIVE Nagelkerke 0.15 of max(R²cs) and
// stays linked to it as φ moves (teaching the max(R²cs) dependency) until the
// learner drags it. Shrinkage S = 0.9 and margin δ = 0.05 are fixed (as in
// pmsampsize and the paper).
const conservativeR2 = (phi: number) => round2(0.15 * maxR2csBinary(phi));

export default function BinaryControls({
  state,
  patch,
}: {
  state: CalcState;
  patch: (next: Partial<CalcState>) => void;
}) {
  const [linked, setLinked] = useState(true);
  const max = maxR2csBinary(state.phi);
  const r2Max = Math.max(0.02, Math.floor((max - 0.005) * 100) / 100);
  const converted = state.mode === "c" ? cToR2cs(state.c, state.phi) : state.r2;

  const onPhi = (phi: number) => {
    patch(linked ? { phi, r2: conservativeR2(phi) } : { phi });
  };
  const onR2 = (r2: number) => {
    setLinked(false);
    patch({ r2 });
  };
  const relink = () => {
    setLinked(true);
    patch({ r2: conservativeR2(state.phi) });
  };

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
          hint="Count every term you might fit — dummy variables and non-linear terms each count."
        />

        <div className="perf-toggle" role="group" aria-label="How to enter anticipated performance">
          <button
            type="button"
            className="perf-toggle__btn"
            aria-pressed={state.mode === "r2"}
            onClick={() => patch({ mode: "r2" })}
          >
            Anticipated R²cs
          </button>
          <button
            type="button"
            className="perf-toggle__btn"
            aria-pressed={state.mode === "c"}
            onClick={() => patch({ mode: "c" })}
          >
            C-statistic
          </button>
        </div>

        {state.mode === "r2" ? (
          <Slider
            label="Anticipated Cox-Snell R²"
            value={state.r2}
            min={0.02}
            max={r2Max}
            step={0.01}
            onChange={onR2}
            format={(v) => v.toFixed(2)}
            valueText={(v) => `Cox-Snell R squared ${v.toFixed(2)}`}
            hint={
              linked
                ? `Linked to the conservative default (Nagelkerke 0.15 × max(R²cs) = ${conservativeR2(state.phi).toFixed(2)} here). Drag to override.`
                : undefined
            }
          />
        ) : (
          <Slider
            label="Anticipated C-statistic"
            value={state.c}
            min={0.55}
            max={0.95}
            step={0.01}
            onChange={(c) => patch({ c })}
            format={(v) => v.toFixed(2)}
            valueText={(v) => `C statistic ${v.toFixed(2)}`}
            labelSuffix={<span className="approx-badge">approx.</span>}
            hint={`Converted to Cox-Snell R² ≈ ${converted.toFixed(3)} (approximate — C is a rank measure; the map to R²cs assumes a normal linear-predictor distribution).`}
          />
        )}

        {state.mode === "r2" && !linked && (
          <button type="button" className="preset-btn" onClick={relink}>
            Reset to conservative default
          </button>
        )}
      </fieldset>

      <fieldset className="field-group">
        <legend className="field-group__legend">Outcome setting</legend>
        <Slider
          label="Outcome proportion (φ)"
          value={state.phi}
          min={0.01}
          max={0.5}
          step={0.01}
          onChange={onPhi}
          format={(v) => `${Math.round(v * 100)}%`}
          valueText={(v) => `${Math.round(v * 100)} percent`}
          hint="The anticipated prevalence of the outcome in the target population."
        />
        <p className="field-group__why">
          Shrinkage target S = 0.9 and the risk-precision margin δ = 0.05 are fixed,
          as in the paper and <code>pmsampsize</code>.
        </p>
      </fieldset>
    </div>
  );
}
