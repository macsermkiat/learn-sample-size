import { useState } from "react";
import Slider from "./Slider";
import { maxR2csSurvival, round2 } from "../engine";
import type { CalcState } from "../hooks/useCalculatorState";

// Inputs for the time-to-event tab, grouped per the handoff: "Model performance"
// (P, anticipated R²cs) and "Time-to-event setting" (event rate per person-year,
// key timepoint, mean follow-up). pmsampsize's survival entry point takes a
// Cox-Snell R² (or Nagelkerke), NOT a C-statistic, so no C toggle here.
const conservativeR2 = (rate: number, meanfup: number) =>
  round2(0.15 * maxR2csSurvival(rate, meanfup));

export default function SurvivalControls({
  state,
  patch,
}: {
  state: CalcState;
  patch: (next: Partial<CalcState>) => void;
}) {
  const [linked, setLinked] = useState(true);
  const max = maxR2csSurvival(state.rate, state.meanfup);
  const r2Max = Math.max(0.02, Math.floor((max - 0.005) * 100) / 100);

  const relinkOnSetting = (next: Partial<CalcState>) => {
    if (!linked) return patch(next);
    const rate = next.rate ?? state.rate;
    const meanfup = next.meanfup ?? state.meanfup;
    patch({ ...next, r2: conservativeR2(rate, meanfup) });
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
        />
        <Slider
          label="Anticipated Cox-Snell R²"
          value={state.r2}
          min={0.02}
          max={r2Max}
          step={0.001}
          onChange={(r2) => {
            setLinked(false);
            patch({ r2 });
          }}
          format={(v) => v.toFixed(3)}
          valueText={(v) => `Cox-Snell R squared ${v.toFixed(3)}`}
          hint={
            linked
              ? `Linked to the conservative default (Nagelkerke 0.15 × max(R²cs) = ${conservativeR2(state.rate, state.meanfup).toFixed(3)} here). Drag to override.`
              : undefined
          }
        />
      </fieldset>

      <fieldset className="field-group">
        <legend className="field-group__legend">Time-to-event setting</legend>
        <Slider
          label="Event rate (per person-year)"
          value={state.rate}
          min={0.01}
          max={0.3}
          step={0.005}
          onChange={(rate) => relinkOnSetting({ rate })}
          format={(v) => v.toFixed(3)}
          valueText={(v) => `${v.toFixed(3)} events per person-year`}
          hint="The overall event rate per person-year of follow-up."
        />
        <Slider
          label="Key timepoint (years)"
          value={state.timepoint}
          min={0.5}
          max={10}
          step={0.5}
          onChange={(timepoint) => patch({ timepoint })}
          format={(v) => `${v} yr`}
          valueText={(v) => `${v} years`}
          hint="The horizon at which the predicted risk is reported."
        />
        <Slider
          label="Mean follow-up (years)"
          value={state.meanfup}
          min={0.5}
          max={10}
          step={0.05}
          onChange={(meanfup) => relinkOnSetting({ meanfup })}
          format={(v) => `${v.toFixed(2)} yr`}
          valueText={(v) => `${v.toFixed(2)} years`}
          hint="Expected events = N × rate × mean follow-up — this is why EPP uses follow-up time."
        />
      </fieldset>
    </div>
  );
}
