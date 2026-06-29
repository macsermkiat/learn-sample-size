# Sample size for prediction models, explained

An interactive, intuition-first explainer of **sample size for developing
clinical prediction models** (Riley et al., 2020, _BMJ_ 368:m441), pitched at a
graduate-biostatistics reading level. A sibling of the
[Decision Curve Analysis explainer](https://github.com/macsermkiat/DCA).

**Live:** https://macsermkiat.github.io/learn-sample-size/

"Ten events per variable" is a blanket heuristic that does not guarantee a
well-calibrated, low-overfit model. The required sample size is
**context-specific** — it depends on the outcome frequency, the number of
candidate predictors, and the model's anticipated performance (Cox-Snell R²).
This site builds that idea, then hands you a calculator whose hero payload is the
**binding criterion** and the **take-the-max** sample size — reproducing the
paper's published numbers exactly.

## What it covers

- **Why the 10-EPP rule fails** — an EPP-vs-prevalence demo: Riley's required N
  versus the rule's implied N across outcome frequency, showing the rule
  over-sizes at low prevalence and under-sizes at high prevalence.
- **The criteria** — one per scroll section, worked numbers before the formula
  (collapsed by default): precise overall risk, small MAPE, required shrinkage,
  small optimism — then **take the largest**.
- **The calculator** — outcome-type tabs (binary / continuous / time-to-event),
  the binding N and a take-the-max bar chart foregrounded, the full per-criterion
  table on demand, presets that reproduce the paper's three examples, and a
  "matches the paper" panel pinning the published N beside the live value.
- **Best practice** — each point a direct quote from the paper: choose predictors
  blind to the data, cut candidate predictors (not data) if N is impractical,
  and use all the data with bootstrapping instead of a train/test split.
- **A knowledge-check quiz** with instant per-answer feedback.

## Faithfulness to the paper

The math engine is checked against the authors' own reference implementation,
the **`pmsampsize`** R package, plus the paper's three published worked examples
(see [`docs/provenance.md`](docs/provenance.md) for the pinned formulas and
versions):

| Example | Type | N | events | EPP/SPP |
| --- | --- | --- | --- | --- |
| Pre-eclampsia (Ex 1) | binary | 5249 (P=30) / 3500 (P=20) | 263 / 175 | 8.75 |
| VTE recurrence (Ex 2) | time-to-event | 5143 (P=30) / 3429 (P=20) | 692 | 23.07 |
| Fat-free mass (Ex 3) | continuous | 254 | — | 12.7 |

A committed **fixture battery** of 104 `pmsampsize` 1.1.3 scenarios is reproduced
exactly by the engine (per-criterion N, final N, events). The battery runs
against the committed JSON, so CI needs **no R toolchain**.

Two facts are type-specific and easy to get wrong; the engine encodes both:

- **EPP/events.** Binary: events = N·φ. Time-to-event: events = N·rate·mean
  follow-up (so VTE EPP is 23.07, not 11.1). Continuous: no events; reports SPP.
- **Shrinkage.** Continuous shrinkage is a different solver from the
  binary/survival one (the binary form is undefined at Example 3).

The **MAPE criterion (B2)** is ported from van Smeden (2019) / Riley Fig 2 (it is
not in `pmsampsize`) and validated against the paper's anchors (461 and 544); the
**C-statistic → R²cs** conversion is a deterministic approximation of
`pmsampsize`'s seeded simulation and is **disclosed as approximate** at the point
of use. See `docs/provenance.md` for both.

## Tech

Vite + React + TypeScript · React Router (HashRouter, host-agnostic) · D3
submodules (`d3-scale`, `d3-shape`) for math with React-rendered SVG ·
build-time KaTeX (HTML + MathML; no runtime shipped) · Vitest + Testing Library ·
Playwright. No backend, no analytics, no tracking.

The math engine is pure TypeScript (`src/engine/`) — numbers in, numbers out, no
React or DOM — and carries the correctness burden. The chart geometry layer
(`src/charts/geometry.ts`) turns numbers into SVG paths and is unit-tested as a
pure function.

## Develop

```bash
npm install
npm run dev          # local dev server
npm test             # unit + integration (Vitest)
npm run e2e          # Playwright (builds + previews first)
npm run typecheck
npm run build        # production build (set VITE_BASE for a sub-path host)
npm run gen:formulas # re-render the KaTeX formulas (dev tooling only)
```

Regenerating the fixture battery (requires R + the `pmsampsize` package):

```bash
Rscript scripts/fixtures/generate-fixtures.R
```

## Deploy

Static SPA to **GitHub Pages** via `.github/workflows/deploy.yml`. The Vite base
path is one env var (`VITE_BASE`, set to `/learn-sample-size/` in CI). HashRouter
keeps deep-link refresh from 404-ing on a static host; `public/404.html` is a
real 404 page for unknown paths.

## Accessibility (WCAG 2.2 AA)

- Keyboard-operable sliders (native range inputs: arrows / Home / End / PageUp /
  PageDown) exposing `role="slider"` + `aria-valuetext`; a roving-tabindex
  outcome-type tablist.
- The **binding criterion** — the core teaching signal — is conveyed
  non-visually: a dedicated "Binding" column with the literal word, per-row
  `aria-label`s, and a debounced `aria-live` readout; never colour/bold alone.
- Semantic criteria table; N/A criteria render a literal "n/a" cell. Charts use
  stroke pattern + inline end-labels (greyscale-safe) and ship a data-table
  alternative. Take-the-max bars mark the binding bar with a hatch + label.
- Focus moves to the page `<h1>` on route change; `prefers-reduced-motion`
  respected; KaTeX emits MathML with a plain-language container label; 44×44px
  touch targets; AA-contrast warm palette.

## Figure provenance

Every figure is **recreated from scratch** with original styling and original
data — never traced or screenshotted from the paper. The source PDF is **not**
committed (referenced by DOI).

## Citation

Riley RD, Ensor J, Snell KIE, et al. "Calculating the sample size required for
developing a clinical prediction model." _BMJ_ 2020;368:m441.
doi:10.1136/bmj.m441.

**APA**

> Riley, R. D., Ensor, J., Snell, K. I. E., Harrell, F. E., Martin, G. P.,
> Reitsma, J. B., Moons, K. G. M., Collins, G., & van Smeden, M. (2020).
> Calculating the sample size required for developing a clinical prediction
> model. _BMJ, 368_, m441. https://doi.org/10.1136/bmj.m441

**BibTeX**

```bibtex
@article{riley2020samplesize,
  title   = {Calculating the sample size required for developing a clinical prediction model},
  author  = {Riley, Richard D and Ensor, Joie and Snell, Kym I E and Harrell, Frank E and Martin, Glen P and Reitsma, Johannes B and Moons, Karel G M and Collins, Gary and van Smeden, Maarten},
  journal = {BMJ},
  volume  = {368},
  pages   = {m441},
  year    = {2020},
  doi     = {10.1136/bmj.m441}
}
```

Computable oracle: the `pmsampsize` R package (Ensor, Riley, Snell). This
explainer is an independent educational recreation; it is not affiliated with or
endorsed by the authors.

## License

[MIT](LICENSE) for this project's code, copy, and recreated figures. The 2020
paper and `pmsampsize` are the intellectual sources and are cited, not
redistributed.
