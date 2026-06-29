# Sample-size explainer — evaluation rubric (v1)

Four domains. Each is scored **0–100** by a dedicated judge against the criteria
below; the project target is **≥ 90 in every domain**. Judges must cite concrete
evidence (file:line or screenshot), list point deductions, and give specific,
actionable fixes — not vibes.

> Scoring discipline: start at 100 and subtract for defects. A criterion "met"
> loses 0; partial loses part of its weight; absent/wrong loses all of it.
> LLM judge panels are noisy (~±6/run); a stable ≥90 average is the realistic
> ceiling, so do not invent deductions to seem rigorous, and do not inflate.

## Domain A — Correctness & faithfulness (weight 100)

- (30) Reproduces `pmsampsize` for all three outcome types: per-criterion N,
  final N, and events across the committed fixture battery (binary/continuous/
  survival), plus the three published examples (5249/3500, 5143/3429, 254).
- (20) EPP/events are type-specific (binary n·φ; survival n·rate·mean-follow-up →
  23.07 not 11.1; continuous SPP); shrinkage is the correct solver per type.
- (15) max(R²cs) table; take-the-max filters N/A criteria (no NaN poisoning);
  binding-criterion attribution correct (B3/T2/C2 in the examples).
- (15) MAPE (B2) ported and validated (461/544) and disclosed; C→R²cs disclosed
  as an approximation; survival T1 v1.1.3 behaviour documented.
- (10) Degenerate input fails loud (φ∉(0,1); R²cs≥max; R²cs≥S; S∉(0,1); P<1;
  non-positive rate/timepoint/follow-up) — explicit tests, no silent NaN.
- (10) No uncited or overclaimed statements; figures recreated; PDF not committed.

## Domain B — Understandability / pedagogy (weight 100)

- (25) Intuition-first ordering: rule-of-thumb critique → criteria → calculator;
  each concept is available before it is needed.
- (20) Worked numeric example precedes each formula (criteria page); formulas are
  collapsed by default so the page teaches one idea at a time.
- (20) Graduate-biostatistics voice: precise, not padded, assumes the right
  background without hand-holding or talking down.
- (20) The headline ideas are explicit and memorable: context-specific (not
  10×P); take the max; required shrinkage usually binds; pre-specify predictors;
  don't data-split.
- (15) Figures and copy actively aid understanding (labels, captions, callouts,
  the EPP-vs-prevalence crossing).

## Domain C — UX / UI & visual design (weight 100)

- (25) Clear visual hierarchy; the hero calculator reads at a glance — the
  binding N and take-the-max chart are foregrounded, the full table is on demand.
- (20) Polished, cohesive design system (type pairing, spacing, warm palette,
  cards); not generic-AI (no side-tab tells, no centered-everything sludge).
- (20) The calculator feels responsive and legible; charts are clean and labelled.
- (20) Responsive at mobile width; nav / step-bar / prev-next aid orientation.
- (15) Microcopy, presets, degenerate-state messaging, and affordances considered.

## Domain D — Accessibility (WCAG 2.2 AA) (weight 100)

- (25) Keyboard: every control operable, visible focus, logical order, skip link;
  sliders are native range inputs; the outcome-type tablist roves with arrows.
- (25) The binding criterion is conveyed non-visually (binding column + literal
  word + per-row aria-label + aria-live readout), never colour/bold alone;
  N/A criteria render a literal "n/a".
- (20) Charts: stroke-pattern + end-labels (not colour alone); data-table
  alternative for every chart.
- (15) Contrast ≥ AA for text and graphical objects; KaTeX MathML + plain-language
  label.
- (15) Focus moves to `<h1>` on route change; reduced-motion respected; 44px
  touch targets.

## Evidence pointers for judges

- Live: https://macsermkiat.github.io/learn-sample-size/
- Engine + tests: `src/engine/**`, `src/charts/geometry.ts`
- UI: `src/pages/**`, `src/components/**`, `src/charts/**`, `src/styles/**`
- Provenance / pinned numbers: `docs/provenance.md`
- Fixture battery: `src/data/pmsampsize-fixtures.json`
