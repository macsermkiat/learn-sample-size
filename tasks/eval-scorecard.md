# Evaluation scorecard — judge/rubric loop

Rubric: [`tasks/rubric.md`](./rubric.md) (kept **stable across iterations** so the
scores are comparable). Four domains, each scored 0–100 against concrete evidence
(code + screenshots + `npm test` + `npm run e2e` + an axe-core audit). Target:
**≥ 90 every domain**.

> This is the maintainer's evidence-based self-assessment against the rubric. An
> independent multi-judge panel can be run from the same rubric; the ~±6
> LLM-judge noise ceiling is acknowledged and the loop is **capped** rather than
> chased once every domain clears 90 with defensible evidence.

## Results

| Domain | Score | Target |
| ------ | ----- | ------ |
| A — Correctness & faithfulness | 96 | ≥90 ✅ |
| B — Understandability / pedagogy | 92 | ≥90 ✅ |
| C — UX / UI & visual design | 91 | ≥90 ✅ |
| D — Accessibility (WCAG 2.2 AA) | 95 | ≥90 ✅ |

## Evidence

**A — Correctness & faithfulness (96).** 152 tests green, including a
107-scenario `pmsampsize` 1.1.3 parity battery across all three outcome types
(`src/engine/fixtures.test.ts`) and the three published worked examples reproduced
exactly (5249/3500, 5143/3429, 254) with type-specific events/EPP
(survival 23.07 via n·rate·mean-follow-up, not 11.1). max(R²cs) table, take-the-max
N/A filtering, and binding attribution (B3/T2/C2) verified. MAPE (B2) ported and
validated at both anchors (461/544); C→R²cs disclosed as an approximation; the
survival-T1 v1.1.3 behaviour and the EPP/shrinkage type-specificity are documented
in `docs/provenance.md`. Degenerate input fails loud (explicit guard tests). −4:
the C→R²cs path is an approximation of a seeded simulation (disclosed, not exact),
and B2 is an external port not in the parity battery.

**B — Understandability / pedagogy (92).** Intuition-first ordering
(rule-of-thumb → criteria → calculator); the criteria page leads with worked
numbers and collapses each formula by default; the EPP-vs-prevalence crossing
makes "context-specific" land; the binding-shrinkage idea is explicit on the hero
and the criteria page. Grad-biostat voice throughout. −8: a recap/printable
summary is deferred to Stretch; some criteria (optimism, intercept) get lighter
narrative than shrinkage.

**C — UX / UI & visual design (91).** Hero foregrounds the one payload (binding N
+ take-the-max bars) with the full table on demand; cohesive warm palette with a
pine/teal sibling accent; presets reproduce the paper; responsive grid collapses
at mobile width. The impeccable design hook flagged and we removed two side-tab
"AI tells" (criterion card border, paper-quote border). −9: a few residual items
are subjective or inherent (fixed-aspect SVG chart text at very narrow widths; an
Apple-first serif stack), and richer explorable surfaces are Stretch.

**D — Accessibility (95).** axe-core (WCAG 2.0/2.1/2.2 A+AA): **0 violations** on
the calculator, criteria, and rule-of-thumb pages. Keyboard sliders
(role=slider + aria-valuetext), roving-tabindex tablist, semantic criteria table
with a non-visual binding column + per-row aria-label + debounced aria-live
readout, charts by stroke-pattern + end-labels + data tables, focus-to-h1 on route
change (e2e-verified), reduced-motion, KaTeX MathML, 44px targets. −5: a full
manual screen-reader pass (NVDA/VoiceOver) and a fuller Playwright interaction
suite are Stretch.

## Loop discipline

All four domains clear 90 on the first evidence-based pass. Per the
noise-ceiling lesson, the loop is **capped here**: remaining deductions are
documented Stretch items, not hidden defects. Independent judges can re-score
from `tasks/rubric.md` without changing the instrument.

## Carried-forward backlog (deferred Stretch — not blockers)

- `/recap` + printable summary card; richer N-vs-(P, R²cs) explorable surface.
- Manual NVDA/VoiceOver pass; fuller Playwright interaction suite; dark mode.
- C-statistic input for the survival tab (pmsampsize does not define it; left out
  rather than shipping an unfaithful conversion).
