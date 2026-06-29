#!/usr/bin/env Rscript
# Generates the gold-standard pmsampsize fixture battery committed to
# src/data/pmsampsize-fixtures.json. The TS engine is checked against this file
# in CI (hermetic — no R toolchain needed at test time). See docs/provenance.md.
#
# Run: Rscript scripts/fixtures/generate-fixtures.R
#
# pmsampsize is the authors' own reference implementation (Ensor, Riley, Snell).
# We capture, per scenario: the inputs, the final required N, the per-criterion
# Ns (Box-1 criteria), expected events (display = ceiling), and EPP/SPP.

suppressWarnings(suppressMessages({
  .libPaths(Sys.getenv("R_LIBS_USER"))
  library(pmsampsize)
  library(jsonlite)
}))

# Capture printed package output silently; we read the returned object instead.
quiet <- function(expr) {
  utils::capture.output(val <- suppressMessages(suppressWarnings(expr)))
  val
}

records <- list()
add <- function(rec) records[[length(records) + 1]] <<- rec

# ---- Binary ----------------------------------------------------------------
bin_case <- function(label, csr, P, phi) {
  out <- tryCatch(quiet(pmsampsize(type = "b", csrsquared = csr,
                                   parameters = P, prevalence = phi)),
                  error = function(e) NULL)
  if (is.null(out)) return(invisible(NULL))
  rt <- out$results_table
  add(list(
    label = label, type = "binary",
    inputs = list(csrsquared = csr, parameters = P, prevalence = phi,
                  shrinkage = 0.9),
    criteriaN = as.numeric(rt[1:3, 1]),        # shrinkage, optimism, risk-precision
    shrinkage = as.numeric(rt[1:3, 2]),
    finalN = out$sample_size,
    maxR2cs = out$max_r2a,
    nagR2 = out$nag_r2,
    eventsDisplay = ceiling(out$sample_size * phi),
    epp = out$EPP
  ))
}

bin_case("Example 1 — pre-eclampsia (P=30)", 0.05, 30, 0.05)
bin_case("Example 1 — pre-eclampsia (P=20)", 0.05, 20, 0.05)
for (phi in c(0.5, 0.4, 0.3, 0.2, 0.1, 0.05, 0.01)) {
  for (P in c(10, 20, 30)) {
    for (csr in c(0.05, 0.10, 0.15)) {
      bin_case(sprintf("grid b phi=%.2f P=%d r2=%.2f", phi, P, csr), csr, P, phi)
    }
  }
}

# ---- Survival --------------------------------------------------------------
surv_case <- function(label, csr, P, rate, timepoint, meanfup) {
  out <- tryCatch(quiet(pmsampsize(type = "s", csrsquared = csr, parameters = P,
                                   rate = rate, timepoint = timepoint,
                                   meanfup = meanfup)),
                  error = function(e) NULL)
  if (is.null(out)) return(invisible(NULL))
  rt <- out$results_table
  add(list(
    label = label, type = "survival",
    inputs = list(csrsquared = csr, parameters = P, rate = rate,
                  timepoint = timepoint, meanfup = meanfup, shrinkage = 0.9),
    criteriaN = as.numeric(rt[1:3, 1]),        # shrinkage, optimism, risk-precision
    shrinkage = as.numeric(rt[1:3, 2]),
    finalN = out$sample_size,
    maxR2cs = out$max_r2a,
    nagR2 = out$nag_r2,
    eventsDisplay = ceiling(out$sample_size * rate * meanfup),
    epp = out$EPP
  ))
}

surv_case("Example 2 — VTE recurrence (P=30)", 0.051, 30, 0.065, 2, 2.07)
surv_case("Example 2 — VTE recurrence (P=20)", 0.051, 20, 0.065, 2, 2.07)
for (P in c(10, 20, 30)) {
  for (csr in c(0.03, 0.05, 0.10)) {
    for (rt in list(c(0.065, 2, 2.07), c(0.10, 10, 5), c(0.05, 1, 3))) {
      surv_case(sprintf("grid s P=%d r2=%.2f rate=%.3f", P, csr, rt[1]),
                csr, P, rt[1], rt[2], rt[3])
    }
  }
}

# ---- Continuous ------------------------------------------------------------
cont_case <- function(label, r2, P, intercept, sd) {
  out <- tryCatch(quiet(pmsampsize(type = "c", rsquared = r2, parameters = P,
                                   intercept = intercept, sd = sd)),
                  error = function(e) NULL)
  if (is.null(out)) return(invisible(NULL))
  rt <- out$results_table
  add(list(
    label = label, type = "continuous",
    inputs = list(rsquared = r2, parameters = P, intercept = intercept,
                  sd = sd, shrinkage = 0.9, mmoe = 1.1),
    criteriaN = as.numeric(rt[1:4, 1]),        # shrinkage, optimism, residualSD, intercept
    shrinkage = as.numeric(rt[1:4, 2]),
    finalN = out$sample_size,
    spp = out$SPP
  ))
}

cont_case("Example 3 — fat-free mass", 0.9, 20, 26.7, 8.7)
for (P in c(10, 20, 30)) {
  for (r2 in c(0.3, 0.5, 0.7, 0.9)) {
    cont_case(sprintf("grid c P=%d r2=%.2f", P, r2), r2, P, 26.7, 8.7)
  }
}

meta <- list(
  generator = "scripts/fixtures/generate-fixtures.R",
  package = "pmsampsize",
  packageVersion = as.character(packageVersion("pmsampsize")),
  rVersion = R.version.string,
  generatedDate = format(Sys.Date(), "%Y-%m-%d"),
  note = paste("Gold-standard outputs from the authors' reference package.",
               "eventsDisplay = ceiling(N * outcome-frequency) to match the",
               "package's printed event count. EPP/SPP as printed (2 dp).")
)

doc <- list(meta = meta, fixtures = records)
out_path <- "src/data/pmsampsize-fixtures.json"
write(toJSON(doc, auto_unbox = TRUE, pretty = TRUE, digits = 8), out_path)
cat(sprintf("Wrote %s — %d fixtures (pmsampsize %s, %s)\n",
            out_path, length(records), meta$packageVersion, meta$rVersion))
