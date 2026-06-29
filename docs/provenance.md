# Provenance, pinned facts, and licensing policy

Authoritative record of (a) the formulas the engine implements, (b) the numbers
it must reproduce, (c) how figures are sourced, and (d) the licensing posture.
Backs build-order Step 0 ("pin facts & policy").

## Source paper (the oracle)

Riley RD, Ensor J, Snell KIE, et al. "Calculating the sample size required for
developing a clinical prediction model." _BMJ_ 2020;368:m441.
DOI: `10.1136/bmj.m441`.

Method detail: Riley et al. _Stat Med_ 2019 Part I (continuous,
`10.1002/sim.7993`) and Part II (binary & time-to-event, `10.1002/sim.7992`);
van Smeden et al. _Stat Methods Med Res_ 2019 (MAPE, `10.1177/0962280218784726`).

**Computable oracle:** the **`pmsampsize`** R package (Ensor, Riley, Snell) — the
authors' own reference implementation. The TS engine reproduces its outputs.

**The source PDF is NOT committed** (cited by DOI only; `.gitignore` blocks
`*.pdf`).

## Reference implementation versions (pinned)

| Item | Value |
| --- | --- |
| `pmsampsize` version | **1.1.3** |
| R version | **4.2.2 (2022-10-31)** |
| Fixture generation date | **2026-06-30** |
| Fixture battery | `src/data/pmsampsize-fixtures.json` (104 scenarios) |
| Generator | `scripts/fixtures/generate-fixtures.R` |

The parity battery runs against the committed JSON — **hermetic** (no R toolchain
or network at test time). Regenerate only by re-running the R generator.

> **API note (v1.1.3).** Binary/survival take `csrsquared` / `nagrsquared` /
> `cstatistic` (one of); continuous takes `rsquared`. Older docs that pass
> `rsquared` for `type="b"` are pre-1.1.0.

## Closed forms — transcribed from `pmsampsize` 1.1.3 source

Symbols: φ = outcome proportion (binary) / event rate per person-year
(survival); P = candidate predictor parameters; R²cs = Cox-Snell R²; S = uniform
shrinkage target (default 0.9); δ = margin of error (0.05, hard-coded in the
package). Each criterion's N is `ceil`'d to an integer. **Final N = max across
the type's criteria** (take-the-max), after dropping N/A criteria.

### Binary (`pmsampsize_bin`) — criteria map to Box 1 B1–B4

- **B3 shrinkage** (pkg Criteria 1): `n = ceil( P / ((S − 1)·ln(1 − R²cs/S)) )`.
  Guard `S ≥ R²cs` (else `ln` of a non-positive / ≥1 argument).
- **max(R²cs)**: `max = 1 − exp(2·(φ·ln φ + (1−φ)·ln(1−φ)))`
  `= 1 − (φ^φ·(1−φ)^(1−φ))²`. (In the source it is computed from `E1=n1·φ`, but
  `E1/n1 = φ` so n cancels.) φ = 0.5/0.4/0.3/0.2/0.1/0.05/0.01 →
  0.75/0.74/0.71/0.63/0.48/0.33/0.11. Guard `max ≥ R²cs`.
- **B4 optimism** (pkg Criteria 2): `S₄ = R²cs/(R²cs + 0.05·max)`, then
  `n = ceil( P / ((S₄ − 1)·ln(1 − R²cs/S₄)) )`.
- **B1 overall-risk precision** (pkg Criteria 3): `n = ceil( (1.96/0.05)²·φ(1−φ) )`.
  φ = 0.5/0.2/0.1 → 385/246/139.
- **Nagelkerke** = R²cs/max. Conservative default Nagelkerke 0.15 ⇒
  R²cs = 0.15·max (binary/survival only). Events (display) = `ceil(N·φ)`;
  EPP = `round(N·φ/P, 2)` (uses the un-ceiled product).

### Survival (`pmsampsize_surv`) — criteria map to Box 1 T1–T3

- **T2 shrinkage** (pkg Criteria 1): same form as binary,
  `n = ceil( P/((S−1)·ln(1−R²cs/S)) )`.
- **max(R²cs)**: with `n=10000`, `events = ceil(rate·meanfup·n)`,
  `lnLnull = events·ln(events/n) − events`, `max = 1 − exp(2·lnLnull/n)`.
  (rate 0.065, meanfup 2.07 → max ≈ 0.555.)
- **T3 optimism** (pkg Criteria 2): same `S₄` form as binary.
- **T1 risk-precision at the timepoint** (pkg Criteria 3): **in v1.1.3 this does
  NOT iterate to a target.** `n₃ = max(n₁, n₂)`; the package then reports the
  achieved 95% CI of cumulative incidence
  (`1 − exp(−(rate ± 1.96·√(rate/person-years))·timepoint)`) as a diagnostic. So
  the survival final N is `max(T2, T3)` and T1 never independently binds in the
  package. **This supersedes the handoff's assumption** that T1 drives N via a
  KM-precision target (the paper's "2366 person-years" anchor is the paper's
  prose, not reproduced as a binding criterion by the package). The engine
  mirrors the package (the gate). Events (display) = `ceil(N·rate·meanfup)`;
  EPP = `round(N·rate·meanfup/P, 2)` — **type-specific** (×meanfup), so VTE EPP is
  23.07, not 11.1.

### Continuous (`pmsampsize_cont`) — criteria map to Box 1 C1–C4

R²cs here is ordinary R²; max(R²cs) = 1, so the Nagelkerke default does **not**
apply (R² is entered directly).

- **C3 shrinkage** (pkg Criteria 1): iterative. `n` from `P+2` upward until the
  expected shrinkage `S(n) = 1 + (P−2)/(n·ln(1 − ((R²·(n−P−1)) + P)/(n−1)))`
  reaches the target S=0.9. **Different function from the binary form** — the
  binary form is undefined at Example 3 (R²=0.9, S=0.9 ⇒ ln 0).
- **C4 optimism** (pkg Criteria 2): `n = ceil( 1 + P·(1−R²)/0.05 )`.
- **C2 residual-SD precision** (pkg Criteria 3): `n = 234 + P` (Box 1's `234+P`,
  targets MMOE ≤ 1.1 in the residual SD). Example 3: 234+20 = 254.
- **C1 intercept precision** (pkg Criteria 4*): start `n = max(C2,C3,C4)`, then
  grow until `MMOE = uci/intercept ≤ 1.1`, where
  `uci = intercept + √(sd²·(1−R²)/n)·t₀.₉₇₅,df`, df = n−P−1. Because it starts at
  the running max, the package's Criteria 4 value is always ≥ the others, so
  `Final N = Criteria 4`. Example 3: stays at 254 (MMOE already satisfied).
- No "events" — report N and SPP = `round(N/P, 2)`.

> **Box-1 numbering vs Example 3 prose.** The paper's Example 3 prose mislabels
> 254 as "C3 (model SD)" and 68 as "C1, C2". In Box 1 numbering: 254 = residual-SD
> precision (`234+P`), 68 = shrinkage + optimism (overfitting). The engine and UI
> follow **Box 1**, naming criteria rather than copying the prose labels.

### B2 MAPE — ported (NOT in `pmsampsize`)

`pmsampsize` does **not** compute the small-MAPE criterion (Box 1 B2). It is the
van Smeden 2019 meta-model, reproduced as Riley 2020 Fig 2, applicable for
**P ≤ 30** only (N/A and excluded from take-the-max otherwise):

```
n = ceil( exp( (−0.508 + 0.259·ln(φ) + 0.504·ln(P) − ln(0.05)) / 0.544 ) )
```

(target MAPE = 0.05.) **Validated against both pinned anchors:** P=10, φ=0.3 →
461 (EPP 13.8); P=30, φ=0.05 → 544. Disclosed in-app as a ported approximation
at the moment it binds. Survival/continuous have no MAPE step.

### C-statistic → R²cs — disclosed approximation

`pmsampsize`'s `cstat2rsq` is a **seeded Monte-Carlo** (1e6 normal draws under a
linear-predictor model, then a logistic fit; `set.seed(123456)`), not a closed
form. Exact parity would require replicating R's RNG + IRLS, so the engine uses a
**deterministic numerical approximation** of the same generative model and
**discloses it as an approximation** (inline "approx." badge + glossary). It is
not part of the parity battery (which pins R²cs inputs directly).

## Published worked examples (the "matches the paper" gates)

| # | Type | Command (v1.1.3) | N | events | EPP |
| - | --- | --- | --- | --- | --- |
| 1 | binary | `type="b", csrsquared=0.05, parameters=30, prevalence=0.05` | **5249** | 263 | 8.75 |
| 1 | binary | `parameters=20` | **3500** | 175 | 8.75 |
| 2 | survival | `type="s", csrsquared=0.051, parameters=30, rate=0.065, timepoint=2, meanfup=2.07` | **5143** | 692 | 23.07 |
| 2 | survival | `parameters=20` | **3429** | — | 23.07 |
| 3 | continuous | `type="c", rsquared=0.9, parameters=20, intercept=26.7, sd=8.7` | **254** | — | SPP 12.7 |

Binding criteria: Ex 1 = B3 shrinkage (B2 MAPE only needs 544); Ex 2 = T2
shrinkage (= pkg Criteria 1/3, both 5143); Ex 3 = C2 residual-SD precision (only
68 for overfitting). Other anchors pinned in the fixture battery / engine tests:
binary B1 table 385/246/139; max(R²cs) table; MAPE 461 & 544.

## Degenerate-input guards (fail loud — no silent NaN/Infinity)

φ ∉ (0,1); P < 1; binary/survival R²cs ≥ max(R²cs); binary/survival/continuous
shrinkage R²cs ≥ S (the `ln 0` trap); S ∉ (0,1); rate/timepoint/meanfup ≤ 0
(survival); non-finite inputs. Each is an explicit engine test.

## Figure-provenance policy

Every figure is **recreated from scratch** with original styling and original
data. We never trace, screenshot, or reproduce the paper's figures.

## Reading level / voice (locked)

Graduate biostatistics / clinical researchers. Intuition-first, then formalized;
worked numbers precede formulas. No uncited claims; the C→R²cs approximation and
the ported MAPE formula are disclosed at point of use.

## Licensing

- This project's code, copy, and recreated figures: **MIT** (see `LICENSE`).
- The 2020 paper and `pmsampsize` are the intellectual sources, cited not
  redistributed.
