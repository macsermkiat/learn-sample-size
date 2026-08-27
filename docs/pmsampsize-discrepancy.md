# Why the calculator says 792 and Stata says 667

Date: 2026-08-27

The run in question:

```
pmsampsize, type(b) cstatistic(0.89) parameters(24) prevalence(0.17)
```

## Short version

Neither one is broken. They are answering slightly different questions.

The calculator takes the largest of **four** criteria. `pmsampsize` takes the
largest of **three**. The extra one is a small prediction error (MAPE)
criterion from van Smeden 2019. It asks for 792, so it wins. `pmsampsize` does
not calculate that criterion at all, so its Final SS is 667.

There is a second, much smaller difference in how the C-statistic gets turned
into a Cox-Snell R-squared. That one is worth 1 or 2 participants, not 125.

## The two runs, side by side

| Criterion | Calculator | pmsampsize |
| --- | --- | --- |
| Precise estimate of overall risk (Criteria 3) | 217 | 217 |
| Required shrinkage, S = 0.9 (Criteria 1) | 625 | 623 |
| Small optimism in Nagelkerke R-squared (Criteria 2) | 668 | 667 |
| Small prediction error, MAPE | 792 | not calculated |
| **Final N (take the largest)** | **792** | **667** |

The whole 125-participant gap is that one extra row.

## Difference 1: an extra criterion

Riley et al. (BMJ 2020;368:m441) work out a required N for each criterion, then
keep the largest. The reason is that the criteria all have to hold at the same
time. They are not rival estimates of one number. At N = 623 you satisfy the
shrinkage criterion but fail the optimism one. Only the largest N satisfies all
of them. The `Final SS` row in your output is exactly that largest value.

The calculator also works out the van Smeden MAPE criterion (Stat Methods Med
Res 2019;28:2455-2474). It targets a mean absolute prediction error of 0.05 in
the individual risk estimates. `pmsampsize` does not implement it. The formula
is:

```
n = ceil( exp( (-0.508 + 0.259*ln(phi) + 0.504*ln(P) - ln(0.05)) / 0.544 ) )
```

At phi = 0.17 and P = 24 this gives 792. That beats all three `pmsampsize`
criteria, so it becomes the binding one.

Look closely at that formula. It has **no R-squared term and no C-statistic
term**. It only uses the outcome prevalence and the number of candidate
parameters. So it does not move at all when you change how good you expect the
model to be. Here is what that looks like at P = 24 and phi = 0.17:

| Anticipated C-statistic | Final N | Binding criterion | MAPE criterion |
| --- | --- | --- | --- |
| 0.70 | 2,886 | shrinkage | 792 |
| 0.80 | 1,189 | shrinkage | 792 |
| 0.85 | 825 | shrinkage | 792 |
| 0.89 | 792 | MAPE | 792 |
| 0.92 | 792 | MAPE | 792 |
| 0.95 | 792 | MAPE | 792 |

Once C passes roughly 0.86, the answer sticks at 792 and stops responding to the
C-statistic. Your run at C = 0.89 sits just past that point. At C = 0.80 the two
tools would have agreed and nobody would have noticed anything.

## Difference 2: the C-statistic conversion

`pmsampsize` converts a C-statistic to an R-squared with `cstat2rsq()`, which is
a seeded simulation. It draws a linear predictor from a two-normal model, fits a
logistic regression, and reads off the Cox-Snell R-squared.

The calculator does not use a random number generator. It solves the same
underlying model directly, using a fixed grid and IRLS. Think of it as the same
simulation with the sampling noise removed. The app labels the result as an
approximation.

For your inputs:

- Calculator: R-squared_cs = 0.28707
- Stata: R-squared_cs = 0.28774, shown rounded as 0.2877

A gap of 0.0007 in R-squared moves shrinkage from 623 to 625 and optimism from
667 to 668.

We checked this. If you type R-squared_cs = 0.2877 into the calculator instead
of a C-statistic, the optimism criterion comes out at 667, an exact match. To
reproduce 623 for shrinkage you need Stata's unrounded internal value.

## Making the two agree today

1. Enter the anticipated Cox-Snell R-squared directly (0.2877) rather than the
   C-statistic. That removes difference 2.
2. Read only the shrinkage, optimism, and overall-risk rows and ignore the MAPE
   row. Those three then match `pmsampsize`, and the largest of them is 667.

## What we checked

The shrinkage, optimism, and overall-risk formulas were tested against 104
saved `pmsampsize` scenarios (package 1.1.3, R 4.2.2). The battery covers
binary, time-to-event, and continuous outcomes, plus the three worked examples
published in the BMJ paper. Every one reproduces the package's per-criterion N
and its Final SS exactly.

None of those 104 scenarios feed in a C-statistic. They all supply R-squared
directly. That is why the conversion gap in difference 2 went unnoticed until
now.

## Which number to report

Our view is that 667 is the better default, and that the MAPE row should be
shown as background rather than folded into the maximum. Three reasons.

First, `pmsampsize` is the reference implementation, written by the authors of
the method. If a calculator claims to follow that method, its headline number
should be the one the package produces.

Second, the MAPE criterion answers a different question with a different target.
The other three are all about overfitting and precision in this model, and they
respond to the anticipated R-squared. The MAPE criterion asks how many patients
you need for individual risk estimates that are accurate to about 5 percentage
points on average. It is a fair question. It is just not a fourth member of the
same maximum.

Third, and this is the practical one: because the MAPE value ignores the
C-statistic, folding it into the maximum makes the calculator stop responding to
model strength above C = 0.86, as the table above shows. Anyone comparing a
strong model to a moderate one would see the same 792 for both.

Taking the largest value is not the problem, and we are keeping it. It is the
published procedure and it is what `Final SS` already does. The question is only
which criteria belong inside that maximum.

If you disagree, say so. You are closer to the clinical side of this than we
are, and if you think a 0.05 MAPE target is a real requirement for this model
rather than a nice-to-have, then 792 is a defensible number to plan around.

## References

- Riley RD, Ensor J, Snell KIE, et al. Calculating the sample size required for
  developing a clinical prediction model. BMJ 2020;368:m441.
  doi:10.1136/bmj.m441
- Riley RD, et al. Minimum sample size for developing a multivariable prediction
  model: Part II, binary and time-to-event outcomes. Stat Med
  2019;38:1276-1296. doi:10.1002/sim.7992
- van Smeden M, et al. Sample size for binary logistic prediction models: Beyond
  events per variable criteria. Stat Methods Med Res 2019;28:2455-2474.
  doi:10.1177/0962280218784726
- `pmsampsize` (Ensor J, Martin GP, Riley RD), version 1.1.3
