import { useId } from "react";

// Reusable, fully keyboard-operable slider. A native range input is the primary
// control (arrows / Home / End / PageUp / PageDown) and exposes role="slider"
// with aria-value* for free; we add aria-valuetext so screen readers hear a
// meaningful value ("5 percent", "30 parameters") rather than the raw number.
export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Visible value display, e.g. "5%" or "0.05". */
  format: (value: number) => string;
  /** Spoken value, e.g. "5 percent". Falls back to the formatted value. */
  valueText?: (value: number) => string;
  hint?: string;
  /** Optional inline element rendered after the label (e.g. an "approx." badge). */
  labelSuffix?: React.ReactNode;
}

export default function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  valueText,
  hint,
  labelSuffix,
}: SliderProps) {
  const id = useId();
  return (
    <div className="slider">
      <div className="slider__head">
        <label className="slider__label" htmlFor={id}>
          {label}
          {labelSuffix}
        </label>
        <output className="slider__value" htmlFor={id}>
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        className="slider__input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={(valueText ?? format)(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="slider__hint">{hint}</p>}
    </div>
  );
}
