# Task: exclude the MAPE criterion (B2) from take-the-max

Repo: `/Users/admin/learn-sample-size` (React + TypeScript + Vite, Vitest,
Playwright). Branch `main`, clean tree. Run `npm test` (152 passing today),
`npm run typecheck`, `npm run e2e`.

## Why this task exists

A user compared the app against Stata's `pmsampsize`, the reference
implementation this engine is built to reproduce, and got different answers.

Inputs: `pmsampsize, type(b) cstatistic(0.89) parameters(24) prevalence(0.17)`

| Criterion | App | pmsampsize |
| --- | --- | --- |
| B1 precise overall risk | 217 | 217 (Criteria 3) |
| B3 required shrinkage | 625 | 623 (Criteria 1) |
| B4 small optimism | 668 | 667 (Criteria 2) |
| B2 small prediction error (MAPE) | 792 | not computed |
| **Final N** | **792** | **667** |

The app takes the maximum over four criteria; `pmsampsize` takes it over three.
B2 is the van Smeden (2019) MAPE criterion, which the package does not
implement. It wins the max and becomes the headline.

Three reasons B2 should not sit inside that maximum:

1. `pmsampsize` is the reference implementation, written by the method's
   authors. The parity battery in `src/engine/fixtures.test.ts` already excludes
   B2 when checking the package's final N (see its header comment). The headline
   number should be held to the same standard as the tests.
2. B2 targets a different quantity (mean absolute error of individual risk
   estimates) against a different target (MAPE 0.05). The other three are all
   about overfitting and precision of this model.
3. `nFromMape(P, phi)` in `src/engine/shared.ts` takes no R-squared argument. It
   is blind to expected model strength, so folding it into the max freezes the
   final N at 792 for every C-statistic above roughly 0.86. The calculator stops
   responding to its own main input.

Full written analysis: `docs/pmsampsize-discrepancy.md`.

## Scope

Three changes plus tests. Do not go beyond this list.

### 1. Engine

- `src/engine/types.ts` — add a **required** `inMax: boolean` field to the
  `Criterion` interface, documented as "does this criterion compete in the
  take-the-max". Required, not optional, so the compiler finds every
  construction site.
- `src/engine/binary.ts` (criteria array around line 57) — `inMax: false` on B2,
  `true` on B1/B3/B4. Change the `takeMax` call to
  `takeMax(criteria.filter((c) => c.inMax))`.
- `src/engine/survival.ts` (line 64) and `src/engine/continuous.ts` (line 81) —
  set `inMax: true` on every criterion. No behaviour change there.
- **Leave `takeMax` in `src/engine/shared.ts` unchanged.** Filtering at the call
  site keeps it a dumb maximum instead of teaching it criterion semantics.

### 2. Displays that break as a result

Both currently assume every criterion competes. Fix both, or the change reads as
an arithmetic error to a user.

- `src/components/CriteriaTable.tsx` — the caption promises "the final sample
  size is the largest", and a 792 row above a 667 final contradicts it. Move the
  B2 row **below** the Final N row under a subhead such as "Shown for context,
  not part of the maximum", and stop rendering it in the binding column. Drive
  this off `inMax`, never off a hardcoded `"B2"`.
- `src/charts/TakeMaxBars.tsx` (and `src/charts/geometry.ts`, `BarInput` at line
  21) — the chart's whole visual argument is "tallest bar wins". A non-binding
  792 bar destroys it. Drop `inMax: false` criteria from the bars and render B2
  as a dashed reference line labelled with its value and a short "different
  target" note. Keep the existing accessibility contract: the binding bar is
  marked by colour **and** hatch **and** text, never colour alone, and the
  data-table alternative stays in sync.
- `src/components/ResultReadout.tsx` (around line 54) — the provenance
  disclosure fires off `binding?.note`. Once B2 can never bind, that note is
  dead code. Move the van Smeden note onto the B2 row in the criteria table.

### 3. Criteria numbering, to stop this recurring

The app labels criteria B1/B3/B4 while Stata prints "Criteria 1/2/3", **and the
order differs** (shrinkage is B3 but Criteria 1). That mismatch is what made the
original comparison so confusing.

Add the package's number to the criterion label in the table, e.g.
`B3 — Required shrinkage (pmsampsize Criteria 1)`. Mapping: B3 = Criteria 1,
B4 = Criteria 2, B1 = Criteria 3. Survival: T2 = Criteria 1, T3 = Criteria 2.
Continuous: C3 = Criteria 1, C4 = Criteria 2, C2 = Criteria 3, C1 = Criteria 4.
Confirm each against `docs/provenance.md` before writing it, since that file is
the pinned source of truth for the mapping.

## Tests

- Add a regression test in `src/engine/binary.test.ts` for the exact reported
  case: `parameters: 24, prevalence: 0.17, r2cs: cToR2cs(0.89, 0.17)` gives
  `n === 667`, `bindingId === "B4"`, and B2 present at 792 but outside the max.
  Name it so it states why the rule exists, not just what the numbers are.
- Add an engine test that a criterion with `inMax: false` never becomes
  `bindingId` even when it holds the largest N.
- Existing tests that should still pass unchanged: `binary.test.ts` lines 36-63,
  and `Calculator.test.tsx` line 44 (B2 still appears in the table at 544).
- Update `src/pages/Calculator.test.tsx` if the table restructure moves the B2
  row out of the main `tbody`.
- Keep coverage at or above the current level.

## Acceptance criteria

1. `binarySampleSize({parameters: 24, prevalence: 0.17, r2cs: cToR2cs(0.89, 0.17)})`
   returns `n === 667` with `bindingId === "B4"`.
2. B2 is still computed, still visible in the UI at 792, and still carries its
   van Smeden provenance note.
3. `npm test`, `npm run typecheck`, and `npm run e2e` all pass.
4. The 104-scenario parity battery in `src/engine/fixtures.test.ts` passes
   untouched. Do not edit fixtures or the generator.
5. No hardcoded `"B2"` string drives display logic. Everything keys off `inMax`.
6. The take-the-max chart still reads correctly: the tallest drawn bar is the
   binding one.

## Out of scope

Do not attempt these, even if you spot them:

- The `cToR2cs` accuracy gap. The app derives R-squared 0.28707 where Stata's
  seeded Monte Carlo gives 0.28774, which is why B3 reads 625 against 623. That
  is a separate tracked issue and needs new R-generated fixtures.
- Lesson content rewrites in `src/pages/Criteria.tsx`, which is a follow-up task.
- Any change to `survival.ts` or `continuous.ts` beyond adding `inMax: true`.

## Repo conventions

- No emojis in code, comments, or docs.
- Immutable patterns. Do not mutate arrays or objects in place.
- Small focused files, functions under 50 lines.
- Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
- Match surrounding comment density and style. The engine files carry short
  explanatory headers citing the source formulas. Keep that.
- Accessibility is a hard requirement here: this codebase never conveys meaning
  by colour alone, and the e2e suite includes an axe-core audit.

## First step

Read `docs/pmsampsize-discrepancy.md`, then `src/engine/binary.ts` and
`src/engine/types.ts`, before editing anything.
