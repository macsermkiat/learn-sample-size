import { useRef } from "react";
import type { OutcomeType } from "../engine";

const TABS: { type: OutcomeType; label: string }[] = [
  { type: "binary", label: "Binary" },
  { type: "continuous", label: "Continuous" },
  { type: "survival", label: "Time-to-event" },
];

// ARIA tablist for the outcome type. Arrow keys move between tabs (roving
// tabindex); Enter/Space and click activate. The panel content is rendered by
// the parent; we expose ids so it can wire aria-controls / aria-labelledby.
export default function OutcomeTabs({
  value,
  onChange,
}: {
  value: OutcomeType;
  onChange: (t: OutcomeType) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + TABS.length) % TABS.length;
    else return;
    e.preventDefault();
    onChange(TABS[next].type);
    refs.current[next]?.focus();
  };

  return (
    <div className="tabs" role="tablist" aria-label="Outcome type">
      {TABS.map((t, i) => {
        const selected = t.type === value;
        return (
          <button
            key={t.type}
            ref={(el) => (refs.current[i] = el)}
            role="tab"
            id={`tab-${t.type}`}
            aria-selected={selected}
            aria-controls="calc-panel"
            tabIndex={selected ? 0 : -1}
            className="tabs__tab"
            onClick={() => onChange(t.type)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
