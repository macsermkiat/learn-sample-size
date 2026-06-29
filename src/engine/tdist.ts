// Standard-normal and Student-t quantile functions, pure and deterministic.
// Used by the continuous engine's intercept-precision criterion (which needs
// qt(0.025, df)) and by the C->R²cs approximation's normal quantile.

/** Acklam's rational approximation to the standard-normal quantile Φ⁻¹(p). */
export function normalQuantile(p: number): number {
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const pl = 0.02425;
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p > 1 - pl) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

/**
 * Student-t quantile via the Cornish-Fisher expansion of the normal quantile.
 * Accurate to ~1e-4 for df >= 10 (continuous-model df is in the hundreds), which
 * is far tighter than the integer-N rounding the result feeds into.
 */
export function tQuantile(p: number, df: number): number {
  const z = normalQuantile(p);
  const z2 = z * z;
  const g1 = (z2 * z + z) / 4;
  const g2 = (5 * z2 * z2 * z + 16 * z2 * z + 3 * z) / 96;
  const g3 = (3 * z2 * z2 * z2 * z + 19 * z2 * z2 * z + 17 * z2 * z - 15 * z) / 384;
  const g4 =
    (79 * z2 ** 4 * z + 776 * z2 ** 3 * z + 1482 * z2 * z2 * z - 1920 * z2 * z - 945 * z) /
    92160;
  return z + g1 / df + g2 / df ** 2 + g3 / df ** 3 + g4 / df ** 4;
}
