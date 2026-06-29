// Shared boundary validation. The engine FAILS LOUD on bad input rather than
// returning a silent NaN/Infinity. Every guard here has an explicit test.

export function assertProportion(p: number, name: string): void {
  if (!Number.isFinite(p) || p <= 0 || p >= 1) {
    throw new Error(`${name} must be a finite proportion in (0, 1), got ${p}`);
  }
}

export function assertParameters(P: number): void {
  if (!Number.isFinite(P) || P < 1) {
    throw new Error(`parameters (P) must be a finite number >= 1, got ${P}`);
  }
}

export function assertShrinkage(S: number): void {
  if (!Number.isFinite(S) || S <= 0 || S >= 1) {
    throw new Error(`shrinkage target S must be in (0, 1), got ${S}`);
  }
}

export function assertPositive(x: number, name: string): void {
  if (!Number.isFinite(x) || x <= 0) {
    throw new Error(`${name} must be a finite number > 0, got ${x}`);
  }
}

export function assertR2(r2: number, name: string): void {
  if (!Number.isFinite(r2) || r2 <= 0 || r2 >= 1) {
    throw new Error(`${name} must be a finite R-squared in (0, 1), got ${r2}`);
  }
}

/** Guard the binary/survival shrinkage solver against the ln(0) / ln(<0) trap. */
export function assertBelowShrinkage(r2cs: number, S: number): void {
  if (r2cs >= S) {
    throw new Error(
      `anticipated R-squared (${r2cs}) must be < the shrinkage target S (${S}); ` +
        `at or above it the required-shrinkage formula's logarithm is undefined`,
    );
  }
}

/** Guard against an anticipated R²cs at or above the maximum achievable. */
export function assertBelowMax(r2cs: number, maxR2cs: number): void {
  if (r2cs >= maxR2cs) {
    throw new Error(
      `anticipated Cox-Snell R-squared (${r2cs}) must be < the maximum possible ` +
        `max(R²cs) = ${maxR2cs.toFixed(4)} for this outcome frequency`,
    );
  }
}
